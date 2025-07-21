/**
 * Service Worker for iPEC Coach Connect Offline Caching
 * 
 * Provides offline support and caching for critical application data:
 * - User profile data
 * - Coach information
 * - Session data
 * - Critical application assets
 * - API responses caching
 * - Background sync for data updates
 */

const CACHE_VERSION = 'ipec-cache-v1';
const CRITICAL_CACHE = `${CACHE_VERSION}-critical`;
const USER_DATA_CACHE = `${CACHE_VERSION}-user-data`;
const COACH_DATA_CACHE = `${CACHE_VERSION}-coach-data`;
const API_CACHE = `${CACHE_VERSION}-api`;
const ASSETS_CACHE = `${CACHE_VERSION}-assets`;

// Cache configurations
const CACHE_CONFIG = {
  [CRITICAL_CACHE]: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    maxEntries: 50,
    strategy: 'cacheFirst'
  },
  [USER_DATA_CACHE]: {
    maxAge: 30 * 60 * 1000, // 30 minutes
    maxEntries: 100,
    strategy: 'networkFirst'
  },
  [COACH_DATA_CACHE]: {
    maxAge: 60 * 60 * 1000, // 1 hour
    maxEntries: 200,
    strategy: 'staleWhileRevalidate'
  },
  [API_CACHE]: {
    maxAge: 15 * 60 * 1000, // 15 minutes
    maxEntries: 300,
    strategy: 'networkFirst'
  },
  [ASSETS_CACHE]: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    maxEntries: 100,
    strategy: 'cacheFirst'
  }
};

// Critical resources to cache immediately
const CRITICAL_RESOURCES = [
  '/',
  '/auth/login',
  '/dashboard',
  '/profile',
  '/manifest.json',
  '/images/logo.svg'
];

// API endpoints to cache
const CACHEABLE_API_PATTERNS = [
  /\/api\/profiles\/\w+$/,
  /\/api\/coaches\/\w+$/,
  /\/api\/coaches\/search/,
  /\/api\/sessions\/\w+$/,
  /\/api\/learning-resources/,
  /\/api\/community\/posts/
];

// Background sync tags
const SYNC_TAGS = {
  PROFILE_UPDATE: 'profile-update',
  COACH_DATA_UPDATE: 'coach-data-update',
  SESSION_DATA_UPDATE: 'session-data-update',
  ANALYTICS_UPDATE: 'analytics-update'
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', (event) => {
  console.log('ServiceWorker installing...');
  
  event.waitUntil(
    (async () => {
      try {
        // Pre-cache critical resources
        const criticalCache = await caches.open(CRITICAL_CACHE);
        await criticalCache.addAll(CRITICAL_RESOURCES);
        
        // Initialize cache metadata
        await initializeCacheMetadata();
        
        console.log('ServiceWorker installed successfully');
        
        // Skip waiting to activate immediately
        self.skipWaiting();
      } catch (error) {
        console.error('ServiceWorker installation failed:', error);
      }
    })()
  );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', (event) => {
  console.log('ServiceWorker activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Clean up old caches
        await cleanupOldCaches();
        
        // Claim all clients
        await self.clients.claim();
        
        console.log('ServiceWorker activated successfully');
      } catch (error) {
        console.error('ServiceWorker activation failed:', error);
      }
    })()
  );
});

/**
 * Fetch Event Handler
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Determine cache strategy based on request
  if (isCriticalResource(request)) {
    event.respondWith(handleCriticalResource(request));
  } else if (isUserDataRequest(request)) {
    event.respondWith(handleUserDataRequest(request));
  } else if (isCoachDataRequest(request)) {
    event.respondWith(handleCoachDataRequest(request));
  } else if (isApiRequest(request)) {
    event.respondWith(handleApiRequest(request));
  } else if (isAssetRequest(request)) {
    event.respondWith(handleAssetRequest(request));
  }
});

/**
 * Background Sync Handler
 */
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  
  switch (event.tag) {
    case SYNC_TAGS.PROFILE_UPDATE:
      event.waitUntil(syncProfileUpdates());
      break;
    case SYNC_TAGS.COACH_DATA_UPDATE:
      event.waitUntil(syncCoachDataUpdates());
      break;
    case SYNC_TAGS.SESSION_DATA_UPDATE:
      event.waitUntil(syncSessionDataUpdates());
      break;
    case SYNC_TAGS.ANALYTICS_UPDATE:
      event.waitUntil(syncAnalyticsUpdates());
      break;
    default:
      console.log('Unknown sync tag:', event.tag);
  }
});

