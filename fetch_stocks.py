import json
import os
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API_KEY = os.environ.get("FINNHUB_API_KEY")
if not API_KEY:
    raise RuntimeError("FINNHUB_API_KEY secret is missing")

SYMBOLS = ["AAPL", "MSFT", "NVDA", "AMD", "TSLA"]

def get_quote(symbol):
    params = urllib.parse.urlencode({
        "symbol": symbol,
        "token": API_KEY
    })
    url = "https://finnhub.io/api/v1/quote?" + params
    request = urllib.request.Request(
        url, headers={"User-Agent": "NasdaqRadarPro/6.0"}
    )
    with urllib.request.urlopen(request, timeout=20) as response:
        data = json.load(response)

    if not data.get("c") or not data.get("t"):
        raise ValueError(f"No valid quote for {symbol}")

    return {
        "symbol": symbol,
        "price": data["c"],
        "change_percent": data.get("dp"),
        "previous_close": data.get("pc"),
        "quote_timestamp": data["t"]
    }

def main():
    results = []
    for symbol in SYMBOLS:
        try:
            results.append(get_quote(symbol))
            print(f"OK: {symbol}")
        except Exception as error:
            print(f"ERROR: {symbol}: {error}")

    if not results:
        raise RuntimeError("No quotes retrieved")

    output = {
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "Finnhub",
        "stocks": results
    }
    Path("data").mkdir(exist_ok=True)
    Path("data/stocks.json").write_text(
        json.dumps(output, ensure_ascii=False, indent=2),
        encoding="utf-8"
    )
    print(f"Saved {len(results)} stocks")

if __name__ == "__main__":
    main()
