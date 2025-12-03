export type TimeMinutesSeconds = { minute: number; second: number; }
type Times = { elapsed: number; remaining: number; }
type DrawTimerWindow = (timerText: string, bodyColor: string, running: boolean)=>void
type CreateAudioVisualEffect = (url: string) => void


declare global {
  interface Window {
    command: (arg: string) => void;
  }
}
export enum Timer  {
  CYCLE_SECONDS = 15,
}
export enum BackgroundColor {
  NEUTRAL = "#ffffff",
  FAILED = "#ffcccc",
  PASSED = "#ccffcc",
}

if (typeof window !== "undefined") {
  window.document.body.innerHTML = CreateTimerHtml("00:00", BackgroundColor.NEUTRAL, false);
  window.command = command;
}

class SetIntervalCallBack {
  public readonly cycleDurationSeconds: number = Timer.CYCLE_SECONDS;
  public lastRemainingTimeSeconds: number = 0;
  public currentCycleStartTimeSeconds: number = 0;
  public bodyBackgroundColor: BackgroundColor = BackgroundColor.NEUTRAL;
  constructor(
    drawTimerWindow: DrawTimerWindow,
    createEffect: CreateAudioVisualEffect,
    getDateNowSeconds: () => number
  ){
    this.drawTimerWindow = drawTimerWindow.bind(this);
    this.createEffect = createEffect.bind(this);
    this.getDateNowSeconds = getDateNowSeconds.bind(this);
    this.currentCycleReset();
  }
  drawTimerWindow: DrawTimerWindow;
  createEffect: CreateAudioVisualEffect;
  getDateNowSeconds: () => number;
  calculateTimes(): Times{
    const elapsed = this.getDateNowSeconds() - this.currentCycleStartTimeSeconds
    return {elapsed, remaining: this.cycleDurationSeconds - elapsed}
  }
  currentCycleReset(){
    this.currentCycleStartTimeSeconds = this.getDateNowSeconds()
  }
  actionTimeRunsOut(){
    this.createEffect("2166__suburban-grilla__bowl-struck.wav")
  }
  actionFailed(){
    this.createEffect("32304__acclivity__shipsbell.wav")
    this.bodyBackgroundColor = BackgroundColor.FAILED;
  }
  setBackgroundColorNeutral(){
    this.bodyBackgroundColor = BackgroundColor.NEUTRAL;
  }
  updateTimerWindow(elapsedTime: number){
    this.drawTimerWindow(
      printRemainingTimeCaption(getRemainingMinutesSeconds(elapsedTime * 1000)),
      this.bodyBackgroundColor,
      true)
  }
  handler(){
    let times: Times = this.calculateTimes()
    
    if (this.lastRemainingTimeSeconds === times.remaining) { return; }
    this.lastRemainingTimeSeconds = times.remaining;

    if (times.elapsed > 1) {
      this.setBackgroundColorNeutral()
    }
    if (times.remaining === 5) {
      this.actionTimeRunsOut()
    }
    if (times.remaining === 0) {
      this.actionFailed()
    }
    if (times.remaining < 0) {
      this.currentCycleReset()
      return
    }
    this.updateTimerWindow(times.elapsed)
  }
}
class ThreadTimer{
  private static threadTimerInstance: ThreadTimer | undefined;
  public  static create(drawTimerWindow: DrawTimerWindow): ThreadTimer {
    if (!ThreadTimer.threadTimerInstance) {
      ThreadTimer.threadTimerInstance = new ThreadTimer(new SetIntervalCallBack(
        drawTimerWindow,
        playSound,
        dateNowSeconds
      ));
    }
    return ThreadTimer.threadTimerInstance;
  }
  public static destroy(): void {
    if (ThreadTimer.threadTimerInstance) {
      clearInterval(ThreadTimer.threadTimerInstance.threadTimer)
      ThreadTimer.threadTimerInstance = undefined;
    }
  }
  private constructor( callbackObject: SetIntervalCallBack){
    this.setIntervalCallBack = callbackObject
  }
  private threadTimer!: NodeJS.Timeout;
  private setIntervalCallBack: SetIntervalCallBack;
  public run(){
    this.threadTimer = setInterval(
      this.setIntervalCallBack.handler.bind(this.setIntervalCallBack), 
      150, 
    );
  }
  public stop(){
    ThreadTimer.destroy()
  }
  public reset(aBodyBackgroundColor: BackgroundColor){
    this.setIntervalCallBack.bodyBackgroundColor = aBodyBackgroundColor;
    this.setIntervalCallBack.currentCycleStartTimeSeconds = dateNowSeconds();
  }
}

export function command(arg: string): void {
  let args = { Url: { AbsoluteUri: `command://${arg}/` } }
  console.log('called', arg, args.Url.AbsoluteUri);

  const threadTimer = ThreadTimer.create(drawTimerHtml) 

  if (args.Url.AbsoluteUri == "command://start/") {
    threadTimer.run();
  }
  else if (args.Url.AbsoluteUri == "command://stop/") {
    threadTimer.stop();
    window.document.body.innerHTML = CreateTimerHtml("00:00", BackgroundColor.NEUTRAL, false);
  }
  else if (args.Url.AbsoluteUri == "command://reset/") {
    threadTimer.reset(BackgroundColor.PASSED);
  }
  else if (args.Url.AbsoluteUri == "command://quit/") {
    threadTimer.stop()
    window.document.body.innerHTML = "";
  }
};


export function printRemainingTimeCaption(
  remaining: TimeMinutesSeconds
): string {
  return (
    printZeroPrefixedNumber(remaining.minute) +
    ":" +
    printZeroPrefixedNumber(remaining.second)
  );
}

export function getRemainingMinutesSeconds(elapsedTimeSeconds: number) {
  let remainingTime: Date = new Date(Timer.CYCLE_SECONDS * 1000 - elapsedTimeSeconds);
  return {
    minute: remainingTime.getMinutes(),
    second: remainingTime.getSeconds(),
  };
}

export function printZeroPrefixedNumber(number: number): string {
  if (number < 10) { return `0${number}`; }
  return `${number}`;
}

export function CreateTimerHtml(timerText: string, bodyColor: string, running: boolean): string {

  let timerHtml: string = "<div style=\"border: 3px solid #555555; background: " + bodyColor +
    "; margin: 0; padding: 0;\">" +
    "<h1 style=\"text-align: center; font-size: 30px; color: #333333;\">" + timerText +
    "</h1>" +
    "<div style=\"text-align: center\">";
  if (running) {
    timerHtml += "<a style=\"color: #555555;\" href=\"javascript:command('stop');\">Stop</a> " +
      "<a style=\"color: #555555;\" href=\"javascript:command('reset');\">Reset</a> ";
  }
  else {
    timerHtml += "<a style=\"color: #555555;\" href=\"javascript:command('start');\">Start</a> ";
  }
  timerHtml += "<a style=\"color: #555555;\" href=\"javascript:command('quit');\">Quit</a> ";
  timerHtml += "</div></div>"
  return timerHtml;
}

function drawTimerHtml(timerText: string, bodyColor: string, running: boolean) {
  window.document.body.innerHTML = CreateTimerHtml(timerText, bodyColor, running);
}


function playSound(url: string): void {
  let audio = new Audio();
  audio.src = `./src/sounds/${url}`;
  console.log(audio.src);
  audio.load();
  audio.play();
}

function dateNowSeconds(){
  return Math.floor(Date.now() / 1000);
}
