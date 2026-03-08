'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function MortgageCalculatorPage() {
  const [homePrice, setHomePrice] = useState(500000)
  const [downPayment, setDownPayment] = useState(100000)
  const [interestRate, setInterestRate] = useState(5.5)
  const [loanTerm, setLoanTerm] = useState(25)

  const loanAmount = homePrice - downPayment
  const monthlyRate = interestRate / 100 / 12
  const numberOfPayments = loanTerm * 12
  const monthlyPayment =
    (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments))) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)

  return (
    <div className="min-h-screen bg-[#fafaf8]">
      <header className="h-16 bg-white border-b border-[#e8e8e2] flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1e6b4a] flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <span className="font-serif text-lg font-bold">HomeWay</span>
        </Link>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-serif font-bold mb-2">Mortgage Calculator</h1>
          <p className="text-[#6b6b60]">Calculate your monthly mortgage payments</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl border border-[#e8e8e2] p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Home Price</label>
              <input
                type="number"
                value={homePrice}
                onChange={(e) => setHomePrice(Number(e.target.value))}
                className="w-full px-4 py-3 border border-[#e8e8e2] rounded-lg outline-none focus:border-[#1e6b4a]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Down Payment</label>
              <input
                type="number"
                value={downPayment}
                onChange={(e) => setDownPayment(Number(e.target.value))}
                className="w-full px-4 py-3 border border-[#e8e8e2] rounded-lg outline-none focus:border-[#1e6b4a]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Interest Rate (%)</label>
              <input
                type="number"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(Number(e.target.value))}
                className="w-full px-4 py-3 border border-[#e8e8e2] rounded-lg outline-none focus:border-[#1e6b4a]"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Loan Term (years)</label>
              <input
                type="number"
                value={loanTerm}
                onChange={(e) => setLoanTerm(Number(e.target.value))}
                className="w-full px-4 py-3 border border-[#e8e8e2] rounded-lg outline-none focus:border-[#1e6b4a]"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e8e8e2] p-6">
            <h3 className="text-lg font-bold mb-6">Your Monthly Payment</h3>
            <div className="text-5xl font-serif font-bold text-[#1e6b4a] mb-8">
              ${Math.round(monthlyPayment).toLocaleString()}
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex justify-between pb-3 border-b border-[#e8e8e2]">
                <span className="text-[#6b6b60]">Loan Amount</span>
                <span className="font-semibold">${loanAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#e8e8e2]">
                <span className="text-[#6b6b60]">Down Payment</span>
                <span className="font-semibold">${downPayment.toLocaleString()}</span>
              </div>
              <div className="flex justify-between pb-3 border-b border-[#e8e8e2]">
                <span className="text-[#6b6b60]">Interest Rate</span>
                <span className="font-semibold">{interestRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6b6b60]">Total Payments</span>
                <span className="font-semibold">{numberOfPayments}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/mapview"
            className="inline-block px-6 py-3 bg-[#1e6b4a] text-white rounded-lg font-semibold hover:bg-[#2d8f63] transition-colors"
          >
            Find Properties
          </Link>
        </div>
      </div>
    </div>
  )
}
