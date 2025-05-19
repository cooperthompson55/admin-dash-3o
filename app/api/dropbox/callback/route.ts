import { NextResponse } from 'next/server'
import { Dropbox } from 'dropbox'
import fetch from 'node-fetch'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    
    if (!code) {
      return NextResponse.json({ error: 'No code provided' }, { status: 400 })
    }

    const dbx = new Dropbox({
      clientId: process.env.DROPBOX_CLIENT_ID,
      clientSecret: process.env.DROPBOX_CLIENT_SECRET,
      fetch: fetch as any,
    })

    // Exchange the code for an access token
    const response = await dbx.auth.getAccessTokenFromCode(
      process.env.DROPBOX_REDIRECT_URI || '',
      code
    )

    // Get the refresh token
    const refreshResponse = await dbx.auth.getRefreshToken(
      response.result.access_token
    )

    // Return the tokens (in production, you should store these securely)
    return NextResponse.json({
      access_token: response.result.access_token,
      refresh_token: refreshResponse.result.refresh_token,
    })
  } catch (error) {
    console.error('Error in Dropbox callback:', error)
    return NextResponse.json(
      { error: 'Failed to complete OAuth flow' },
      { status: 500 }
    )
  }
} 