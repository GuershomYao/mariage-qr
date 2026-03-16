let invites = {};
let scanner = null;
let isScanning = false;
let lastScannedCode = null;
let scanProcessing = false;
let scanCooldown = false; // Délai d'attente après un scan

// #region agent log
const DEBUG_LOG = (location, message, data, hypothesisId) => fetch('http://127.0.0.1:7242/ingest/5f34726f-8744-4a30-be6d-0cc4097cc360',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location,message,data:data||{},timestamp:Date.now(),runId:'run1',hypothesisId})}).catch(()=>{});
// #endregion

// Code admin (vous pouvez le changer)
const ADMIN_CODE = "";
// Fonction pour jouer un son de scan réussi
function playScanSound() {
    try {
        // Créer un contexte audio
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Créer un oscillateur pour générer un son
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        // Connecter l'oscillateur au gain puis à la sortie
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configuration du son (fréquence et type d'onde)
        oscillator.frequency.value = 800; // Fréquence en Hz (son aigu)
        oscillator.type = 'sine'; // Type d'onde (sine = son doux)
        
        // Configuration du volume (gain)
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime); // Volume à 30%
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2); // Fade out
        
        // Démarrer et arrêter le son
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.2); // Durée de 200ms
    } catch (error) {
        // Si l'API AudioContext n'est pas disponible, ignorer silencieusement
        console.log("Impossible de jouer le son:", error);
    }
}

// Charger les données JSON
fetch("invites.json")
    .then(response => response.json())
    .then(data => {
        invites = data;
    })
    .catch(err => {
        console.error("Erreur lors du chargement des données:", err);
    });

// Vérifier la connexion
function checkLogin() {
    const adminCode = document.getElementById("admin-code").value;
    const errorMessage = document.getElementById("error-message");
    
    if (adminCode === ADMIN_CODE) {
        // Connexion réussie
        document.getElementById("login-page").style.display = "none";
        document.getElementById("main-page").style.display = "block";
        document.getElementById("header").style.display = "block";
        errorMessage.style.display = "none";
    } else {
        // Code incorrect
        errorMessage.style.display = "block";
        document.getElementById("admin-code").value = "";
        document.getElementById("admin-code").focus();
    }
}

// Permettre la connexion avec la touche Entrée
document.addEventListener("DOMContentLoaded", function() {
    const adminCodeInput = document.getElementById("admin-code");
    if (adminCodeInput) {
        adminCodeInput.addEventListener("keypress", function(e) {
            if (e.key === "Enter") {
                checkLogin();
            }
        });
        adminCodeInput.focus();
    }
});

// Déconnexion
function logout() {
    if (scanner) {
        try {
            scanner.clear();
        } catch(e) {}
        scanner = null;
        isScanning = false;
    }
    document.getElementById("login-page").style.display = "flex";
    document.getElementById("main-page").style.display = "none";
    document.getElementById("header").style.display = "none";
    document.getElementById("reader").innerHTML = "";
    document.getElementById("admin-code").value = "";
    document.getElementById("admin-code").focus();
}

// Démarrer le scan
function startScan() {
    // #region agent log
    DEBUG_LOG('app.js:104', 'startScan called', {isScanning, scanProcessing, scanCooldown}, 'E');
    // #endregion
    console.log("🚀 startScan appelé, isScanning:", isScanning);
    
    if (isScanning) {
        return;
    }
    
    // Réinitialiser les flags
    scanProcessing = false;
    scanCooldown = false;
    lastScannedCode = null;
    
    const startBtn = document.getElementById("start-scan-btn");
    startBtn.disabled = true;
    startBtn.textContent = "Scan en cours...";
    
    document.getElementById("reader").style.display = "block";
    
    // Nettoyer l'ancien scanner s'il existe
    if (scanner) {
        try {
            scanner.clear();
        } catch(e) {
            console.log("Nettoyage du scanner");
        }
    }
    
    // Vider le conteneur reader
    document.getElementById("reader").innerHTML = "";
    
    // Créer le scanner avec Html5QrcodeScanner (ancienne méthode qui fonctionnait)
    scanner = new Html5QrcodeScanner(
        "reader",
        { 
            fps: 10, 
            qrbox: 250 
        },
        false // verbose = false
    );
    
    isScanning = true;
    
    // #region agent log
    DEBUG_LOG('app.js:134', 'scanner.render called', {isScanning: true}, 'E');
    // #endregion
    
    // Rendre le scanner avec le callback
    scanner.render(onScanSuccess, onScanError);
    
    startBtn.style.display = "none";
}

// Gestion des erreurs de scan
function onScanError(errorMessage) {
    // Ignorer les erreurs de scan (normal pendant la recherche)
}

