function makeSlug() {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let body;
  try { body = await request.json(); } catch {
    return Response.json({ error: 'Geçersiz istek' }, { status: 400 });
  }

  const url = (body.youtubeUrl || '').trim();
  const m = url.match(/(?:youtu\.be\/|v=|shorts\/|embed\/)([A-Za-z0-9_-]{11})/);
  if (!m) return Response.json({ error: 'Geçersiz YouTube linki' }, { status: 400 });

  const videoId = m[1];

  const existing = await env.DB.prepare(
    'SELECT slug FROM links WHERE video_id = ? LIMIT 1'
  ).bind(videoId).first();
  if (existing) return Response.json({ slug: existing.slug, existed: true });

  let title = null, thumbnail = null;
  try {
    const oe = await fetch(`https://www.youtube.com/oembed?url=https://youtu.be/${videoId}&format=json`);
    if (oe.ok) {
      const data = await oe.json();
      title = data.title || null;
      thumbnail = data.thumbnail_url || null;
    }
  } catch {}

  let slug;
  for (let i = 0; i < 5; i++) {
    slug = makeSlug();
    const exists = await env.DB.prepare('SELECT slug FROM links WHERE slug = ?').bind(slug).first();
    if (!exists) break;
  }

  await env.DB.prepare(
    'INSERT INTO links (slug, video_id, title, thumbnail, created_at) VALUES (?, ?, ?, ?, ?)'
  ).bind(slug, videoId, title, thumbnail, Date.now()).run();

  return Response.json({ slug, videoId, title, thumbnail });
}
