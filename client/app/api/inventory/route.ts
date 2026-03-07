import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    count: 24812,
    change: 4.8,
    label: 'Homes for Sale (Canada)'
  })
}
