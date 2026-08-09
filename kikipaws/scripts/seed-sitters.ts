import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const MONGODB_URI = process.env.MONGODB_URI!

// Inline schemas to avoid Next.js module issues
const UserSchema = new mongoose.Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  photo: { type: String, default: '' },
  role: { type: String, enum: ['owner', 'sitter', 'both'], default: 'sitter' },
  phone: String,
  location: String,
  onboarded: { type: Boolean, default: true },
}, { timestamps: true })

const SitterProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: String,
  services: [String],
  hourlyRate: Number,
  location: String,
  experience: String,
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)
const SitterProfile = mongoose.models.SitterProfile || mongoose.model('SitterProfile', SitterProfileSchema)

const testSitters = [
  {
    user: {
      clerkId: 'seed_sitter_1',
      email: 'emma.wilson@test.com',
      firstName: 'Emma',
      lastName: 'Wilson',
      photo: 'https://randomuser.me/api/portraits/women/44.jpg',
      role: 'sitter',
      location: 'Austin, TX',
      onboarded: true,
    },
    profile: {
      bio: 'Passionate animal lover with 5 years of experience caring for dogs and cats. I treat every pet like my own!',
      services: ['sitting', 'walking', 'dropin'],
      hourlyRate: 25,
      location: 'Austin, TX',
      experience: '5 years',
    },
  },
  {
    user: {
      clerkId: 'seed_sitter_2',
      email: 'james.carter@test.com',
      firstName: 'James',
      lastName: 'Carter',
      photo: 'https://randomuser.me/api/portraits/men/32.jpg',
      role: 'sitter',
      location: 'Brooklyn, NY',
      onboarded: true,
    },
    profile: {
      bio: 'Certified dog trainer and pet sitter. Specialising in boarding and grooming. Your pet will love staying with me!',
      services: ['boarding', 'grooming', 'walking'],
      hourlyRate: 35,
      location: 'Brooklyn, NY',
      experience: '3 years',
    },
  },
  {
    user: {
      clerkId: 'seed_sitter_3',
      email: 'sofia.garcia@test.com',
      firstName: 'Sofia',
      lastName: 'Garcia',
      photo: 'https://randomuser.me/api/portraits/women/68.jpg',
      role: 'both',
      location: 'Miami, FL',
      onboarded: true,
    },
    profile: {
      bio: 'Veterinary student who loves all animals. I offer drop-in visits and pet sitting with lots of love and care.',
      services: ['sitting', 'dropin'],
      hourlyRate: 20,
      location: 'Miami, FL',
      experience: '2 years',
    },
  },
  {
    user: {
      clerkId: 'seed_sitter_4',
      email: 'noah.thompson@test.com',
      firstName: 'Noah',
      lastName: 'Thompson',
      photo: 'https://randomuser.me/api/portraits/men/75.jpg',
      role: 'sitter',
      location: 'Seattle, WA',
      onboarded: true,
    },
    profile: {
      bio: 'Former zookeeper turned freelance pet sitter. Experienced with dogs, cats, birds, and exotic pets.',
      services: ['sitting', 'boarding', 'walking', 'grooming'],
      hourlyRate: 40,
      location: 'Seattle, WA',
      experience: '8 years',
    },
  },
]

async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('Connected to MongoDB')

  for (const data of testSitters) {
    const user = await User.findOneAndUpdate(
      { clerkId: data.user.clerkId },
      data.user,
      { upsert: true, new: true }
    )

    await SitterProfile.findOneAndUpdate(
      { userId: user._id },
      { ...data.profile, userId: user._id },
      { upsert: true, new: true }
    )

    console.log(`✓ Seeded sitter: ${data.user.firstName} ${data.user.lastName}`)
  }

  console.log('\nDone! 4 test sitters added.')
  await mongoose.disconnect()
}

seed().catch((err) => { console.error(err); process.exit(1) })
