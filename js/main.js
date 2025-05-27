window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('./sw.js');
  }
}
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
        installPrompt.classList.remove('show');
      });
    }
  });
}
const dismissBtn = document.getElementById('dismissBtn');

if (dismissBtn) {
  dismissBtn.addEventListener('click', () => {
    installPrompt.classList.remove('show');
    deferredPrompt = null;
  });
}
