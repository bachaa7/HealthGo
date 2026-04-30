const VAPID_PUBLIC_KEY = '';

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Уведомления не поддерживаются');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission === 'denied') {
    console.error('Уведомления заблокированы пользователем');
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (existing) {
      return existing;
    }
    
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (error) {
    return null;
  }
}

export async function subscribeToPush() {
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    console.error('Service Worker не зарегистрирован');
    return null;
  }

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });
    
    console.log('Подписка на Push создана:', subscription);
    return subscription;
  } catch (error) {
    console.error('Ошибка подписки на Push:', error);
    return null;
  }
}

export async function showLocalNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.showNotification(title, {
          icon: '/assets/human.png',
          badge: '/assets/human.png',
          vibrate: [200, 100, 200],
          ...options
        });
      }
    } catch (e) {}
    
    new Notification(title, {
      icon: '/assets/human.png',
      ...options
    });
  }
}

export function scheduleNotification(reminder) {
  const now = new Date();
  const [hours, minutes] = reminder.time.split(':').map(Number);
  
  reminder.days.forEach(day => {
    const dayMap = {
      'sun': 0, 'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6
    };
    
    const targetDay = dayMap[day];
    let daysUntil = targetDay - now.getDay();
    if (daysUntil < 0 || (daysUntil === 0 && hours < now.getHours()) ||
        (daysUntil === 0 && hours === now.getHours() && minutes <= now.getMinutes())) {
      daysUntil += 7;
    }
    
    const nextRun = new Date(now);
    nextRun.setDate(now.getDate() + daysUntil);
    nextRun.setHours(hours, minutes, 0, 0);
    
    if (nextRun > now && reminder.enabled) {
      showLocalNotification(reminder.title, {
        body: `Напоминание на ${reminder.time}`,
        tag: `reminder-${reminder.id}`,
        renotify: true
      });
    }
  });
}

function urlBase64ToUint8Array(base64String) {
  if (!base64String) return null;
  
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  
  return outputArray;
}

export function checkNotificationStatus() {
  return {
    supported: 'Notification' in window,
    permission: Notification.permission,
    serviceWorker: 'serviceWorker' in navigator
  };
}