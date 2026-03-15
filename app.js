let invites = {};

fetch("invites.json")
.then(response => response.json())
.then(data => invites = data);

function onScanSuccess(decodedText) {

 let guest = invites[decodedText];

 if(!guest){
   document.getElementById("result").innerHTML =
   "❌ Invité inconnu";
   return;
 }

 if(guest.used){
   document.getElementById("result").innerHTML =
   "⚠️ Déjà utilisé : " + guest.nom;
   return;
 }

 guest.used = true;

 document.getElementById("result").innerHTML =
   "<br>Nombre : " + guest.Number +
   "✅ " + guest.nom +
   "<br>Table : " + guest.table;
}

const scanner = new Html5QrcodeScanner(
 "reader",
 { fps: 10, qrbox: 250 }
);

scanner.render(onScanSuccess);
