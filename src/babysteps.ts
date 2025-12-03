export type TimeMinutesSeconds = { minute: number; second: number; }
type RenderTimerCallBackFn = (timerText: string, bodyColor: string, running: boolean)=>void
type PlaySoundFn = (url: string) => void
type SetIntervalCallBackParams = {
    lastRemainingTimeSeconds: number, 
    bodyBackgroundColor: BackgroundColor,
    currentCycleStartTimeSeconds: number,
    renderTimerCallBackFn: RenderTimerCallBackFn,
    cycleDurationSeconds: number,
    playSoundFn: PlaySoundFn;
    dateNowSecondsFn: () => number
}

declare global {
  interface Window {
    command: (arg: string) => void;
  }
}

enum BackgroundColor {
  NEUTRAL = "#ffffff",
  FAILED = "#ffcccc",
  PASSED = "#ccffcc",
}

if (typeof window !== "undefined") {
  window.document.body.innerHTML = CreateTimerHtml("00:00", BackgroundColor.NEUTRAL, false);
  window.command = command;
}

class SetIntervalCallBack implements SetIntervalCallBackParams {
  public readonly cycleDurationSeconds: number = ThreadTimer.CYCLE_SECONDS;
  public lastRemainingTimeSeconds: number = 0;
  public currentCycleStartTimeSeconds: number = 0;
  public bodyBackgroundColor: BackgroundColor = BackgroundColor.NEUTRAL;
  constructor(
    renderTimerCallBack: RenderTimerCallBackFn,
    playSound: PlaySoundFn,
    dateNowSeconds: () => number
  ){
    this.renderTimerCallBackFn = renderTimerCallBack.bind(this);
    this.playSoundFn = playSound.bind(this);
    this.dateNowSecondsFn = dateNowSeconds.bind(this);
  }
  renderTimerCallBackFn: RenderTimerCallBackFn;
  playSoundFn: PlaySoundFn;
  dateNowSecondsFn: () => number;
  calculateTimes(){
    const elapsed = this.dateNowSecondsFn() - this.currentCycleStartTimeSeconds
    const remaining = this.cycleDurationSeconds - elapsed
    return {elapsed, remaining}
  }
  currentCycleReset(){
    this.currentCycleStartTimeSeconds = this.dateNowSecondsFn()
  }
  actionTimeRunsOut(){
    this.playSoundFn("2166__suburban-grilla__bowl-struck.wav")
  }
  actionFailed(){
    this.playSoundFn("32304__acclivity__shipsbell.wav")
    this.bodyBackgroundColor = BackgroundColor.FAILED;
  }
  setBackgroundColorNeutral(){
    this.bodyBackgroundColor = BackgroundColor.NEUTRAL;
  }
  updateTimerWindow(elapsedTime: number){
    this.renderTimerCallBackFn(
      printRemainingTimeCaption(getRemainingMinutesSeconds(elapsedTime * 1000)),
      this.bodyBackgroundColor,
      true)
  }
}
class ThreadTimer{
  public  static readonly CYCLE_SECONDS = 15;
  private static threadTimerInstance: ThreadTimer | undefined;
  public  static create(renderTimerCallBack: RenderTimerCallBackFn): ThreadTimer {
    if (!ThreadTimer.threadTimerInstance) {
      ThreadTimer.threadTimerInstance = new ThreadTimer(new SetIntervalCallBack(
        renderTimerCallBack,
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
  private constructor( params: SetIntervalCallBack){
    this.setIntervalCallBackParams = params
  }
  private threadTimer!: NodeJS.Timeout;
  private setIntervalCallBackParams: SetIntervalCallBack;
  public run(){
    this.setIntervalCallBackParams.currentCycleStartTimeSeconds = dateNowSeconds();
    this.threadTimer = setInterval(
      setIntervalCallBack, 
      150, 
      this.setIntervalCallBackParams
    );
  }
  public stop(){
    ThreadTimer.destroy()
  }
  public reset(aBodyBackgroundColor: BackgroundColor){
    this.setIntervalCallBackParams.bodyBackgroundColor = aBodyBackgroundColor;
    this.setIntervalCallBackParams.currentCycleStartTimeSeconds = dateNowSeconds();
  }
}

export function command(arg: string): void {
  let args = { Url: { AbsoluteUri: `command://${arg}/` } }
  console.log('called', arg, args.Url.AbsoluteUri);

  const threadTimer2 = ThreadTimer.create(drawTimerHtml) 

  if (args.Url.AbsoluteUri == "command://start/") {
    threadTimer2.run();
  }
  else if (args.Url.AbsoluteUri == "command://stop/") {
    threadTimer2.stop();
    window.document.body.innerHTML = CreateTimerHtml("00:00", BackgroundColor.NEUTRAL, false);
  }
  else if (args.Url.AbsoluteUri == "command://reset/") {
    threadTimer2.reset(BackgroundColor.PASSED);
  }
  else if (args.Url.AbsoluteUri == "command://quit/") {
    threadTimer2.stop()
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

function getRemainingMinutesSeconds(elapsedTime: number) {
  let remainingTime: Date = new Date(ThreadTimer.CYCLE_SECONDS * 1000 - elapsedTime);
  return {
    minute: remainingTime.getMinutes(),
    second: remainingTime.getSeconds(),
  };
}

function printZeroPrefixedNumber(number: number): string {
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

function setIntervalCallBack(params: SetIntervalCallBack): void {
  let elapsedTimeSeconds: number = params.calculateTimes().elapsed
  let remainingTimeSeconds: number = params.calculateTimes().remaining;
  
  if (params.lastRemainingTimeSeconds === remainingTimeSeconds) { return; }
  params.lastRemainingTimeSeconds = remainingTimeSeconds;

  if (elapsedTimeSeconds > 1) {
    params.setBackgroundColorNeutral()
  }
  if (remainingTimeSeconds === 5) {
    params.actionTimeRunsOut()
  }
  if (remainingTimeSeconds === 0) {
    params.actionFailed()
  }
  if (remainingTimeSeconds < 0) {
    params.currentCycleReset()
    return
  }
  params.updateTimerWindow(elapsedTimeSeconds)
}