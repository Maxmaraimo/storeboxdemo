/**
 * Official Yandex Maps API v2.1 Loader
 * Uses official API key: 05cb44b0-89df-4d2a-9349-167c0e97a836
 */

declare global {
  interface Window {
    ymaps?: any;
    __YMAPS_PROMISE__?: Promise<any>;
  }
}

const YANDEX_MAPS_API_KEY = '05cb44b0-89df-4d2a-9349-167c0e97a836';
const YANDEX_MAPS_URL = `https://api-maps.yandex.ru/2.1/?apikey=${YANDEX_MAPS_API_KEY}&lang=ru_RU`;

export function loadYandexMaps(): Promise<any> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window is undefined'));
  }

  // Already loaded and ready
  if (window.ymaps && window.ymaps.ready) {
    return new Promise((resolve) => {
      window.ymaps.ready(() => resolve(window.ymaps));
    });
  }

  // Promise already pending
  if (window.__YMAPS_PROMISE__) {
    return window.__YMAPS_PROMISE__;
  }

  // Inject script
  window.__YMAPS_PROMISE__ = new Promise((resolve, reject) => {
    // Check if script element already exists in document
    const existingScript = document.querySelector(`script[src*="api-maps.yandex.ru/2.1/"]`);
    if (existingScript) {
      const checkInterval = setInterval(() => {
        if (window.ymaps && window.ymaps.ready) {
          clearInterval(checkInterval);
          window.ymaps.ready(() => resolve(window.ymaps));
        }
      }, 50);

      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.ymaps && window.ymaps.ready) {
          window.ymaps.ready(() => resolve(window.ymaps));
        } else {
          reject(new Error('Yandex Maps loading timed out'));
        }
      }, 10000);
      return;
    }

    const script = document.createElement('script');
    script.src = YANDEX_MAPS_URL;
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => {
      if (window.ymaps && window.ymaps.ready) {
        window.ymaps.ready(() => resolve(window.ymaps));
      } else {
        reject(new Error('Yandex Maps loaded but ymaps object not found'));
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load Yandex Maps API script'));
    };

    document.head.appendChild(script);
  });

  return window.__YMAPS_PROMISE__;
}
