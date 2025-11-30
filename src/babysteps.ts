export type TimeMinutesSeconds = { minute: number; second: number; }

enum BackgroundColor {
  NEUTRAL = "#ffffff",
  FAILED = "#ffcccc",
  PASSED = "#ccffcc",
}

const SecondsInCycle: number = 16;


let _threadTimer: NodeJS.Timeout;

let _currentCycleStartTimeSeconds = 0;

if (typeof window !== "undefined") {
  window.document.body.innerHTML = CreateTimerHtml("00:00", BackgroundColor.NEUTRAL, false);
  //@ts-ignore
  window.command = command;
}


class ThreadTimer{
  private static threadTimerInstance: ThreadTimer;
  public  static create(): ThreadTimer {
    if (!ThreadTimer.threadTimerInstance) {
      ThreadTimer.threadTimerInstance = new ThreadTimer();
    }
    return ThreadTimer.threadTimerInstance;
  }
  private constructor(){}
  private bodyBackgroundColor = BackgroundColor.NEUTRAL
  public run(){
    _currentCycleStartTimeSeconds = dateNowSeconds()
    let lastRemainingTimeSeconds = 0;
    _threadTimer = setInterval( () => {
      let elapsedTimeSeconds: number = dateNowSeconds() - _currentCycleStartTimeSeconds;
      let remainingTimeSeconds: number = SecondsInCycle - elapsedTimeSeconds;

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
        this.bodyBackgroundColor = BackgroundColor.FAILED;

        _currentCycleStartTimeSeconds = dateNowSeconds()
        elapsedTimeSeconds = dateNowSeconds() - _currentCycleStartTimeSeconds;
        return
      }
      document.body.innerHTML = CreateTimerHtml(printRemainingTimeCaption(getRemainingMinutesSeconds(elapsedTimeSeconds * 1000)), this.bodyBackgroundColor, true);
      
    }, 150);
  }
  public stop(){
    clearInterval(_threadTimer)
    document.body.innerHTML = CreateTimerHtml(printRemainingTimeCaption(getRemainingMinutesSeconds(0)), BackgroundColor.NEUTRAL, false);
  }
  public reset(){
    this.bodyBackgroundColor = BackgroundColor.PASSED;
    _currentCycleStartTimeSeconds = dateNowSeconds();
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
  }
  else if (args.Url.AbsoluteUri == "command://reset/") {
    threadTimer2.reset();
  }
  else if (args.Url.AbsoluteUri == "command://quit/") {
    threadTimer2.stop()
    document.body.innerHTML = "";
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
  let remainingTime: Date = new Date(SecondsInCycle * 1000 - elapsedTime);
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