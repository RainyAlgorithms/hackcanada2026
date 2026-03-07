'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface Property {
  property_id: string
  list_price?: number
  listing_id: string
  status: string
  photo?: string
  open_house?: string | null
  address: { street_number: string; street: string; unit?: string | null; city: string; state_code: string; postal_code: string; latitude: number; longitude: number }
  description?: { beds?: number; baths?: number; sqft_living?: number; lot_size?: number; year_built?: number; property_type?: string }
  agent?: { name: string; office: string }
}

interface UserProfile {
  annual_income: number | null
  monthly_spending: number | null
  city: string | null
  price_min: number | null
  price_max: number | null
}

const fmt = (n?: number) => n != null ? `$${n.toLocaleString('en-CA')}` : 'Price N/A'
const fmtSqft = (n?: number) => n != null ? `${n.toLocaleString()} sq ft` : null

function calcMaxPrice(profile: UserProfile): number {
  if (profile.price_max && profile.price_max > 0) return profile.price_max
  if (profile.monthly_spending && profile.monthly_spending > 0)
    return Math.min(Math.round((profile.monthly_spending * 200) / 50000) * 50000, 2500000)
  if (profile.annual_income && profile.annual_income > 0)
    return Math.min(Math.round((profile.annual_income * 5) / 50000) * 50000, 2500000)
  return 2500000
}

// ── Styles ────────────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: 'var(--bg)',
  border: '1px solid var(--border)', borderRadius: '9px', fontSize: '15px',
  fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)', outline: 'none'
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
  marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em'
}
const prefixStyle: React.CSSProperties = {
  position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)',
  color: 'var(--text-muted)', fontSize: '14px', pointerEvents: 'none'
}

