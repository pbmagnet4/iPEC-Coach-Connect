// Advanced Service Worker for iPEC Coach Connect
// Implements intelligent caching strategies and offline support

const CACHE_NAME = 'ipec-coach-connect-v1';
const RUNTIME_CACHE = 'runtime-cache';
const ASSETS_CACHE = 'assets-cache';
const API_CACHE = 'api-cache';

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache-first',
  NETWORK_FIRST: 'network-first',
  STALE_WHILE_REVALIDATE: 'stale-while-revalidate',
  NETWORK_ONLY: 'network-only',
  CACHE_ONLY: 'cache-only'
};

// Cache configurations
const CACHE_CONFIG = {
  // Static assets - Cache First strategy
  staticAssets: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
    maxEntries: 100,
    patterns: [
      /\.(?:js|css|woff2?|ttf|eot)$/,
      /\/assets\//,
      /\/images\//,
      /\/fonts\//
    ]
  },
  
  // HTML documents - Network First strategy
  documents: {
    strategy: CACHE_STRATEGIES.NETWORK_FIRST,
    maxAgeSeconds: 60 * 60 * 24, // 1 day
    maxEntries: 50,
    patterns: [
      /\.(?:html)$/,
      /\/$/,
      /\/[^.]*$/ // Routes without extensions
    ]
  },
  
  // API responses - Stale While Revalidate
  api: {
    strategy: CACHE_STRATEGIES.STALE_WHILE_REVALIDATE,
    maxAgeSeconds: 60 * 5, // 5 minutes
    maxEntries: 100,
    patterns: [
      /\/api\//,
      /supabase\.co\/rest\//,
      /googleapis\.com\//
    ]
  },
  
  // Images - Cache First with fallback
  images: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
    maxEntries: 200,
    patterns: [
      /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/
    ]
  },
  
  // External fonts - Cache First
  fonts: {
    strategy: CACHE_STRATEGIES.CACHE_FIRST,
    maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
    maxEntries: 20,
    patterns: [
      /fonts\.googleapis\.com/,
      /fonts\.gstatic\.com/
    ]
  }
};

// Install event - Cache essential resources
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching essential resources');
        
        // Essential resources to cache immediately
        const essentialResources = [
          '/',
          '/index.html',
          '/manifest.json',
          '/assets/css/index.css',
          '/assets/js/index.js',
          '/offline.html' // Fallback page
        ];
        
        return cache.addAll(essentialResources);
      })
      .then(() => {
        console.log('Service Worker: Essential resources cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache essential resources:', error);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && 
                cacheName !== RUNTIME_CACHE && 
                cacheName !== ASSETS_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Cache cleanup complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - Intelligent request handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Determine cache strategy based on request
  const strategy = determineCacheStrategy(request);
  
  event.respondWith(
    handleRequest(request, strategy)
  );
});

// Determine appropriate cache strategy
function determineCacheStrategy(request) {
  const url = new URL(request.url);
  
  // Check against each cache configuration
  for (const [configName, config] of Object.entries(CACHE_CONFIG)) {
    if (config.patterns.some(pattern => pattern.test(url.pathname) || pattern.test(url.href))) {
      return config.strategy;
    }
  }
  
  // Default strategy for unmatched requests
  return CACHE_STRATEGIES.NETWORK_FIRST;
}

// Handle requests based on strategy
async function handleRequest(request, strategy) {
  const cacheName = getCacheName(request);
  
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request, cacheName);
    
    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request, cacheName);
    
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request, cacheName);
    
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return fetch(request);
    
    case CACHE_STRATEGIES.CACHE_ONLY:
      return caches.match(request);
    
    default:
      return networkFirst(request, cacheName);
  }
}

// Get appropriate cache name for request
function getCacheName(request) {
  const url = new URL(request.url);
  
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase')) {
    return API_CACHE;
  }
  
  if (url.pathname.includes('/assets/')) {
    return ASSETS_CACHE;
  }
  
  return RUNTIME_CACHE;
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache First strategy failed:', error);
    return await handleOfflineFallback(request);
  }
}

// Network First strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network request failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return await handleOfflineFallback(request);
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const networkPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error('Network request failed in SWR:', error);
      return null;
    });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    return cachedResponse;
  }
  
  // Otherwise wait for network response
  return networkPromise || await handleOfflineFallback(request);
}

// Handle offline fallbacks
async function handleOfflineFallback(request) {
  const url = new URL(request.url);
  
  // HTML requests - return offline page
  if (request.destination === 'document') {
    return caches.match('/offline.html');
  }
  
  // Image requests - return placeholder
  if (request.destination === 'image') {
    return caches.match('/assets/images/placeholder.svg');
  }
  
  // Default fallback
  return new Response('Network error', {
    status: 408,
    headers: { 'Content-Type': 'text/plain' }
  });
}

// Cache management - Clean up old entries
async function cleanupCache(cacheName, maxEntries = 100) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxEntries) {
    const keysToDelete = keys.slice(0, keys.length - maxEntries);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

// Handle background sync
async function handleBackgroundSync() {
  console.log('Service Worker: Background sync triggered');
  
  // Implement background sync logic here
  // For example, sync offline form submissions, analytics, etc.
  
  try {
    // Get offline queue from IndexedDB
    const offlineQueue = await getOfflineQueue();
    
    for (const item of offlineQueue) {
      try {
        await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body
        });
        
        // Remove from offline queue after successful sync
        await removeFromOfflineQueue(item.id);
      } catch (error) {
        console.error('Failed to sync offline item:', error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', (event) => {
  if (event.data) {
    const options = {
      body: event.data.text(),
      icon: '/assets/images/icon-192x192.png',
      badge: '/assets/images/badge-72x72.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'explore',
          title: 'View',
          icon: '/assets/images/checkmark.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/assets/images/xmark.png'
        }
      ]
    };
    
    event.waitUntil(
      self.registration.showNotification('iPEC Coach Connect', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Placeholder functions for offline queue (implement with IndexedDB)
async function getOfflineQueue() {
  // Implement IndexedDB retrieval logic
  return [];
}

async function removeFromOfflineQueue(id) {
  // Implement IndexedDB removal logic
  return Promise.resolve();
}

// Performance monitoring
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PERFORMANCE_REPORT') {
    console.log('Performance report received:', event.data.metrics);
    // Send performance data to analytics service
  }
});

console.log('Service Worker: Loaded and ready');