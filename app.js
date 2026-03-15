let invites = {};
let scanner = null;

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
        scanner.clear();
        scanner = null;
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
        // Jouer le son de scan
    playScanSound();
    
    let code = decodedText.trim();
    let guest = invites[code];
    
    if (!guest) {
        showPopup("❌ Invité inconnu", "invalid");
        return;
    }
    
    if (guest.used) {
        showPopup(
            "⚠️ Déjà utilisé : " + guest.nom + 
            "<br>Table : " + guest.table,
            "used"
        );
        return;
    }
    
    // Marquer comme utilisé
    guest.used = true;
    
    showPopup(
        "✅ " + guest.nom +
        "<br>Nombre : " + guest.Number +
        "<br>Table : " + guest.table,
        "valid"
    );
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
    // Le scanner Html5QrcodeScanner reprend automatiquement après la fermeture du popup
}