// ── Auth Modal ────────────────────────────────────────────────────────────────
function AuthModal({ onClose, onAuth }: { onClose: () => void; onAuth: (u: User, isNewUser: boolean) => void }) {
  const supabase = createClient()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const submit = async () => {
    setError(''); setSuccess(''); setLoading(true)
    try {
      if (mode === 'signup') {
        const { data, error: e } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } })
        if (e) throw e
        if (data.user?.identities?.length === 0) {
          setError('An account with this email already exists. Please sign in instead.')
          setMode('login')
        } else if (data.user && !data.session) {
          setSuccess('Check your email to confirm your account!')
        } else if (data.user && data.session) {
          onAuth(data.user, true)
        }
      } else {
        const { data, error: e } = await supabase.auth.signInWithPassword({ email, password })
        if (e) throw e
        if (data.user) onAuth(data.user, false)
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'An error occurred')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-backdrop animate-fadeIn" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,15,14,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={onClose}>
      <div className="animate-scaleIn" style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }} onClick={e => e.stopPropagation()}>
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px' }}>MapleEstate AI</span>
          </div>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '26px', lineHeight: 1.2 }}>{mode === 'login' ? 'Welcome back' : 'Create account'}</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>{mode === 'login' ? 'Sign in to access AI-powered insights' : 'Get started with Canadian real estate AI'}</p>
        </div>
        <div style={{ display: 'flex', background: 'var(--bg-deep)', borderRadius: '8px', padding: '3px', marginBottom: '24px' }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); setSuccess('') }} style={{ flex: 1, padding: '7px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'DM Sans, sans-serif', transition: 'all 0.2s', background: mode === m ? 'var(--bg-card)' : 'transparent', color: mode === m ? 'var(--text-primary)' : 'var(--text-secondary)', boxShadow: mode === m ? 'var(--shadow)' : 'none' }}>{m === 'login' ? 'Sign in' : 'Sign up'}</button>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {mode === 'signup' && <input placeholder="Full name" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />}
          <input type="email" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} onKeyDown={e => e.key === 'Enter' && submit()} />
          <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} style={inputStyle} onKeyDown={e => e.key === 'Enter' && submit()} />
        </div>
        {error && <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: '13px' }}>{error}</div>}
        {success && <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: '#F0FDF4', border: '1px solid #BBF7D0', color: '#15803D', fontSize: '13px' }}>{success}</div>}
        <button onClick={submit} disabled={loading} style={{ width: '100%', marginTop: '20px', padding: '12px', background: loading ? 'var(--text-muted)' : 'var(--accent)', color: 'white', border: 'none', borderRadius: '9px', fontSize: '15px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button>
        <button onClick={onClose} style={{ width: '100%', marginTop: '10px', padding: '10px', background: 'transparent', color: 'var(--text-secondary)', border: 'none', borderRadius: '9px', fontSize: '14px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Continue browsing</button>
      </div>
    </div>
  )
}

// ── Onboarding Modal ──────────────────────────────────────────────────────────
const PROVINCES = ['AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT']
const PROVINCE_NAMES: Record<string,string> = { AB:'Alberta', BC:'British Columbia', MB:'Manitoba', NB:'New Brunswick', NL:'Newfoundland', NS:'Nova Scotia', NT:'Northwest Territories', NU:'Nunavut', ON:'Ontario', PE:'Prince Edward Island', QC:'Quebec', SK:'Saskatchewan', YT:'Yukon' }

function OnboardingModal({ user, onComplete }: { user: User; onComplete: (profile: UserProfile) => void }) {
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ annual_income: '', monthly_budget: '', price_min: '', price_max: '', city: '', province: '' })
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setLoading(true)
    const profile: UserProfile = {
      annual_income: form.annual_income ? Number(form.annual_income.replace(/,/g, '')) : null,
      monthly_spending: form.monthly_budget ? Number(form.monthly_budget.replace(/,/g, '')) : null,
      city: form.city.trim() || null,
      price_min: form.price_min ? Number(form.price_min.replace(/,/g, '')) : null,
      price_max: form.price_max ? Number(form.price_max.replace(/,/g, '')) : null,
    }
    try {
      await supabase.from('users').upsert({
        id: user.id, email: user.email,
        full_name: user.user_metadata?.full_name ?? '',
        annual_income: profile.annual_income,
        monthly_spending: profile.monthly_spending,
        city: profile.city,
        price_min: profile.price_min,
        price_max: profile.price_max,
      }, { onConflict: 'id' })
    } catch (e) { console.error('Profile save error:', e) }
    setLoading(false)
    onComplete(profile) // ← pass data directly, no re-fetch needed
  }

  const steps = [
    {
      icon: '💰', title: 'Your finances', subtitle: 'Help us find properties that fit your budget',
      fields: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>Annual household income</label>
            <div style={{ position: 'relative' }}><span style={prefixStyle}>$</span><input placeholder="e.g. 95,000" value={form.annual_income} onChange={e => set('annual_income', e.target.value)} style={{ ...inputStyle, paddingLeft: '28px' }} /></div>
          </div>
          <div>
            <label style={labelStyle}>Monthly mortgage / housing budget</label>
            <div style={{ position: 'relative' }}><span style={prefixStyle}>$</span><input placeholder="e.g. 2,500" value={form.monthly_budget} onChange={e => set('monthly_budget', e.target.value)} style={{ ...inputStyle, paddingLeft: '28px' }} /></div>
          </div>
        </div>
      )
    },
    {
      icon: '🏠', title: 'Price range', subtitle: 'What range of homes are you looking at?',
      fields: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div><label style={labelStyle}>Minimum</label><div style={{ position: 'relative' }}><span style={prefixStyle}>$</span><input placeholder="e.g. 400,000" value={form.price_min} onChange={e => set('price_min', e.target.value)} style={{ ...inputStyle, paddingLeft: '28px' }} /></div></div>
            <div><label style={labelStyle}>Maximum</label><div style={{ position: 'relative' }}><span style={prefixStyle}>$</span><input placeholder="e.g. 800,000" value={form.price_max} onChange={e => set('price_max', e.target.value)} style={{ ...inputStyle, paddingLeft: '28px' }} /></div></div>
          </div>
          <div style={{ padding: '10px 14px', background: 'var(--accent-light)', borderRadius: '8px', fontSize: '12px', color: 'var(--accent)' }}>
            💡 Rule of thumb: home price = 4–5× your annual income
            {form.annual_income && Number(form.annual_income.replace(/,/g,'')) > 0 && <span style={{ fontWeight: 700 }}>{' '}— for you: ${(Number(form.annual_income.replace(/,/g,'')) * 4).toLocaleString('en-CA')}–${(Number(form.annual_income.replace(/,/g,'')) * 5).toLocaleString('en-CA')}</span>}
          </div>
        </div>
      )
    },
    {
      icon: '📍', title: 'Where are you looking?', subtitle: 'Your current location and target market',
      fields: (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={labelStyle}>City you&apos;re searching in</label>
            <input placeholder="e.g. Toronto, Vancouver, Calgary…" value={form.city} onChange={e => set('city', e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Province</label>
            <select value={form.province} onChange={e => set('province', e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
              <option value="">Select province…</option>
              {PROVINCES.map(p => <option key={p} value={p}>{PROVINCE_NAMES[p]} ({p})</option>)}
            </select>
          </div>
        </div>
      )
    }
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className="auth-backdrop animate-fadeIn" style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15,15,14,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="animate-scaleIn" style={{ background: 'var(--bg-card)', borderRadius: '18px', padding: '40px', width: '100%', maxWidth: '440px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
          {steps.map((_, i) => <div key={i} style={{ height: '3px', flex: 1, borderRadius: '99px', background: i <= step ? 'var(--accent)' : 'var(--border)', transition: 'background 0.3s' }} />)}
        </div>
        <div style={{ marginBottom: '28px' }}>
          <div style={{ fontSize: '32px', marginBottom: '10px' }}>{current.icon}</div>
          <h2 style={{ fontFamily: 'DM Serif Display, serif', fontSize: '24px', marginBottom: '4px' }}>{current.title}</h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>{current.subtitle}</p>
        </div>
        {current.fields}
        <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
          {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ flex: 1, padding: '11px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '9px', fontSize: '14px', fontWeight: 500, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer', color: 'var(--text-secondary)' }}>Back</button>}
          <button onClick={isLast ? save : () => setStep(s => s + 1)} disabled={loading} style={{ flex: 2, padding: '11px', background: loading ? 'var(--text-muted)' : 'var(--accent)', color: 'white', border: 'none', borderRadius: '9px', fontSize: '14px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Saving…' : isLast ? 'Finish setup' : 'Continue'}</button>
        </div>
        <button onClick={() => onComplete({ annual_income: null, monthly_spending: null, city: null, price_min: null, price_max: null })} style={{ width: '100%', marginTop: '8px', padding: '9px', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'DM Sans, sans-serif' }}>Skip for now</button>
      </div>
    </div>
  )
}

// ── Property Card ─────────────────────────────────────────────────────────────
function PropertyCard({ p, selected, onClick }: { p: Property, selected: boolean, onClick: () => void }) {
  return (
    <div onClick={onClick} style={{ background: selected ? 'var(--accent-light)' : 'var(--bg-card)', border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border)'}`, borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', overflow: 'hidden', boxShadow: selected ? '0 0 0 3px rgba(200,67,10,0.12)' : 'var(--shadow)' }}>
      {p.photo && <div style={{ height: '140px', overflow: 'hidden' }}><img src={p.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} loading="lazy" /></div>}
      <div style={{ padding: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '18px', color: 'var(--accent)', lineHeight: 1 }}>{fmt(p.list_price)}</span>
          {p.open_house && <span style={{ fontSize: '10px', fontWeight: 600, background: '#FEF3C7', color: '#92400E', padding: '2px 7px', borderRadius: '99px', border: '1px solid #FDE68A' }}>OPEN HOUSE</span>}
        </div>
        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>{p.address.street_number} {p.address.street}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>{p.address.city}, {p.address.state_code}</div>
        {p.description && (
          <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)' }}>
            {p.description.beds && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BedIcon /> {p.description.beds} bd</span>}
            {p.description.baths && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><BathIcon /> {p.description.baths} ba</span>}
            {p.description.sqft_living && <span>{fmtSqft(p.description.sqft_living)}</span>}
          </div>
        )}
      </div>
    </div>
  )
}

const BedIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 9V5a2 2 0 012-2h16a2 2 0 012 2v4M2 9h20M2 9v10M22 9v10M2 19h20"/></svg>
const BathIcon = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 12h16M4 12a2 2 0 01-2-2V6a2 2 0 012-2h4v8M20 12v2a6 6 0 01-6 6H10a6 6 0 01-6-6v-2"/></svg>

// ── AI Chat Panel ─────────────────────────────────────────────────────────────
function AIChatPanel({ user, property, onClose }: { user: User | null; property: Property | null; onClose: () => void }) {
  const [messages, setMessages] = useState<{ role: 'user'|'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const systemPrompt = property
    ? `You are MapleEstate AI, a helpful Canadian real estate assistant. The user is viewing: ${property.address.street_number} ${property.address.street}, ${property.address.city}, ${property.address.state_code}. Price: ${fmt(property.list_price)}. Beds: ${property.description?.beds}, Baths: ${property.description?.baths}, Sqft: ${property.description?.sqft_living}, Year Built: ${property.description?.year_built}. Agent: ${property.agent?.name} at ${property.agent?.office}. Be concise and helpful.`
    : `You are MapleEstate AI, a helpful Canadian real estate assistant. Help users explore Canadian properties, understand market trends, and make informed decisions. Be concise and helpful.`

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim(); setInput('')
    const newMessages = [...messages, { role: 'user' as const, content: userMsg }]
    setMessages(newMessages); setLoading(true)
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: systemPrompt, messages: newMessages }) })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.content?.[0]?.text ?? 'Sorry, no response.' }])
    } catch { setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to AI.' }]) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '360px', height: '480px', background: 'var(--bg-card)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', zIndex: 100, animation: 'scaleIn 0.3s ease both' }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, var(--accent), #E8650F)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>MapleEstate AI</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{property ? property.address.city : 'Canada-wide insights'}</div>
          </div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: '40px' }}>
            <div style={{ fontSize: '28px', marginBottom: '10px' }}>🍁</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{property ? 'Ask me about this property' : 'Ask about any Canadian property'}</div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Market trends · Neighbourhood insights · Investment analysis</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{ maxWidth: '85%', padding: '9px 13px', borderRadius: '11px', fontSize: '13px', lineHeight: '1.5', background: m.role === 'user' ? 'var(--accent)' : 'var(--bg-deep)', color: m.role === 'user' ? 'white' : 'var(--text-primary)', borderBottomRightRadius: m.role === 'user' ? '3px' : '11px', borderBottomLeftRadius: m.role === 'user' ? '11px' : '3px' }}>{m.content}</div>
          </div>
        ))}
        {loading && <div style={{ display: 'flex' }}><div style={{ padding: '9px 14px', borderRadius: '11px', background: 'var(--bg-deep)' }}><span style={{ display: 'flex', gap: '4px' }}>{[0,1,2].map(i => <span key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: `fadeUp 0.8s ease ${i*0.2}s infinite alternate` }}/>)}</span></div></div>}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Ask about this property…" style={{ flex: 1, padding: '9px 13px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)', outline: 'none' }} />
        <button onClick={send} disabled={loading || !input.trim()} style={{ padding: '9px 14px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', opacity: loading || !input.trim() ? 0.5 : 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  )
}

