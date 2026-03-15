let invites = {};
let scanner = null;
let isScanning = false;

// Code admin (vous pouvez le changer)
const ADMIN_CODE = "admin123";

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
    if (isScanning && scanner) {
        stopScan();
    }
    document.getElementById("login-page").style.display = "flex";
    document.getElementById("main-page").style.display = "none";
    document.getElementById("header").style.display = "none";
    document.getElementById("admin-code").value = "";
    document.getElementById("admin-code").focus();
}

// Démarrer le scan
function startScan() {
    if (isScanning) {
        return;
    }
    
    const startBtn = document.getElementById("start-scan-btn");
    startBtn.disabled = true;
    startBtn.textContent = "Scan en cours...";
    
    document.getElementById("reader").style.display = "block";
    
    scanner = new Html5Qrcode("reader");
    
    scanner.start(
        { facingMode: "environment" },
        {
            fps: 15,
            qrbox: { width: 300, height: 300 }
        },
        onScanSuccess,
        onScanError
    ).then(() => {
        isScanning = true;
        startBtn.style.display = "none";
    }).catch(err => {
        console.error("Erreur caméra:", err);
        alert("Erreur lors du démarrage de la caméra. Veuillez autoriser l'accès à la caméra.");
        startBtn.disabled = false;
        startBtn.textContent = "📷 Lancer le scan";
        document.getElementById("reader").style.display = "none";
    });
}

// Arrêter le scan
function stopScan() {
    if (scanner && isScanning) {
        scanner.stop().then(() => {
            scanner.clear();
            isScanning = false;
            document.getElementById("reader").style.display = "none";
            const startBtn = document.getElementById("start-scan-btn");
            startBtn.style.display = "block";
            startBtn.disabled = false;
            startBtn.textContent = "📷 Lancer le scan";
        }).catch(err => {
            console.error("Erreur lors de l'arrêt du scanner:", err);
        });
    }
}

// Erreur de scan
function onScanError(errorMessage) {
    // Ignorer les erreurs de scan (normal pendant la recherche)
}

// Succès du scan
function onScanSuccess(decodedText) {
    scanner.pause();
    
    let code = decodedText.trim();
    let guest = invites[code];
    
    if (!guest) {
        showPopup("❌ Invité inconnu<br>Code: " + code, "invalid");
        return;
    }
    
    if (guest.used) {
        showPopup(
            "⚠️ Déjà utilisé<br><br>" + 
            "Nom: " + guest.nom + 
            "<br>Nombre: " + guest.Number + 
            "<br>Table: " + guest.table,
            "used"
        );
        return;
    }
    
    // Marquer comme utilisé
    guest.used = true;
    
    showPopup(
        "✅ Invité validé<br><br>" +
        "Nom: " + guest.nom +
        "<br>Nombre: " + guest.Number +
        "<br>Table: " + guest.table,
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
    if (scanner && isScanning) {
        scanner.resume();
    }
}
