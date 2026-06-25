const express = require('express');

const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { authenticate, requireRole } = require('../middleware/auth');
const { decryptSecret } = require('../services/encryption');
const { depositFunds, releaseFunds } = require('../services/sorobanService');
const { track } = require('../config/analytics');

const router = express.Router();

const XLM_TO_STROOPS = 10_000_000;

/**
 * For the native asset, Soroban's token interface is fronted by the
 * Stellar Asset Contract for XLM, whose address is fixed per network and
 * derived from the native asset issuer. Rather than hardcode it, we
 * require it to be set once in env after you look it up for testnet (see
 * contracts/README.md) — this keeps the service generic if you later swap
 * in a custom issued asset instead of native XLM.
 */
function getNativeAssetAddress() {
  const address = process.env.STELLAR_NATIVE_ASSET_CONTRACT_ID;
  if (!address) {
    throw new Error(
      'STELLAR_NATIVE_ASSET_CONTRACT_ID is not set. See contracts/README.md for how to find the native asset SAC address on testnet.'
    );
  }
  return address;
}

/**
 * Parent sends funds to a linked student. This calls the SendFunds
 * contract's `deposit` method, which pulls XLM from the parent's wallet
 * into contract escrow earmarked for that student.
 */
router.post('/deposit', authenticate, requireRole('parent'), async (req, res, next) => {
  try {
    const { studentId, amount } = req.body;
    if (!studentId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'studentId and a positive amount are required.' });
    }

    const parent = await User.findById(req.user.id);
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ error: 'Student not found.' });
    }
    if (!parent.linkedStudents.some((id) => id.equals(student._id))) {
      return res.status(403).json({ error: 'You are not linked to this student.' });
    }

    const parentSecret = decryptSecret(parent.stellarSecretEncrypted);
    const assetAddress = getNativeAssetAddress();

    let contractResult;
    try {
      contractResult = await depositFunds({
        parentSecret,
        parentPublicKey: parent.stellarPublicKey,
        studentPublicKey: student.stellarPublicKey,
        assetAddress,
        amountStroops: Math.round(amount * XLM_TO_STROOPS),
      });
    } catch (contractErr) {
      const wrapped = new Error(`Deposit contract call failed: ${contractErr.message}`);
      wrapped.category = 'contract';
      wrapped.statusCode = 502;
      wrapped.publicMessage = wrapped.message;
      return next(wrapped);
    }

    const transaction = await Transaction.create({
      type: 'parent_deposit',
      fromUser: parent._id,
      toUser: student._id,
      amount,
      assetCode: 'XLM',
      txHash: contractResult.hash,
      contractId: process.env.SEND_FUNDS_CONTRACT_ID,
      status: 'success',
    });

    track(parent._id.toString(), 'funds_sent', { amount, studentId: student._id.toString() });

    return res.status(201).json({ transaction, escrowBalance: contractResult.returnValue });
  } catch (err) {
    return next(err);
  }
});

/**
 * Student pulls previously escrowed funds from a specific parent into
 * their own wallet by calling the contract's `release` method.
 */
router.post('/release', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const { parentId, amount } = req.body;
    if (!parentId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'parentId and a positive amount are required.' });
    }

    const student = await User.findById(req.user.id);
    const parent = await User.findById(parentId);
    if (!parent || parent.role !== 'parent') {
      return res.status(404).json({ error: 'Parent not found.' });
    }

    const studentSecret = decryptSecret(student.stellarSecretEncrypted);
    const assetAddress = getNativeAssetAddress();

    let contractResult;
    try {
      contractResult = await releaseFunds({
        studentSecret,
        parentPublicKey: parent.stellarPublicKey,
        studentPublicKey: student.stellarPublicKey,
        assetAddress,
        amountStroops: Math.round(amount * XLM_TO_STROOPS),
      });
    } catch (contractErr) {
      const wrapped = new Error(`Release contract call failed: ${contractErr.message}`);
      wrapped.category = 'contract';
      wrapped.statusCode = 502;
      wrapped.publicMessage = wrapped.message;
      return next(wrapped);
    }

    const transaction = await Transaction.create({
      type: 'student_release',
      fromUser: parent._id,
      toUser: student._id,
      amount,
      assetCode: 'XLM',
      txHash: contractResult.hash,
      contractId: process.env.SEND_FUNDS_CONTRACT_ID,
      status: 'success',
    });

    return res.status(201).json({ transaction, escrowBalanceRemaining: contractResult.returnValue });
  } catch (err) {
    return next(err);
  }
});

/**
 * Student pays a university directly (plain Stellar payment, not via the
 * escrow contract — tuition is a final destination, not an earmark).
 */
const { TransactionBuilder, Networks, Operation, Asset, BASE_FEE } = require('@stellar/stellar-sdk');
const { Keypair } = require('@stellar/stellar-sdk');
const { getHorizonServer } = require('../services/stellarService');

router.post('/pay-tuition', authenticate, requireRole('student'), async (req, res, next) => {
  try {
    const { universityId, amount } = req.body;
    if (!universityId || !amount || amount <= 0) {
      return res.status(400).json({ error: 'universityId and a positive amount are required.' });
    }

    const student = await User.findById(req.user.id);
    const university = await User.findById(universityId);
    if (!university || university.role !== 'university') {
      return res.status(404).json({ error: 'University not found.' });
    }

    const studentSecret = decryptSecret(student.stellarSecretEncrypted);
    const server = getHorizonServer();
    const sourceKeypair = Keypair.fromSecret(studentSecret);

    let txHash;
    try {
      const account = await server.loadAccount(sourceKeypair.publicKey());
      const networkPassphrase =
        process.env.STELLAR_NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET;

      const tx = new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase })
        .addOperation(
          Operation.payment({
            destination: university.stellarPublicKey,
            asset: Asset.native(),
            amount: amount.toString(),
          })
        )
        .addMemo(require('@stellar/stellar-sdk').Memo.text('Tuition payment'))
        .setTimeout(60)
        .build();

      tx.sign(sourceKeypair);
      const result = await server.submitTransaction(tx);
      txHash = result.hash;
    } catch (paymentErr) {
      const wrapped = new Error(`Tuition payment failed: ${paymentErr.message}`);
      wrapped.category = 'wallet';
      wrapped.statusCode = 502;
      wrapped.publicMessage = wrapped.message;
      return next(wrapped);
    }

    const transaction = await Transaction.create({
      type: 'tuition_payment',
      fromUser: student._id,
      toUser: university._id,
      amount,
      assetCode: 'XLM',
      txHash,
      status: 'success',
    });

    track(student._id.toString(), 'tuition_paid', { amount, universityId: university._id.toString() });

    return res.status(201).json({ transaction });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
