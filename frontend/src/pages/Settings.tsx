import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AlertCircle, CheckCircle, Mail, RefreshCw, User } from 'lucide-react'

export const Settings: React.FC = () => {
  const { user, resendVerification, updateProfile, refreshUser } = useAuth()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isSendingVerification, setIsSendingVerification] = useState(false)
  const [username, setUsername] = useState(user?.username || '')
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  const handleResendVerification = async () => {
    setIsSendingVerification(true)
    setError('')
    setSuccess('')
    try {
      await resendVerification()
      setSuccess('Verification email sent! Please check your inbox.')
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError('Too many requests. Please wait before trying again.')
      } else {
        setError(err.response?.data?.error || 'Failed to send verification email')
      }
    } finally {
      setIsSendingVerification(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingProfile(true)
    setError('')
    setSuccess('')
    try {
      await updateProfile(username || undefined)
      setSuccess('Profile updated successfully.')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setIsSavingProfile(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
        <p className="mt-1 text-sm text-gray-600">Manage your profile and account</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="ml-3 text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
            <p className="ml-3 text-sm text-green-800">{success}</p>
          </div>
        </div>
      )}

      {/* Profile */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <User className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <p className="mt-1 text-sm text-gray-900 bg-gray-50 rounded-md px-3 py-2">
              {user?.email}
            </p>
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Choose a username"
            />
          </div>

          <button
            type="submit"
            disabled={isSavingProfile}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSavingProfile ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      {/* Email Verification Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Mail className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Email Verification</h2>
        </div>

        {user?.is_verified ? (
          <div className="flex items-center space-x-2 text-green-700 bg-green-50 rounded-md p-3">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Your email is verified</span>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-amber-700 bg-amber-50 rounded-md p-3">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">
                Your email is not verified. Some features (AI Chat, Spaced Repetition) require a verified email.
              </span>
            </div>
            <button
              onClick={handleResendVerification}
              disabled={isSendingVerification}
              className="inline-flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSendingVerification ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              <span>{isSendingVerification ? 'Sending...' : 'Resend Verification Email'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
