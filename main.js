// Variablendeklaration
const statusinfo = document.getElementById("statusinfo");
const timer = document.getElementById("timer");
const minutes = document.getElementById("minutes");
const seconds = document.getElementById("seconds");
const divider = document.getElementById("divider");

const start = document.getElementById("start");
const abort = document.getElementById("abort");
const pause = document.getElementById("pause");

let sessionCounter = 1;
let sessionCounterFrontend = document.getElementById("sessionCounter");
sessionCounterFrontend.innerHTML = sessionCounter;

let sessionDuration = 1501000;
let pauseDuration = 301000;

let settingSessionDuration = 1501000;
let settingPauseDuration = 301000;

let sessionTimerId, breakTimerId;

let timerRunning = false;

let minutesDigit = Math.floor((sessionDuration % (1000 * 60 * 60)) / (1000 * 60));
let secondsDigit = Math.floor((sessionDuration % (1000 * 60)) / 1000);

const sound = document.getElementById("audio");

// Hinzufügen einer führenden Null im Timer, wenn minutes oder seconds einstellig sind.
const formatTime = (digit) => {
    return digit < 10 ? "0" + digit : digit;
}

// Starte den Timer
const startTimer = () => {

    if (!timerRunning) {

        timerRunning = true;
        start.classList.add("disabled");
        pause.classList.remove("disabled");
        abort.classList.remove("disabled");

        statusinfo.innerHTML = "Session ist aktiv";
        statusinfo.style.color = "var(--accentcolor2)";

        minutes.style.color = "var(--accentcolor)";
        divider.style.color = "var(--accentcolor)";
        seconds.style.color = "var(--accentcolor)";

        document.title = "Timer ist aktiv!";

        let startTime = performance.now();
        let elapsedTime = 0;

        if(settingSessionDuration !== sessionDuration){
            sessionDuration = settingSessionDuration;
        }
        if(settingPauseDuration !== pauseDuration){
            pauseDuration = settingPauseDuration;
        }

        const updateTimer = (time) => {
            elapsedTime += time - startTime;
            startTime = time;

            if (elapsedTime >= 1000) {
                sessionDuration -= elapsedTime;

                minutesDigit = Math.floor((sessionDuration % (1000 * 60 * 60)) / (1000 * 60));
                secondsDigit = Math.floor((sessionDuration % (1000 * 60)) / 1000);

                minutes.innerHTML = formatTime(minutesDigit);
                seconds.innerHTML = formatTime(secondsDigit);

                elapsedTime = 0;
            }

            if (sessionDuration > 0) {
                sessionTimerId = requestAnimationFrame(updateTimer);
            } else if (sessionCounter < 4) {
                stopTimer();
                startBreakTimer();
            } else {
                sound.play();
                resetApp();
            }
        };

        sessionTimerId = requestAnimationFrame(updateTimer);
    } else {
        console.error("Fehler: Es können nicht mehrere Timer gestartet werden!");
    }
}

// Timer pausieren
const pauseTimer = () => {
    timerRunning = false;
    pause.classList.add("disabled");
    start.classList.remove("disabled");

    minutes.style.color = "var(--accentcolor2)";
    divider.style.color = "var(--accentcolor2)";
    seconds.style.color = "var(--accentcolor2)";

    statusinfo.innerHTML = "Session ist pausiert";

    cancelAnimationFrame(sessionTimerId);

    minutes.classList.add("onpause");
    seconds.classList.add("onpause");
}

// Beende die Session
const stopTimer = () => {

    timerRunning = false;

    start.classList.remove("disabled");
    pause.classList.add("disabled");
    abort.classList.add("disabled");

    statusinfo.innerHTML = "Session wurde beendet";
    document.title = "Pomodoro Timer"

    cancelAnimationFrame(sessionTimerId);
    sessionDuration = settingSessionDuration;

    minutes.innerHTML = "--";
    seconds.innerHTML = "--";
}

