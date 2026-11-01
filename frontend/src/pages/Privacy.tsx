import { Link } from 'react-router-dom'
import { IconShield } from '@tabler/icons-react'
import { SEO } from '@/components/SEO'

export function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy"
        description="How MandarinFlash collects and uses account, progress, and analytics data."
        canonical="https://mandarinflash.com/privacy"
      />
      <article className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary-600 text-white flex items-center justify-center">
            <IconShield className="w-5 h-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last updated: November 1, 2026</p>
          </div>
        </div>

        <div className="prose prose-gray max-w-none space-y-6 text-gray-700 leading-relaxed">
          <p>
            MandarinFlash is a free Mandarin learning site. This policy explains what we collect
            and why. We do not sell your personal information.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">What we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>
              <strong>Account:</strong> email address, optional username, password hash, and
              timezone. We do not store your password in plain text.
            </li>
            <li>
              <strong>Learning progress:</strong> words you study, quiz results, daily goals,
              streaks, and onboarding choices (goal and HSK level).
            </li>
            <li>
              <strong>Guest progress:</strong> if you study before signing up, quiz and word
              progress is stored in your browser and can be merged into your account later.
            </li>
            <li>
              <strong>Technical logs:</strong> IP address, user agent, and timestamps for
              security (rate limits, session management) and debugging.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">How we use it</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>Create your account and keep you signed in.</li>
            <li>Send transactional email (verification, password reset, welcome) via Amazon SES.</li>
            <li>Save and show your study progress.</li>
            <li>
              Understand site usage with Google Analytics 4 (page views and events such as
              signup or quiz complete). We do not send your email address as a GA user ID.
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900">Cookies and local storage</h2>
          <p>
            We use browser storage for your session tokens, theme preference, and optional guest
            progress. Analytics cookies may be set by Google Analytics.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">Sharing</h2>
          <p>
            We share data only with the processors that run the product: our hosting provider,
            Amazon SES for email, and Google Analytics. We may disclose information if required
            by law or to prevent abuse.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">Retention and your choices</h2>
          <p>
            We keep account and progress data while your account is active. You can request
            deletion or a copy of your data by emailing{' '}
            <a href="mailto:support@mandarinflash.com" className="text-primary-600 hover:underline">
              support@mandarinflash.com
            </a>
            . You can also use browser controls to clear local storage and opt out of Google
            Analytics.
          </p>

          <h2 className="text-xl font-semibold text-gray-900">Contact</h2>
          <p>
            Questions about this policy:{' '}
            <a href="mailto:support@mandarinflash.com" className="text-primary-600 hover:underline">
              support@mandarinflash.com
            </a>
            . See also our <Link to="/terms" className="text-primary-600 hover:underline">Terms of Service</Link>.
          </p>
        </div>
      </article>
    </>
  )
}
