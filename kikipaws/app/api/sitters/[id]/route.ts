import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import SitterProfile from '@/lib/models/SitterProfile'
import Review from '@/lib/models/Review'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await connectDB()

  const profile = await SitterProfile.findById(id)
    .populate('userId', 'firstName lastName photo location')
    .lean()

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const reviews = await Review.find({ sitterProfileId: id })
    .populate('reviewerId', 'firstName lastName photo')
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ profile, reviews })
}
