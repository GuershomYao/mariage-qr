let invites = {};
let scanner;

fetch("invites.json")
.then(response => response.json())
.then(data => invites = data);

function showPopup(message){
document.getElementById("popup-result").innerHTML = message;
document.getElementById("popup").style.display = "flex";
}

function restartScan(){
document.getElementById("popup").style.display = "none";
scanner.resume();
}

function onScanSuccess(decodedText){

scanner.pause();

let guest = invites[decodedText];

if(!guest){
showPopup("❌ Invité inconnu");
return;
}

if(guest.used){
showPopup("⚠️ Déjà utilisé<br>"+guest.nom);
return;
}

guest.used = true;

showPopup(
"✅ "+guest.nom+
"<br>Nombre : "+guest.Number+
"<br>Table : "+guest.table
);

}

scanner = new Html5Qrcode("reader");

scanner.start(
{ facingMode: "environment" },
{
fps:10,
qrbox:{ width:300, height:300 }
},
onScanSuccess
);
