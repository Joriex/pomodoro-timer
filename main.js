// Wait for DOM to be fully loaded before running any code
document.addEventListener('DOMContentLoaded', function() {
    // ====== DOM Element References ======
    // Timer elements
    const minutesDisplay = document.getElementById('minutes');
    const secondsDisplay = document.getElementById('seconds');
    const statusInfo = document.getElementById('statusinfo');
    const sessionCounterEl = document.getElementById('sessionCounter');

    // Control buttons
    const startBtn = document.getElementById('start');
    const pauseBtn = document.getElementById('pause');
    const resetBtn = document.getElementById('abort');
    const themeToggle = document.getElementById('theme-toggle');

    // Visual elements
    const progressRing = document.querySelector('.progress-ring-circle');
    const progressSegments = document.querySelectorAll('.progress-segment');

    // Audio
    const soundAlert = document.getElementById('audio');

    // Modals
    const helpModal = document.getElementById('help');
    const settingsModal = document.getElementById('settings');
    const helpBtn = document.getElementById('helpButton');
    const settingsBtn = document.getElementById('settingsButton');

    // ====== Timer State ======
    let timerState = {
        sessionCounter: 1,
        sessionDuration: 25 * 60 * 1000, // 25 minutes in milliseconds
        breakDuration: 5 * 60 * 1000,    // 5 minutes in milliseconds
        currentTime: 25 * 60 * 1000,     // Current time remaining
        isRunning: false,
        isPaused: false,
        isBreak: false,
        animationId: null
    };

    // ====== Utility Functions ======
    // Format milliseconds to mm:ss
    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        return {
            minutes: minutes < 10 ? `0${minutes}` : `${minutes}`,
            seconds: seconds < 10 ? `0${seconds}` : `${seconds}`
        };
    }

    // Update the timer display
    function updateTimerDisplay(time) {
        const formatted = formatTime(time);
        minutesDisplay.textContent = formatted.minutes;
        secondsDisplay.textContent = formatted.seconds;
    }

    // Update the circular progress indicator
    function updateProgressRing(ratio) {
        const radius = 140;
        const circumference = 2 * Math.PI * radius;
        progressRing.style.strokeDasharray = `${circumference}`;
        const offset = circumference - (ratio * circumference);
        progressRing.style.strokeDashoffset = offset;
    }

    // Update session progress indicators
    function updateSessionProgress() {
        progressSegments.forEach((segment, index) => {
            segment.classList.remove('active', 'completed');

            if (index < timerState.sessionCounter - 1) {
                segment.classList.add('completed');
            } else if (index === timerState.sessionCounter - 1) {
                segment.classList.add('active');
            }
        });
    }

    // ====== Timer Functions ======
    function startTimer() {
        if (timerState.isPaused) {
            resumeTimer();
            return;
        }

        if (!timerState.isRunning) {
            timerState.isRunning = true;
            startBtn.classList.add('disabled');
            pauseBtn.classList.remove('disabled');
            resetBtn.classList.remove('disabled');

            // Update status display
            if (timerState.isBreak) {
                statusInfo.textContent = 'Pause läuft...';
                document.title = 'Pause läuft | FocusFlow';
            } else {
                statusInfo.textContent = 'Fokuszeit läuft...';
                document.title = 'Fokuszeit läuft | FocusFlow';
            }

            // Get starting timestamp for animation
            let startTimestamp = performance.now();
            const duration = timerState.isBreak ? timerState.breakDuration : timerState.sessionDuration;

            function timerLoop(timestamp) {
                const elapsed = timestamp - startTimestamp;
                startTimestamp = timestamp;

                timerState.currentTime -= elapsed;

                // Check if timer completed
                if (timerState.currentTime <= 0) {
                    timerState.currentTime = 0;
                    completeTimer();
                    return;
                }

                // Update UI
                updateTimerDisplay(timerState.currentTime);
                updateProgressRing(timerState.currentTime / duration);

                // Continue loop
                timerState.animationId = requestAnimationFrame(timerLoop);
            }

            timerState.animationId = requestAnimationFrame(timerLoop);
        }
    }

    function pauseTimer() {
        if (timerState.isRunning) {
            timerState.isRunning = false;
            timerState.isPaused = true;

            startBtn.classList.remove('disabled');
            pauseBtn.classList.add('disabled');

            // Update status
            if (timerState.isBreak) {
                statusInfo.textContent = 'Pause pausiert';
            } else {
                statusInfo.textContent = 'Fokuszeit pausiert';
            }

            // Add pulsing animation to timer display
            minutesDisplay.parentElement.classList.add('paused');

            // Stop animation frame
            cancelAnimationFrame(timerState.animationId);
        }
    }

    function resumeTimer() {
        if (timerState.isPaused) {
            timerState.isRunning = true;
            timerState.isPaused = false;

            startBtn.classList.add('disabled');
            pauseBtn.classList.remove('disabled');

            // Update status
            if (timerState.isBreak) {
                statusInfo.textContent = 'Pause läuft...';
            } else {
                statusInfo.textContent = 'Fokuszeit läuft...';
            }

            // Remove pulsing animation
            minutesDisplay.parentElement.classList.remove('paused');

            // Restart animation
            let startTimestamp = performance.now();
            const duration = timerState.isBreak ? timerState.breakDuration : timerState.sessionDuration;

            function timerLoop(timestamp) {
                const elapsed = timestamp - startTimestamp;
                startTimestamp = timestamp;

                timerState.currentTime -= elapsed;

                if (timerState.currentTime <= 0) {
                    timerState.currentTime = 0;
                    completeTimer();
                    return;
                }

                updateTimerDisplay(timerState.currentTime);
                updateProgressRing(timerState.currentTime / duration);

                timerState.animationId = requestAnimationFrame(timerLoop);
            }

            timerState.animationId = requestAnimationFrame(timerLoop);
        }
    }

    function completeTimer() {
        cancelAnimationFrame(timerState.animationId);
        soundAlert.play();

        if (timerState.isBreak) {
            // Break is over, start a new focus session
            timerState.isBreak = false;
            timerState.currentTime = timerState.sessionDuration;
            updateTimerDisplay(timerState.sessionDuration);
            updateProgressRing(1);

            startBtn.classList.remove('disabled');
            pauseBtn.classList.add('disabled');

            statusInfo.textContent = 'Bereit für die nächste Fokusphase';
            document.title = 'FocusFlow';

            timerState.isRunning = false;
            timerState.isPaused = false;
        } else {
            // Focus session is over
            if (timerState.sessionCounter < 4) {
                // Start a break
                timerState.sessionCounter++;
                sessionCounterEl.textContent = timerState.sessionCounter;
                updateSessionProgress();

                timerState.isBreak = true;
                timerState.currentTime = timerState.breakDuration;
                updateTimerDisplay(timerState.breakDuration);
                updateProgressRing(1);

                statusInfo.textContent = 'Zeit für eine Pause!';
                document.title = 'Pausenzeit | FocusFlow';

                // Auto-start the break
                setTimeout(() => {
                    startTimer();
                }, 1000);
            } else {
                // All 4 sessions completed
                resetApp();
                statusInfo.textContent = 'Alle Fokusphasen abgeschlossen! 🎉';
            }
        }
    }

    function resetApp() {
        // Cancel any ongoing timer
        cancelAnimationFrame(timerState.animationId);

        // Reset all state variables
        timerState.sessionCounter = 1;
        timerState.isBreak = false;
        timerState.currentTime = timerState.sessionDuration;
        timerState.isRunning = false;
        timerState.isPaused = false;

        // Update UI
        sessionCounterEl.textContent = timerState.sessionCounter;
        updateSessionProgress();
        updateTimerDisplay(timerState.sessionDuration);
        updateProgressRing(1);

        startBtn.classList.remove('disabled');
        pauseBtn.classList.add('disabled');
        resetBtn.classList.add('disabled');

        minutesDisplay.parentElement.classList.remove('paused');

        statusInfo.textContent = 'Bereit zu starten';
        document.title = 'FocusFlow';
    }

    // ====== Modal Functions ======
    function openHelp() {
        helpModal.showModal();
    }

    function closeHelp() {
        helpModal.close();
    }

    function openSettings() {
        console.log("Settings opened");
        // Set current values in the form
        document.getElementById('focusTime').value = Math.floor(timerState.sessionDuration / (60 * 1000));
        document.getElementById('pauseTime').value = Math.floor(timerState.breakDuration / (60 * 1000));
        settingsModal.showModal();
    }

    function closeSettings() {
        console.log("Settings closed")
        settingsModal.close();
    }

    function saveSettings() {
        const newFocusTime = parseInt(document.getElementById('focusTime').value);
        const newPauseTime = parseInt(document.getElementById('pauseTime').value);

        // Validate inputs
        if (newFocusTime < 1 || newFocusTime > 60 || newPauseTime < 1 || newPauseTime > 30) {
            alert('Bitte geben Sie gültige Werte ein: Fokuszeit (1-60 Min) und Pausenzeit (1-30 Min).');
            return;
        }

        // Update timer durations
        timerState.sessionDuration = newFocusTime * 60 * 1000;
        timerState.breakDuration = newPauseTime * 60 * 1000;

        // If timer is not running, update the display
        if (!timerState.isRunning && !timerState.isPaused) {
            timerState.currentTime = timerState.sessionDuration;
            updateTimerDisplay(timerState.sessionDuration);
        }

        closeSettings();
    }

    // ====== Theme Functions ======
    function toggleTheme() {
        if (document.body.classList.contains('light-theme')) {
            document.body.classList.remove('light-theme');
            document.body.classList.add('dark-theme');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-theme');
            document.body.classList.add('light-theme');
            localStorage.setItem('theme', 'light');
        }
    }

    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');

        if (savedTheme === 'light') {
            document.body.classList.add('light-theme');
        } else {
            document.body.classList.add('dark-theme');
        }
    }

    // ====== Event Listeners ======
    // UI control buttons
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetApp);
    themeToggle.addEventListener('click', toggleTheme);

    // Modal buttons
    helpBtn.addEventListener('click', openHelp);
    settingsBtn.addEventListener('click', openSettings);

    // Modal close buttons (X in corner)
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal.id === 'help') {
                closeHelp();
            } else if (modal.id === 'settings') {
                closeSettings();
            }
        });
    });

    // Modal action buttons
    document.querySelector('#help .primary-btn').addEventListener('click', closeHelp);
    document.querySelector('#settings .secondary-btn').addEventListener('click', closeSettings);
    document.querySelector('#settings .primary-btn').addEventListener('click', saveSettings);

    // Click outside to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(event) {
            if (event.target === this) {
                if (this.id === 'help') {
                    closeHelp();
                } else if (this.id === 'settings') {
                    closeSettings();
                }
            }
        });
    });

    // Number input buttons
    document.querySelectorAll('.number-input .minus').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentNode.querySelector('input[type=number]');
            if (input.value > input.min) {
                input.stepDown();
            }
        });
    });

    document.querySelectorAll('.number-input .plus').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.parentNode.querySelector('input[type=number]');
            if (input.value < input.max) {
                input.stepUp();
            }
        });
    });

    // Prevent page unload if timer is running
    window.addEventListener('beforeunload', function(e) {
        if (timerState.isRunning) {
            e.preventDefault();
            e.returnValue = 'Der Timer läuft noch. Möchten Sie wirklich die Seite verlassen?';
            return e.returnValue;
        }
    });

    // ====== Initialization ======
    // Make sure modals aren't open at startup
    if (helpModal.open) helpModal.close();
    if (settingsModal.open) settingsModal.close();

    // Load saved theme
    loadTheme();

    // Initialize UI
    updateTimerDisplay(timerState.sessionDuration);
    updateProgressRing(1);
    updateSessionProgress();
    sessionCounterEl.textContent = timerState.sessionCounter;
});