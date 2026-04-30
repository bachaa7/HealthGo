self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  
  const title = data.title || 'HealthGo';
  const options = {
    body: data.body || 'У вас есть новое напоминание',
    icon: '/assets/human.png',
    badge: '/assets/human.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'reminder',
    renotify: true,
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Открыть' },
      { action: 'dismiss', title: 'Закрыть' }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { title, body, tag, timestamp } = event.data;
    
    if (timestamp && timestamp > Date.now()) {
      setTimeout(() => {
        self.registration.showNotification(title, {
          body: body,
          icon: '/assets/human.png',
          tag: tag,
          renotify: true
        });
      }, timestamp - Date.now());
    }
  }
});