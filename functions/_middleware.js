export async function onRequest(context) {
  const { request, env, next } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // /r/* (kısa linkler) herkese açık. / ve /api/* korumalı.
  const isProtected = path === '/' || path === '/index.html' || path.startsWith('/api/');
  if (!isProtected) return next();

  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Basic ')) {
    return new Response('Yetki gerekli', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
    });
  }

  const decoded = atob(auth.slice(6));
  const [, pass] = decoded.split(':');

  if (pass !== env.PANEL_PASSWORD) {
    return new Response('Yanlış şifre', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
    });
  }

  return next();
}