// Beendet den Pausentimer
const stopBreakTimer = () => {
    sessionCounter++;
    sessionCounterFrontend.innerHTML = sessionCounter;

    start.classList.add("disabled");
    pause.classList.remove("disabled");
    abort.classList.remove("disabled");

    pauseDuration = settingPauseDuration;
    minutes.innerHTML = Math.floor((settingPauseDuration % (1000 * 60 * 60)) / (1000 * 60)).toString();
    seconds.innerHTML = Math.floor((settingPauseDuration % (1000 * 60)) / 1000).toString();

    timerRunning = false;
    cancelAnimationFrame(breakTimerId);
}

// Pausentimer starten, wenn ein SessionTimer abgelaufen ist
const startBreakTimer = () => {
    activeTab() ? sound.play() : sound.play();
    let startTime = performance.now();
    let elapsedTime = 0;

    timerRunning = true;

    statusinfo.innerHTML = "Jetzt Pause machen";

    minutes.style.color = "var(--accentcolor)";
    divider.style.color = "var(--accentcolor)";
    seconds.style.color = "var(--accentcolor)";

    document.title = "Jetzt Pause machen!"

    start.classList.add("disabled");

    const updateTimer = (time) => {
        elapsedTime += time - startTime;
        startTime = time;

        if (elapsedTime >= 1000) {
            pauseDuration -= elapsedTime;

            minutesDigit = Math.floor((pauseDuration % (1000 * 60 * 60)) / (1000 * 60));
            secondsDigit = Math.floor((pauseDuration % (1000 * 60)) / 1000);

            minutes.innerHTML = formatTime(minutesDigit);
            seconds.innerHTML = formatTime(secondsDigit);

            elapsedTime = 0;
        }

        if (pauseDuration > 0) {
            breakTimerId = requestAnimationFrame(updateTimer);
        } else {
            stopBreakTimer();
            if(settingSessionDuration !== sessionDuration){
                sessionDuration = settingSessionDuration;
            }
            if(settingPauseDuration !== pauseDuration){
                pauseDuration = settingPauseDuration;
            }
            startTimer();
        }
    };

    breakTimerId = requestAnimationFrame(updateTimer);
}

const resetApp = () => {
    timerRunning = false;
    cancelAnimationFrame(sessionTimerId, breakTimerId);

    statusinfo.innerHTML = "Session wurde beendet";
    document.title = "PomodoroTimer"

    minutes.style.color = "var(--accentcolor2)";
    divider.style.color = "var(--accentcolor2)";
    seconds.style.color = "var(--accentcolor2)";

    sessionCounter = 1;
    sessionCounterFrontend.innerHTML = sessionCounter;

    sessionDuration = settingSessionDuration;

    start.classList.remove("disabled");
    abort.classList.add("disabled");
    pause.classList.add("disabled");

    minutes.innerHTML = Math.floor((settingSessionDuration % (1000 * 60 * 60)) / (1000 * 60)).toString();
    seconds.innerHTML =  Math.floor((settingSessionDuration % (1000 * 60)) / 1000).toString().padStart(2, "0");
}

// Prüfen, ob der Tab im Hintergrund ist
const activeTab = () => {
    return !document.hidden;
}

// Timer-Funktion für die Hintergrundausführung
const backgroundTimer = () => {
    if (activeTab()) {
        // Timer im Vordergrund starten
        startTimer();
        timerRunning = true;
    } else {
        // Timer im Hintergrund starten
        startBreakTimer();
    }
}

// Dialogfeld anzeigen, wenn auf Hilfe geklickt wird
const showHelp = () => {
    const help = document.getElementById("help");
    help.show();
}

const showSettings = () => {
    const settings = document.getElementById("settings");
    document.getElementById("focusTime").value = Math.floor((sessionDuration % (1000 * 60 * 60)) / (1000 * 60));
    document.getElementById("pauseTime").value = Math.floor((pauseDuration % (1000 * 60 * 60)) / (1000 * 60));;
    settings.show();
}

const updateSettings = () => {
    settingSessionDuration = Math.floor(document.getElementById("focusTime").value * (1000 * 60));
    settingPauseDuration = Math.floor(document.getElementById("pauseTime").value * (1000 * 60));
    document.getElementById("settings").close();
    alert("Die neuen Zeiten gelten ab Beginn der nächsten Fokusphase.")
}

// Warnen wenn der Nutzer den Tab schließen möchte
window.addEventListener('beforeunload', (event) => {
    event.preventDefault();
    event.returnValue = '';
});