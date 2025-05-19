"use client"

import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function AuthSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const hasTokens = searchParams.get('has_tokens') === 'true'
  const hasRefresh = searchParams.get('has_refresh') === 'true'
  const refreshToken = searchParams.get('refresh_token')
  const accessToken = searchParams.get('access_token')
  const expiry = searchParams.get('expiry')

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6">
          {hasTokens ? 'Authentication Successful!' : 'Authentication Failed'}
        </h1>
        
        <div className="mt-6 text-left space-y-4">
          <div>
            <h2 className="font-semibold text-gray-700">Refresh Token:</h2>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
              {refreshToken || 'No refresh token received'}
            </pre>
            {!hasRefresh && (
              <p className="text-yellow-600 text-sm mt-1">
                Note: No refresh token received. Make sure to include access_type=offline in the auth URL.
              </p>
            )}
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Access Token:</h2>
            <pre className="bg-gray-100 p-2 rounded mt-1 overflow-x-auto">
              {accessToken || 'No access token received'}
            </pre>
          </div>

          <div>
            <h2 className="font-semibold text-gray-700">Expiry Date:</h2>
            <pre className="bg-gray-100 p-2 rounded mt-1">
              {expiry ? new Date(parseInt(expiry)).toLocaleString() : 'No expiry date received'}
            </pre>
          </div>
        </div>

        <p className="text-gray-600 mt-6">
          Copy your refresh token and add it to your .env.local file as GOOGLE_REFRESH_TOKEN.
          Redirecting back in 10 seconds...
        </p>
      </div>
    </div>
  )
}

export default function AuthSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthSuccessContent />
    </Suspense>
  )
} 