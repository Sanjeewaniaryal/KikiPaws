import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12"
      style={{
        background: 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 50%, #ede9fe 100%)',
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <a href="/" className="flex items-center gap-2">
          <span className="text-4xl">🐾</span>
          <span className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
            Kiki Paws
          </span>
        </a>
        <SignUp />
      </div>
    </div>
  )
}
