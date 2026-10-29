
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
      "https://api.massive.com/v2/last/trade/" +
      encodeURIComponent(symbol);

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

    return Response.json({
      symbol,
      price: data.results?.p ?? null,
      timestamp: data.results?.t ?? null,
      source: "Massive",
      status: data.status ?? "OK"
    });
  } catch (error) {
    return Response.json(
      { error: "Failed to fetch market data" },
      { status: 502 }
    );
  }
}
