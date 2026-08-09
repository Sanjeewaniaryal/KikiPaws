import { config } from 'dotenv'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env.local') })

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) { console.error('❌ MONGODB_URI not found in .env.local'); process.exit(1) }

// ── Schemas ──────────────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  clerkId: String, email: String, firstName: String, lastName: String,
  photo: String, role: String, phone: String, location: String, onboarded: Boolean,
}, { timestamps: true })

const SitterProfileSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  bio: String, services: [String], hourlyRate: Number,
  location: String, experience: String,
  averageRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
}, { timestamps: true })

const User = mongoose.models.User || mongoose.model('User', UserSchema)
const SitterProfile = mongoose.models.SitterProfile || mongoose.model('SitterProfile', SitterProfileSchema)

// ── Seed data ─────────────────────────────────────────────────────────────────

const testSitters = [
  {
    user: { clerkId: 'seed_sitter_1', email: 'emma@test.com', firstName: 'Emma', lastName: 'Wilson',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma', role: 'sitter',
      onboarded: true, location: 'New York, NY', phone: '+1 555 001 0001' },
    profile: { bio: 'Lifelong animal lover with 5+ years of pet sitting experience. I treat every pet like my own!',
      services: ['sitting', 'walking', 'dropin'], hourlyRate: 25, location: 'New York, NY', experience: '5 years' },
  },
  {
    user: { clerkId: 'seed_sitter_2', email: 'james@test.com', firstName: 'James', lastName: 'Carter',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James', role: 'sitter',
      onboarded: true, location: 'Brooklyn, NY', phone: '+1 555 001 0002' },
    profile: { bio: 'Dog trainer and walker. Your pup will come home tired and happy!',
      services: ['walking', 'boarding'], hourlyRate: 30, location: 'Brooklyn, NY', experience: '3 years' },
  },
  {
    user: { clerkId: 'seed_sitter_3', email: 'sofia@test.com', firstName: 'Sofia', lastName: 'Martinez',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sofia', role: 'both',
      onboarded: true, location: 'Queens, NY', phone: '+1 555 001 0003' },
    profile: { bio: 'Cat whisperer and certified vet technician. Specialise in cats and senior pets.',
      services: ['sitting', 'dropin', 'grooming'], hourlyRate: 35, location: 'Queens, NY', experience: '7 years' },
  },
  {
    user: { clerkId: 'seed_sitter_4', email: 'oliver@test.com', firstName: 'Oliver', lastName: 'Brown',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Oliver', role: 'sitter',
      onboarded: true, location: 'Manhattan, NY', phone: '+1 555 001 0004' },
    profile: { bio: 'Full-time pet sitter with a large home and garden. Overnight boarding is my speciality.',
      services: ['boarding', 'sitting', 'walking'], hourlyRate: 40, location: 'Manhattan, NY', experience: '4 years' },
  },
]

// ── Run ───────────────────────────────────────────────────────────────────────

await mongoose.connect(MONGODB_URI)
console.log('✅ Connected to MongoDB')

let created = 0
for (const { user, profile } of testSitters) {
  const existing = await User.findOne({ clerkId: user.clerkId })
  if (existing) {
    console.log(`⏭  Skipping ${user.firstName} ${user.lastName} (already exists)`)
    continue
  }
  const createdUser = await User.create(user)
  await SitterProfile.create({ userId: createdUser._id, ...profile })
  console.log(`✅ Created ${user.firstName} ${user.lastName}`)
  created++
}

console.log(`\n🐾 Done — ${created} sitter(s) added.`)
await mongoose.disconnect()
