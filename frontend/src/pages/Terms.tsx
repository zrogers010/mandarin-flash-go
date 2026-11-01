import { Link } from 'react-router-dom'
import { IconFileText } from '@tabler/icons-react'
import { SEO } from '@/components/SEO'

export function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service"
        description="Terms of Service for MandarinFlash, a free Mandarin Chinese learning app."
        canonical="https://mandarinflash.com/terms"
      />
      <article className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center">
            <IconFileText className="w-5 h-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1>
            <p className="text-sm text-gray-500">Last updated: November 1, 2026</p>
          </div>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <p>
            MandarinFlash is a free website for studying Mandarin Chinese (HSK vocabulary,
            flashcards, quizzes, and a dictionary). By creating an account or using the site,
            you agree to these terms.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">Using the service</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>The site is provided free of charge, as-is, for personal learning.</li>
            <li>You must be at least 13 years old (or the age of digital consent in your country).</li>
            <li>Keep your password to yourself. You are responsible for activity on your account.</li>
            <li>Do not abuse the service (spam, scraping at scale, attacking the site, or impersonating others).</li>
            <li>Study content is for learning. We work to keep HSK words accurate, but it is not an official HSK exam or a substitute for a teacher.</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">Accounts</h2>
          <p>
            You can try quizzes before signing up. Progress stored on your device can be merged
            into your account when you register. We may suspend accounts that violate these terms
            or that look automated or abusive.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">Intellectual property</h2>
          <p>
            MandarinFlash branding, site design, and original lesson copy belong to MandarinFlash.
            Dictionary definitions draw on public lexical sources (including CC-CEDICT) and our
            own learner-facing edits. You may not copy the site or its datasets for a competing
            commercial product without permission.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">Disclaimer</h2>
          <p>
            The service is provided “as is.” We do not guarantee uninterrupted access, perfect
            translations, or any particular learning outcome. To the extent allowed by law, we
            are not liable for lost progress, exam results, or indirect damages from using the site.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">Changes and contact</h2>
          <p>
            We may update these terms as the product changes. Continued use after an update
            means you accept the new terms. Questions:{' '}
            <a href="mailto:support@mandarinflash.com" className="text-primary-600 hover:underline">
              support@mandarinflash.com
            </a>
            . See also our <Link to="/privacy" className="text-primary-600 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </article>
    </>
  )
}
