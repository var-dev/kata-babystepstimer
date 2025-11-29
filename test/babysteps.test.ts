import { describe, it } from "node:test";
import assert from "node:assert";

import {
  type TimeMinutesSeconds,
  printRemainingTimeCaption,
  CreateTimerHtml,
} from "../src/babysteps";

describe("A new babysteps timer", () => {
  it("is successfully created", () => {
    var result = CreateTimerHtml("Aap", "Noot", true);
    var expected =
      '<div style="border: 3px solid #555555; background: Noot; margin: 0; padding: 0;"><h1 style="text-align: center; font-size: 30px; color: #333333;">Aap</h1><div style="text-align: center"><a style="color: #555555;" href="javascript:command(\'stop\');">Stop</a> <a style="color: #555555;" href="javascript:command(\'reset\');">Reset</a> <a style="color: #555555;" href="javascript:command(\'quit\');">Quit</a> </div></div>';
    assert.equal(expected, result);
    //expect(false).to.be.false
    //expect(30).to.equal(30)
    //expect([]).to.be.empty;
  });
  it("prints the remaining time 01:02", () => {
    var result = printRemainingTimeCaption({ minute: 1, second: 2 });
    assert.equal("01:02", result);
  });
  it("prints the remaining time 11:22", () => {
    var result = printRemainingTimeCaption({ minute: 11, second: 22 });
    assert.equal("11:22", result);
  });
});
