export type TimeMinutesSeconds = { minute: number; second: number; }

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

class ThreadTimer{
  public  static readonly CYCLE_SECONDS = 16;
  private static threadTimerInstance: ThreadTimer | undefined;
  public  static create(): ThreadTimer {
    if (!ThreadTimer.threadTimerInstance) {
      ThreadTimer.threadTimerInstance = new ThreadTimer();
    }
    return ThreadTimer.threadTimerInstance;
  }
  public static destroy(): void {
    if (ThreadTimer.threadTimerInstance) {
      clearInterval(ThreadTimer.threadTimerInstance.threadTimer)
      ThreadTimer.threadTimerInstance = undefined;
    }
  }
  private constructor(){}
  private threadTimer!: NodeJS.Timeout;
  private bodyBackgroundColor!: BackgroundColor;
  private currentCycleStartTimeSeconds!: number;
  public run(){
    this.reset(BackgroundColor.NEUTRAL)
    let lastRemainingTimeSeconds = 0;
    this.threadTimer = setInterval( () => {
      let elapsedTimeSeconds: number = dateNowSeconds() - this.currentCycleStartTimeSeconds;
      let remainingTimeSeconds: number = ThreadTimer.CYCLE_SECONDS - elapsedTimeSeconds;

      if (lastRemainingTimeSeconds === remainingTimeSeconds) { return; }
      lastRemainingTimeSeconds = remainingTimeSeconds;

      if (remainingTimeSeconds <= 13) {
        this.bodyBackgroundColor = BackgroundColor.NEUTRAL;
      }
      if (remainingTimeSeconds === 5) {
        playSound("2166__suburban-grilla__bowl-struck.wav");
      }
      if (remainingTimeSeconds < 0) {
        playSound("32304__acclivity__shipsbell.wav");
        this.reset(BackgroundColor.FAILED)
        elapsedTimeSeconds = dateNowSeconds() - this.currentCycleStartTimeSeconds;
        return
      }
      document.body.innerHTML = CreateTimerHtml(printRemainingTimeCaption(getRemainingMinutesSeconds(elapsedTimeSeconds * 1000)), this.bodyBackgroundColor, true);
      
    }, 150);
  }
  public stop(){
    ThreadTimer.destroy()
  }
  public reset(aBodyBackgroundColor: BackgroundColor){
    this.bodyBackgroundColor = aBodyBackgroundColor;
    this.currentCycleStartTimeSeconds = dateNowSeconds();
  }
}

export function command(arg: string): void {
  let args = { Url: { AbsoluteUri: `command://${arg}/` } }
  console.log('called', arg, args.Url.AbsoluteUri);

  const threadTimer2 = ThreadTimer.create() 

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