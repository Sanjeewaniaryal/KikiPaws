import { currentUser } from '@clerk/nextjs/server'
import { connectDB } from '@/lib/db'
import User, { IUser } from '@/lib/models/User'

export async function syncUser(): Promise<IUser> {
  const clerkUser = await currentUser()
  if (!clerkUser) throw new Error('Not authenticated')

  await connectDB()

  let user = await User.findOne({ clerkId: clerkUser.id })

  if (!user) {
    user = await User.create({
      clerkId: clerkUser.id,
      email: clerkUser.emailAddresses[0].emailAddress,
      firstName: clerkUser.firstName || '',
      lastName: clerkUser.lastName || '',
      photo: clerkUser.imageUrl || '',
      onboarded: false,
    })
  }

  return user
}
