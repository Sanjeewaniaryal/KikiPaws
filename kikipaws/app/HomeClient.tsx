'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UserButton } from '@clerk/nextjs'

const fadeUp = {
  hidden: { opacity: 0, y: 36 },
  show: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const services = [
  { emoji: '🏡', title: 'Pet Sitting', desc: "A trusted sitter comes to your home so your pet stays comfortable in their own space." },
  { emoji: '🦮', title: 'Dog Walking', desc: "Daily walks to keep your pup happy, healthy, and well-exercised while you're busy." },
  { emoji: '🛏️', title: 'Overnight Boarding', desc: "Your pet stays at a sitter's home and gets round-the-clock love and attention." },
  { emoji: '🐱', title: 'Cat Drop-In', desc: "Quick check-in visits to feed, play with, and care for your cat on their own terms." },
  { emoji: '💊', title: 'Pet Care & Meds', desc: "Sitters experienced with special needs pets, including medication administration." },
  { emoji: '📸', title: 'Photo Updates', desc: "Get real-time photos and updates from your sitter so you always know your pet is happy." },
]

const steps = [
  { step: '1', emoji: '🔍', title: 'Search nearby sitters', desc: 'Browse verified sitters in your area. Filter by service, availability, and reviews.' },
  { step: '2', emoji: '💬', title: 'Connect & book', desc: 'Chat directly with your chosen sitter, confirm details, and book securely in-app.' },
  { step: '3', emoji: '🐾', title: 'Relax & enjoy updates', desc: 'Sit back while your sitter sends photo updates. Your pet is in great hands.' },
]

export default function HomeClient({ isSignedIn }: { isSignedIn: boolean }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ y: -70, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 md:px-12"
        style={{ background: 'rgba(250,245,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}
      >
        <motion.div
          className="flex items-center gap-2"
          whileHover={{ scale: 1.04 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          <span className="text-3xl">🐾</span>
          <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--primary)' }}>Kiki Paws</span>
        </motion.div>

        <div className="hidden items-center gap-8 text-sm font-medium md:flex">
          {['#services', '#how-it-works'].map((href, i) => (
            <motion.a
              key={href}
              href={href}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              style={{ color: 'var(--muted)' }}
              className="relative transition-colors hover:text-violet-600"
            >
              {href === '#services' ? 'Services' : 'How It Works'}
            </motion.a>
          ))}
          {isSignedIn ? (
            <>
              <motion.a
                href="/dashboard"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.29 }}
                style={{ color: 'var(--muted)' }}
                className="transition-colors hover:text-violet-600"
              >
                Dashboard
              </motion.a>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
                <UserButton />
              </motion.div>
            </>
          ) : (
            <>
              <motion.a
                href="/login"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.29 }}
                style={{ color: 'var(--muted)' }}
                className="transition-colors hover:text-violet-600"
              >
                Sign In
              </motion.a>
              <motion.a
                href="/signup"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.35, type: 'spring', stiffness: 300, damping: 20 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                className="rounded-full px-5 py-2 text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}
              >
                Get Started
              </motion.a>
            </>
          )}
        </div>

        <button
          className="flex flex-col gap-1 md:hidden"
          aria-label="Open menu"
          onClick={() => setMobileOpen((o) => !o)}
        >
          <motion.span animate={{ rotate: mobileOpen ? 45 : 0, y: mobileOpen ? 6 : 0 }} className="block h-0.5 w-5 rounded" style={{ background: 'var(--foreground)' }} />
          <motion.span animate={{ opacity: mobileOpen ? 0 : 1 }} className="block h-0.5 w-5 rounded" style={{ background: 'var(--foreground)' }} />
          <motion.span animate={{ rotate: mobileOpen ? -45 : 0, y: mobileOpen ? -6 : 0 }} className="block h-0.5 w-5 rounded" style={{ background: 'var(--foreground)' }} />
        </button>
      </motion.nav>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[65px] z-40 flex flex-col gap-1 px-6 py-4 md:hidden"
            style={{ background: 'rgba(250,245,255,0.98)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)' }}
          >
            {[
              { href: '#services', label: 'Services' },
              { href: '#how-it-works', label: 'How It Works' },
              ...(isSignedIn ? [{ href: '/dashboard', label: 'Dashboard' }] : [{ href: '/login', label: 'Sign In' }]),
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium transition-colors hover:bg-violet-50"
                style={{ color: 'var(--foreground)' }}
              >
                {link.label}
              </a>
            ))}
            {!isSignedIn && (
              <a
                href="/signup"
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-full px-4 py-3 text-center text-sm font-semibold text-white"
                style={{ background: 'var(--primary)' }}
              >
                Get Started
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #f5f3ff 0%, #faf5ff 60%, #ede9fe 100%)' }}
      >
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-12 px-6 py-16 md:flex-row md:gap-8 md:px-12 md:py-24">

          {/* Left — text */}
          <div className="flex-1 text-center md:text-left">
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
              className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium"
              style={{ background: 'var(--primary-light)', color: '#4c1d95' }}
            >
              🐶 Trusted by pet families everywhere
            </motion.span>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
              className="mb-6 text-4xl font-bold leading-tight tracking-tight md:text-6xl"
              style={{ color: 'var(--foreground)' }}
            >
              Loving care for your pets,{' '}
              <motion.span
                style={{ color: 'var(--primary)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65, duration: 0.5 }}
              >
                every single day
              </motion.span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.35, ease: 'easeOut' }}
              className="mb-10 max-w-xl text-lg leading-relaxed"
              style={{ color: 'var(--muted)' }}
            >
              Kiki Paws connects you with caring, verified pet sitters in your
              neighborhood. Your furry family deserves the best — even when you&apos;re away.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.48, ease: 'easeOut' }}
              className="flex flex-col items-center gap-4 sm:flex-row md:items-start"
            >
              <motion.a
                href={isSignedIn ? '/sitters' : '/signup'}
                whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(124,58,237,0.35)' }}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-full px-8 py-3.5 text-base font-semibold text-white shadow-md sm:w-auto"
                style={{ background: 'var(--primary)' }}
              >
                Find a Sitter
              </motion.a>
              <motion.a
                href="/signup"
                whileHover={{ scale: 1.04, background: 'var(--primary-light)' }}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-full border px-8 py-3.5 text-base font-semibold sm:w-auto"
                style={{ borderColor: 'var(--primary)', color: 'var(--primary)' }}
              >
                Become a Sitter
              </motion.a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.65, duration: 0.5 }}
              className="mt-10 flex flex-wrap justify-center gap-5 text-sm md:justify-start"
              style={{ color: 'var(--muted)' }}
            >
              {['✅ Verified sitters', '🔒 Secure payments', '⭐ 5-star care', '💬 Real-time updates'].map((badge) => (
                <span key={badge} className="flex items-center gap-1.5">{badge}</span>
              ))}
            </motion.div>
          </div>

          {/* Right — photo collage */}
          <motion.div
            className="relative flex-1 w-full max-w-lg md:max-w-none"
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ minHeight: '460px' }}
          >
            <img
              src="/photos/Hero.jpeg"
              alt="Happy pet with sitter"
              className="w-full rounded-3xl object-cover shadow-2xl"
              style={{ maxHeight: '520px' }}
            />
            {/* Floating card — bottom left */}
            <motion.div
              className="animate-float absolute -bottom-6 -left-5 w-44 overflow-hidden rounded-2xl shadow-2xl"
              style={{ border: '4px solid white' }}
              initial={{ opacity: 0, scale: 0.7, x: -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.75, duration: 0.5, type: 'spring', stiffness: 200 }}
            >
              <img src="/photos/petsitter2.jpeg" alt="Pet sitter with dog" className="h-32 w-full object-cover" />
              <div className="px-3 py-2" style={{ background: '#ffffff' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Bella & Max</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>⭐⭐⭐⭐⭐ Loved it!</p>
              </div>
            </motion.div>
            {/* Floating card — top right */}
            <motion.div
              className="animate-float2 absolute -right-5 -top-5 w-40 overflow-hidden rounded-2xl shadow-2xl"
              style={{ border: '4px solid white' }}
              initial={{ opacity: 0, scale: 0.7, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              transition={{ delay: 0.9, duration: 0.5, type: 'spring', stiffness: 200 }}
            >
              <img src="/photos/petsitter3.jpeg" alt="Sitter caring for pet" className="h-28 w-full object-cover" />
              <div className="px-3 py-2" style={{ background: '#ffffff' }}>
                <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Sarah</p>
                <p className="text-xs" style={{ color: 'var(--primary)' }}>✓ Verified sitter</p>
              </div>
            </motion.div>
            {/* Badge */}
            <motion.div
              className="absolute bottom-6 right-4 flex items-center gap-2 rounded-full px-4 py-2 shadow-lg"
              style={{ background: 'var(--primary)', color: 'white' }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.0, type: 'spring', stiffness: 300 }}
            >
              <span className="text-lg">🐾</span>
              <div>
                <p className="text-xs font-bold leading-none">2,400+</p>
                <p className="text-xs leading-none opacity-80">happy pets</p>
              </div>
            </motion.div>
          </motion.div>

        </div>
      </section>

      {/* ── Services ── */}
      <section id="services" className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: 'var(--foreground)' }}>
              Everything your pet needs
            </h2>
            <p className="text-base" style={{ color: 'var(--muted)' }}>
              From drop-in visits to overnight stays — we&apos;ve got you covered.
            </p>
          </motion.div>

          <motion.div
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ staggerChildren: 0.1 }}
          >
            {services.map((service) => (
              <motion.div
                key={service.title}
                variants={fadeUp}
                whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(124,58,237,0.12)' }}
                className="rounded-2xl p-6"
                style={{ background: 'var(--card-bg)', border: '1px solid var(--border)', cursor: 'default' }}
              >
                <motion.div
                  className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl text-2xl"
                  style={{ background: '#f5f3ff' }}
                  whileHover={{ rotate: [0, -10, 10, -6, 0], scale: 1.15 }}
                  transition={{ duration: 0.4 }}
                >
                  {service.emoji}
                </motion.div>
                <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {service.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Sitters in Action ── */}
      <section className="px-6 pb-4 pt-4 md:px-12">
        <div className="mx-auto max-w-5xl">
          <motion.div
            className="overflow-hidden rounded-3xl shadow-xl"
            style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)' }}
            initial={{ opacity: 0, scale: 0.97 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex flex-col md:flex-row">
              <motion.div
                className="relative md:w-1/2"
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <img
                  src="/photos/petsitter2.jpeg"
                  alt="Sitter with pet"
                  className="h-72 w-full object-cover md:h-full"
                  style={{ minHeight: '300px' }}
                />
                <div className="absolute bottom-4 left-4 rounded-2xl px-4 py-2 shadow-md" style={{ background: 'rgba(255,255,255,0.95)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>🏡 In-home sitting</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Your pet, their comfort zone</p>
                </div>
              </motion.div>
              <motion.div
                className="relative md:w-1/2"
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.25 }}
              >
                <img
                  src="/photos/petsitter3.jpeg"
                  alt="Happy pet and sitter"
                  className="h-72 w-full object-cover md:h-full"
                  style={{ minHeight: '300px' }}
                />
                <div className="absolute bottom-4 right-4 rounded-2xl px-4 py-2 shadow-md" style={{ background: 'rgba(255,255,255,0.95)' }}>
                  <p className="text-sm font-bold" style={{ color: 'var(--foreground)' }}>🦮 Daily walks</p>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>Exercise & adventure</p>
                </div>
              </motion.div>
            </div>
            <motion.div
              className="px-8 py-5 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
            >
              <p className="text-lg font-semibold text-white">Real sitters. Real love. Real results.</p>
              <p className="mt-1 text-sm text-violet-200">Every sitter is background-checked and pet-care trained.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="px-6 py-20 md:px-12" style={{ background: '#f5f3ff' }}>
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
          >
            <h2 className="mb-3 text-3xl font-bold md:text-4xl" style={{ color: 'var(--foreground)' }}>
              How Kiki Paws works
            </h2>
            <p className="text-base" style={{ color: 'var(--muted)' }}>
              Finding trusted care for your pet has never been easier.
            </p>
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {steps.map((item, i) => (
              <motion.div
                key={item.step}
                className="relative text-center"
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.55, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
              >
                <motion.div
                  className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-3xl shadow-sm"
                  style={{ background: 'var(--primary-light)' }}
                  whileHover={{ scale: 1.15, rotate: 8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                >
                  {item.emoji}
                </motion.div>
                <span
                  className="absolute left-1/2 top-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: 'var(--primary)', marginLeft: '16px' }}
                >
                  {item.step}
                </span>
                <h3 className="mb-2 text-lg font-semibold" style={{ color: 'var(--foreground)' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="px-6 py-20 md:px-12">
        <motion.div
          className="mx-auto max-w-3xl rounded-3xl px-8 py-14 text-center shadow-sm"
          style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #8b5cf6 100%)' }}
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.span
            className="mb-4 block text-5xl"
            animate={{ rotate: [0, -10, 10, -6, 6, 0] }}
            transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.6 }}
          >
            🐾
          </motion.span>
          <h2 className="mb-4 text-3xl font-bold text-white md:text-4xl">
            Ready to find your pet&apos;s perfect sitter?
          </h2>
          <p className="mx-auto mb-8 max-w-md text-base text-violet-100">
            Join thousands of happy pet owners who trust Kiki Paws for reliable, loving pet care.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <motion.a
              href={isSignedIn ? '/sitters' : '/signup'}
              whileHover={{ scale: 1.05, boxShadow: '0 6px 24px rgba(255,255,255,0.3)' }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-full bg-white px-8 py-3.5 text-base font-semibold sm:w-auto"
              style={{ color: 'var(--primary)' }}
            >
              Find a Sitter Now
            </motion.a>
            <motion.a
              href="/signup"
              whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.15)' }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-full border-2 border-white px-8 py-3.5 text-base font-semibold text-white sm:w-auto"
            >
              List as a Sitter
            </motion.a>
          </div>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <motion.footer
        className="px-6 py-10 md:px-12"
        style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐾</span>
            <span className="text-lg font-bold" style={{ color: 'var(--primary)' }}>Kiki Paws</span>
          </div>
          <p className="text-sm">
            &copy; {new Date().getFullYear()} Kiki Paws. Made with ❤️ for pets everywhere.
          </p>
          <div className="flex gap-6 text-sm">
            {[{ label: 'Privacy', href: '/privacy' }, { label: 'Terms', href: '/terms' }, { label: 'Contact', href: 'mailto:support@kikipaws.com' }].map((link) => (
              <motion.a
                key={link.label}
                href={link.href}
                whileHover={{ color: '#7c3aed' }}
                className="transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
          </div>
        </div>
      </motion.footer>

    </div>
  )
}
