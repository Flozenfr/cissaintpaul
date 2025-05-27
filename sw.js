var cacheName = 'hello-pwa-v2'; // Incrémentez la version du cache si vous modifiez filesToCache
var filesToCache = [
  '/',
  '/index.html',
  '/css/calendrier.css', // Assurez-vous que le nom du fichier CSS est correct
  '/js/calendrier.js',  // Assurez-vous que le nom du fichier JS principal est correct
  '/js/main.js',        // Le fichier qui enregistre le SW
  // Ajoutez ici d'autres ressources importantes (icônes, polices si locales, etc.)
  // Par exemple, si vos icônes de manifest sont dans /images/ :
  '/images/hello-icon-128.png',
  '/images/hello-icon-144.png',
  '/images/hello-icon-152.png',
  '/images/hello-icon-192.png',
  '/images/hello-icon-256.png',
  '/images/hello-icon-512.png'
];

/* Démarrer le service worker et mettre en cache tout le contenu de l'application */
self.addEventListener('install', function(e) {
  console.log('[Service Worker] Installation');
  e.waitUntil(
    caches.open(cacheName).then(function(cache) {
      console.log('[Service Worker] Mise en cache des fichiers');
      return cache.addAll(filesToCache);
    })
  );
  self.skipWaiting(); // Force le nouveau SW à s'activer immédiatement
});

/* Activer le service worker et supprimer les anciens caches */
self.addEventListener('activate', function(e) {
  console.log('[Service Worker] Activation');
  e.waitUntil(
    caches.keys().then(function(keyList) {
      return Promise.all(keyList.map(function(key) {
        if (key !== cacheName) {
          console.log('[Service Worker] Suppression de l\'ancien cache', key);
          return caches.delete(key);
        }
      }));
    })
  );
  return self.clients.claim(); // Permet au SW activé de contrôler les clients immédiatement
});

/* Servir le contenu mis en cache en mode hors ligne */
self.addEventListener('fetch', function(e) {
  e.respondWith(
    caches.match(e.request).then(function(response) {
      return response || fetch(e.request);
    })
  );
});

/* Écouter les messages de l'application principale */
self.addEventListener('message', function(event) {
  console.log('[Service Worker] Message reçu :', event.data);

  if (event.data && event.data.type === 'NEW_EVENT_NOTIFICATION') {
    const eventDetails = event.data.payload;
    const title = 'Nouvel événement !';
    const options = {
      body: `"${eventDetails.title}" a été ajouté pour le ${new Date(eventDetails.date + 'T00:00:00').toLocaleDateString('fr-FR')} à ${eventDetails.time}.`,
      icon: '/images/hello-icon-192.png', // Chemin vers une icône pour la notification
      badge: '/images/hello-icon-128.png', // Petite icône (souvent monochrome) pour la barre d'état Android
      vibrate: [200, 100, 200], // Optionnel : vibration [vibre, pause, vibre]
      tag: 'new-event-notification', // Permet de remplacer une notification existante avec le même tag
      renotify: true, // Fait vibrer/sonner même si une notif avec le même tag existe
      // Vous pouvez ajouter des actions ici si besoin
      // actions: [
      //   { action: 'view_event', title: 'Voir l'événement', icon: '/images/view-icon.png' },
      //   { action: 'close', title: 'Fermer', icon: '/images/close-icon.png' }
      // ]
    };

    // Vérifier la permission avant d'afficher (bien que déjà demandée par main.js, c'est une bonne pratique)
    if (Notification.permission === 'granted') {
      self.registration.showNotification(title, options)
        .then(() => console.log('[Service Worker] Notification affichée'))
        .catch(err => console.error('[Service Worker] Erreur d\'affichage de la notification:', err));
    } else {
      console.log('[Service Worker] Permission de notification non accordée, notification non affichée.');
    }
  }
});

/* Gérer le clic sur la notification */
self.addEventListener('notificationclick', function(event) {
  console.log('[Service Worker] Clic sur la notification reçu.', event.notification.tag);
  event.notification.close(); // Ferme la notification

  // Action par défaut : ouvrir l'application
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Si une fenêtre de l'application est déjà ouverte, la focus
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        // Remplacez '/index.html' par l'URL de votre page principale si elle est différente
        if (client.url == self.registration.scope + 'index.html' && 'focus' in client) {
          return client.focus();
        }
      }
      // Sinon, ouvrir une nouvelle fenêtre
      if (clients.openWindow) {
        // Remplacez '/index.html' par l'URL que vous voulez ouvrir
        return clients.openWindow(self.registration.scope + 'index.html');
      }
    })
  );

  // Gérer les actions personnalisées (si vous en avez défini)
  // if (event.action === 'view_event') {
  //   console.log('Action "Voir l\'événement" cliquée');
  //   // Logique pour ouvrir une page spécifique de l'événement
  //   // clients.openWindow('/event-details?id=...');
  // } else if (event.action === 'close') {
  //   console.log('Action "Fermer" cliquée');
  // } else {
  //   console.log('Clic sur le corps de la notification (pas une action)');
  // }
});
