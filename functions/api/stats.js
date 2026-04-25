export async function onRequest(context) {
  const { env } = context;

  const linksRes = await env.DB.prepare(`
    SELECT l.slug, l.video_id, l.title, l.thumbnail, l.created_at,
           COALESCE(c.cnt, 0) as click_count
    FROM links l
    LEFT JOIN (SELECT slug, COUNT(*) as cnt FROM clicks GROUP BY slug) c
      ON l.slug = c.slug
    ORDER BY l.created_at DESC
  `).all();

  const total = await env.DB.prepare('SELECT COUNT(*) as n FROM clicks').first();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const today = await env.DB.prepare('SELECT COUNT(*) as n FROM clicks WHERE clicked_at >= ?')
    .bind(todayStart.getTime()).first();

  const all = await env.DB.prepare('SELECT clicked_at FROM clicks').all();
  const dayCount = [0, 0, 0, 0, 0, 0, 0];
  const hourCount = Array(24).fill(0);
  for (const c of (all.results || [])) {
    const d = new Date(c.clicked_at);
    dayCount[d.getDay()]++;
    hourCount[d.getHours()]++;
  }
  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const maxDay = Math.max(...dayCount);
  const maxHour = Math.max(...hourCount);
  const bestDay = maxDay > 0 ? dayNames[dayCount.indexOf(maxDay)] : '—';
  const bestHour = maxHour > 0 ? hourCount.indexOf(maxHour) + ':00' : '—';

  return Response.json({
    total: total.n,
    today: today.n,
    bestDay,
    bestHour,
    links: linksRes.results || []
  });
}
