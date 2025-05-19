"use client"

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'

export default function AuthSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Redirect back to the booking page after 10 seconds
    const timeout = setTimeout(() => {
      router.back()
    }, 10000)

    return () => clearTimeout(timeout)
  }, [router])

  const refreshToken = searchParams.get('refresh_token')
  const accessToken = searchParams.get('access_token')
  const expiry = searchParams.get('expiry')
  const hasRefresh = searchParams.get('has_refresh') === 'true'

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-2xl w-full">
        <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="h-6 w-6 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">
          Authentication Successful
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