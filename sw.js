/* Service worker de la versión web y de la app de Microsoft Store.
   Guarda el juego en el PC para jugarlo sin conexión. build.py --web reemplaza 21192a552b4f por una huella
   del juego, así cada versión publicada es un sw.js distinto y el navegador la descarga sola.
   La versión nueva queda esperando hasta que el jugador toque «Actualizar ahora» o cierre el juego. */
const CACHE='camino-del-pacto-21192a552b4f';
const ARCHIVOS=['./','manifest.webmanifest','iconos/icono-192.png','iconos/icono-512.png','iconos/icono-maskable-512.png','privacidad.html'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ARCHIVOS.map(u=>new Request(u,{cache:'reload'})))));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('camino-del-pacto-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',e=>{if(e.data==='activar')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  /* Cualquier página del juego (con o sin index.html o parámetros) es el juego guardado */
  if(r.mode==='navigate'&&!r.url.includes('privacidad')){e.respondWith(caches.match('./').then(x=>x||fetch(r)));return}
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(x=>x||fetch(r)));
});
