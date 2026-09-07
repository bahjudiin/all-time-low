"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";

const FEATURES = [
  {
    icon: "◎",
    title: "ATH / ATL Tracking",
    desc: "Real-time all-time high and all-time low detection across 250+ assets.",
  },
  {
    icon: "⚡",
    title: "Liquidation Engine",
    desc: "Live liquidation stream from Binance, OKX & Bybit with history charts.",
  },
  {
    icon: "◉",
    title: "Predictive Signals",
    desc: "Multi-factor scoring engine that flags momentum shifts before they happen.",
  },
  {
    icon: "△",
    title: "Over/Under Valued",
    desc: "Fair-value analysis comparing spot price to fundamentals and trend data.",
  },
];

const STATS = [
  { value: "250+", label: "Assets" },
  { value: "3", label: "Exchanges" },
  { value: "<1s", label: "Latency" },
  { value: "24/7", label: "Live" },
];

function AnimatedCounter({ target }: { target: string }) {
  const [display, setDisplay] = useState("0");
  useEffect(() => {
    const num = parseInt(target.replace(/[^0-9]/g, ""));
    if (isNaN(num)) { setDisplay(target); return; }
    let start = 0;
    const duration = 1200;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setDisplay(String(Math.round(ease * num)));
      if (p < 1) requestAnimationFrame(step);
      else setDisplay(target);
    };
    requestAnimationFrame(step);
  }, [target]);
  return <span>{display}</span>;
}

export function LandingPage() {
  const [visible, setVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisible(true);
  }, []);

  return (
    <div className="landing-root">
      {/* Nav */}
      <nav className={`landing-nav ${visible ? "show" : ""}`}>
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <span className="landing-logo-icon">◈</span>
            <span className="landing-logo-text">ATH/ATL</span>
          </div>
          <Link href="/dashboard" className="landing-nav-cta">
            Open Dashboard →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="landing-hero" ref={heroRef}>
        <div className="landing-hero-glow" />
        <div className={`landing-hero-content ${visible ? "show" : ""}`}>
          <div className="landing-hero-badge">Crypto Intelligence Terminal</div>
          <h1 className="landing-hero-title">
            <span className="landing-hero-line1">Every coin.</span>
            <span className="landing-hero-line2">
              Every <span className="landing-gradient-text">extreme</span>.
            </span>
            <span className="landing-hero-line3">In real time.</span>
          </h1>
          <p className="landing-hero-sub">
            Track ATH/ATL breakouts, liquidation cascades, and momentum
            shifts across Binance, OKX & Bybit — live.
          </p>
          <div className="landing-hero-actions">
            <Link href="/dashboard" className="landing-btn-primary">
              Launch Dashboard
            </Link>
            <a href="#features" className="landing-btn-ghost">
              See Features
            </a>
          </div>
        </div>

        {/* Stats bar */}
        <div className={`landing-stats ${visible ? "show" : ""}`}>
          {STATS.map((s) => (
            <div key={s.label} className="landing-stat">
              <div className="landing-stat-value">
                <AnimatedCounter target={s.value} />
              </div>
              <div className="landing-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="landing-features" id="features">
        <div className="landing-section-header">
          <h2 className="landing-section-title">Built for speed</h2>
          <p className="landing-section-sub">
            Every feature designed for traders who need information now, not later.
          </p>
        </div>
        <div className="landing-feature-grid">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="landing-feature-card"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="landing-feature-icon">{f.icon}</div>
              <h3 className="landing-feature-title">{f.title}</h3>
              <p className="landing-feature-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Terminal-style CTA */}
      <section className="landing-terminal-section">
        <div className="landing-terminal">
          <div className="landing-terminal-bar">
            <span className="landing-terminal-dot red" />
            <span className="landing-terminal-dot yellow" />
            <span className="landing-terminal-dot green" />
          </div>
          <div className="landing-terminal-body">
            <div className="landing-terminal-line">
              <span className="landing-terminal-prompt">$</span>
              <span className="landing-terminal-cmd">ath-atl tracker</span>
              <span className="landing-terminal-cursor" />
            </div>
            <div className="landing-terminal-line dim">
              <span className="landing-terminal-prompt">→</span>
              <span>Fetching 250 coins from CoinGecko...</span>
            </div>
            <div className="landing-terminal-line dim">
              <span className="landing-terminal-prompt">→</span>
              <span>Streaming liquidations from 3 exchanges...</span>
            </div>
            <div className="landing-terminal-line dim">
              <span className="landing-terminal-prompt">→</span>
              <span>Running predictive signal engine...</span>
            </div>
            <div className="landing-terminal-line accent">
              <span className="landing-terminal-prompt">✓</span>
              <span>All systems live. Welcome.</span>
            </div>
          </div>
        </div>
        <div className="landing-terminal-cta">
          <Link href="/dashboard" className="landing-btn-primary large">
            Start Exploring
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="landing-footer-brand">
            <span className="landing-logo-icon">◈</span> ATH/ATL Tracker
          </div>
          <div className="landing-footer-meta">
            Real-time crypto intelligence · Open source
          </div>
        </div>
      </footer>
    </div>
  );
}