// Fonction de callback pour le scan réussi (basée sur l'ancien code)
function onScanSuccess(decodedText) {
    // #region agent log
    DEBUG_LOG('app.js:164', 'onScanSuccess called', {decodedText: decodedText?.substring(0, 20), isScanning, scanProcessing, scanCooldown}, 'A');
    // #endregion
    console.log("🔍 onScanSuccess appelé:", decodedText, "scanCooldown:", scanCooldown);
    
    // Ignorer les scans pendant le délai d'attente
    if (scanCooldown) {
        // #region agent log
        DEBUG_LOG('app.js:170', 'onScanSuccess ignored - cooldown active', {decodedText: decodedText?.substring(0, 20)}, 'B');
        // #endregion
        console.log("⏳ Scan ignoré - délai d'attente actif");
        return;
    }
    
    // Protection contre les scans multiples - ignorer si déjà en traitement
    if (scanProcessing) {
        // #region agent log
        DEBUG_LOG('app.js:177', 'onScanSuccess ignored - already processing', {decodedText: decodedText?.substring(0, 20)}, 'B');
        // #endregion
        console.log("⚠️ Scan ignoré - déjà en traitement");
        return;
    }
    
    // Ignorer si c'est le même code scanné récemment
    let code = decodedText.trim();
    if (lastScannedCode === code) {
        // #region agent log
        DEBUG_LOG('app.js:184', 'onScanSuccess ignored - same code', {code}, 'B');
        // #endregion
        console.log("⚠️ Scan ignoré - même code:", code);
        return;
    }
    
    // Marquer comme en traitement et activer le délai d'attente
    scanProcessing = true;
    scanCooldown = true;
    lastScannedCode = code;
    
    // Arrêter le scanner IMMÉDIATEMENT pour éviter les scans multiples
    if (scanner && isScanning) {
        try {
            // #region agent log
            DEBUG_LOG('app.js:196', 'Calling scanner.clear', {hasScanner: !!scanner, isScanning}, 'C');
            // #endregion
            console.log("🛑 Arrêt du scanner...");
            scanner.clear();
            isScanning = false;
            // #region agent log
            DEBUG_LOG('app.js:202', 'scanner.clear completed', {isScanning: false}, 'C');
            // #endregion
            console.log("✅ Scanner arrêté");
        } catch(e) {
            console.error("❌ Erreur lors de l'arrêt du scanner:", e);
            // #region agent log
            DEBUG_LOG('app.js:208', 'scanner.clear error', {error: e.message || String(e)}, 'C');
            // #endregion
        }
    }
    
    // Jouer le son de scan
    playScanSound();
    
    let guest = invites[code];
    
    if (!guest) {
        // #region agent log
        DEBUG_LOG('app.js:219', 'Guest not found', {code}, 'D');
        // #endregion
        scanProcessing = false;
        // Réinitialiser le délai après 2 secondes
        setTimeout(() => {
            scanCooldown = false;
            lastScannedCode = null;
        }, 2000);
        showPopup("❌ Invité inconnu", "invalid");
        return;
    }
    
    if (guest.used) {
        // #region agent log
        DEBUG_LOG('app.js:232', 'Guest already used', {code, nom: guest.nom}, 'D');
        // #endregion
        scanProcessing = false;
        // Réinitialiser le délai après 2 secondes
        setTimeout(() => {
            scanCooldown = false;
            lastScannedCode = null;
        }, 2000);
        showPopup(
            "⚠️ Déjà utilisé : " + guest.nom + 
            "<br>Table : " + guest.table,
            "used"
        );
        return;
    }
    
    // Marquer comme utilisé
    guest.used = true;
    // #region agent log
    DEBUG_LOG('app.js:247', 'Guest marked as used', {code, nom: guest.nom}, 'D');
    // #endregion

    showPopup(
        "✅ " + guest.nom +
        "<br>Nombre : " + guest.Number +
        "<br>Table : " + guest.table,
        "valid"
    );
    
    // Réinitialiser les flags après un délai de 3 secondes (délai d'attente)
    setTimeout(() => {
        scanProcessing = false;
        scanCooldown = false;
        lastScannedCode = null;
        console.log("✅ Délai d'attente terminé - prêt pour un nouveau scan");
    }, 3000);
}

// Afficher le popup
function showPopup(message, type) {
    let popup = document.getElementById("popup");
    let content = document.getElementById("popup-content");
    
    content.className = type;
    document.getElementById("popup-result").innerHTML = message;
    popup.style.display = "flex";
}

// Reprendre le scan
function restartScan() {
    document.getElementById("popup").style.display = "none";
    
    // Réinitialiser les flags
    scanProcessing = false;
    scanCooldown = false;
    lastScannedCode = null;
    
    // #region agent log
    DEBUG_LOG('app.js:272', 'restartScan called', {isScanning}, 'E');
    // #endregion
    console.log("🔄 Redémarrage du scan...");
    
    // Redémarrer le scanner seulement si on clique sur "Scanner suivant"
    if (!isScanning) {
        startScan();
    }
}
