var assert = require("assert");
import chai from "chai";
import UserController from "../../../src/services/user";

describe("Basic Mocha String Test", function() {
  it("compare", function() {
    const userController = new UserController();
    chai.expect(userController.verifyEmailPassword("123", "123123")).equal(true);
  });
});
