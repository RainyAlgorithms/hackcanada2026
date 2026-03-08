'use client'

import { useState, useEffect } from "react";
import Image from "next/image";
import './styles/landing.css';
import {
  ArrowRight,
  HomeIcon,
  CalculatorIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CheckIcon
} from '@/components/icons';
import { features, steps, problems } from './data/landing-data';



export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'Georgia', 'Times New Roman', serif", backgroundColor: "#fafaf8", color: "#1a1a1a", overflowX: "hidden" }}>

      {/* ── TOP ACTIONS ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
        borderBottom: scrolled ? "1px solid var(--border)" : "1px solid transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "all 0.3s ease",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 68, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <a href="/" style={{ display: "inline-flex", alignItems: "center" }} aria-label="Go to homepage">
            <Image
              src="/image.png"
              alt="HomeWay logo"
              width={140}
              height={100}
              priority
              style={{ width: "auto", height: 54, objectFit: "contain" }}
            />
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a
              href="#"
              className="btn-secondary"
              style={{ minHeight: 44, padding: "11px 20px", justifyContent: "center", whiteSpace: "nowrap" }}
            >
              Login
            </a>
            <a
              href="#"
              className="btn-primary"
              style={{ minHeight: 44, padding: "11px 20px", justifyContent: "center", whiteSpace: "nowrap" }}
            >
              Sign up
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{ paddingTop: 120, paddingBottom: 80, background: "linear-gradient(160deg, #f0f7f3 0%, #fafaf8 50%, #faf7f0 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div className="hero-layout" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>

            {/* Left */}
            <div className="animate-fadeup">
              <div className="hero-badge animate-fadeup delay-1">
                <span style={{ width: 6, height: 6, background: "var(--primary)", borderRadius: "50%", display: "inline-block" }} />
                AI-Powered Home Buying Platform
              </div>

              <h1 className="font-display animate-fadeup delay-2" style={{ fontSize: "clamp(2.2rem, 4vw, 3.4rem)", fontWeight: 800, lineHeight: 1.1, letterSpacing: "-0.02em", marginBottom: 20 }}>
                Smart Home Search<br />
                <span style={{ color: "var(--primary)" }}>Powered by Data</span>
              </h1>

              <p className="font-body animate-fadeup delay-3" style={{ fontSize: "1.05rem", color: "var(--text-muted)", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
                An intelligent platform that combines real-time property data, advanced financial analytics, and interactive mapping to streamline your home buying journey.
              </p>

              <div className="hero-btns animate-fadeup delay-4" style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 44 }}>
                <a href="/Budget-planner" className="btn-primary">Start Planning Free <ArrowRight size={16} /></a>
                <a href="/mapview" className="btn-secondary">Browse Homes</a>
              </div>

              {/* Problem lines */}
              <div className="animate-fadeup delay-5" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "All your home buying tools unified in one intelligent platform",
                  "Real-time data analysis for smarter, faster decisions",
                ].map((line, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ color: "var(--primary)", marginTop: 3, flexShrink: 0 }}><CheckIcon /></span>
                    <span className="font-body" style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>{line}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — image */}
            <div className="hero-image-col" style={{ position: "relative" }}>
              <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.12)" }}>
                <img
                  src="/family.jpg"
                  alt="Family in front of a house"
                  style={{ width: "100%", height: 520, objectFit: "cover", display: "block" }}
                />
              </div>

              {/* Floating card */}
              <div style={{
                position: "absolute", bottom: 32, left: -32,
                background: "white", borderRadius: 14, padding: "16px 20px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                display: "flex", alignItems: "center", gap: 14, minWidth: 220
              }}>
                <div style={{ width: 44, height: 44, background: "var(--primary-pale)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ color: "var(--primary)" }}><CalculatorIcon /></span>
                </div>
                <div>
                  <div className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)" }}>$1,847/mo</div>
                  <div className="font-body" style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Estimated payment</div>
                </div>
              </div>

              {/* Decorative bg shape */}
              <div style={{ position: "absolute", top: -16, right: -16, width: "100%", height: "100%", borderRadius: 20, background: "var(--primary-pale)", zIndex: -1 }} />
            </div>
          </div>
        </div>
      </section>

      {/* ── THE PROBLEM ── */}
      <section style={{ background: "white", borderTop: "1px solid var(--border)", padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="divider-line" style={{ margin: "0 auto 20px" }} />
            <h2 className="font-display" style={{ fontSize: "clamp(1.6rem, 3vw, 2.4rem)", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 12 }}>
              Why Traditional Home Buying Fails
            </h2>
            <p className="font-body" style={{ fontSize: "1rem", color: "var(--text-muted)", maxWidth: 500, margin: "0 auto", lineHeight: 1.7 }}>
              Fragmented tools, manual processes, and outdated systems create inefficiency and uncertainty.
            </p>
          </div>
          <div className="grid-3">
            {problems.map((p, i) => (
              <div key={i} className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.2rem", marginBottom: 16 }}>{p.icon}</div>
                <h3 className="font-display" style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 10, color: "var(--text)" }}>{p.title}</h3>
                <p className="font-body" style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section style={{ padding: "88px 24px", background: "var(--surface-alt)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ marginBottom: 56, maxWidth: 560 }}>
            <div className="divider-line" />
            <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: 14, letterSpacing: "-0.02em" }}>
              Powerful Features in One Platform
            </h2>
            <p className="font-body" style={{ fontSize: "1rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
              Advanced tools and integrations that transform how you search, analyze, and purchase property.
            </p>
          </div>

          <div className="grid-3">
            {features.map((feature, i) => (
              <div key={feature.title} className="feature-card animate-fadeup" style={{ animationDelay: `${i * 0.08}s` }}>
                <div style={{ width: 48, height: 48, background: "var(--primary-pale)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: "var(--primary)" }}>
                  <feature.icon />
                </div>
                <h3 className="font-display" style={{ fontSize: "1rem", fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>{feature.title}</h3>
                <p className="font-body" style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "88px 24px", background: "white" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56, maxWidth: 520, margin: "0 auto 56px" }}>
            <div className="divider-line" style={{ margin: "0 auto 20px" }} />
            <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 700, lineHeight: 1.2, marginBottom: 14, letterSpacing: "-0.02em" }}>
              How HomeWay Works
            </h2>
            <p className="font-body" style={{ fontSize: "1rem", color: "var(--text-muted)", lineHeight: 1.7 }}>
              Four clear steps from financial clarity to keys in your hand.
            </p>
          </div>

          <div className="grid-4">
            {steps.map((step, i) => (
              <div key={step.number} className="step-card">
                <div className="font-display" style={{ fontSize: "3.5rem", fontWeight: 800, color: "#eeede8", lineHeight: 1, position: "absolute", top: 20, right: 24 }}>{step.number}</div>
                <div style={{ width: 44, height: 44, background: "var(--primary)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20, color: "white", position: "relative" }}>
                  <step.icon />
                </div>
                <h4 className="font-display" style={{ fontSize: "0.95rem", fontWeight: 700, marginBottom: 8, color: "var(--text)" }}>{step.title}</h4>
                <p className="font-body" style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.65 }}>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OUR ANSWER ── */}
      <section style={{ padding: "88px 24px", background: "var(--surface-alt)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
          <div className="divider-line" style={{ margin: "0 auto 20px" }} />
          <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)", fontWeight: 700, lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 20 }}>
            Built for the Modern Home Buyer
          </h2>
          <p className="font-body" style={{ fontSize: "1.05rem", color: "var(--text-muted)", lineHeight: 1.8, maxWidth: 680, margin: "0 auto 40px" }}>
            HomeWay centralizes property search, financial analysis, and market intelligence into a single, powerful platform. Using advanced algorithms and real-time data integration, we eliminate the complexity of home buying by automating calculations, aggregating listings, and providing actionable insights at every step.
          </p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 16 }}>
            {["Automated financial modeling", "Live market data integration", "Centralized workflow management"].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, background: "white", border: "1px solid var(--border)", borderRadius: 100, padding: "10px 18px" }}>
                <span style={{ color: "var(--primary)" }}><CheckIcon /></span>
                <span className="font-body" style={{ fontSize: "0.85rem", color: "var(--text)", fontWeight: 500 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "32px 24px 80px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            background: "linear-gradient(135deg, #0f3d28 0%, #1e6b4a 50%, #0f3d28 100%)",
            borderRadius: 24, padding: "clamp(40px, 6vw, 72px) clamp(28px, 5vw, 64px)",
            position: "relative", overflow: "hidden"
          }}>
            {/* Decorative circles */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
            <div style={{ position: "absolute", bottom: -40, left: 160, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.03)" }} />

            <div style={{ position: "relative", zIndex: 1, maxWidth: 540 }}>
              <div className="hero-badge" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)" }}>
                <span style={{ width: 6, height: 6, background: "#5cd896", borderRadius: "50%", display: "inline-block" }} />
                Free to get started
              </div>
              <h2 className="font-display" style={{ fontSize: "clamp(1.7rem, 3vw, 2.6rem)", fontWeight: 700, color: "white", lineHeight: 1.15, marginBottom: 14, letterSpacing: "-0.02em" }}>
                Experience the Future of Home Buying
              </h2>
              <p className="font-body" style={{ color: "rgba(255,255,255,0.7)", fontSize: "1rem", lineHeight: 1.7, marginBottom: 32 }}>
                Join thousands of smart buyers using HomeWay's data-driven platform to find, analyze, and secure their perfect home faster than ever before.
              </p>

              <div className="cta-buttons" style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "white", color: "var(--primary)", fontWeight: 700, fontSize: "0.9rem", borderRadius: 10, textDecoration: "none", fontFamily: "'DM Sans', sans-serif", transition: "transform 0.15s", letterSpacing: "0.01em" }}>
                  Get Started Free <ArrowRight size={16} />
                </a>
                <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "transparent", color: "white", fontWeight: 600, fontSize: "0.9rem", borderRadius: 10, textDecoration: "none", border: "1.5px solid rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif", transition: "background 0.2s", letterSpacing: "0.01em" }}>
                  Schedule a Demo
                </a>
              </div>

              {/* Checklist */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 20px", marginTop: 24 }}>
                {["No credit card required", "Setup in under 5 minutes", "Cancel anytime"].map(item => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#5cd896" }}><CheckIcon /></span>
                    <span className="font-body" style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.8rem" }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ background: "#f4f4f0", borderTop: "1px solid var(--border)", padding: "64px 24px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="grid-footer">
            {/* Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <div style={{ width: 30, height: 30, background: "var(--primary)", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <HomeIcon />
                </div>
                <span className="font-display" style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--text)" }}>HomeWay</span>
              </div>
              <p className="font-body" style={{ fontSize: "0.85rem", color: "var(--text-muted)", lineHeight: 1.7, maxWidth: 240 }}>
                Empowering first-time homebuyers with smart planning tools and personalized guidance.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-body" style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Product</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {["Features", "How It Works", "Pricing", "Blog"].map(link => (
                  <li key={link}><a href="#" className="nav-link" style={{ fontSize: "0.875rem" }}>{link}</a></li>
                ))}
              </ul>
            </div>

            {/* Resources */}
            <div>
              <h4 className="font-body" style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Resources</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
                {["Mortgage Calculator", "Budget Planner", "Help Center", "FAQs"].map(link => (
                  <li key={link}><a href="#" className="nav-link" style={{ fontSize: "0.875rem" }}>{link}</a></li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-body" style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.06em" }}>Contact</h4>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12 }}>
                <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "var(--text-light)" }}><MailIcon /></span>
                  <span className="font-body" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>contact@homeway.com</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "var(--text-light)" }}><PhoneIcon /></span>
                  <span className="font-body" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>1-800-HOME-WAY</span>
                </li>
                <li style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "var(--text-light)" }}><MapPinIcon /></span>
                  <span className="font-body" style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>San Francisco, CA</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom */}
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
            <p className="font-body" style={{ fontSize: "0.8rem", color: "var(--text-light)" }}>© 2026 HomeWay. All rights reserved.</p>
            <div style={{ display: "flex", gap: 20 }}>
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(link => (
                <a key={link} href="#" className="nav-link" style={{ fontSize: "0.8rem" }}>{link}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}