// ms-9router bridge template — Cloudflare Worker (service-worker format).
// Purpose: give single-field OpenAI clients ONE stable Base URL + ONE key,
// while the ModelScope gateway needs its own token AND the app key.
//   Client  ->  https://<your-worker>.<subdomain>.workers.dev/v1  (9Router key)
//   Worker  ->  TUNNEL_URL (tunnel endpoint, valid cert)            (same key forwarded)
//   Fallback->  api-inference host + MS_TOKEN + x-api-key (only if tunnel is down)
//
// Setup (browser only, no terminal):
//  1. dash.cloudflare.com -> Workers & Pages -> Create Worker.
//  2. Paste this file as the Worker code -> Deploy.
//  3. Settings -> Variables and Secrets:
//       - Plaintext variable: TUNNEL_URL = https://<current-tunnel-host>  (no trailing slash)
//       - Secret:             MS_TOKEN   = <your ModelScope access token>
//  4. Client config:  Base URL = https://<your-worker>.<subdomain>.workers.dev/v1
//                     API Key  = <your 9Router API key>
//  5. When the tunnel host changes, only update TUNNEL_URL. Clients never change.
var FALLBACK_TARGET = "https://studio-<owner>-<repo>.api-inference.modelscope.ai";
addEventListener("fetch", function (event) { event.respondWith(handle(event.request)); });
async function handle(req) {
  var url = new URL(req.url);
  var base = (typeof TUNNEL_URL !== "undefined" && TUNNEL_URL ? TUNNEL_URL : "").replace(/\/+$/, "");
  if (!base) return new Response("TUNNEL_URL not configured", { status: 500 });
  var target = base + url.pathname + url.search;
  var headers = new Headers(req.headers);
  try { headers.set("Host", new URL(base).host); } catch (e) {}
  headers.delete("cf-connecting-ip");
  try {
    return await fetch(target, { method: req.method, headers: headers, body: ["GET", "HEAD"].indexOf(req.method) >= 0 ? undefined : req.body });
  } catch (e) {
    if (typeof MS_TOKEN !== "undefined" && MS_TOKEN) {
      var fb = FALLBACK_TARGET + url.pathname + url.search;
      var h2 = new Headers(req.headers);
      var clientKey = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
      h2.set("Authorization", "Bearer " + MS_TOKEN);
      if (clientKey) h2.set("x-api-key", clientKey);
      return await fetch(fb, { method: req.method, headers: h2, body: ["GET", "HEAD"].indexOf(req.method) >= 0 ? undefined : req.body });
    }
    return new Response("upstream unavailable", { status: 502 });
  }
}