/**
 * Message Handler for Cache Management
 */
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'CACHE_USER_DATA':
      handleCacheUserData(data);
      break;
    case 'CACHE_COACH_DATA':
      handleCacheCoachData(data);
      break;
    case 'INVALIDATE_CACHE':
      handleInvalidateCache(data);
      break;
    case 'GET_CACHE_STATS':
      handleGetCacheStats(event);
      break;
    case 'CLEAR_ALL_CACHES':
      handleClearAllCaches();
      break;
    case 'WARM_CACHE':
      handleWarmCache(data);
      break;
    default:
      console.log('Unknown message type:', type);
  }
});

/**
 * Request Classification Functions
 */
function isCriticalResource(request) {
  const url = new URL(request.url);
  return CRITICAL_RESOURCES.some(resource => 
    url.pathname === resource || url.pathname.startsWith(resource)
  );
}

function isUserDataRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/api/profiles/') || 
         url.pathname.includes('/api/auth/') ||
         url.pathname.includes('/api/user/');
}

function isCoachDataRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/api/coaches/') ||
         url.pathname.includes('/api/coaching/');
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/') &&
         CACHEABLE_API_PATTERNS.some(pattern => pattern.test(url.pathname));
}

function isAssetRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/images/') ||
         url.pathname.includes('/fonts/') ||
         url.pathname.includes('/icons/') ||
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.svg') ||
         url.pathname.endsWith('.png') ||
         url.pathname.endsWith('.jpg');
}

/**
 * Cache Strategy Handlers
 */
async function handleCriticalResource(request) {
  return cacheFirstStrategy(request, CRITICAL_CACHE);
}

async function handleUserDataRequest(request) {
  return networkFirstStrategy(request, USER_DATA_CACHE);
}

async function handleCoachDataRequest(request) {
  return staleWhileRevalidateStrategy(request, COACH_DATA_CACHE);
}

async function handleApiRequest(request) {
  return networkFirstStrategy(request, API_CACHE);
}

async function handleAssetRequest(request) {
  return cacheFirstStrategy(request, ASSETS_CACHE);
}

/**
 * Cache Strategies Implementation
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse && !isExpired(cachedResponse, cacheName)) {
      // Update access time
      await updateCacheMetadata(cacheName, request.url, 'access');
      return cachedResponse;
    }
    
    // Fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      await cache.put(request, networkResponse.clone());
      await updateCacheMetadata(cacheName, request.url, 'store');
      await enforceCacheSize(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache first strategy failed:', error);
    
    // Return cached response if available (even if expired)
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page or error response
    return createOfflineResponse(request);
  }
}

async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response
      const cache = await caches.open(cacheName);
      await cache.put(request, networkResponse.clone());
      await updateCacheMetadata(cacheName, request.url, 'store');
      await enforceCacheSize(cacheName);
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Network first strategy failed:', error);
    
    // Fallback to cache
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      await updateCacheMetadata(cacheName, request.url, 'access');
      return cachedResponse;
    }
    
    return createOfflineResponse(request);
  }
}

async function staleWhileRevalidateStrategy(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  
  // Always try to revalidate in the background
  const networkPromise = fetch(request)
    .then(async (networkResponse) => {
      if (networkResponse.ok) {
        await cache.put(request, networkResponse.clone());
        await updateCacheMetadata(cacheName, request.url, 'store');
        await enforceCacheSize(cacheName);
      }
      return networkResponse;
    })
    .catch(error => {
      console.error('Stale while revalidate network error:', error);
      return null;
    });
  
  // Return cached response immediately if available
  if (cachedResponse) {
    await updateCacheMetadata(cacheName, request.url, 'access');
    return cachedResponse;
  }
  
  // If no cached response, wait for network
  try {
    const networkResponse = await networkPromise;
    return networkResponse || createOfflineResponse(request);
  } catch (error) {
    return createOfflineResponse(request);
  }
}

/**
 * Cache Metadata Management
 */
