import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import User from '@/lib/models/User'
import SitterProfile from '@/lib/models/SitterProfile'

const testSitters = [
  {
    user: {
      clerkId: 'seed_sitter_1',
      email: 'emma@test.com',
      firstName: 'Emma',
      lastName: 'Wilson',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
      role: 'sitter' as const,
      onboarded: true,
      location: 'New York, NY',
      phone: '+1 555 001 0001',
    },
    profile: {
      bio: 'Lifelong animal lover with 5+ years of pet sitting experience. I treat every pet like my own!',
      services: ['sitting', 'walking', 'dropin'],
      hourlyRate: 25,
      location: 'New York, NY',
      experience: '5 years',
    },
  },
  {
    user: {
      clerkId: 'seed_sitter_2',
      email: 'james@test.com',
      firstName: 'James',
      lastName: 'Carter',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
      role: 'sitter' as const,
      onboarded: true,
      location: 'Brooklyn, NY',
      phone: '+1 555 001 0002',
    },
    profile: {
      bio: 'Dog trainer and walker. Your pup will come home tired and happy!',
      services: ['walking', 'boarding'],
      hourlyRate: 30,
      location: 'Brooklyn, NY',
      experience: '3 years',
    },
  },
  {
    user: {
      clerkId: 'seed_sitter_3',
      email: 'sofia@test.com',
      firstName: 'Sofia',
      lastName: 'Martinez',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia',
      role: 'both' as const,
      onboarded: true,
      location: 'Queens, NY',
      phone: '+1 555 001 0003',
    },
    profile: {
      bio: 'Cat whisperer and certified vet technician. Specialise in cats and senior pets.',
      services: ['sitting', 'dropin', 'grooming'],
      hourlyRate: 35,
      location: 'Queens, NY',
      experience: '7 years',
    },
  },
  {
    user: {
      clerkId: 'seed_sitter_4',
      email: 'oliver@test.com',
      firstName: 'Oliver',
      lastName: 'Brown',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver',
      role: 'sitter' as const,
      onboarded: true,
      location: 'Manhattan, NY',
      phone: '+1 555 001 0004',
    },
    profile: {
      bio: 'Full-time pet sitter with a large home and garden. Overnight boarding is my speciality.',
      services: ['boarding', 'sitting', 'walking'],
      hourlyRate: 40,
      location: 'Manhattan, NY',
      experience: '4 years',
    },
  },
]

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not allowed in production' }, { status: 403 })
  }

  await connectDB()

  for (const { user, profile } of testSitters) {
    const existingUser = await User.findOne({ clerkId: user.clerkId })
    if (existingUser) continue

    const createdUser = await User.create(user)
    await SitterProfile.create({ userId: createdUser._id, ...profile })
  }

  return NextResponse.json({ success: true, message: `${testSitters.length} test sitters seeded` })
}
