import React, { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

export const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const { verifyEmail } = useAuth()
  const hasAttempted = useRef(false)

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('No verification token provided. Please check the link in your email.')
      return
    }

    if (hasAttempted.current) return
    hasAttempted.current = true

    const verify = async () => {
      try {
        await verifyEmail(token)
        setStatus('success')
        setMessage('Your email has been verified successfully!')
      } catch (err: any) {
        setStatus('error')
        setMessage(
          err.response?.data?.error ||
          'Failed to verify email. The link may have expired or already been used.'
        )
      }
    }

    verify()
  }, [token, verifyEmail])

  return (
    <div className="min-h-[60vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center space-y-6">
        {status === 'loading' && (
          <>
            <Loader2 className="h-16 w-16 text-indigo-600 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">Verifying your email...</h2>
            <p className="text-gray-600">Please wait a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Email Verified!</h2>
            <p className="text-gray-600">{message}</p>
            <p className="text-gray-600">You now have full access to all features.</p>
            <div className="pt-4">
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
              >
                Sign in to your account
              </Link>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-10 w-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Verification Failed</h2>
            <p className="text-gray-600">{message}</p>
            <div className="pt-4 space-x-4">
              <Link
                to="/login"
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors"
              >
                Go to Login
              </Link>
              <Link
                to="/settings"
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-md transition-colors"
              >
                Resend Verification
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
