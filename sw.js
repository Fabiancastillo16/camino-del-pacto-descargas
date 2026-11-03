/* Service worker de la versión web y de la app de Microsoft Store.
   Guarda el juego en el PC para jugarlo sin conexión. build.py --web reemplaza d1eebf2c29c2 por una huella
   del juego, así cada versión publicada es un sw.js distinto y el navegador la descarga sola.
   La versión nueva queda esperando hasta que el jugador toque «Actualizar ahora» o cierre el juego.
   La narración grabada (AUDIOS, la llena build.py) va en un almacén aparte que se conserva entre versiones:
   cada audio se llama según su texto, así que nunca cambia; solo se descargan los nuevos. */
const CACHE='camino-del-pacto-d1eebf2c29c2',VOZ='camino-del-pacto-voz';
const ARCHIVOS=['./','manifest.webmanifest','iconos/icono-192.png','iconos/icono-512.png','iconos/icono-maskable-512.png','privacidad.html'];
const AUDIOS=["audio/voz/a5976297.mp3", "audio/voz/4ff99c0c.mp3", "audio/voz/81bc1a74.mp3", "audio/voz/dee5f530.mp3", "audio/voz/8be53c7e.mp3", "audio/voz/d47a615a.mp3", "audio/voz/5d39fdf4.mp3", "audio/voz/b84c3738.mp3", "audio/voz/3ae83512.mp3", "audio/voz/6bb2d92c.mp3", "audio/voz/1e864f96.mp3", "audio/voz/6889de36.mp3", "audio/voz/fe792ae3.mp3", "audio/voz/aa8c9944.mp3", "audio/voz/b8135019.mp3", "audio/voz/066d02d2.mp3", "audio/voz/9e4078f2.mp3", "audio/voz/7dfbbfb1.mp3", "audio/voz/ede97b1f.mp3", "audio/voz/0dd368ba.mp3", "audio/voz/84f41855.mp3", "audio/voz/14041ac8.mp3", "audio/voz/ce6636f2.mp3", "audio/voz/36e78d13.mp3", "audio/voz/0ffeabf6.mp3", "audio/voz/4b8e7277.mp3", "audio/voz/00bbe754.mp3", "audio/voz/0eb0abc4.mp3", "audio/voz/a7436895.mp3", "audio/voz/92e38f36.mp3", "audio/voz/04991550.mp3", "audio/voz/4ed4d2db.mp3", "audio/voz/58998355.mp3", "audio/voz/f0ca97be.mp3", "audio/voz/b244a92c.mp3", "audio/voz/ece46c99.mp3", "audio/voz/dab1595b.mp3", "audio/voz/bfef75fc.mp3", "audio/voz/b959cb7e.mp3", "audio/voz/74ca028c.mp3", "audio/voz/31932a2d.mp3", "audio/voz/44f6cfc0.mp3", "audio/voz/36de6242.mp3", "audio/voz/27540a1b.mp3", "audio/voz/386569bc.mp3", "audio/voz/2d5d6fc5.mp3", "audio/voz/ed781d04.mp3", "audio/voz/e92db3ab.mp3", "audio/voz/37f85f82.mp3", "audio/voz/d47ccffc.mp3", "audio/voz/bdb9870c.mp3", "audio/voz/0b65d7b3.mp3", "audio/voz/3f7a33bd.mp3", "audio/voz/996754a2.mp3", "audio/voz/6eede7e2.mp3", "audio/voz/fbaca273.mp3", "audio/voz/739759e6.mp3", "audio/voz/47da9b20.mp3", "audio/voz/dbf39e61.mp3", "audio/voz/d09e525e.mp3", "audio/voz/2398da77.mp3", "audio/voz/1395395d.mp3", "audio/voz/6cd9ea92.mp3", "audio/voz/f57caf0f.mp3", "audio/voz/210f89f0.mp3", "audio/voz/e1319521.mp3", "audio/voz/455671eb.mp3"];

self.addEventListener('install',e=>{
  e.waitUntil(Promise.all([
    caches.open(CACHE).then(c=>c.addAll(ARCHIVOS.map(u=>new Request(u,{cache:'reload'})))),
    /* La narración no impide instalar: si un audio falla, se pedirá cuando haga falta */
    caches.open(VOZ).then(c=>Promise.allSettled(AUDIOS.map(u=>c.match(u).then(x=>x||c.add(u)))))
  ]));
});
self.addEventListener('activate',e=>{
  const vivos=new Set(AUDIOS.map(u=>new URL(u,self.registration.scope).href));
  e.waitUntil(Promise.all([
    caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('camino-del-pacto-')&&k!==CACHE&&k!==VOZ).map(k=>caches.delete(k)))),
    /* Borra los audios que ya no usa ninguna versión */
    caches.open(VOZ).then(c=>c.keys().then(rs=>Promise.all(rs.filter(r=>!vivos.has(r.url)).map(r=>c.delete(r)))))
  ]).then(()=>self.clients.claim()));
});
self.addEventListener('message',e=>{if(e.data==='activar')self.skipWaiting()});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
  /* Cualquier página del juego (con o sin index.html o parámetros) es el juego guardado */
  if(r.mode==='navigate'&&!r.url.includes('privacidad')){e.respondWith(caches.match('./').then(x=>x||fetch(r)));return}
  if(r.url.includes('/audio/voz/')){e.respondWith(caches.open(VOZ).then(c=>c.match(r,{ignoreSearch:true}).then(x=>x||fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}))));return}
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(x=>x||fetch(r)));
});
