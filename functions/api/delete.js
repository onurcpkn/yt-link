export async function onRequestPost(context) {
  const { request, env } = context;
  const { slug } = await request.json();
  if (!slug) return Response.json({ error: 'slug gerek' }, { status: 400 });

  await env.DB.prepare('DELETE FROM clicks WHERE slug = ?').bind(slug).run();
  await env.DB.prepare('DELETE FROM links WHERE slug = ?').bind(slug).run();

  return Response.json({ ok: true });
}
