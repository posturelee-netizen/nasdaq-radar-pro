
export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const symbol = (url.searchParams.get("symbol") || "").toUpperCase();

  if (!/^[A-Z0-9.^-]{1,15}$/.test(symbol)) {
    return Response.json({ error: "Invalid symbol" }, { status: 400 });
  }

  return Response.json({
    symbol,
    status: "api_ready",
    message: "Cloudflare API route is working. Market data is not connected yet."
  });
}
