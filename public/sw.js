// RapiEmail Enterprise PWA & Push Service Worker
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Suporte para notificações Push e Background mesmo com a app fechada
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'RapiEmail Enterprise';
    const emailId = data.emailId || (data.data && data.data.emailId);
    const targetUrl = data.url || (emailId ? `/inbox?id=${emailId}` : '/inbox');

    const options = {
      body: data.body || 'Recebeu um novo e-mail corporativo.',
      icon: data.icon || '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [200, 100, 200],
      tag: emailId ? `email-${emailId}` : 'rapiemail-inbox',
      renotify: true,
      data: {
        url: targetUrl,
        emailId: emailId
      }
    };

    event.waitUntil(
      Promise.all([
        self.registration.showNotification(title, options),
        // Avisar janelas abertas para atualizarem a caixa de entrada
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          for (const client of clientList) {
            client.postMessage({ type: 'NEW_EMAIL_RECEIVED', emailId });
          }
        })
      ])
    );
  } catch (e) {
    const text = event.data.text();
    event.waitUntil(
      self.registration.showNotification('Novo E-mail', {
        body: text,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        data: { url: '/inbox' }
      })
    );
  }
});

// Ao clicar na notificação: focar/abrir o RapiEmail diretamente no e-mail recebido
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const notificationData = event.notification.data || {};
  const targetUrl = notificationData.url || '/inbox';
  const emailId = notificationData.emailId;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já existir uma aba do RapiEmail aberta, focar nela e abrir o e-mail
      for (const client of clientList) {
        if (client.url.includes('/inbox') && 'focus' in client) {
          if (emailId) {
            client.postMessage({ type: 'SELECT_EMAIL', emailId });
          }
          if ('navigate' in client && targetUrl) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }
      // Caso contrário, abrir uma nova janela no e-mail específico
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
