'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';

// Dynamic import to avoid SSR issues with maplibre-gl
const MapView = dynamic(() => import('./components/MapView'), { ssr: false });

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      background: '#04060f',
      fontFamily: 'Inter, sans-serif',
    }}>
      {/* ─── Navbar ─── */}
      <header style={{
        position: 'relative',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        height: 64,
        background: 'rgba(4,6,15,0.96)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(99,102,241,0.5)',
            flexShrink: 0,
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
            </svg>
          </div>
          <div>
            <span style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#f1f5f9',
              letterSpacing: '-0.02em',
            }}>
              Property<span style={{ color: '#818cf8' }}>Seek</span>
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {['Map Search', 'Listings', 'Neighborhoods', 'Agents', 'Blog'].map((item, idx) => (
            <button key={item} style={{
              background: idx === 0 ? 'rgba(99,102,241,0.15)' : 'transparent',
              border: idx === 0 ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
              borderRadius: 8,
              color: idx === 0 ? '#a5b4fc' : '#64748b',
              fontSize: 13,
              fontWeight: idx === 0 ? 600 : 400,
              padding: '6px 14px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontFamily: 'Inter, sans-serif',
            }}
              onMouseEnter={e => {
                if (idx !== 0) {
                  (e.target as HTMLButtonElement).style.color = '#94a3b8';
                }
              }}
              onMouseLeave={e => {
                if (idx !== 0) {
                  (e.target as HTMLButtonElement).style.color = '#64748b';
                }
              }}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '7px 12px',
            width: 220,
            transition: 'border-color 0.2s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search city, address..."
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#f1f5f9',
                fontSize: 12,
                fontFamily: 'Inter, sans-serif',
                width: '100%',
              }}
            />
          </div>

          <button style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none',
            borderRadius: 10,
            color: 'white',
            fontSize: 13,
            fontWeight: 600,
            padding: '8px 18px',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
            fontFamily: 'Inter, sans-serif',
          }}>
            List Property
          </button>
        </div>
      </header>

      {/* ─── Hero Tag Line (floating over map) ─── */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        {/* Floating hero text */}
        <div style={{
          position: 'absolute',
          top: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 25,
          textAlign: 'center',
          pointerEvents: 'none',
        }}>
          <h1 style={{
            fontSize: 'clamp(22px, 3vw, 36px)',
            fontWeight: 900,
            color: '#f1f5f9',
            letterSpacing: '-0.04em',
            margin: 0,
            lineHeight: 1.1,
            textShadow: '0 2px 20px rgba(0,0,0,0.8)',
          }}>
            Find your perfect home
            <span style={{
              display: 'block',
              background: 'linear-gradient(90deg, #6366f1, #a78bfa, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              across Canada
            </span>
          </h1>
        </div>

        {/* Map */}
        <MapView />
      </div>

      {/* ─── Bottom Stats Bar ─── */}
      <div style={{
        position: 'relative',
        zIndex: 40,
        height: 52,
        background: 'rgba(4,6,15,0.96)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        backdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 48,
        flexShrink: 0,
      }}>
        {[
          { value: '50', label: 'Active Listings' },
          { value: '12', label: 'Cities' },
          { value: '$319K–$2.15M', label: 'Price Range' },
          { value: '100%', label: 'Verified Properties' },
        ].map(({ value, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ color: '#818cf8', fontSize: 15, fontWeight: 800, fontFamily: 'Inter, sans-serif' }}>{value}</span>
            <span style={{ color: '#475569', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>{label}</span>
          </div>
        ))}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
      `}</style>
    </div>
  );
}
