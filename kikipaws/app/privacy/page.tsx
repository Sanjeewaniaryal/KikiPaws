export default function PrivacyPage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <nav className="flex items-center justify-between px-6 py-4 md:px-12" style={{ borderBottom: '1px solid var(--border)', background: 'rgba(250,245,255,0.95)' }}>
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl">🐾</span>
          <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>Kiki Paws</span>
        </a>
      </nav>

      <main className="mx-auto max-w-3xl px-6 py-16 md:px-12">
        <h1 className="mb-2 text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Privacy Policy</h1>
        <p className="mb-10 text-sm" style={{ color: 'var(--muted)' }}>Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>

        {[
          { title: '1. Information We Collect', body: 'We collect information you provide when creating an account (name, email, phone, location), information about your pets, booking and payment details, and messages sent through our platform. We also collect usage data and device information automatically.' },
          { title: '2. How We Use Your Information', body: 'We use your information to facilitate bookings between owners and sitters, process payments, send transactional emails (booking confirmations, status updates), improve our service, and comply with legal obligations.' },
          { title: '3. Information Sharing', body: 'We share your name and relevant booking details with the sitter or owner you are matched with. We do not sell your personal information to third parties. We share data with service providers (Clerk for auth, Stripe for payments, Resend for email) only as necessary to operate the platform.' },
          { title: '4. Payment Data', body: 'Payment information is processed by Stripe. Kiki Paws does not store your full card details. Stripe\'s privacy policy governs how your payment data is handled.' },
          { title: '5. Data Retention', body: 'We retain your account data for as long as your account is active. Booking records are kept for legal and accounting purposes. You may request deletion of your account and associated data by contacting us.' },
          { title: '6. Your Rights', body: 'You have the right to access, correct, or delete your personal information. You may opt out of marketing communications at any time. Contact us at privacy@kikipaws.com to exercise these rights.' },
          { title: '7. Security', body: 'We implement industry-standard security measures to protect your information. However, no method of transmission over the internet is 100% secure. We encourage you to use a strong, unique password for your account.' },
          { title: '8. Cookies', body: 'We use cookies for authentication and session management. You can control cookie settings through your browser, but disabling cookies may affect platform functionality.' },
          { title: '9. Changes to This Policy', body: 'We may update this Privacy Policy periodically. We will notify you of significant changes via email. Your continued use of Kiki Paws after changes constitutes acceptance.' },
          { title: '10. Contact', body: 'For privacy-related questions, email us at privacy@kikipaws.com.' },
        ].map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="mb-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>{section.title}</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{section.body}</p>
          </div>
        ))}
      </main>

      <footer className="px-6 py-8 text-center text-sm" style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}>
        <a href="/terms" style={{ color: 'var(--primary)' }}>Terms of Service</a>
        {' · '}
        <a href="/" style={{ color: 'var(--primary)' }}>Back to Home</a>
      </footer>
    </div>
  )
}
