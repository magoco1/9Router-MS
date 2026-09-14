// ModelScope Studio keep-alive — human-like, low-frequency, fully irregular.
// ~8-20 lightweight localhost hits per ~15h window: random 30-90 min gaps +
// 0-15 min jitter, rotating endpoints and real browser User-Agents.
// No fixed pattern, no external traffic, minimal logging.
const PORT = process.env.PORT || "7860";
const BASE = "http://127.0.0.1:" + PORT;
const PATHS = ["/api/health", "/api/health", "/api/health", "/", "/api/version"];
const UAS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];
const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[rand(0, arr.length - 1)];
// 30-90 min + 0-15 min jitter  =>  ~8-20 hits per 15h
const nextDelay = () => (rand(30, 90) * 60 + rand(0, 15) * 60) * 1000;
async function ping() {
  const path = pick(PATHS);
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 20000);
    await fetch(BASE + path, { headers: { "User-Agent": pick(UAS), Accept: "*/*" }, signal: ctl.signal });
    clearTimeout(t);
  } catch {}
  setTimeout(ping, nextDelay());
}
console.log("[keep-alive] armed, first ping in random 5-40 min (human-like schedule)");
// First hit after a random 5-40 min (avoid boot-spike pattern).
setTimeout(ping, rand(5, 40) * 60 * 1000);
