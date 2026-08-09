import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import Pet from '@/lib/models/Pet'

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await connectDB()
  const user = await User.findOne({ clerkId: userId })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const body = await req.json()
  const pet = await Pet.findOneAndUpdate(
    { _id: id, userId: user._id },
    body,
    { new: true }
  )

  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })
  return NextResponse.json(pet)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await connectDB()
  const user = await User.findOne({ clerkId: userId })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const pet = await Pet.findOneAndDelete({ _id: id, userId: user._id })
  if (!pet) return NextResponse.json({ error: 'Pet not found' }, { status: 404 })

  return NextResponse.json({ success: true })
}