// ── Main Home Component ───────────────────────────────────────────────────────
export default function Home() {
  const supabase = createClient()
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const markersRef = useRef<mapboxgl.Marker[]>([])

  const [user, setUser] = useState<User | null>(null)
  const [showAuth, setShowAuth] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [properties, setProperties] = useState<Property[]>([])
  const [selected, setSelected] = useState<Property | null>(null)
  const [showChat, setShowChat] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [cityFilter, setCityFilter] = useState('All')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(2500000)
  const [inventoryStats, setInventoryStats] = useState({ count: 0, change: 0, label: '' })
  const [mapLoaded, setMapLoaded] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Takes a profile and the current property list and sets filters directly
  const applyProfile = useCallback((profile: UserProfile, props: Property[]) => {
    if (profile.city) {
      const cityInput = profile.city.trim().toLowerCase()
      const match = props.find(p => p.address.city.toLowerCase() === cityInput)
      if (match) {
        setCityFilter(match.address.city)
      }
    }
    if (profile.price_min && profile.price_min > 0) setMinPrice(profile.price_min)
    const max = calcMaxPrice(profile)
    if (max < 2500000) setMaxPrice(max)
  }, [])

  // Auth listener
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  // Load listings
  useEffect(() => {
    fetch('/listings.json').then(r => r.json()).then(d => setProperties(d.data?.properties ?? [])).catch(() => {})
  }, [])

  // Load inventory stats
  useEffect(() => {
    fetch('/api/inventory').then(r => r.json()).then(d => setInventoryStats(d)).catch(() => setInventoryStats({ count: 24812, change: 4.8, label: 'Homes for Sale (Canada)' }))
  }, [])

  // When an existing user logs in AND properties are loaded, fetch + apply their profile
  useEffect(() => {
    if (!user || properties.length === 0) return
    supabase.from('users').select('annual_income, monthly_spending, city, price_min, price_max').eq('id', user.id).single()
      .then(({ data }) => { if (data) applyProfile(data as UserProfile, properties) })
  }, [user, properties, applyProfile])

  const cities = ['All', ...Array.from(new Set(properties.map(p => p.address.city))).sort()]
  const filtered = properties.filter(p => {
    const cityMatch = cityFilter === 'All' || p.address.city === cityFilter
    const priceMatch = !p.list_price || (p.list_price >= minPrice && p.list_price <= maxPrice)
    return cityMatch && priceMatch
  })

  // Map init
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) { setMapLoaded(true); return }
    mapboxgl.accessToken = token
    const map = new mapboxgl.Map({ container: mapContainer.current, style: 'mapbox://styles/mapbox/light-v11', center: [-96.5, 56.1], zoom: 3.5 })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    map.on('load', () => setMapLoaded(true))
    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Markers
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return
    markersRef.current.forEach(m => m.remove()); markersRef.current = []
    filtered.forEach(p => {
      const { latitude, longitude } = p.address
      if (!latitude || !longitude) return
      const el = document.createElement('div')
      const isSelected = selected?.property_id === p.property_id
      el.style.cssText = `background:${isSelected ? '#C8430A' : '#FAFAF8'};color:${isSelected ? 'white' : '#C8430A'};border:2px solid #C8430A;border-radius:99px;padding:4px 9px;font-size:11px;font-weight:700;font-family:DM Sans,sans-serif;cursor:pointer;white-space:nowrap;box-shadow:0 2px 8px rgba(200,67,10,0.25);transition:all 0.15s;`
      el.textContent = p.list_price ? `$${Math.round(p.list_price / 1000)}K` : '—'
      el.addEventListener('mouseenter', () => { if (!isSelected) el.style.background = '#FEF0EB' })
      el.addEventListener('mouseleave', () => { if (!isSelected) el.style.background = '#FAFAF8' })
      el.addEventListener('click', () => selectProperty(p))
      markersRef.current.push(new mapboxgl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(mapRef.current!))
    })
  }, [filtered, mapLoaded, selected])

  const selectProperty = useCallback((p: Property) => {
    setSelected(p)
    mapRef.current?.flyTo({ center: [p.address.longitude, p.address.latitude], zoom: 14, duration: 1200, essential: true })
  }, [])

  const signOut = async () => { await supabase.auth.signOut(); setUser(null); setUserMenuOpen(false) }
  const avgPrice = filtered.length ? Math.round(filtered.filter(p => p.list_price).reduce((s, p) => s + (p.list_price ?? 0), 0) / filtered.filter(p => p.list_price).length) : 0

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--bg)' }}>
      {/* HEADER */}
      <header style={{ height: '56px', background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, zIndex: 200 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => setSidebarOpen(o => !o)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '6px', color: 'var(--text-secondary)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            </div>
            <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '17px' }}>MapleEstate <span style={{ color: 'var(--accent)' }}>AI</span></span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <Stat label={inventoryStats.label || 'Listings Tracked'} value={inventoryStats.count?.toLocaleString() ?? '—'} delta={inventoryStats.change} />
          {cityFilter !== 'All' && <Stat label={`${cityFilter} listings`} value={filtered.length.toString()} />}
          {avgPrice > 0 && <Stat label="Avg price" value={`$${Math.round(avgPrice/1000)}K`} />}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={() => setShowChat(c => !c)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'var(--accent-light)', color: 'var(--accent)', border: '1px solid rgba(200,67,10,0.2)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>Ask AI
          </button>
          {user ? (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setUserMenuOpen(o => !o)} style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '6px 12px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontFamily: 'DM Sans, sans-serif' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--accent)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>{(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}</div>
                {user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0]}
              </button>
              {userMenuOpen && (
                <div style={{ position: 'absolute', top: '38px', right: 0, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', boxShadow: 'var(--shadow-lg)', minWidth: '180px', overflow: 'hidden', zIndex: 300 }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Signed in as</div>
                    <div style={{ fontSize: '13px', fontWeight: 500 }}>{user.email}</div>
                  </div>
                  <button onClick={signOut} style={{ width: '100%', padding: '11px 14px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '13px', color: '#DC2626', fontFamily: 'DM Sans, sans-serif' }}>Sign out</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ padding: '7px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif' }}>Sign in</button>
          )}
        </div>
      </header>

      {/* MAIN */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <aside style={{ width: sidebarOpen ? '340px' : '0', minWidth: sidebarOpen ? '340px' : '0', overflow: 'hidden', transition: 'all 0.3s ease', background: 'var(--bg)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '10px' }}>Filters</div>
            <select value={cityFilter} onChange={e => setCityFilter(e.target.value)} style={{ width: '100%', padding: '8px 10px', marginBottom: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '13px', fontFamily: 'DM Sans, sans-serif', color: 'var(--text-primary)', cursor: 'pointer', outline: 'none' }}>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Price: <strong style={{ color: 'var(--text-primary)' }}>{fmt(minPrice)}</strong> — <strong style={{ color: 'var(--text-primary)' }}>{fmt(maxPrice)}</strong>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Min price</div>
            <input type="range" min={0} max={2500000} step={50000} value={minPrice} onChange={e => setMinPrice(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)', marginBottom: '8px' }} />
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '3px' }}>Max price</div>
            <input type="range" min={0} max={2500000} step={50000} value={maxPrice} onChange={e => setMaxPrice(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}><span>$0</span><span>$2.5M+</span></div>
          </div>
          <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', fontSize: '12px', color: 'var(--text-secondary)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong style={{ color: 'var(--text-primary)' }}>{filtered.length}</strong> properties</span>
            {(cityFilter !== 'All' || minPrice > 0 || maxPrice < 2500000) && (
              <button onClick={() => { setCityFilter('All'); setMinPrice(0); setMaxPrice(2500000) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', color: 'var(--accent)', fontFamily: 'DM Sans, sans-serif' }}>Reset filters</button>
            )}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {filtered.map((p, i) => (
              <div key={p.property_id} style={{ animationDelay: `${i * 0.03}s` }} className="animate-fadeUp">
                <PropertyCard p={p} selected={selected?.property_id === p.property_id} onClick={() => selectProperty(p)} />
              </div>
            ))}
            {filtered.length === 0 && <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--text-muted)', fontSize: '14px' }}>No properties match your filters</div>}
          </div>
        </aside>

        <div style={{ flex: 1, position: 'relative' }}>
          <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />
          {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN && mapLoaded && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', flexDirection: 'column', gap: '12px' }}>
              <div style={{ fontSize: '48px' }}>🗺️</div>
              <div style={{ fontSize: '18px', fontFamily: 'DM Serif Display, serif' }}>Map requires Mapbox token</div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Add NEXT_PUBLIC_MAPBOX_TOKEN to .env.local</div>
            </div>
          )}
          {selected && (
            <div className="animate-scaleIn" style={{ position: 'absolute', top: '16px', left: '16px', width: '300px', background: 'var(--bg-card)', borderRadius: '14px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)', overflow: 'hidden', zIndex: 100 }}>
              {selected.photo && <img src={selected.photo} alt="" style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block' }} />}
              <div style={{ padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ fontFamily: 'DM Serif Display, serif', fontSize: '22px', color: 'var(--accent)' }}>{fmt(selected.list_price)}</span>
                  <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 600, marginTop: '4px' }}>{selected.address.street_number} {selected.address.street}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>{selected.address.city}, {selected.address.state_code} · {selected.address.postal_code}</div>
                {selected.description && (
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap' }}>
                    {[{ label: 'Beds', val: selected.description.beds }, { label: 'Baths', val: selected.description.baths }, { label: 'Sqft', val: selected.description.sqft_living?.toLocaleString() }, { label: 'Built', val: selected.description.year_built }].filter(x => x.val).map(x => (
                      <div key={x.label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '15px', fontWeight: 700 }}>{x.val}</div>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{x.label}</div>
                      </div>
                    ))}
                  </div>
                )}
                {selected.agent && (
                  <div style={{ padding: '9px 12px', background: 'var(--bg-deep)', borderRadius: '8px', marginBottom: '10px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '1px' }}>Listed by</div>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{selected.agent.name}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{selected.agent.office}</div>
                  </div>
                )}
                {selected.open_house && (
                  <div style={{ fontSize: '12px', color: '#92400E', background: '#FEF3C7', padding: '7px 10px', borderRadius: '7px', marginBottom: '10px' }}>
                    🏠 Open House: {new Date(selected.open_house).toLocaleDateString('en-CA', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
                <button onClick={() => setShowChat(true)} style={{ width: '100%', padding: '9px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, fontFamily: 'DM Sans, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                  Ask AI about this property
                </button>
              </div>
            </div>
          )}
          {showChat && <AIChatPanel user={user} property={selected} onClose={() => setShowChat(false)} />}
        </div>
      </div>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} onAuth={(u, isNewUser) => { setUser(u); setShowAuth(false); if (isNewUser) setShowOnboarding(true) }} />
      )}

      {showOnboarding && user && (
        <OnboardingModal
          user={user}
          onComplete={(profile) => {
            setShowOnboarding(false)
            applyProfile(profile, properties) // ← immediate, no re-fetch
          }}
        />
      )}
    </div>
  )
}

function Stat({ label, value, delta }: { label: string; value: string; delta?: number }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', justifyContent: 'center' }}>
        <span style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'DM Serif Display, serif' }}>{value}</span>
        {delta != null && <span style={{ fontSize: '10px', fontWeight: 700, padding: '1px 5px', borderRadius: '99px', background: delta >= 0 ? '#DCFCE7' : '#FEE2E2', color: delta >= 0 ? '#15803D' : '#DC2626' }}>{delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}%</span>}
      </div>
      <div style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
    </div>
  )
}
