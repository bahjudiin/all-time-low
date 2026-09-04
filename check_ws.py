from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()

    # Test various Binance WS URLs
    urls = [
        "wss://fstream.binance.com/ws/!forceOrder@arr",
        "wss://fstream.binance.com/market/!forceOrder@arr",
        "wss://fstream.binance.com/public/!forceOrder@arr",
    ]

    for url in urls:
        result = page.evaluate("""(url) => {
            return new Promise((resolve) => {
                try {
                    const ws = new WebSocket(url);
                    const msgs = [];
                    ws.onopen = () => msgs.push('OPEN');
                    ws.onmessage = (e) => { msgs.push('MSG:' + e.data.substring(0,120)); ws.close(); };
                    ws.onerror = (e) => msgs.push('ERROR');
                    ws.onclose = (e) => msgs.push('CLOSE:' + e.code);
                    setTimeout(() => { ws.close(); resolve(msgs.join(' | ') || 'TIMEOUT'); }, 5000);
                } catch(e) { resolve('CATCH:' + e); }
            });
        }""", url)
        print(f"{url}")
        print(f"  -> {result}")
        print()

    # Test Binance REST liquidation endpoint
    rest_result = page.evaluate("""async () => {
        try {
            const r = await fetch('https://fapi.binance.com/fapi/v1/allForceOrders?limit=5');
            const data = await r.json();
            return JSON.stringify({status: r.status, count: data.length, sample: data.slice(0,1)});
        } catch(e) { return JSON.stringify({error: String(e)}); }
    }""")
    print(f"Binance REST: {rest_result}")

    # Test OKX REST
    okx_result = page.evaluate("""async () => {
        try {
            const r = await fetch('https://www.okx.com/api/v5/rubik/contracts/liquidation-orders?instType=SWAP&state=filled&limit=5');
            const data = await r.json();
            return JSON.stringify({code: data.code, count: data.data?.length, sample: data.data?.slice(0,1)});
        } catch(e) { return JSON.stringify({error: String(e)}); }
    }""")
    print(f"OKX REST: {okx_result}")

    browser.close()
