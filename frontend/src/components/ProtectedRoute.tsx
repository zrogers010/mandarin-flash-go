import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { readAccessToken, restoreSessionIfClobbered, writeLoginBreadcrumb } from '@/lib/authSession'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireVerification?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireVerification = false 
}) => {
  const { isAuthenticated, user, token, isLoading } = useAuth()
  const location = useLocation()
  restoreSessionIfClobbered()
  const storedToken = readAccessToken()
  const pendingSession = !!(storedToken || token) && !user

  if (isLoading || pendingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    writeLoginBreadcrumb({
      reason: 'protected_unauthenticated',
      path: location.pathname,
      hadStoredToken: !!storedToken,
      hadContextToken: !!token,
      hadUser: !!user,
      isAuthenticated,
      isLoading,
    })
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requireVerification && user && !user.is_verified) {
    return <Navigate to="/verify-email" state={{ from: location }} replace />
  }

  return <>{children}</>
}
