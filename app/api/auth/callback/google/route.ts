import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
)

export async function GET(request: Request) {
  try {
    // Log environment variables (without sensitive values)
    console.log('Environment check:')
    console.log('GOOGLE_CLIENT_ID exists:', !!process.env.GOOGLE_CLIENT_ID)
    console.log('GOOGLE_CLIENT_SECRET exists:', !!process.env.GOOGLE_CLIENT_SECRET)
    console.log('GOOGLE_REDIRECT_URI:', process.env.GOOGLE_REDIRECT_URI)

    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const scope = searchParams.get('scope')

    console.log('\nReceived OAuth callback with:')
    console.log('Code:', code)
    console.log('Scope:', scope)

    if (!code) {
      console.error('No code provided in callback')
      return NextResponse.json(
        { error: 'No code provided' },
        { status: 400 }
      )
    }

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Missing Google OAuth credentials')
      return NextResponse.json(
        { error: 'Server configuration error - missing credentials' },
        { status: 500 }
      )
    }

    try {
      // Exchange the code for tokens
      const { tokens } = await oauth2Client.getToken(code)
      
      // Log tokens in a more visible way
      console.log('\n=== GOOGLE OAUTH TOKENS ===')
      console.log('Access Token:', tokens.access_token)
      console.log('Refresh Token:', tokens.refresh_token)
      console.log('Expiry Date:', tokens.expiry_date)
      console.log('===========================\n')

      // Store the tokens securely
      // In production, you should store these in a secure database
      if (!tokens.refresh_token) {
        console.error('No refresh token received. Make sure to include access_type=offline in the auth URL')
      }

      // Redirect to success page with tokens in URL (for development only)
      // In production, you should store these securely and not expose them in the URL
      const successUrl = new URL('/auth/success', request.url)
      successUrl.searchParams.set('has_tokens', 'true')
      if (tokens.refresh_token) {
        successUrl.searchParams.set('has_refresh', 'true')
        successUrl.searchParams.set('refresh_token', tokens.refresh_token)
      }
      successUrl.searchParams.set('access_token', tokens.access_token || '')
      successUrl.searchParams.set('expiry', tokens.expiry_date?.toString() || '')

      return NextResponse.redirect(successUrl)
    } catch (tokenError) {
      console.error('Error exchanging code for tokens:', tokenError)
      if (tokenError instanceof Error) {
        console.error('Token error name:', tokenError.name)
        console.error('Token error message:', tokenError.message)
        console.error('Token error stack:', tokenError.stack)
      }
      return NextResponse.json(
        { error: 'Failed to exchange code for tokens', details: tokenError instanceof Error ? tokenError.message : 'Unknown error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in Google OAuth callback:', error)
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    return NextResponse.json(
      { error: 'Failed to authenticate with Google', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 