async function initializeCacheMetadata() {
  const metadata = {
    version: CACHE_VERSION,
    created: Date.now(),
    caches: {}
  };
  
  for (const cacheName of Object.keys(CACHE_CONFIG)) {
    metadata.caches[cacheName] = {
      created: Date.now(),
      lastAccessed: Date.now(),
      entries: {},
      size: 0
    };
  }
  
  await setCacheMetadata(metadata);
}

async function updateCacheMetadata(cacheName, url, operation) {
  try {
    const metadata = await getCacheMetadata();
    const now = Date.now();
    
    if (!metadata.caches[cacheName]) {
      metadata.caches[cacheName] = {
        created: now,
        lastAccessed: now,
        entries: {},
        size: 0
      };
    }
    
    const cacheMetadata = metadata.caches[cacheName];
    cacheMetadata.lastAccessed = now;
    
    if (operation === 'store') {
      cacheMetadata.entries[url] = {
        stored: now,
        accessed: now,
        accessCount: 1
      };
      cacheMetadata.size++;
    } else if (operation === 'access' && cacheMetadata.entries[url]) {
      cacheMetadata.entries[url].accessed = now;
      cacheMetadata.entries[url].accessCount = 
        (cacheMetadata.entries[url].accessCount || 0) + 1;
    }
    
    await setCacheMetadata(metadata);
  } catch (error) {
    console.error('Error updating cache metadata:', error);
  }
}

async function getCacheMetadata() {
  try {
    const cache = await caches.open(CRITICAL_CACHE);
    const response = await cache.match('/cache-metadata');
    
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error getting cache metadata:', error);
  }
  
  return { version: CACHE_VERSION, created: Date.now(), caches: {} };
}

async function setCacheMetadata(metadata) {
  try {
    const cache = await caches.open(CRITICAL_CACHE);
    const response = new Response(JSON.stringify(metadata), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put('/cache-metadata', response);
  } catch (error) {
    console.error('Error setting cache metadata:', error);
  }
}

/**
 * Cache Expiration and Size Management
 */
function isExpired(response, cacheName) {
  const config = CACHE_CONFIG[cacheName];
  if (!config) return false;
  
  const dateHeader = response.headers.get('date');
  if (!dateHeader) return false;
  
  const responseTime = new Date(dateHeader).getTime();
  const maxAge = config.maxAge || 24 * 60 * 60 * 1000; // Default 24 hours
  
  return Date.now() - responseTime > maxAge;
}

async function enforceCacheSize(cacheName) {
  const config = CACHE_CONFIG[cacheName];
  if (!config.maxEntries) return;
  
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    if (keys.length > config.maxEntries) {
      const metadata = await getCacheMetadata();
      const cacheMetadata = metadata.caches[cacheName];
      
      if (cacheMetadata && cacheMetadata.entries) {
        // Sort by access time (LRU)
        const sortedEntries = Object.entries(cacheMetadata.entries)
          .sort(([,a], [,b]) => (a.accessed || 0) - (b.accessed || 0));
        
        const toDelete = keys.length - config.maxEntries;
        const keysToDelete = sortedEntries.slice(0, toDelete);
        
        for (const [url] of keysToDelete) {
          await cache.delete(url);
          delete cacheMetadata.entries[url];
          cacheMetadata.size--;
        }
        
        await setCacheMetadata(metadata);
      }
    }
  } catch (error) {
    console.error('Error enforcing cache size:', error);
  }
}

