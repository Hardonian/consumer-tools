import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const script = `(function() {
  if (window.InboxExorcistWidget) return;
  window.InboxExorcistWidget = true;

  const btn = document.createElement("div");
  btn.id = "inbox-exorcist-floating-btn";
  btn.innerHTML = \`
    <a href="https://inboxexorcist.com/demo" target="_blank" rel="noopener noreferrer" style="
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 999999;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #090a0f;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      border-radius: 9999px;
      box-shadow: 0 8px 24px rgba(245, 158, 11, 0.35);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      cursor: pointer;
    ">
      <span>🕯️</span>
      <span>Exorcise Gmail Noise</span>
    </a>
  \`;

  document.body.appendChild(btn);
})();`;

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
