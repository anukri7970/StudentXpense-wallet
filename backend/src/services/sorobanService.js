const {
  Keypair,
  Contract,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  nativeToScVal,
  scValToNative,
  Address,
  BASE_FEE,
} = require('@stellar/stellar-sdk');

function getRpcServer() {
  return new SorobanRpc.Server(process.env.SOROBAN_RPC_URL || 'https://soroban-testnet.stellar.org');
}

function getContract() {
  const contractId = process.env.SEND_FUNDS_CONTRACT_ID;
  if (!contractId) {
    throw new Error(
      'SEND_FUNDS_CONTRACT_ID is not set. Deploy the contract first (see contracts/README.md) and put its address in .env.'
    );
  }
  return new Contract(contractId);
}

/**
 * Polls a submitted transaction until it lands or times out. Soroban RPC
 * is async — sendTransaction just acknowledges the tx was accepted into
 * the network's queue, you then poll getTransaction for the final result.
 */
async function pollTransaction(server, hash, { timeoutMs = 30000, intervalMs = 1500 } = {}) {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const result = await server.getTransaction(hash);
    if (result.status !== 'NOT_FOUND') {
      return result;
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Timed out waiting for transaction ${hash} to confirm.`);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/**
 * Builds, simulates, signs, and submits a Soroban contract invocation.
 * `signerSecret` is the secret key of whichever party must authorize the
 * call (the parent for `deposit`, the student for `release`).
 */
async function invokeContract(method, scArgs, signerSecret) {
  const server = getRpcServer();
  const sourceKeypair = Keypair.fromSecret(signerSecret);
  const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
  const contract = getContract();

  const networkPassphrase =
    process.env.STELLAR_NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET;

  let tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...scArgs))
    .setTimeout(60)
    .build();

  // Simulate first to get the correct resource footprint / fees.
  const simulated = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simulated)) {
    throw new Error(`Soroban simulation failed for ${method}: ${simulated.error}`);
  }

  tx = SorobanRpc.assembleTransaction(tx, simulated).build();
  tx.sign(sourceKeypair);

  const sendResponse = await server.sendTransaction(tx);
  if (sendResponse.status === 'ERROR') {
    throw new Error(`Soroban submission failed for ${method}: ${JSON.stringify(sendResponse.errorResult)}`);
  }

  const finalResult = await pollTransaction(server, sendResponse.hash);
  if (finalResult.status !== 'SUCCESS') {
    throw new Error(`Soroban transaction ${method} did not succeed: ${finalResult.status}`);
  }

  const returnValue = finalResult.returnValue ? scValToNative(finalResult.returnValue) : null;

  return { hash: sendResponse.hash, returnValue };
}

/**
 * Parent deposits `amount` (in stroops, i.e. XLM * 10_000_000) of the
 * native asset into escrow for `student`.
 */
async function depositFunds({ parentSecret, parentPublicKey, studentPublicKey, assetAddress, amountStroops }) {
  const args = [
    new Address(parentPublicKey).toScVal(),
    new Address(studentPublicKey).toScVal(),
    new Address(assetAddress).toScVal(),
    nativeToScVal(amountStroops, { type: 'i128' }),
  ];
  return invokeContract('deposit', args, parentSecret);
}

/**
 * Student releases `amount` of previously escrowed funds (deposited by
 * `parentPublicKey`) into their own wallet.
 */
async function releaseFunds({ studentSecret, parentPublicKey, studentPublicKey, assetAddress, amountStroops }) {
  const args = [
    new Address(parentPublicKey).toScVal(),
    new Address(studentPublicKey).toScVal(),
    new Address(assetAddress).toScVal(),
    nativeToScVal(amountStroops, { type: 'i128' }),
  ];
  return invokeContract('release', args, studentSecret);
}

/**
 * Read-only balance check. Uses simulation only (no signature, no fee,
 * no ledger write) since get_balance never mutates state.
 */
async function getEscrowBalance({ parentPublicKey, studentPublicKey, assetAddress, readOnlySourceSecret }) {
  const server = getRpcServer();
  const sourceKeypair = Keypair.fromSecret(readOnlySourceSecret);
  const sourceAccount = await server.getAccount(sourceKeypair.publicKey());
  const contract = getContract();

  const networkPassphrase =
    process.env.STELLAR_NETWORK === 'PUBLIC' ? Networks.PUBLIC : Networks.TESTNET;

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      contract.call(
        'get_balance',
        new Address(parentPublicKey).toScVal(),
        new Address(studentPublicKey).toScVal(),
        new Address(assetAddress).toScVal()
      )
    )
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (SorobanRpc.Api.isSimulationError(simulated)) {
    throw new Error(`Soroban simulation failed for get_balance: ${simulated.error}`);
  }

  const result = SorobanRpc.Api.isSimulationSuccess(simulated) ? simulated.result : null;
  return result ? scValToNative(result.retval) : 0;
}

module.exports = {
  depositFunds,
  releaseFunds,
  getEscrowBalance,
};
