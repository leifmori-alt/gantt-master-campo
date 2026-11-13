// Trabajador de la app de campo: guarda la aplicación completa la primera vez que se abre con señal (la página, sus
// archivos de código y estilos, el manifiesto y los íconos) y desde ahí funciona sin internet (primero lo guardado; si
// hay señal, se actualiza para la próxima vez). Los datos (obras y fotos) no pasan por aquí: viven en el celular.
// Al publicar, el nombre lleva la versión (vite.campo.config.mts): cada versión nueva se guarda completa y se borra la anterior.
const CACHE = 'gm-campo-202611131510'
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png']

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE)
    // Pedidos al sitio (no a la memoria del navegador), para guardar la versión recién publicada.
    const fresh = (u) => new Request(u, { cache: 'reload' })
    await cache.addAll(CORE.map(fresh))
    // Los archivos de la app que pide la página (con su huella en el nombre).
    const html = await (await cache.match('./index.html')).text()
    const assets = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map((m) => m[1])
    if (assets.length) await cache.addAll(assets.map(fresh))
    await self.skipWaiting()
  })())
})

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()))
})

self.addEventListener('fetch', (e) => {
  const req = e.request
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: true })
      const net = fetch(req).then((res) => { if (res.ok) cache.put(req, res.clone()); return res }).catch(() => hit)
      return hit ?? net
    })
  )
})
