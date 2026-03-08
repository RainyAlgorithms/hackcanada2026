'use client'

import Link from 'next/link'

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fafaf8] px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-[#e8e8e2] p-8 text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-[#1a1a1a] mb-2">Authentication Error</h1>
        <p className="text-[#6b6b60] mb-6">
          Sorry, there was a problem signing you in. Please try again.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-[#1e6b4a] text-white rounded-lg font-semibold hover:bg-[#2d8f63] transition-colors"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}
