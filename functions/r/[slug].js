export async function onRequest(context) {
  const { params, env } = context;
  const slug = params.slug;

  const link = await env.DB.prepare(
    'SELECT video_id FROM links WHERE slug = ?'
  ).bind(slug).first();

  if (!link) return new Response('Link bulunamadı', { status: 404 });

  context.waitUntil(
    env.DB.prepare('INSERT INTO clicks (slug, clicked_at) VALUES (?, ?)')
      .bind(slug, Date.now()).run()
  );

  const id = link.video_id;
  const html = `<!DOCTYPE html><html lang="tr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>YouTube'a yönlendiriliyor...</title>
<style>body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#0f0f0f;color:#fff;text-align:center;padding:20px}.btn{display:inline-block;background:#ff0000;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:20px}.small{opacity:.6;font-size:14px;margin-top:30px}</style>
</head><body>
<h2>YouTube'a yönlendiriliyorsun...</h2>
<a id="manual" class="btn" href="#">Açılmadıysa buraya bas</a>
<p class="small">Tarayıcıdan değil, YouTube uygulamasından izlemen için.</p>
<script>
(function(){
  var id = ${JSON.stringify(id)};
  var ua = navigator.userAgent || '';
  var isAndroid = /android/i.test(ua);
  var isIOS = /iPad|iPhone|iPod/.test(ua);
  var webUrl = 'https://www.youtube.com/watch?v=' + id;
  var iosScheme = 'youtube://www.youtube.com/watch?v=' + id;
  var intentUrl = 'intent://www.youtube.com/watch?v=' + id +
    '#Intent;package=com.google.android.youtube;scheme=https;' +
    'S.browser_fallback_url=' + encodeURIComponent(webUrl) + ';end';
  document.getElementById('manual').href = isAndroid ? intentUrl : (isIOS ? iosScheme : webUrl);
  if(isAndroid){ location.href = intentUrl; }
  else if(isIOS){ location.href = iosScheme; setTimeout(function(){location.href=webUrl;}, 1500); }
  else { location.href = webUrl; }
})();
</script></body></html>`;

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}
