import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import SitterProfile from '@/lib/models/SitterProfile'
import User from '@/lib/models/User'

const PAGE_SIZE = 6

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const service = searchParams.get('service') || ''
    const search = searchParams.get('search') || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))

    await connectDB()

    const profileFilter: Record<string, unknown> = {}
    if (service) profileFilter.services = service

    // If searching by name/location, find matching user IDs first
    let userIdFilter: unknown[] | null = null
    if (search) {
      const regex = new RegExp(search, 'i')
      const matchingUsers = await User.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
          { location: regex },
        ],
      }).select('_id').lean()
      userIdFilter = matchingUsers.map((u) => u._id)
      if (userIdFilter.length === 0) {
        return NextResponse.json({ sitters: [], total: 0, page, pages: 0 })
      }
      profileFilter.userId = { $in: userIdFilter }
    }

    const total = await SitterProfile.countDocuments(profileFilter)
    const pages = Math.ceil(total / PAGE_SIZE)

    const sitterProfiles = await SitterProfile.find(profileFilter)
      .populate('userId', 'firstName lastName photo location')
      .sort({ averageRating: -1, createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean()

    const sitters = sitterProfiles.filter((s) => s.userId)

    return NextResponse.json({ sitters, total, page, pages })
  } catch (err) {
    console.error('[/api/sitters]', err)
    return NextResponse.json({ error: 'Failed to fetch sitters' }, { status: 500 })
  }
}
