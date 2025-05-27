window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(function(registration) {
        console.log('Service Worker enregistré avec succès, portée :', registration.scope);
        // Demander la permission pour les notifications après l'enregistrement du SW
        askForNotificationPermission();
      }).catch(function(error) {
        console.log('Échec de l\'enregistrement du Service Worker :', error);
      });
  }
};

// Fonction pour demander la permission de notification
function askForNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Ce navigateur ne supporte pas les notifications.');
    return;
  }

  Notification.requestPermission().then(function(permission) {
    if (permission === 'granted') {
      console.log('Permission pour les notifications accordée.');
      // Vous pourriez vouloir stocker cette information ou informer l'utilisateur
    } else if (permission === 'denied') {
      console.log('Permission pour les notifications refusée.');
      // L'utilisateur a explicitement refusé, il ne faut plus le déranger
    } else {
      console.log('Permission pour les notifications non déterminée (ignorée).');
      // L'utilisateur a fermé la boîte de dialogue sans choisir
    }
  });
}


// --- Logique existante pour le bouton d'installation ---
let deferredPrompt;
const installPrompt = document.getElementById('installPrompt');
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  if (installPrompt) installPrompt.classList.add('show');
});

if (installBtn) {
  installBtn.addEventListener('click', () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('L’utilisateur a accepté l’installation');
        } else {
          console.log('L’utilisateur a refusé l’installation');
        }
        deferredPrompt = null;
        if(installPrompt) installPrompt.classList.remove('show');
      });
    }
  });
}

const dismissBtn = document.getElementById('dismissBtn');
if (dismissBtn) {
  dismissBtn.addEventListener('click', () => {
    if(installPrompt) installPrompt.classList.remove('show');
    deferredPrompt = null;
  });
}
