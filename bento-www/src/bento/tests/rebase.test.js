import {
  Yam
} from "../index.js";
import * as Types from "../lib/types.js";
import {
  addressMap
} from "../lib/constants.js";
import {
  decimalToString,
  stringToDecimal
} from "../lib/Helpers.js"


export const bento = new Yam(
  "http://localhost:8545/",
  // "http://127.0.0.1:9545/",
  "1001",
  true, {
    defaultAccount: "",
    defaultConfirmations: 1,
    autoGasMultiplier: 1.5,
    testing: false,
    defaultGas: "6000000",
    defaultGasPrice: "1000000000000",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("rebase_tests", () => {
  let snapshotId;
  let user;
  let new_user;
  // let unlocked_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let unlocked_account = "0x681148725731f213b0187a3cbef215c291d85a3e";

  beforeAll(async () => {
    const accounts = await bento.web3.eth.getAccounts();
    bento.addAccount(accounts[0]);
    user = accounts[0];
    new_user = accounts[1];
    snapshotId = await bento.testing.snapshot();
  });

  beforeEach(async () => {
    await bento.testing.resetEVM("0x2");
    let a = await bento.contracts.ycrv.methods.transfer(user, "2000000000000000000000000").send({
      from: unlocked_account
    });
  });

  describe("rebase", () => {
    test("user has ycrv", async () => {
      let bal0 = await bento.contracts.ycrv.methods.balanceOf(user).call();
      expect(bal0).toBe("2000000000000000000000000");
    });
    test("create pair", async () => {
      await bento.contracts.uni_fact.methods.createPair(
        bento.contracts.ycrv.options.address,
        bento.contracts.bento.options.address
      ).send({
        from: user,
        gas: 8000000
      })
    });
    test("mint pair", async () => {
      await bento.contracts.bento.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await bento.contracts.ycrv.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await bento.contracts.uni_router.methods.addLiquidity(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address,
        10000000,
        10000000,
        10000000,
        10000000,
        user,
        1596740361 + 100000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await bento.contracts.uni_fact.methods.getPair(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address
      ).call();
      bento.contracts.uni_pair.options.address = pair;
      let bal = await bento.contracts.uni_pair.methods.balanceOf(user).call();
      expect(bento.toBigN(bal).toNumber()).toBeGreaterThan(100)
    });
    test("init_twap", async () => {
      await bento.contracts.bento.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await bento.contracts.ycrv.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await bento.contracts.uni_router.methods.addLiquidity(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await bento.contracts.uni_fact.methods.getPair(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address
      ).call();
      bento.contracts.uni_pair.options.address = pair;
      let bal = await bento.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await bento.testing.increaseTime(1000);

      await bento.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await bento.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await bento.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(bento.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(bento.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);
    });
    test("activate rebasing", async () => {
      await bento.contracts.bento.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await bento.contracts.ycrv.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await bento.contracts.uni_router.methods.addLiquidity(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address,
        100000,
        100000,
        100000,
        100000,
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });
      let pair = await bento.contracts.uni_fact.methods.getPair(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address
      ).call();
      bento.contracts.uni_pair.options.address = pair;
      let bal = await bento.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        1000,
        100,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await bento.testing.increaseTime(1000);

      await bento.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });



      let init_twap = await bento.contracts.rebaser.methods.timeOfTWAPInit().call();
      let priceCumulativeLast = await bento.contracts.rebaser.methods.priceCumulativeLast().call();
      expect(bento.toBigN(init_twap).toNumber()).toBeGreaterThan(0);
      expect(bento.toBigN(priceCumulativeLast).toNumber()).toBeGreaterThan(0);

      await bento.testing.increaseTime(12 * 60 * 60);

      await bento.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });
    });
    test("positive rebasing", async () => {
      await bento.contracts.bento.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await bento.contracts.ycrv.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await bento.contracts.uni_router.methods.addLiquidity(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await bento.contracts.uni_fact.methods.getPair(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address
      ).call();

      bento.contracts.uni_pair.options.address = pair;
      let bal = await bento.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await bento.testing.increaseTime(43200);

      await bento.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000000000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await bento.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await bento.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await bento.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      let res_bal = await bento.contracts.bento.methods.balanceOf(
          bento.contracts.reserves.options.address
      ).call();

      expect(res_bal).toBe("0");

      bal = await bento.contracts.bento.methods.balanceOf(user).call();

      let a = await bento.web3.eth.getBlock('latest');

      let offset = await bento.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = bento.toBigN(offset).toNumber();
      let interval = await bento.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = bento.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await bento.testing.increaseTime(i);

      let r = await bento.contracts.uni_pair.methods.getReserves().call();
      let q = await bento.contracts.uni_router.methods.quote(bento.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre positive rebase", q);

      let b = await bento.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("positive rebase gas used:", b["gasUsed"]);

      let bal1 = await bento.contracts.bento.methods.balanceOf(user).call();

      let resBENTO = await bento.contracts.bento.methods.balanceOf(bento.contracts.reserves.options.address).call();

      let resycrv = await bento.contracts.ycrv.methods.balanceOf(bento.contracts.reserves.options.address).call();

      console.log("bal user, bal bento res, bal res crv", bal1, resBENTO, resycrv);
      r = await bento.contracts.uni_pair.methods.getReserves().call();
      q = await bento.contracts.uni_router.methods.quote(bento.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("post positive rebase quote", q);

      // new balance > old balance
      expect(bento.toBigN(bal).toNumber()).toBeLessThan(bento.toBigN(bal1).toNumber());
      // used full bento reserves
      expect(bento.toBigN(resBENTO).toNumber()).toBe(0);
      // increases reserves
      expect(bento.toBigN(resycrv).toNumber()).toBeGreaterThan(0);


      // not below peg
      expect(bento.toBigN(q).toNumber()).toBeGreaterThan(bento.toBigN(10**18).toNumber());
    });
    test("negative rebasing", async () => {
      await bento.contracts.bento.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await bento.contracts.ycrv.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await bento.contracts.uni_router.methods.addLiquidity(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await bento.contracts.uni_fact.methods.getPair(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address
      ).call();

      bento.contracts.uni_pair.options.address = pair;
      let bal = await bento.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await bento.testing.increaseTime(43200);

      await bento.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await bento.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await bento.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await bento.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await bento.contracts.bento.methods.balanceOf(user).call();

      let a = await bento.web3.eth.getBlock('latest');

      let offset = await bento.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = bento.toBigN(offset).toNumber();
      let interval = await bento.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = bento.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await bento.testing.increaseTime(i);

      let r = await bento.contracts.uni_pair.methods.getReserves().call();
      let q = await bento.contracts.uni_router.methods.quote(bento.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre negative rebase", q);

      let b = await bento.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      //console.log(b.events)
      console.log("negative rebase gas used:", b["gasUsed"]);

      let bal1 = await bento.contracts.bento.methods.balanceOf(user).call();

      let resBENTO = await bento.contracts.bento.methods.balanceOf(bento.contracts.reserves.options.address).call();

      let resycrv = await bento.contracts.ycrv.methods.balanceOf(bento.contracts.reserves.options.address).call();

      // balance decreases
      expect(bento.toBigN(bal1).toNumber()).toBeLessThan(bento.toBigN(bal).toNumber());
      // no increases to reserves
      expect(bento.toBigN(resBENTO).toNumber()).toBe(0);
      expect(bento.toBigN(resycrv).toNumber()).toBe(0);
    });
    test("no rebasing", async () => {
      await bento.contracts.bento.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await bento.contracts.ycrv.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await bento.contracts.uni_router.methods.addLiquidity(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await bento.contracts.uni_fact.methods.getPair(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address
      ).call();

      bento.contracts.uni_pair.options.address = pair;
      let bal = await bento.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await bento.testing.increaseTime(43200);

      await bento.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await bento.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await bento.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await bento.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await bento.contracts.bento.methods.balanceOf(user).call();

      let a = await bento.web3.eth.getBlock('latest');

      let offset = await bento.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = bento.toBigN(offset).toNumber();
      let interval = await bento.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = bento.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await bento.testing.increaseTime(i);

      let r = await bento.contracts.uni_pair.methods.getReserves().call();
      console.log(r, r[0], r[1]);
      let q = await bento.contracts.uni_router.methods.quote(bento.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre no rebase", q);
      let b = await bento.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });

      console.log("no rebase gas used:", b["gasUsed"]);

      let bal1 = await bento.contracts.bento.methods.balanceOf(user).call();

      let resBENTO = await bento.contracts.bento.methods.balanceOf(bento.contracts.reserves.options.address).call();

      let resycrv = await bento.contracts.ycrv.methods.balanceOf(bento.contracts.reserves.options.address).call();

      // no change
      expect(bento.toBigN(bal1).toNumber()).toBe(bento.toBigN(bal).toNumber());
      // no increases to reserves
      expect(bento.toBigN(resBENTO).toNumber()).toBe(0);
      expect(bento.toBigN(resycrv).toNumber()).toBe(0);
      r = await bento.contracts.uni_pair.methods.getReserves().call();
      q = await bento.contracts.uni_router.methods.quote(bento.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post no rebase", q);
    });
    test("rebasing with BENTO in reserves", async () => {
      await bento.contracts.bento.methods.transfer(bento.contracts.reserves.options.address, bento.toBigN(60000*10**18).toString()).send({from: user});
      await bento.contracts.bento.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await bento.contracts.ycrv.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await bento.contracts.uni_router.methods.addLiquidity(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await bento.contracts.uni_fact.methods.getPair(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address
      ).call();

      bento.contracts.uni_pair.options.address = pair;
      let bal = await bento.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await bento.testing.increaseTime(43200);

      await bento.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await bento.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await bento.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await bento.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await bento.contracts.bento.methods.balanceOf(user).call();

      let a = await bento.web3.eth.getBlock('latest');

      let offset = await bento.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = bento.toBigN(offset).toNumber();
      let interval = await bento.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = bento.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await bento.testing.increaseTime(i);


      let r = await bento.contracts.uni_pair.methods.getReserves().call();
      let q = await bento.contracts.uni_router.methods.quote(bento.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote pre pos rebase with reserves", q);

      let b = await bento.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      });
      //console.log(b.events)

      console.log("positive  with reserves gas used:", b["gasUsed"]);

      let bal1 = await bento.contracts.bento.methods.balanceOf(user).call();

      let resBENTO = await bento.contracts.bento.methods.balanceOf(bento.contracts.reserves.options.address).call();

      let resycrv = await bento.contracts.ycrv.methods.balanceOf(bento.contracts.reserves.options.address).call();

      console.log(bal, bal1, resBENTO, resycrv);
      expect(bento.toBigN(bal).toNumber()).toBeLessThan(bento.toBigN(bal1).toNumber());
      expect(bento.toBigN(resBENTO).toNumber()).toBeGreaterThan(0);
      expect(bento.toBigN(resycrv).toNumber()).toBeGreaterThan(0);
      r = await bento.contracts.uni_pair.methods.getReserves().call();
      q = await bento.contracts.uni_router.methods.quote(bento.toBigN(10**18).toString(), r[0], r[1]).call();
      console.log("quote post rebase w/ reserves", q);
      expect(bento.toBigN(q).toNumber()).toBeGreaterThan(bento.toBigN(10**18).toNumber());
    });
  });

  describe("failing", () => {
    test("unitialized rebasing", async () => {
      await bento.testing.expectThrow(bento.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      }), "twap wasnt intitiated, call init_twap()");
    });
    test("no early twap", async () => {
      await bento.testing.expectThrow(bento.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      }), "");
    });
    test("too late rebasing", async () => {
      await bento.contracts.bento.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await bento.contracts.ycrv.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await bento.contracts.uni_router.methods.addLiquidity(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await bento.contracts.uni_fact.methods.getPair(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address
      ).call();

      bento.contracts.uni_pair.options.address = pair;
      let bal = await bento.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await bento.testing.increaseTime(43200);

      await bento.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await bento.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await bento.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await bento.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });


      bal = await bento.contracts.bento.methods.balanceOf(user).call();

      let a = await bento.web3.eth.getBlock('latest');

      let offset = await bento.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = bento.toBigN(offset).toNumber();
      let interval = await bento.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = bento.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      let len = await bento.contracts.rebaser.methods.rebaseWindowLengthSec().call();

      await bento.testing.increaseTime(i + bento.toBigN(len).toNumber()+1);

      let b = await bento.testing.expectThrow(bento.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too late");
    });
    test("too early rebasing", async () => {
      await bento.contracts.bento.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });
      await bento.contracts.ycrv.methods.approve(
        bento.contracts.uni_router.options.address,
        -1
      ).send({
        from: user,
        gas: 80000
      });

      await bento.contracts.uni_router.methods.addLiquidity(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address,
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        "1000000000000000000000000",
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 8000000
      });

      let pair = await bento.contracts.uni_fact.methods.getPair(
        bento.contracts.bento.options.address,
        bento.contracts.ycrv.options.address
      ).call();

      bento.contracts.uni_pair.options.address = pair;
      let bal = await bento.contracts.uni_pair.methods.balanceOf(user).call();

      // make a trade to get init values in uniswap
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // trade back for easier calcs later
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "100000000000",
        100000,
        [
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      await bento.testing.increaseTime(43200);

      await bento.contracts.rebaser.methods.init_twap().send({
        from: user,
        gas: 500000
      });


      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "500000000000000000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // init twap
      let init_twap = await bento.contracts.rebaser.methods.timeOfTWAPInit().call();

      // wait 12 hours
      await bento.testing.increaseTime(12 * 60 * 60);

      // perform trade to change price
      await bento.contracts.uni_router.methods.swapExactTokensForTokens(
        "10000000000000000000",
        100000,
        [
          bento.contracts.ycrv.options.address,
          bento.contracts.bento.options.address
        ],
        user,
        1596740361 + 10000000
      ).send({
        from: user,
        gas: 1000000
      });

      // activate rebasing
      await bento.contracts.rebaser.methods.activate_rebasing().send({
        from: user,
        gas: 500000
      });

      bal = await bento.contracts.bento.methods.balanceOf(user).call();

      let a = await bento.web3.eth.getBlock('latest');

      let offset = await bento.contracts.rebaser.methods.rebaseWindowOffsetSec().call();
      offset = bento.toBigN(offset).toNumber();
      let interval = await bento.contracts.rebaser.methods.minRebaseTimeIntervalSec().call();
      interval = bento.toBigN(interval).toNumber();

      let i;
      if (a["timestamp"] % interval > offset) {
        i = (interval - (a["timestamp"] % interval)) + offset;
      } else {
        i = offset - (a["timestamp"] % interval);
      }

      await bento.testing.increaseTime(i - 1);



      let b = await bento.testing.expectThrow(bento.contracts.rebaser.methods.rebase().send({
        from: user,
        gas: 2500000
      }), "too early");
    });
  });
});
