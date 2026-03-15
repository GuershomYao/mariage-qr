let invites = {};
let scanner;

fetch("invites.json")
.then(response => response.json())
.then(data => invites = data);

function showPopup(message,type){

let popup = document.getElementById("popup");
let content = document.getElementById("popup-content");

content.className = type;

document.getElementById("popup-result").innerHTML = message;

popup.style.display="flex";

}

function restartScan(){

document.getElementById("popup").style.display="none";

scanner.resume();

}

function onScanSuccess(decodedText){

scanner.pause();

let guest = invites[decodedText];

if(!guest){

showPopup("❌ Invité inconnu","invalid");

return;

}

if(guest.used){

showPopup(
"⚠️ Déjà utilisé<br>"+guest.nom+
"<br>Table : "+guest.table,
"used"
);

return;

}

guest.used = true;

showPopup(

"✅ "+guest.nom+
"<br>Nombre : "+guest.Number+
"<br>Table : "+guest.table,

"valid"

);

}

scanner = new Html5Qrcode("reader");

scanner.start(

{ facingMode: "environment" },

{
fps:10,
qrbox:false
},

onScanSuccess
);
