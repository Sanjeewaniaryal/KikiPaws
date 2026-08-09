import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import SitterProfile from '@/lib/models/SitterProfile'

export async function GET() {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ clerkId: userId })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const profile = await SitterProfile.findOne({ userId: user._id }).lean()
  return NextResponse.json({ profile })
}

export async function PATCH(req: Request) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await connectDB()
  const user = await User.findOne({ clerkId: userId })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (user.role !== 'sitter' && user.role !== 'both') {
    return NextResponse.json({ error: 'Not a sitter account' }, { status: 403 })
  }

  const body = await req.json()
  const { bio, services, hourlyRate, experience, availability, profilePhoto } = body

  const profile = await SitterProfile.findOneAndUpdate(
    { userId: user._id },
    { bio, services, hourlyRate, experience, availability, ...(profilePhoto !== undefined && { profilePhoto }) },
    { upsert: true, new: true }
  )

  return NextResponse.json({ profile })
}
