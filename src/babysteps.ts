export type TimeMinutesSeconds = { minute: number; second: number; }

const BackgroundColorNeutral: string = "#ffffff";
const BackgroundColorFailed: string = "#ffcccc";
const BackgroundColorPassed: string = "#ccffcc";
const SecondsInCycle: number = 16;


let _currentCycleStartTime: number;
let _lastRemainingTime: string;
let _bodyBackgroundColor: string = BackgroundColorNeutral;
let _threadTimer: NodeJS.Timeout;




export function command(arg: string): void {
  let args = { Url: { AbsoluteUri: `command://${arg}/` } }
  console.log('called', arg, args.Url.AbsoluteUri);
  if (args.Url.AbsoluteUri == "command://start/") {

    _currentCycleStartTime = Date.now();

    _threadTimer = setInterval(function () {
      let elapsedTime: number = Date.now() - _currentCycleStartTime;
      let remainingTime: string = printRemainingTimeCaption(getRemainingMinutesSeconds(elapsedTime));
      if (_lastRemainingTime === remainingTime) { return }

      if (remainingTime === "00:13" ) {
        _bodyBackgroundColor = BackgroundColorNeutral;
      }
      if (remainingTime === "00:10") {
        playSound("2166__suburban-grilla__bowl-struck.wav");
      }
      if (remainingTime === "00:00") {
        playSound("32304__acclivity__shipsbell.wav");
        _bodyBackgroundColor = BackgroundColorFailed;
        
        _currentCycleStartTime = Date.now();
        elapsedTime = Date.now() - _currentCycleStartTime;
      }
      document.body.innerHTML = CreateTimerHtml(remainingTime, _bodyBackgroundColor, true);
      _lastRemainingTime = remainingTime;
    }, 150);
  }
  else if (args.Url.AbsoluteUri == "command://stop/") {
    clearInterval(_threadTimer)
    document.body.innerHTML = CreateTimerHtml(printRemainingTimeCaption(getRemainingMinutesSeconds(0)), BackgroundColorNeutral, false);

  }
  else if (args.Url.AbsoluteUri == "command://reset/") {
    _currentCycleStartTime = Date.now();
    _bodyBackgroundColor = BackgroundColorPassed;
  }
  else if (args.Url.AbsoluteUri == "command://quit/") {
    document.body.innerHTML = "";
    clearInterval(_threadTimer)
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
