
export async function onRequestGet(context) {
  const url = new URL(context.request.url);

  const symbol = (url.searchParams.get("symbol") || "GPUS")
    .trim()
    .toUpperCase();

  if (!/^[A-Z0-9.^-]{1,15}$/.test(symbol)) {
    return Response.json(
      { error: "Invalid symbol" },
      { status: 400 }
    );
  }

  const key = context.env.MASSIVE_API_KEY;

  if (!key) {
    return Response.json(
      { error: "MASSIVE_API_KEY is missing" },
      { status: 500 }
    );
  }

  try {
    const endpoint =
      "https://api.massive.com/v2/aggs/ticker/" +
      encodeURIComponent(symbol) +
      "/prev?adjusted=true";

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${key}`
      }
    });

    const data = await response.json();

    if (!response.ok || data.status === "ERROR") {
      return Response.json(
        {
          symbol,
          error: "Market data unavailable",
          details: data.error || data.message || null
        },
        { status: response.ok ? 502 : response.status }
      );
    }

    const bar = data.results?.[0];

    if (!bar) {
      return Response.json({
        symbol,
        price: null,
        status: "NO_DATA",
        message: "No previous trading day data available"
      });
    }

    return Response.json({
      symbol,
      price: bar.c,
      open: bar.o,
      high: bar.h,
      low: bar.l,
      close: bar.c,
      volume: bar.v,
      vwap: bar.vw ?? null,
      timestamp: bar.t,
      source: "Massive",
      dataType: "previous_close",
      delayed: true,
      status: "OK"
    });

  } catch (error) {
    return Response.json(
      {
        symbol,
        error: "Failed to fetch market data"
      },
      { status: 502 }
    );
  }
}
