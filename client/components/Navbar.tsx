'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import { HomeIcon } from './icons'

const navItems = [
  { href: '/mapview', label: 'Map View', icon: '🗺️' },
  { href: '/mortgage-calculator', label: 'Mortgage Calculator', icon: '🏦' },
  { href: '/Budget-planner', label: 'Budget Planner', icon: '💰' },
]

export default function Navbar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user ?? null))
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
  }

  return (
    <nav className="h-16 bg-white border-b border-[#e8e8e2] px-6 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1e6b4a] flex items-center justify-center">
            <HomeIcon size={16} className="text-white" />
          </div>
          <span className="font-serif text-lg font-bold">HomeWay</span>
        </Link>

        <div className="flex gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  isActive
                    ? 'bg-[#e8f5ef] text-[#1e6b4a]'
                    : 'text-[#6b6b60] hover:bg-[#f4f4f0]'
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 px-3 py-2 bg-[#f4f4f0] rounded-lg hover:bg-[#e8e8e2] transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-[#1e6b4a] text-white flex items-center justify-center text-xs font-bold">
                {(user.user_metadata?.full_name?.[0] ?? user.email?.[0] ?? 'U').toUpperCase()}
              </div>
              <span className="text-sm font-medium">
                {user.user_metadata?.full_name?.split(' ')[0] ?? user.email?.split('@')[0]}
              </span>
            </button>
            {userMenuOpen && (
              <div className="absolute top-12 right-0 bg-white border border-[#e8e8e2] rounded-xl shadow-lg min-w-[200px] overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#e8e8e2]">
                  <div className="text-xs text-[#6b6b60]">Signed in as</div>
                  <div className="text-sm font-semibold">{user.email}</div>
                </div>
                <button
                  onClick={signOut}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-[#fef2f2] transition-colors"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/"
            className="px-4 py-2 bg-[#1e6b4a] text-white rounded-lg font-semibold text-sm hover:bg-[#2d8f63] transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  )
}