async function cleanupOldCaches() {
  try {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name => 
      name.startsWith('ipec-cache-') && !name.startsWith(CACHE_VERSION)
    );
    
    await Promise.all(oldCaches.map(name => caches.delete(name)));
    
    console.log('Cleaned up old caches:', oldCaches);
  } catch (error) {
    console.error('Error cleaning up old caches:', error);
  }
}

/**
 * Background Sync Functions
 */
async function syncProfileUpdates() {
  try {
    const pendingUpdates = await getPendingUpdates('profile');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(update.url, {
          method: update.method,
          headers: update.headers,
          body: update.body
        });
        
        if (response.ok) {
          await removePendingUpdate('profile', update.id);
          
          // Notify clients of successful sync
          await notifyClients('PROFILE_SYNC_SUCCESS', {
            updateId: update.id,
            data: await response.json()
          });
        }
      } catch (error) {
        console.error('Error syncing profile update:', error);
      }
    }
  } catch (error) {
    console.error('Error in profile sync:', error);
  }
}

async function syncCoachDataUpdates() {
  try {
    const pendingUpdates = await getPendingUpdates('coach');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(update.url, {
          method: update.method,
          headers: update.headers,
          body: update.body
        });
        
        if (response.ok) {
          await removePendingUpdate('coach', update.id);
          
          // Update cached coach data
          const cache = await caches.open(COACH_DATA_CACHE);
          const updatedData = await response.json();
          
          const cacheResponse = new Response(JSON.stringify(updatedData), {
            headers: { 'Content-Type': 'application/json' }
          });
          
          await cache.put(update.url, cacheResponse);
          
          // Notify clients
          await notifyClients('COACH_DATA_SYNC_SUCCESS', {
            updateId: update.id,
            data: updatedData
          });
        }
      } catch (error) {
        console.error('Error syncing coach data update:', error);
      }
    }
  } catch (error) {
    console.error('Error in coach data sync:', error);
  }
}

async function syncSessionDataUpdates() {
  try {
    const pendingUpdates = await getPendingUpdates('session');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(update.url, {
          method: update.method,
          headers: update.headers,
          body: update.body
        });
        
        if (response.ok) {
          await removePendingUpdate('session', update.id);
          
          // Notify clients
          await notifyClients('SESSION_DATA_SYNC_SUCCESS', {
            updateId: update.id,
            data: await response.json()
          });
        }
      } catch (error) {
        console.error('Error syncing session data update:', error);
      }
    }
  } catch (error) {
    console.error('Error in session data sync:', error);
  }
}

async function syncAnalyticsUpdates() {
  try {
    const pendingUpdates = await getPendingUpdates('analytics');
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(update.url, {
          method: update.method,
          headers: update.headers,
          body: update.body
        });
        
        if (response.ok) {
          await removePendingUpdate('analytics', update.id);
        }
      } catch (error) {
        console.error('Error syncing analytics update:', error);
      }
    }
  } catch (error) {
    console.error('Error in analytics sync:', error);
  }
}

/**
 * Pending Updates Management
 */
async function getPendingUpdates(type) {
  try {
    const cache = await caches.open(CRITICAL_CACHE);
    const response = await cache.match(`/pending-updates-${type}`);
    
    if (response) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error getting pending updates:', error);
  }
  
  return [];
}

async function addPendingUpdate(type, update) {
  try {
    const pendingUpdates = await getPendingUpdates(type);
    update.id = Date.now().toString();
    pendingUpdates.push(update);
    
    const cache = await caches.open(CRITICAL_CACHE);
    const response = new Response(JSON.stringify(pendingUpdates), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/pending-updates-${type}`, response);
    
    return update.id;
  } catch (error) {
    console.error('Error adding pending update:', error);
    return null;
  }
}

async function removePendingUpdate(type, updateId) {
  try {
    const pendingUpdates = await getPendingUpdates(type);
    const filteredUpdates = pendingUpdates.filter(update => update.id !== updateId);
    
    const cache = await caches.open(CRITICAL_CACHE);
    const response = new Response(JSON.stringify(filteredUpdates), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/pending-updates-${type}`, response);
  } catch (error) {
    console.error('Error removing pending update:', error);
  }
}

