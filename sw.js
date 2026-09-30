const CACHE='lex-prospect-v5';
const ASSETS=['/','/index.html','/assets/app.css','/assets/core.js','/assets/extract.js','/assets/crm.js','/assets/social.js','/manifest.webmanifest','/icon.svg','/vendor/supabase.js'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.hostname.endsWith('.supabase.co'))return;
  if(url.origin!==self.location.origin)return;
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy))}return response}).catch(()=>caches.match(request).then(hit=>hit||caches.match('/index.html'))));
});
