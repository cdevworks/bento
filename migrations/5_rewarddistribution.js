var fs = require('fs')

// ============ Contracts ============


// Protocol
// deployed second
const BENTOImplementation = artifacts.require("BENTODelegate");
const BENTOProxy = artifacts.require("BENTODelegator");

// deployed third
const BENTOReserves = artifacts.require("BENTOReserves");
const BENTORebaser = artifacts.require("BENTORebaser");

const Gov = artifacts.require("GovernorAlpha");
const Timelock = artifacts.require("Timelock");

// deployed fourth
const BENTO_ETHPool = artifacts.require("BENTOETHPool");
const BENTO_uAMPLPool = artifacts.require("BENTOAMPLPool");
const BENTO_YFIPool = artifacts.require("BENTOYFIPool");
const BENTO_LINKPool = artifacts.require("BENTOLINKPool");
const BENTO_MKRPool = artifacts.require("BENTOMKRPool");
const BENTO_LENDPool = artifacts.require("BENTOLENDPool");
const BENTO_COMPPool = artifacts.require("BENTOCOMPPool");
const BENTO_SNXPool = artifacts.require("BENTOSNXPool");
const BENTO_PNKPool = artifacts.require("BENTOPNKPool");
const BENTO_KNCPool = artifacts.require("BENTOKNCPool");


// deployed fifth
const BENTOIncentivizer = artifacts.require("BENTOIncentivizer");

// ============ Main Migration ============

const migration = async (deployer, network, accounts) => {
  await Promise.all([
    // deployTestContracts(deployer, network),
    deployDistribution(deployer, network, accounts),
    // deploySecondLayer(deployer, network)
  ]);
}

module.exports = migration;

// ============ Deploy Functions ============


async function deployDistribution(deployer, network, accounts) {
  console.log(network)
  let bento = await BENTOProxy.deployed();
  let yReserves = await BENTOReserves.deployed()
  let yRebaser = await BENTORebaser.deployed()
  let tl = await Timelock.deployed();
  let gov = await Gov.deployed();
  if (network != "test") {

    let eth_pool = new web3.eth.Contract(BENTO_ETHPool.abi, BENTO_ETHPool.address);
    let ampl_pool = new web3.eth.Contract(BENTO_uAMPLPool.abi, BENTO_uAMPLPool.address);
    let yfi_pool = new web3.eth.Contract(BENTO_YFIPool.abi, BENTO_YFIPool.address);
    let lend_pool = new web3.eth.Contract(BENTO_LENDPool.abi, BENTO_LENDPool.address);
    let mkr_pool = new web3.eth.Contract(BENTO_MKRPool.abi, BENTO_MKRPool.address);
    let snx_pool = new web3.eth.Contract(BENTO_SNXPool.abi, BENTO_SNXPool.address);
    let comp_pool = new web3.eth.Contract(BENTO_COMPPool.abi, BENTO_COMPPool.address);
    let link_pool = new web3.eth.Contract(BENTO_LINKPool.abi, BENTO_LINKPool.address);
    let pnk_pool = new web3.eth.Contract(BENTO_PNKPool.abi, BENTO_PNKPool.address);
    let knc_pool = new web3.eth.Contract(BENTO_KNCPool.abi, BENTO_KNCPool.address);
    let ycrv_pool = new web3.eth.Contract(BENTOIncentivizer.abi, BENTOIncentivizer.address);

    console.log("setting distributor");
    await Promise.all([
        eth_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        ampl_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        yfi_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        ycrv_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        lend_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        mkr_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        snx_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        comp_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        link_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        pnk_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        knc_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
        ycrv_pool.methods.setRewardDistribution("0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      ]);

    let twenty = web3.utils.toBN(10**3).mul(web3.utils.toBN(10**18)).mul(web3.utils.toBN(200));
    let one_five = web3.utils.toBN(10**3).mul(web3.utils.toBN(10**18)).mul(web3.utils.toBN(1500));

    console.log("transfering and notifying");
    console.log("eth");
    await Promise.all([
      bento.transfer(BENTO_ETHPool.address, twenty.toString()),
      bento.transfer(BENTO_uAMPLPool.address, twenty.toString()),
      bento.transfer(BENTO_YFIPool.address, twenty.toString()),
      bento.transfer(BENTO_LENDPool.address, twenty.toString()),
      bento.transfer(BENTO_MKRPool.address, twenty.toString()),
      bento.transfer(BENTO_SNXPool.address, twenty.toString()),
      bento.transfer(BENTO_COMPPool.address, twenty.toString()),
      bento.transfer(BENTO_LINKPool.address, twenty.toString()),
      bento.transfer(BENTO_PNKPool.address, twenty.toString()),
      bento.transfer(BENTO_KNCPool.address, twenty.toString()),
      bento._setIncentivizer(BENTOIncentivizer.address),
    ]);

    await Promise.all([
      eth_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      ampl_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      yfi_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      lend_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      mkr_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      snx_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      comp_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      link_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      pnk_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),
      knc_pool.methods.notifyRewardAmount(twenty.toString()).send({from:"0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84"}),

      // incentives is a minter and prepopulates itself.
      ycrv_pool.methods.notifyRewardAmount("0").send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 500000}),
    ]);

    await Promise.all([
      eth_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      ampl_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      yfi_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      lend_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      mkr_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      snx_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      comp_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      link_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      pnk_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      knc_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      ycrv_pool.methods.setRewardDistribution(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
    ]);
    await Promise.all([
      eth_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      ampl_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      yfi_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      lend_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      mkr_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      snx_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      comp_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      link_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      pnk_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      knc_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
      ycrv_pool.methods.transferOwnership(Timelock.address).send({from: "0x683A78bA1f6b25E29fbBC9Cd1BFA29A51520De84", gas: 100000}),
    ]);
  }

  await Promise.all([
    bento._setPendingGov(Timelock.address),
    yReserves._setPendingGov(Timelock.address),
    yRebaser._setPendingGov(Timelock.address),
  ]);

  await Promise.all([
      tl.executeTransaction(
        BENTOProxy.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        BENTOReserves.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),

      tl.executeTransaction(
        BENTORebaser.address,
        0,
        "_acceptGov()",
        "0x",
        0
      ),
  ]);
  await tl.setPendingAdmin(Gov.address);
  await gov.__acceptAdmin();
  await gov.__abdicate();
}
