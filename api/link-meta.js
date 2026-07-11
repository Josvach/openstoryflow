// Vercel serverless function: fetch a URL server-side (no CORS limits)
// and return { title, description, image } parsed from its HTML.
module.exports = async (req, res) => {
  const url = req.query.url;
  if (!url || !/^https?:\/\//i.test(url)) {
    res.status(400).json({ error: 'invalid url' });
    return;
  }
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OpenStoryflow/1.0)' },
      signal: ctrl.signal,
      redirect: 'follow'
    });
    clearTimeout(t);
    const html = (await r.text()).slice(0, 300000);
    const pick = (re) => { const m = html.match(re); return m ? m[1].trim() : ''; };
    const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
    res.setHeader('Cache-Control', 's-maxage=86400');
    res.status(200).json({
      title: decode(pick(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i) || pick(/<title[^>]*>([^<]+)<\/title>/i) || url),
      description: decode(pick(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)/i) || pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i)),
      image: pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)/i)
    });
  } catch (err) {
    res.status(200).json({ title: url, description: '', image: '', error: String(err.message || err) });
  }
};
