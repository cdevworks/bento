// ============ Contracts ============

// Token
// deployed first
const BENTOImplementation = artifacts.require("BENTODelegate");
const BENTOProxy = artifacts.require("BENTODelegator");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployToken(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployToken(deployer, network) {
  await deployer.deploy(BENTOImplementation);
  await deployer.deploy(BENTOProxy,
    "BENTO",
    "BENTO",
    18,
    "2000000000000000000000000",
    BENTOImplementation.address,
    "0x"
  );
}
