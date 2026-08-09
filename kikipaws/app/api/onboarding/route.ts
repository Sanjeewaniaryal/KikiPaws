import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import SitterProfile from '@/lib/models/SitterProfile'

export async function POST(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { role, location, phone, bio, services, hourlyRate, experience } = body

  await connectDB()

  const user = await User.findOneAndUpdate(
    { clerkId: userId },
    { role, location, phone, onboarded: true },
    { new: true }
  )

  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (role === 'sitter' || role === 'both') {
    await SitterProfile.findOneAndUpdate(
      { userId: user._id },
      { bio, services, hourlyRate, location, experience },
      { upsert: true, new: true }
    )
  }

  return NextResponse.json({ success: true })
}
