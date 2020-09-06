// ============ Contracts ============

// Token
// deployed first
const BENTOImplementation = artifacts.require("BENTODelegate");
const BENTOProxy = artifacts.require("BENTODelegator");

// Rs
// deployed second
const BENTOReserves = artifacts.require("BENTOReserves");
const BENTORebaser = artifacts.require("BENTORebaser");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    deployRs(deployer, network),
  ]);
};

module.exports = migration;

// ============ Deploy Functions ============


async function deployRs(deployer, network) {
  let reserveToken = "0xa36085F69e2889c224210F603D836748e7dC0088";
  let uniswap_factory = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
  await deployer.deploy(BENTOReserves, reserveToken, BENTOProxy.address);
  await deployer.deploy(BENTORebaser,
      BENTOProxy.address,
      reserveToken,
      uniswap_factory,
      BENTOReserves.address
  );
  let rebase = new web3.eth.Contract(BENTORebaser.abi, BENTORebaser.address);

  let pair = await rebase.methods.uniswap_pair().call();
  console.log("BENTOProxy address is " + BENTOProxy.address);
  console.log("Uniswap pair is " + pair);
  let bento = await BENTOProxy.deployed();
  await bento._setRebaser(BENTORebaser.address);
  let reserves = await BENTOReserves.deployed();
  await reserves._setRebaser(BENTORebaser.address)
}
