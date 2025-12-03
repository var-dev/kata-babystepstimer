import { describe, it, mock, type Mock} from "node:test";
import assert from "node:assert";

import { BackgroundColor, SetIntervalCallBack } from "../src/babysteps";

enum Timer  {
  CYCLE_SECONDS = 120,
}

describe("SetIntervalCallBack", () => {
  it("calls setBackgroundColorNeutral when elapsed time > 1 second", () => {
    let now = 1000 ;
    const getDateNowSeconds = () => now;
    const drawTimerWindow = () => {};
    const createEffect = () => {};

    const cb = new SetIntervalCallBack(drawTimerWindow, createEffect, getDateNowSeconds, Timer.CYCLE_SECONDS);
    cb.bodyBackgroundColor = BackgroundColor.FAILED
    mock.method(cb , "updateTimerWindow", )
    cb.handler();

    // advance time so elapsed > 1
    now += 3;

    cb.handler();
    cb.handler();
    cb.handler();

    assert.strictEqual(cb.bodyBackgroundColor, BackgroundColor.NEUTRAL)
    assert.strictEqual((cb.updateTimerWindow as any).mock.calls.length, 2)
    assert.deepEqual((cb.updateTimerWindow as any).mock.calls[1].arguments, [ 3 ]) // elapsed +=3 sec
  });

  it("calls actionTimeRunsOut when remaining time is 5 seconds", () => {
    let now = 1000 ;
    const getDateNowSeconds = () => now;
    const drawTimerWindow = () => {};
    const createEffect = () => {};

    const cb = new SetIntervalCallBack(drawTimerWindow, createEffect, getDateNowSeconds, Timer.CYCLE_SECONDS);
    mock.method(cb , "actionTimeRunsOut", )
    mock.method(cb , "updateTimerWindow", )
    cb.handler();

    // advance time so remaining = 5
    now += 115;

    cb.handler();
    cb.handler();
    cb.handler();

    assert.strictEqual(cb.lastRemainingTimeSeconds,5)
    assert.strictEqual((cb.actionTimeRunsOut as any).mock.calls.length,1)
    assert.strictEqual((cb.updateTimerWindow as any).mock.calls.length, 2)
    assert.deepEqual((cb.updateTimerWindow as any).mock.calls[1].arguments, [ 115 ]) // elapsed +=115 sec
  });

  it("calls actionFailed when remaining time is 0 seconds", () => {
    let now = 1000 ;
    const getDateNowSeconds = () => now;
    const drawTimerWindow = () => {};
    const createEffect = () => {};

    const cb = new SetIntervalCallBack(drawTimerWindow, createEffect, getDateNowSeconds, Timer.CYCLE_SECONDS);
    mock.method(cb , "actionFailed", )
    mock.method(cb , "updateTimerWindow", )
    cb.handler();

    // advance time so remaining = 0
    now += 120;

    cb.handler();
    cb.handler();
    cb.handler();

    assert.strictEqual((cb.actionFailed as any).mock.calls.length,1)
    assert.strictEqual((cb.updateTimerWindow as any).mock.calls.length, 2)
    assert.deepEqual((cb.updateTimerWindow as any).mock.calls[1].arguments, [ 120 ]) // elapsed +=120 sec
  });

  it("calls currentCycleReset when remaining time is less than 0 seconds", () => {
    let now = 1000 ;
    const getDateNowSeconds = () => now;
    const drawTimerWindow = () => {};
    const createEffect = () => {};

    const cb = new SetIntervalCallBack(drawTimerWindow, createEffect, getDateNowSeconds, Timer.CYCLE_SECONDS);
    mock.method(cb , "currentCycleReset", )
    mock.method(cb , "updateTimerWindow", )
    cb.handler();

    // advance time so remaining < 0
    now += 121;

    cb.handler();
    cb.handler();
    cb.handler();

    assert.strictEqual((cb.currentCycleReset as any).mock.calls.length,1)
    assert.strictEqual((cb.updateTimerWindow as any).mock.calls.length, 2)
    assert.deepEqual((cb.updateTimerWindow as any).mock.calls[1].arguments, [ 0 ]) // elapsed +=121 sec reset to 0
    assert.strictEqual(cb.currentCycleStartTimeSeconds, now)
  });
});