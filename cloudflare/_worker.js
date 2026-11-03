// Cloudflare Pages 고급 모드 Worker — _routes.json 에 맞는 주소(.html)만 여기로 온다.
//
// Pages 는 /a.html 을 /a 로, /dir/index.html 을 /dir/ 로 308 리다이렉트하고 이 동작을 끌 수 없다.
// 서재는 canonical·sitemap·내부 링크가 모두 .html 이라, 리다이렉트 없이 그 주소에서 바로 200 을 준다:
// 확장자를 뗀 주소(Pages 가 a.html 을 주는 주소)로 정적 자산을 받아 그대로 돌려준다.
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const p = url.pathname;
    if (p.endsWith(".html")) {
      const clean = new URL(url);
      clean.pathname = p.endsWith("/index.html") ? p.slice(0, -"index.html".length) : p.slice(0, -".html".length);
      const r = await env.ASSETS.fetch(new Request(clean, req));
      if (r.status === 200 || r.status === 304) return r;
    }
    return env.ASSETS.fetch(req);
  },
};