/**
 * Message Handlers
 */
async function handleCacheUserData(data) {
  try {
    const cache = await caches.open(USER_DATA_CACHE);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/user-data/${data.userId}`, response);
    await updateCacheMetadata(USER_DATA_CACHE, `/user-data/${data.userId}`, 'store');
    
    console.log('User data cached successfully');
  } catch (error) {
    console.error('Error caching user data:', error);
  }
}

async function handleCacheCoachData(data) {
  try {
    const cache = await caches.open(COACH_DATA_CACHE);
    const response = new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
    
    await cache.put(`/coach-data/${data.coachId}`, response);
    await updateCacheMetadata(COACH_DATA_CACHE, `/coach-data/${data.coachId}`, 'store');
    
    console.log('Coach data cached successfully');
  } catch (error) {
    console.error('Error caching coach data:', error);
  }
}

async function handleInvalidateCache(data) {
  try {
    const { pattern, cacheTypes } = data;
    
    for (const cacheType of cacheTypes) {
      const cache = await caches.open(cacheType);
      const keys = await cache.keys();
      
      for (const request of keys) {
        if (new RegExp(pattern).test(request.url)) {
          await cache.delete(request);
        }
      }
    }
    
    console.log('Cache invalidation completed');
  } catch (error) {
    console.error('Error invalidating cache:', error);
  }
}

async function handleGetCacheStats(event) {
  try {
    const metadata = await getCacheMetadata();
    const stats = {
      version: metadata.version,
      created: metadata.created,
      caches: {}
    };
    
    for (const [cacheName, cacheMetadata] of Object.entries(metadata.caches)) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      
      stats.caches[cacheName] = {
        size: keys.length,
        maxSize: CACHE_CONFIG[cacheName]?.maxEntries || 'unlimited',
        created: cacheMetadata.created,
        lastAccessed: cacheMetadata.lastAccessed,
        entries: Object.keys(cacheMetadata.entries || {}).length
      };
    }
    
    event.ports[0].postMessage(stats);
  } catch (error) {
    console.error('Error getting cache stats:', error);
    event.ports[0].postMessage({ error: error.message });
  }
}

async function handleClearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    const ipecCaches = cacheNames.filter(name => name.startsWith('ipec-cache-'));
    
    await Promise.all(ipecCaches.map(name => caches.delete(name)));
    
    console.log('All caches cleared');
  } catch (error) {
    console.error('Error clearing all caches:', error);
  }
}

async function handleWarmCache(data) {
  try {
    const { urls, cacheType } = data;
    const cache = await caches.open(cacheType);
    
    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          await updateCacheMetadata(cacheType, url, 'store');
        }
      } catch (error) {
        console.error('Error warming cache for URL:', url, error);
      }
    }
    
    console.log('Cache warming completed');
  } catch (error) {
    console.error('Error warming cache:', error);
  }
}

/**
 * Utility Functions
 */
function createOfflineResponse(request) {
  const isApiRequest = request.url.includes('/api/');
  
  if (isApiRequest) {
    return new Response(JSON.stringify({
      error: 'Network unavailable',
      message: 'This data is not available offline',
      offline: true
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response('<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>', {
    status: 503,
    headers: { 'Content-Type': 'text/html' }
  });
}

async function notifyClients(type, data) {
  try {
    const clients = await self.clients.matchAll();
    
    for (const client of clients) {
      client.postMessage({ type, data });
    }
  } catch (error) {
    console.error('Error notifying clients:', error);
  }
}

// Export functions for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    CACHE_VERSION,
    CACHE_CONFIG,
    CRITICAL_RESOURCES,
    CACHEABLE_API_PATTERNS,
    SYNC_TAGS,
    isCriticalResource,
    isUserDataRequest,
    isCoachDataRequest,
    isApiRequest,
    isAssetRequest
  };
}