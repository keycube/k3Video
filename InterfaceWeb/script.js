
document.addEventListener("DOMContentLoaded", () => {
    // Éléments de l'interface
    const textInput = document.getElementById("textInput");
    const speedInput = document.getElementById("speedInput");
    const speedValue = document.getElementById("speedValue");

    const startBtn = document.getElementById("startBtn");
    const resetBtn = document.getElementById("resetBtn");
    const captureBtn = document.getElementById("captureBtn");

    const terminalText = document.getElementById("terminalText");
    const cursor = document.getElementById("cursor");

    // Variables de simulation
    let currentText = "";
    let currentIndex = 0;
    let typingTimer = null;
    let isTyping = false;
    let captureMode = false;

    // Valeurs par défaut
    const defaultText = "Hello world!";

    if (textInput && !textInput.value) {
        textInput.value = defaultText;
    }

    // Récupérer la vitesse de frappe
    function getTypingSpeed() {
        const speed = Number(speedInput?.value || 50);
        return Math.max(10, speed);
    }

    // Mettre à jour l'affichage de la vitesse
    function updateSpeedDisplay() {
        if (speedValue && speedInput) {
            speedValue.textContent = speedInput.value + " ms";
        }
    }

    // Afficher progressivement les caractères
    function typeCharacter() {
        if (currentIndex >= currentText.length) {
            stopTyping();
            return;
        }

        const character = currentText[currentIndex];

        terminalText.textContent += character;
        currentIndex++;

        typingTimer = setTimeout(
            typeCharacter,
            getTypingSpeed()
        );
    }

    // Démarrer la simulation
    function startTyping() {
        if (isTyping) return;

        if (currentIndex >= currentText.length) {
            resetTyping();
        }

        currentText = textInput?.value || defaultText;
        isTyping = true;

        if (cursor) {
            cursor.style.display = "inline-block";
        }

        typeCharacter();
    }

    // Arrêter la simulation
    function stopTyping() {
        clearTimeout(typingTimer);
        typingTimer = null;
        isTyping = false;
    }

    // Réinitialiser le terminal
    function resetTyping() {
        stopTyping();

        currentIndex = 0;
        currentText = textInput?.value || defaultText;

        if (terminalText) {
            terminalText.textContent = "";
        }
    }

    // Activer ou désactiver le mode capture
    function toggleCaptureMode() {
        captureMode = !captureMode;

        document.body.classList.toggle(
            "capture-mode",
            captureMode
        );

        if (captureBtn) {
            captureBtn.textContent = captureMode
                ? "Quitter le mode capture"
                : "Mode capture";
        }
    }

    // Événements des boutons
    startBtn?.addEventListener("click", startTyping);
    resetBtn?.addEventListener("click", resetTyping);
    captureBtn?.addEventListener("click", toggleCaptureMode);

    // Changement de vitesse
    speedInput?.addEventListener(
        "input",
        updateSpeedDisplay
    );

    // Raccourcis clavier
    document.addEventListener("keydown", (event) => {
        const activeElement = document.activeElement;

        const isEditing =
            activeElement?.tagName === "INPUT" ||
            activeElement?.tagName === "TEXTAREA";

        if (event.code === "Escape" && captureMode) {
            toggleCaptureMode();
            return;
        }

        if (isEditing) return;

        // Espace : démarrer ou mettre en pause
        if (event.code === "Space") {
            event.preventDefault();

            if (isTyping) {
                stopTyping();
            } else {
                startTyping();
            }
        }

        // R : réinitialiser
        if (event.code === "KeyR") {
            resetTyping();
        }
    });

    // Initialisation
    updateSpeedDisplay();
    resetTyping();
});
