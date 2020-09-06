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
    defaultGasPrice: "1",
    accounts: [],
    ethereumNodeTimeout: 10000
  }
)
const oneEther = 10 ** 18;

describe("Distribution", () => {
  let snapshotId;
  let user;
  let user2;
  let ycrv_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  let weth_account = "0xf9e11762d522ea29dd78178c9baf83b7b093aacc";
  let uni_ampl_account = "0x8c545be506a335e24145edd6e01d2754296ff018";
  let comp_account = "0xc89b6f0146642688bb254bf93c28fccf1e182c81";
  let lend_account = "0x3b08aa814bea604917418a9f0907e7fc430e742c";
  let link_account = "0xbe6977e08d4479c0a6777539ae0e8fa27be4e9d6";
  let mkr_account = "0xf37216a8ac034d08b4663108d7532dfcb44583ed";
  let snx_account = "0xb696d629cd0a00560151a434f6b4478ad6c228d7"
  let yfi_account = "0x0eb4add4ba497357546da7f5d12d39587ca24606";
  beforeAll(async () => {
    const accounts = await bento.web3.eth.getAccounts();
    bento.addAccount(accounts[0]);
    user = accounts[0];
    bento.addAccount(accounts[1]);
    user2 = accounts[1];
    snapshotId = await bento.testing.snapshot();
  });

  beforeEach(async () => {
    await bento.testing.resetEVM("0x2");
  });

  describe("pool failures", () => {
    test("cant join pool 1s early", async () => {
      await bento.testing.resetEVM("0x2");
      let a = await bento.web3.eth.getBlock('latest');

      let starttime = await bento.contracts.eth_pool.methods.starttime().call();

      expect(bento.toBigN(a["timestamp"]).toNumber()).toBeLessThan(bento.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);
      await bento.contracts.weth.methods.approve(bento.contracts.eth_pool.options.address, -1).send({from: user});

      await bento.testing.expectThrow(
        bento.contracts.eth_pool.methods.stake(
          bento.toBigN(200).times(bento.toBigN(10**18)).toString()
        ).send({
          from: user,
          gas: 300000
        })
      , "not start");


      a = await bento.web3.eth.getBlock('latest');

      starttime = await bento.contracts.ampl_pool.methods.starttime().call();

      expect(bento.toBigN(a["timestamp"]).toNumber()).toBeLessThan(bento.toBigN(starttime).toNumber());

      //console.log("starttime", a["timestamp"], starttime);

      await bento.contracts.UNIAmpl.methods.approve(bento.contracts.ampl_pool.options.address, -1).send({from: user});

      await bento.testing.expectThrow(bento.contracts.ampl_pool.methods.stake(
        "5016536322915819"
      ).send({
        from: user,
        gas: 300000
      }), "not start");
    });

    test("cant join pool 2 early", async () => {

    });

    test("cant withdraw more than deposited", async () => {
      await bento.testing.resetEVM("0x2");
      let a = await bento.web3.eth.getBlock('latest');

      await bento.contracts.weth.methods.transfer(user, bento.toBigN(2000).times(bento.toBigN(10**18)).toString()).send({
        from: weth_account
      });
      await bento.contracts.UNIAmpl.methods.transfer(user, "5000000000000000").send({
        from: uni_ampl_account
      });

      let starttime = await bento.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await bento.testing.increaseTime(waittime);
      }

      await bento.contracts.weth.methods.approve(bento.contracts.eth_pool.options.address, -1).send({from: user});

      await bento.contracts.eth_pool.methods.stake(
        bento.toBigN(200).times(bento.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      });

      await bento.contracts.UNIAmpl.methods.approve(bento.contracts.ampl_pool.options.address, -1).send({from: user});

      await bento.contracts.ampl_pool.methods.stake(
        "5000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      await bento.testing.expectThrow(bento.contracts.ampl_pool.methods.withdraw(
        "5016536322915820"
      ).send({
        from: user,
        gas: 300000
      }), "");

      await bento.testing.expectThrow(bento.contracts.eth_pool.methods.withdraw(
        bento.toBigN(201).times(bento.toBigN(10**18)).toString()
      ).send({
        from: user,
        gas: 300000
      }), "");

    });
  });

  describe("incentivizer pool", () => {
    test("joining and exiting", async() => {
      await bento.testing.resetEVM("0x2");

      await bento.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
        from: ycrv_account
      });

      await bento.contracts.weth.methods.transfer(user, bento.toBigN(2000).times(bento.toBigN(10**18)).toString()).send({
        from: weth_account
      });

      let a = await bento.web3.eth.getBlock('latest');

      let starttime = await bento.contracts.eth_pool.methods.starttime().call();

      let waittime = starttime - a["timestamp"];
      if (waittime > 0) {
        await bento.testing.increaseTime(waittime);
      } else {
        console.log("late entry", waittime)
      }

      await bento.contracts.weth.methods.approve(bento.contracts.eth_pool.options.address, -1).send({from: user});

      await bento.contracts.eth_pool.methods.stake(
        "2000000000000000000000"
      ).send({
        from: user,
        gas: 300000
      });

      let earned = await bento.contracts.eth_pool.methods.earned(user).call();

      let rr = await bento.contracts.eth_pool.methods.rewardRate().call();

      let rpt = await bento.contracts.eth_pool.methods.rewardPerToken().call();
      //console.log(earned, rr, rpt);
      await bento.testing.increaseTime(86400);
      // await bento.testing.mineBlock();

      earned = await bento.contracts.eth_pool.methods.earned(user).call();

      rpt = await bento.contracts.eth_pool.methods.rewardPerToken().call();

      let ysf = await bento.contracts.bento.methods.bentosScalingFactor().call();

      console.log(earned, ysf, rpt);

      let j = await bento.contracts.eth_pool.methods.getReward().send({
        from: user,
        gas: 300000
      });

      let bento_bal = await bento.contracts.bento.methods.balanceOf(user).call()

      console.log("bento bal", bento_bal)
      // start rebasing
        //console.log("approve bento")
        await bento.contracts.bento.methods.approve(
          bento.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });
        //console.log("approve ycrv")
        await bento.contracts.ycrv.methods.approve(
          bento.contracts.uni_router.options.address,
          -1
        ).send({
          from: user,
          gas: 80000
        });

        let ycrv_bal = await bento.contracts.ycrv.methods.balanceOf(user).call()

        console.log("ycrv_bal bal", ycrv_bal)

        console.log("add liq/ create pool")
        await bento.contracts.uni_router.methods.addLiquidity(
          bento.contracts.bento.options.address,
          bento.contracts.ycrv.options.address,
          bento_bal,
          bento_bal,
          bento_bal,
          bento_bal,
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

        await bento.contracts.uni_pair.methods.approve(
          bento.contracts.ycrv_pool.options.address,
          -1
        ).send({
          from: user,
          gas: 300000
        });

        starttime = await bento.contracts.ycrv_pool.methods.starttime().call();

        a = await bento.web3.eth.getBlock('latest');

        waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await bento.testing.increaseTime(waittime);
        } else {
          console.log("late entry, pool 2", waittime)
        }

        await bento.contracts.ycrv_pool.methods.stake(bal).send({from: user, gas: 400000});


        earned = await bento.contracts.ampl_pool.methods.earned(user).call();

        rr = await bento.contracts.ampl_pool.methods.rewardRate().call();

        rpt = await bento.contracts.ampl_pool.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await bento.testing.increaseTime(625000 + 1000);

        earned = await bento.contracts.ampl_pool.methods.earned(user).call();

        rr = await bento.contracts.ampl_pool.methods.rewardRate().call();

        rpt = await bento.contracts.ampl_pool.methods.rewardPerToken().call();

        console.log(earned, rr, rpt);

        await bento.contracts.ycrv_pool.methods.exit().send({from: user, gas: 400000});

        bento_bal = await bento.contracts.bento.methods.balanceOf(user).call();


        expect(bento.toBigN(bento_bal).toNumber()).toBeGreaterThan(0)
        console.log("bento bal after staking in pool 2", bento_bal);
    });
  });

  describe("ampl", () => {
    test("rewards from pool 1s ampl", async () => {
        await bento.testing.resetEVM("0x2");

        await bento.contracts.UNIAmpl.methods.transfer(user, "5000000000000000").send({
          from: uni_ampl_account
        });
        let a = await bento.web3.eth.getBlock('latest');

        let starttime = await bento.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await bento.testing.increaseTime(waittime);
        } else {
          //console.log("missed entry");
        }

        await bento.contracts.UNIAmpl.methods.approve(bento.contracts.ampl_pool.options.address, -1).send({from: user});

        await bento.contracts.ampl_pool.methods.stake(
          "5000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await bento.contracts.ampl_pool.methods.earned(user).call();

        let rr = await bento.contracts.ampl_pool.methods.rewardRate().call();

        let rpt = await bento.contracts.ampl_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await bento.testing.increaseTime(625000 + 100);
        // await bento.testing.mineBlock();

        earned = await bento.contracts.ampl_pool.methods.earned(user).call();

        rpt = await bento.contracts.ampl_pool.methods.rewardPerToken().call();

        let ysf = await bento.contracts.bento.methods.bentosScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let bento_bal = await bento.contracts.bento.methods.balanceOf(user).call()

        let j = await bento.contracts.ampl_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        // let k = await bento.contracts.eth_pool.methods.exit().send({
        //   from: user,
        //   gas: 300000
        // });
        //
        // //console.log(k.events)

        // weth_bal = await bento.contracts.weth.methods.balanceOf(user).call()

        // expect(weth_bal).toBe(bento.toBigN(2000).times(bento.toBigN(10**18)).toString())

        let ampl_bal = await bento.contracts.UNIAmpl.methods.balanceOf(user).call()

        expect(ampl_bal).toBe("5000000000000000")


        let bento_bal2 = await bento.contracts.bento.methods.balanceOf(user).call()

        let two_fity = bento.toBigN(250).times(bento.toBigN(10**3)).times(bento.toBigN(10**18))
        expect(bento.toBigN(bento_bal2).minus(bento.toBigN(bento_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("eth", () => {
    test("rewards from pool 1s eth", async () => {
        await bento.testing.resetEVM("0x2");

        await bento.contracts.weth.methods.transfer(user, bento.toBigN(2000).times(bento.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await bento.web3.eth.getBlock('latest');

        let starttime = await bento.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await bento.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await bento.contracts.weth.methods.approve(bento.contracts.eth_pool.options.address, -1).send({from: user});

        await bento.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await bento.contracts.eth_pool.methods.earned(user).call();

        let rr = await bento.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await bento.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await bento.testing.increaseTime(625000 + 100);
        // await bento.testing.mineBlock();

        earned = await bento.contracts.eth_pool.methods.earned(user).call();

        rpt = await bento.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await bento.contracts.bento.methods.bentosScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let bento_bal = await bento.contracts.bento.methods.balanceOf(user).call()

        let j = await bento.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await bento.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let bento_bal2 = await bento.contracts.bento.methods.balanceOf(user).call()

        let two_fity = bento.toBigN(250).times(bento.toBigN(10**3)).times(bento.toBigN(10**18))
        expect(bento.toBigN(bento_bal2).minus(bento.toBigN(bento_bal)).toString()).toBe(two_fity.times(1).toString())
    });
    test("rewards from pool 1s eth with rebase", async () => {
        await bento.testing.resetEVM("0x2");

        await bento.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
          from: ycrv_account
        });

        await bento.contracts.weth.methods.transfer(user, bento.toBigN(2000).times(bento.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await bento.web3.eth.getBlock('latest');

        let starttime = await bento.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await bento.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await bento.contracts.weth.methods.approve(bento.contracts.eth_pool.options.address, -1).send({from: user});

        await bento.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await bento.contracts.eth_pool.methods.earned(user).call();

        let rr = await bento.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await bento.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await bento.testing.increaseTime(125000 + 100);
        // await bento.testing.mineBlock();

        earned = await bento.contracts.eth_pool.methods.earned(user).call();

        rpt = await bento.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await bento.contracts.bento.methods.bentosScalingFactor().call();

        //console.log(earned, ysf, rpt);




        let j = await bento.contracts.eth_pool.methods.getReward().send({
          from: user,
          gas: 300000
        });

        let bento_bal = await bento.contracts.bento.methods.balanceOf(user).call()

        console.log("bento bal", bento_bal)
        // start rebasing
          //console.log("approve bento")
          await bento.contracts.bento.methods.approve(
            bento.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });
          //console.log("approve ycrv")
          await bento.contracts.ycrv.methods.approve(
            bento.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });

          let ycrv_bal = await bento.contracts.ycrv.methods.balanceOf(user).call()

          console.log("ycrv_bal bal", ycrv_bal)

          console.log("add liq/ create pool")
          await bento.contracts.uni_router.methods.addLiquidity(
            bento.contracts.bento.options.address,
            bento.contracts.ycrv.options.address,
            bento_bal,
            bento_bal,
            bento_bal,
            bento_bal,
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
          //console.log("init swap")
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

          // trade back for easier calcs later
          //console.log("swap 0")
          await bento.contracts.uni_router.methods.swapExactTokensForTokens(
            "10000000000000000",
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

          await bento.testing.increaseTime(43200);

          //console.log("init twap")
          await bento.contracts.rebaser.methods.init_twap().send({
            from: user,
            gas: 500000
          });

          //console.log("first swap")
          await bento.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000000",
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
          //console.log("second swap")
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

          a = await bento.web3.eth.getBlock('latest');

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

          let bal1 = await bento.contracts.bento.methods.balanceOf(user).call();

          let resBENTO = await bento.contracts.bento.methods.balanceOf(bento.contracts.reserves.options.address).call();

          let resycrv = await bento.contracts.ycrv.methods.balanceOf(bento.contracts.reserves.options.address).call();

          // new balance > old balance
          expect(bento.toBigN(bal).toNumber()).toBeLessThan(bento.toBigN(bal1).toNumber());
          // increases reserves
          expect(bento.toBigN(resycrv).toNumber()).toBeGreaterThan(0);

          r = await bento.contracts.uni_pair.methods.getReserves().call();
          q = await bento.contracts.uni_router.methods.quote(bento.toBigN(10**18).toString(), r[0], r[1]).call();
          console.log("quote", q);
          // not below peg
          expect(bento.toBigN(q).toNumber()).toBeGreaterThan(bento.toBigN(10**18).toNumber());


        await bento.testing.increaseTime(525000 + 100);


        j = await bento.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });
        //console.log(j.events)

        let weth_bal = await bento.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let bento_bal2 = await bento.contracts.bento.methods.balanceOf(user).call()

        let two_fity = bento.toBigN(250).times(bento.toBigN(10**3)).times(bento.toBigN(10**18))
        expect(
          bento.toBigN(bento_bal2).minus(bento.toBigN(bento_bal)).toNumber()
        ).toBeGreaterThan(two_fity.toNumber())
    });
    test("rewards from pool 1s eth with negative rebase", async () => {
        await bento.testing.resetEVM("0x2");

        await bento.contracts.ycrv.methods.transfer(user, "12000000000000000000000000").send({
          from: ycrv_account
        });

        await bento.contracts.weth.methods.transfer(user, bento.toBigN(2000).times(bento.toBigN(10**18)).toString()).send({
          from: weth_account
        });

        let a = await bento.web3.eth.getBlock('latest');

        let starttime = await bento.contracts.eth_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await bento.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await bento.contracts.weth.methods.approve(bento.contracts.eth_pool.options.address, -1).send({from: user});

        await bento.contracts.eth_pool.methods.stake(
          "2000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await bento.contracts.eth_pool.methods.earned(user).call();

        let rr = await bento.contracts.eth_pool.methods.rewardRate().call();

        let rpt = await bento.contracts.eth_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await bento.testing.increaseTime(125000 + 100);
        // await bento.testing.mineBlock();

        earned = await bento.contracts.eth_pool.methods.earned(user).call();

        rpt = await bento.contracts.eth_pool.methods.rewardPerToken().call();

        let ysf = await bento.contracts.bento.methods.bentosScalingFactor().call();

        //console.log(earned, ysf, rpt);




        let j = await bento.contracts.eth_pool.methods.getReward().send({
          from: user,
          gas: 300000
        });

        let bento_bal = await bento.contracts.bento.methods.balanceOf(user).call()

        console.log("bento bal", bento_bal)
        // start rebasing
          //console.log("approve bento")
          await bento.contracts.bento.methods.approve(
            bento.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });
          //console.log("approve ycrv")
          await bento.contracts.ycrv.methods.approve(
            bento.contracts.uni_router.options.address,
            -1
          ).send({
            from: user,
            gas: 80000
          });

          let ycrv_bal = await bento.contracts.ycrv.methods.balanceOf(user).call()

          console.log("ycrv_bal bal", ycrv_bal)

          bento_bal = bento.toBigN(bento_bal);
          console.log("add liq/ create pool")
          await bento.contracts.uni_router.methods.addLiquidity(
            bento.contracts.bento.options.address,
            bento.contracts.ycrv.options.address,
            bento_bal.times(.1).toString(),
            bento_bal.times(.1).toString(),
            bento_bal.times(.1).toString(),
            bento_bal.times(.1).toString(),
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
          //console.log("init swap")
          await bento.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000000",
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

          // trade back for easier calcs later
          //console.log("swap 0")
          await bento.contracts.uni_router.methods.swapExactTokensForTokens(
            "100000000000000",
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

          //console.log("init twap")
          await bento.contracts.rebaser.methods.init_twap().send({
            from: user,
            gas: 500000
          });

          //console.log("first swap")
          await bento.contracts.uni_router.methods.swapExactTokensForTokens(
            "100000000000000",
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
          //console.log("second swap")
          await bento.contracts.uni_router.methods.swapExactTokensForTokens(
            "1000000000000000000",
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

          a = await bento.web3.eth.getBlock('latest');

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

          let bal1 = await bento.contracts.bento.methods.balanceOf(user).call();

          let resBENTO = await bento.contracts.bento.methods.balanceOf(bento.contracts.reserves.options.address).call();

          let resycrv = await bento.contracts.ycrv.methods.balanceOf(bento.contracts.reserves.options.address).call();

          expect(bento.toBigN(bal1).toNumber()).toBeLessThan(bento.toBigN(bal).toNumber());
          expect(bento.toBigN(resycrv).toNumber()).toBe(0);

          r = await bento.contracts.uni_pair.methods.getReserves().call();
          q = await bento.contracts.uni_router.methods.quote(bento.toBigN(10**18).toString(), r[0], r[1]).call();
          console.log("quote", q);
          // not below peg
          expect(bento.toBigN(q).toNumber()).toBeLessThan(bento.toBigN(10**18).toNumber());


        await bento.testing.increaseTime(525000 + 100);


        j = await bento.contracts.eth_pool.methods.exit().send({
          from: user,
          gas: 300000
        });
        //console.log(j.events)

        let weth_bal = await bento.contracts.weth.methods.balanceOf(user).call()

        expect(weth_bal).toBe("2000000000000000000000")


        let bento_bal2 = await bento.contracts.bento.methods.balanceOf(user).call()

        let two_fity = bento.toBigN(250).times(bento.toBigN(10**3)).times(bento.toBigN(10**18))
        expect(
          bento.toBigN(bento_bal2).minus(bento.toBigN(bento_bal)).toNumber()
        ).toBeLessThan(two_fity.toNumber())
    });
  });

  describe("yfi", () => {
    test("rewards from pool 1s yfi", async () => {
        await bento.testing.resetEVM("0x2");
        await bento.contracts.yfi.methods.transfer(user, "500000000000000000000").send({
          from: yfi_account
        });

        let a = await bento.web3.eth.getBlock('latest');

        let starttime = await bento.contracts.yfi_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await bento.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await bento.contracts.yfi.methods.approve(bento.contracts.yfi_pool.options.address, -1).send({from: user});

        await bento.contracts.yfi_pool.methods.stake(
          "500000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await bento.contracts.yfi_pool.methods.earned(user).call();

        let rr = await bento.contracts.yfi_pool.methods.rewardRate().call();

        let rpt = await bento.contracts.yfi_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await bento.testing.increaseTime(625000 + 100);
        // await bento.testing.mineBlock();

        earned = await bento.contracts.yfi_pool.methods.earned(user).call();

        rpt = await bento.contracts.yfi_pool.methods.rewardPerToken().call();

        let ysf = await bento.contracts.bento.methods.bentosScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let bento_bal = await bento.contracts.bento.methods.balanceOf(user).call()

        let j = await bento.contracts.yfi_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await bento.contracts.yfi.methods.balanceOf(user).call()

        expect(weth_bal).toBe("500000000000000000000")


        let bento_bal2 = await bento.contracts.bento.methods.balanceOf(user).call()

        let two_fity = bento.toBigN(250).times(bento.toBigN(10**3)).times(bento.toBigN(10**18))
        expect(bento.toBigN(bento_bal2).minus(bento.toBigN(bento_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("comp", () => {
    test("rewards from pool 1s comp", async () => {
        await bento.testing.resetEVM("0x2");
        await bento.contracts.comp.methods.transfer(user, "50000000000000000000000").send({
          from: comp_account
        });

        let a = await bento.web3.eth.getBlock('latest');

        let starttime = await bento.contracts.comp_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await bento.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await bento.contracts.comp.methods.approve(bento.contracts.comp_pool.options.address, -1).send({from: user});

        await bento.contracts.comp_pool.methods.stake(
          "50000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await bento.contracts.comp_pool.methods.earned(user).call();

        let rr = await bento.contracts.comp_pool.methods.rewardRate().call();

        let rpt = await bento.contracts.comp_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await bento.testing.increaseTime(625000 + 100);
        // await bento.testing.mineBlock();

        earned = await bento.contracts.comp_pool.methods.earned(user).call();

        rpt = await bento.contracts.comp_pool.methods.rewardPerToken().call();

        let ysf = await bento.contracts.bento.methods.bentosScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let bento_bal = await bento.contracts.bento.methods.balanceOf(user).call()

        let j = await bento.contracts.comp_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await bento.contracts.comp.methods.balanceOf(user).call()

        expect(weth_bal).toBe("50000000000000000000000")


        let bento_bal2 = await bento.contracts.bento.methods.balanceOf(user).call()

        let two_fity = bento.toBigN(250).times(bento.toBigN(10**3)).times(bento.toBigN(10**18))
        expect(bento.toBigN(bento_bal2).minus(bento.toBigN(bento_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("lend", () => {
    test("rewards from pool 1s lend", async () => {
        await bento.testing.resetEVM("0x2");
        await bento.web3.eth.sendTransaction({from: user2, to: lend_account, value : bento.toBigN(100000*10**18).toString()});

        await bento.contracts.lend.methods.transfer(user, "10000000000000000000000000").send({
          from: lend_account
        });

        let a = await bento.web3.eth.getBlock('latest');

        let starttime = await bento.contracts.lend_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await bento.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await bento.contracts.lend.methods.approve(bento.contracts.lend_pool.options.address, -1).send({from: user});

        await bento.contracts.lend_pool.methods.stake(
          "10000000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await bento.contracts.lend_pool.methods.earned(user).call();

        let rr = await bento.contracts.lend_pool.methods.rewardRate().call();

        let rpt = await bento.contracts.lend_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await bento.testing.increaseTime(625000 + 100);
        // await bento.testing.mineBlock();

        earned = await bento.contracts.lend_pool.methods.earned(user).call();

        rpt = await bento.contracts.lend_pool.methods.rewardPerToken().call();

        let ysf = await bento.contracts.bento.methods.bentosScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let bento_bal = await bento.contracts.bento.methods.balanceOf(user).call()

        let j = await bento.contracts.lend_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await bento.contracts.lend.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000000")


        let bento_bal2 = await bento.contracts.bento.methods.balanceOf(user).call()

        let two_fity = bento.toBigN(250).times(bento.toBigN(10**3)).times(bento.toBigN(10**18))
        expect(bento.toBigN(bento_bal2).minus(bento.toBigN(bento_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("link", () => {
    test("rewards from pool 1s link", async () => {
        await bento.testing.resetEVM("0x2");

        await bento.web3.eth.sendTransaction({from: user2, to: link_account, value : bento.toBigN(100000*10**18).toString()});

        await bento.contracts.link.methods.transfer(user, "10000000000000000000000000").send({
          from: link_account
        });

        let a = await bento.web3.eth.getBlock('latest');

        let starttime = await bento.contracts.link_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await bento.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await bento.contracts.link.methods.approve(bento.contracts.link_pool.options.address, -1).send({from: user});

        await bento.contracts.link_pool.methods.stake(
          "10000000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await bento.contracts.link_pool.methods.earned(user).call();

        let rr = await bento.contracts.link_pool.methods.rewardRate().call();

        let rpt = await bento.contracts.link_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await bento.testing.increaseTime(625000 + 100);
        // await bento.testing.mineBlock();

        earned = await bento.contracts.link_pool.methods.earned(user).call();

        rpt = await bento.contracts.link_pool.methods.rewardPerToken().call();

        let ysf = await bento.contracts.bento.methods.bentosScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let bento_bal = await bento.contracts.bento.methods.balanceOf(user).call()

        let j = await bento.contracts.link_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await bento.contracts.link.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000000")


        let bento_bal2 = await bento.contracts.bento.methods.balanceOf(user).call()

        let two_fity = bento.toBigN(250).times(bento.toBigN(10**3)).times(bento.toBigN(10**18))
        expect(bento.toBigN(bento_bal2).minus(bento.toBigN(bento_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("mkr", () => {
    test("rewards from pool 1s mkr", async () => {
        await bento.testing.resetEVM("0x2");
        await bento.web3.eth.sendTransaction({from: user2, to: mkr_account, value : bento.toBigN(100000*10**18).toString()});
        let eth_bal = await bento.web3.eth.getBalance(mkr_account);

        await bento.contracts.mkr.methods.transfer(user, "10000000000000000000000").send({
          from: mkr_account
        });

        let a = await bento.web3.eth.getBlock('latest');

        let starttime = await bento.contracts.mkr_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await bento.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await bento.contracts.mkr.methods.approve(bento.contracts.mkr_pool.options.address, -1).send({from: user});

        await bento.contracts.mkr_pool.methods.stake(
          "10000000000000000000000"
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await bento.contracts.mkr_pool.methods.earned(user).call();

        let rr = await bento.contracts.mkr_pool.methods.rewardRate().call();

        let rpt = await bento.contracts.mkr_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await bento.testing.increaseTime(625000 + 100);
        // await bento.testing.mineBlock();

        earned = await bento.contracts.mkr_pool.methods.earned(user).call();

        rpt = await bento.contracts.mkr_pool.methods.rewardPerToken().call();

        let ysf = await bento.contracts.bento.methods.bentosScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let bento_bal = await bento.contracts.bento.methods.balanceOf(user).call()

        let j = await bento.contracts.mkr_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await bento.contracts.mkr.methods.balanceOf(user).call()

        expect(weth_bal).toBe("10000000000000000000000")


        let bento_bal2 = await bento.contracts.bento.methods.balanceOf(user).call()

        let two_fity = bento.toBigN(250).times(bento.toBigN(10**3)).times(bento.toBigN(10**18))
        expect(bento.toBigN(bento_bal2).minus(bento.toBigN(bento_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });

  describe("snx", () => {
    test("rewards from pool 1s snx", async () => {
        await bento.testing.resetEVM("0x2");

        await bento.web3.eth.sendTransaction({from: user2, to: snx_account, value : bento.toBigN(100000*10**18).toString()});

        let snx_bal = await bento.contracts.snx.methods.balanceOf(snx_account).call();

        console.log(snx_bal)

        await bento.contracts.snx.methods.transfer(user, snx_bal).send({
          from: snx_account
        });

        snx_bal = await bento.contracts.snx.methods.balanceOf(user).call();

        console.log(snx_bal)

        let a = await bento.web3.eth.getBlock('latest');

        let starttime = await bento.contracts.snx_pool.methods.starttime().call();

        let waittime = starttime - a["timestamp"];
        if (waittime > 0) {
          await bento.testing.increaseTime(waittime);
        } else {
          console.log("late entry", waittime)
        }

        await bento.contracts.snx.methods.approve(bento.contracts.snx_pool.options.address, -1).send({from: user});

        await bento.contracts.snx_pool.methods.stake(
          snx_bal
        ).send({
          from: user,
          gas: 300000
        });

        let earned = await bento.contracts.snx_pool.methods.earned(user).call();

        let rr = await bento.contracts.snx_pool.methods.rewardRate().call();

        let rpt = await bento.contracts.snx_pool.methods.rewardPerToken().call();
        //console.log(earned, rr, rpt);
        await bento.testing.increaseTime(625000 + 100);
        // await bento.testing.mineBlock();

        earned = await bento.contracts.snx_pool.methods.earned(user).call();

        rpt = await bento.contracts.snx_pool.methods.rewardPerToken().call();

        let ysf = await bento.contracts.bento.methods.bentosScalingFactor().call();

        //console.log(earned, ysf, rpt);


        let bento_bal = await bento.contracts.bento.methods.balanceOf(user).call()

        let j = await bento.contracts.snx_pool.methods.exit().send({
          from: user,
          gas: 300000
        });

        //console.log(j.events)

        let weth_bal = await bento.contracts.snx.methods.balanceOf(user).call()

        expect(weth_bal).toBe(snx_bal)


        let bento_bal2 = await bento.contracts.bento.methods.balanceOf(user).call()

        let two_fity = bento.toBigN(250).times(bento.toBigN(10**3)).times(bento.toBigN(10**18))
        expect(bento.toBigN(bento_bal2).minus(bento.toBigN(bento_bal)).toString()).toBe(two_fity.times(1).toString())
    });
  });
})
