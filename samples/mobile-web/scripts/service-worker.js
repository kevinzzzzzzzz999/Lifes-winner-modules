// Only app shell files are cached. User documents never pass through this worker.
const APP_FILES = __APP_FILES__;
const APP_VERSIONS = __APP_VERSIONS__;
const INTEGRITY = __ASSET_INTEGRITY__;
const APP = new URL(self.location.href).searchParams.get('app');
if (!Object.hasOwn(APP_FILES, APP)) throw new Error('Unknown application scope');
const ROOT = new URL('./', self.location.href);
const PREFIX = 'inkspace-mobile:' + APP + ':';
const CACHE = PREFIX + APP_VERSIONS[APP];
const ALLOWED = new Set(APP_FILES[APP].map(path => new URL(path, ROOT).href));
const ENTRY = new URL(APP + '/index.html', ROOT).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll([...ALLOWED].map(url => new Request(url,{cache:'reload',credentials:'omit',integrity:INTEGRITY[new URL(url).pathname.slice(ROOT.pathname.length)]})))));
  // An update waits for the user to close this app, preserving unsaved editing.
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(PREFIX) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== ROOT.origin) return;
  let target = url.href;
  if (event.request.mode === 'navigate' && (url.pathname === new URL(APP+'/',ROOT).pathname || url.href === ENTRY)) target = ENTRY;
  if (!ALLOWED.has(target)) return;
  event.respondWith((async () => {
    const cached = await caches.match(target,{cacheName:CACHE});
    if (cached) return cached;
    const response = await fetch(new Request(target,{credentials:'omit',cache:'reload',integrity:INTEGRITY[new URL(target).pathname.slice(ROOT.pathname.length)]}));
    if (!response.ok) return response;
    try { await (await caches.open(CACHE)).put(target,response.clone()); } catch { /* Online use can continue when storage is full. */ }
    return response;
  })());
});
