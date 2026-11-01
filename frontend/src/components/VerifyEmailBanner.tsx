import { useState } from 'react'
import { IconMail, IconX, IconCircleCheck } from '@tabler/icons-react'
import { useAuth } from '@/contexts/AuthContext'

export function VerifyEmailBanner() {
  const { user, resendVerification } = useAuth()
  const [dismissed, setDismissed] = useState(false)
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  if (!user || user.is_verified || dismissed) return null

  const handleResend = async () => {
    setStatus('sending')
    try {
      await resendVerification()
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-start sm:items-center gap-3">
        <IconMail className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5 sm:mt-0" aria-hidden />
        <div className="flex-1 min-w-0 text-sm text-amber-900">
          <span className="font-medium">Please verify your email.</span>{' '}
          <span className="text-amber-800">
            We sent a link to {user.email}. You can keep studying — some features unlock after verification.
          </span>
          <span className="block sm:inline sm:ml-2 mt-1 sm:mt-0">
            {status === 'sent' ? (
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                <IconCircleCheck className="w-4 h-4" aria-hidden />
                Email sent
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={status === 'sending'}
                className="font-semibold text-amber-900 underline underline-offset-2 hover:text-amber-700 disabled:opacity-60"
              >
                {status === 'sending' ? 'Sending…' : status === 'error' ? 'Retry send' : 'Resend email'}
              </button>
            )}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1 rounded text-amber-700 hover:bg-amber-100"
          aria-label="Dismiss verification reminder"
        >
          <IconX className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
