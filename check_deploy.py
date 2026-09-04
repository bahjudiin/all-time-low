from playwright.sync_api import sync_playwright
import json

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1280, "height": 900})

    errors = []
    page.on("console", lambda msg: errors.append(f"{msg.type}: {msg.text}"))
    page.on("pageerror", lambda err: errors.append(f"PAGE_ERROR: {err}"))

    page.goto("https://ath-atl-tracker.vercel.app/liquidations", wait_until="networkidle", timeout=15000)
    page.wait_for_timeout(10000)

    print("=== Console messages ===")
    for e in errors:
        print(e)

    # Check API response
    api_resp = page.evaluate("""async () => {
        try {
            const r = await fetch('/api/liquidations');
            const data = await r.json();
            return JSON.stringify({status: r.status, count: data.length, sample: data.slice(0,2)});
        } catch(e) { return JSON.stringify({error: String(e)}); }
    }""")
    print("\n=== API /api/liquidations ===")
    print(api_resp)

    # Test direct WS
    ws_test = page.evaluate("""() => {
        return new Promise((resolve) => {
            try {
                const ws = new WebSocket('wss://fstream.binance.com/market/!forceOrder@arr');
                const msgs = [];
                ws.onopen = () => msgs.push('OPEN');
                ws.onmessage = (e) => { msgs.push('MSG:' + e.data.substring(0,100)); ws.close(); };
                ws.onerror = (e) => msgs.push('ERROR');
                ws.onclose = () => resolve(msgs.join(' | '));
                setTimeout(() => { ws.close(); resolve(msgs.join(' | ') || 'TIMEOUT'); }, 6000);
            } catch(e) { resolve('CATCH:' + e); }
        });
    }""")
    print("\n=== Direct WS test ===")
    print(ws_test)

    # Check if page has rendered content
    body_text = page.evaluate("() => document.body.innerText.substring(0, 500)")
    print("\n=== Page text ===")
    print(body_text)

    browser.close()
