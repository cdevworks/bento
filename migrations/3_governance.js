// ============ Contracts ============


// Token
// deployed first
const BENTOImplementation = artifacts.require("BENTODelegate");
const BENTOProxy = artifacts.require("BENTODelegator");

// Rs
// deployed second
const BENTOReserves = artifacts.require("BENTOReserves");
const BENTORebaser = artifacts.require("BENTORebaser");

// Governance
// deployed third
const Gov = artifacts.require("GovernorAlpha");
const Timelock = artifacts.require("Timelock");



// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployGovernance(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============
// This is split across multiple files so that
// if the web3 provider craps out, all progress isn't lost.
//
// This is at the expense of having to do 6 extra txs to sync the migrations
// contract

async function deployGovernance(deployer, network) {
  await deployer.deploy(Timelock);
  await deployer.deploy(Gov,
      Timelock.address,
      BENTOProxy.address
  );
}
