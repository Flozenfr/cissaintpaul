window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }
}
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // Empêche le prompt automatique
  deferredPrompt = e; // Sauvegarde pour l'utiliser plus tard
  showInstallPopup(); // Fonction personnalisée pour afficher le popup
});
