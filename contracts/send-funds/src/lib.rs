//! Send Funds — Soroban smart contract for Student Expense Wallet AI
//!
//! Models a simple parent -> student custodial escrow on Stellar testnet.
//!
//! Flow:
//!   1. A parent calls `deposit` to lock XLM (or any SAC asset) into the
//!      contract, earmarked for one student.
//!   2. The student calls `release` to pull earmarked funds into their own
//!      wallet, in whole or in part.
//!   3. Anyone can call `get_balance` to read a student's available
//!      (un-released) balance for a given parent/asset pair.
//!
//! This is intentionally simple (no multi-asset netting, no fees) because
//! the goal is to demonstrate a real, auditable on-chain money path for an
//! education-expense product, not to build a general-purpose payments
//! protocol.

#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env,
};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct EscrowKey {
    pub parent: Address,
    pub student: Address,
    pub asset: Address,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum ContractError {
    /// Deposit amount must be a positive integer.
    InvalidAmount = 1,
    /// Release amount exceeds the caller's available escrowed balance.
    InsufficientBalance = 2,
    /// Arithmetic overflow while updating a balance.
    Overflow = 3,
}

#[contract]
pub struct SendFunds;

#[contractimpl]
impl SendFunds {
    /// Parent deposits `amount` of `asset` into escrow for `student`.
    /// Requires the parent's signature. Transfers tokens from the parent's
    /// wallet into the contract's own balance, then credits an internal
    /// ledger entry keyed by (parent, student, asset).
    pub fn deposit(
        env: Env,
        parent: Address,
        student: Address,
        asset: Address,
        amount: i128,
    ) -> Result<i128, ContractError> {
        parent.require_auth();

        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let client = token::Client::new(&env, &asset);
        client.transfer(&parent, &env.current_contract_address(), &amount);

        let key = EscrowKey {
            parent: parent.clone(),
            student: student.clone(),
            asset: asset.clone(),
        };

        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        let updated = current
            .checked_add(amount)
            .ok_or(ContractError::Overflow)?;

        env.storage().persistent().set(&key, &updated);

        env.events().publish(
            (symbol_short!("deposit"), parent, student),
            (asset, amount, updated),
        );

        Ok(updated)
    }

    /// Student pulls `amount` of previously escrowed `asset` (deposited by
    /// `parent`) out of the contract into their own wallet. Requires the
    /// student's signature, not the parent's — this is the "student
    /// receives" leg of the flow.
    pub fn release(
        env: Env,
        parent: Address,
        student: Address,
        asset: Address,
        amount: i128,
    ) -> Result<i128, ContractError> {
        student.require_auth();

        if amount <= 0 {
            return Err(ContractError::InvalidAmount);
        }

        let key = EscrowKey {
            parent: parent.clone(),
            student: student.clone(),
            asset: asset.clone(),
        };

        let current: i128 = env.storage().persistent().get(&key).unwrap_or(0);
        if amount > current {
            return Err(ContractError::InsufficientBalance);
        }

        let remaining = current - amount;
        env.storage().persistent().set(&key, &remaining);

        let client = token::Client::new(&env, &asset);
        client.transfer(&env.current_contract_address(), &student, &amount);

        env.events().publish(
            (symbol_short!("release"), parent, student),
            (asset, amount, remaining),
        );

        Ok(remaining)
    }

    /// Read-only: available (un-released) escrow balance for a given
    /// (parent, student, asset) triple. No auth required — balances are
    /// meant to be visible to both the dashboard and the student.
    pub fn get_balance(env: Env, parent: Address, student: Address, asset: Address) -> i128 {
        let key = EscrowKey {
            parent,
            student,
            asset,
        };
        env.storage().persistent().get(&key).unwrap_or(0)
    }
}

mod test;
