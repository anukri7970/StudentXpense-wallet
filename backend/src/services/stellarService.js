const { Keypair, Horizon } = require('@stellar/stellar-sdk');

function getHorizonServer() {
  return new Horizon.Server(process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org');
}

/**
 * Generates a brand-new Stellar keypair. Does NOT fund it — that's a
 * separate step (fundWithFriendbot) so signup can succeed even if the
 * friendbot is briefly rate-limited or unreachable, without losing the
 * generated wallet.
 */
function generateKeypair() {
  const keypair = Keypair.random();
  return {
    publicKey: keypair.publicKey(),
    secretKey: keypair.secret(),
  };
}

/**
 * Funds a freshly generated testnet account via Friendbot. Throws on
 * failure so callers can decide whether to retry, mark the wallet as
 * unfunded, or surface an error to the user.
 */
async function fundWithFriendbot(publicKey) {
  const friendbotUrl = process.env.STELLAR_FRIENDBOT_URL || 'https://friendbot.stellar.org';
  const response = await fetch(`${friendbotUrl}?addr=${encodeURIComponent(publicKey)}`);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Friendbot funding failed (${response.status}): ${body}`);
  }

  return response.json();
}

async function getXlmBalance(publicKey) {
  const server = getHorizonServer();
  const account = await server.loadAccount(publicKey);
  const native = account.balances.find((b) => b.asset_type === 'native');
  return native ? parseFloat(native.balance) : 0;
}

module.exports = {
  getHorizonServer,
  generateKeypair,
  fundWithFriendbot,
  getXlmBalance,
};
