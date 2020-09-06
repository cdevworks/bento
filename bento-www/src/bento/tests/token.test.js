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

describe("token_tests", () => {
  let snapshotId;
  let user;
  let new_user;
  beforeAll(async () => {
    const accounts = await bento.web3.eth.getAccounts();
    bento.addAccount(accounts[0]);
    user = accounts[0];
    new_user = accounts[1];
    snapshotId = await bento.testing.snapshot();
  });

  beforeEach(async () => {
    await bento.testing.resetEVM("0x2");
  });

  describe("expected fail transfers", () => {
    test("cant transfer from a 0 balance", async () => {
      await bento.testing.expectThrow(bento.contracts.bento.methods.transfer(user, "100").send({from: new_user}), "SafeMath: subtraction overflow");
    });
    test("cant transferFrom without allowance", async () => {
      await bento.testing.expectThrow(bento.contracts.bento.methods.transferFrom(user, new_user, "100").send({from: new_user}), "SafeMath: subtraction overflow");
    });

  });

  describe("non-failing transfers", () => {
    test("transfer to self doesnt inflate", async () => {
      let bal0 = await bento.contracts.bento.methods.balanceOf(user).call();
      await bento.contracts.bento.methods.transfer(user, "100").send({from: user});
      let bal1 = await bento.contracts.bento.methods.balanceOf(user).call();
      expect(bal0).toBe(bal1);
    });
    test("transferFrom works", async () => {
      let bal00 = await bento.contracts.bento.methods.balanceOf(user).call();
      let bal01 = await bento.contracts.bento.methods.balanceOf(new_user).call();
      await bento.contracts.bento.methods.approve(new_user, "100").send({from: user});
      await bento.contracts.bento.methods.transferFrom(user, new_user, "100").send({from: new_user});
      let bal10 = await bento.contracts.bento.methods.balanceOf(user).call();
      let bal11 = await bento.contracts.bento.methods.balanceOf(new_user).call();
      expect((bento.toBigN(bal01).plus(bento.toBigN(100))).toString()).toBe(bal11);
      expect((bento.toBigN(bal00).minus(bento.toBigN(100))).toString()).toBe(bal10);
    });
    test("approve", async () => {
      await bento.contracts.bento.methods.approve(new_user, "100").send({from: user});
      let allowance = await bento.contracts.bento.methods.allowance(user, new_user).call();
      expect(allowance).toBe("100")
    });
    test("increaseAllowance", async () => {
      await bento.contracts.bento.methods.increaseAllowance(new_user, "100").send({from: user});
      let allowance = await bento.contracts.bento.methods.allowance(user, new_user).call();
      expect(allowance).toBe("100")
    });
    test("decreaseAllowance", async () => {
      await bento.contracts.bento.methods.increaseAllowance(new_user, "100").send({from: user});
      let allowance = await bento.contracts.bento.methods.allowance(user, new_user).call();
      expect(allowance).toBe("100")
      await bento.contracts.bento.methods.decreaseAllowance(new_user, "100").send({from: user});
      allowance = await bento.contracts.bento.methods.allowance(user, new_user).call();
      expect(allowance).toBe("0")
    });
    test("decreaseAllowance from 0", async () => {
      await bento.contracts.bento.methods.decreaseAllowance(new_user, "100").send({from: user});
      let allowance = await bento.contracts.bento.methods.allowance(user, new_user).call();
      expect(allowance).toBe("0")
    });
  })

})
