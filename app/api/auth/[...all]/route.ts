import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ status: 'Firebase Auth Active' })
}

export async function POST() {
  return NextResponse.json({ status: 'Firebase Auth Active' })
}
