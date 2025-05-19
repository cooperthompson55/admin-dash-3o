import { NextResponse } from 'next/server'
import { Dropbox } from 'dropbox'
import fetch from 'node-fetch'

export async function POST() {
  try {
    const dbx = new Dropbox({
      clientId: process.env.DROPBOX_CLIENT_ID,
      clientSecret: process.env.DROPBOX_CLIENT_SECRET,
      refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
      fetch: fetch as any,
    })

    // Get a new access token using the refresh token
    const response = await dbx.auth.refreshAccessToken()
    
    // Update the environment variable with the new access token
    process.env.DROPBOX_ACCESS_TOKEN = response.result.access_token

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error refreshing Dropbox token:', error)
    return NextResponse.json(
      { error: 'Failed to refresh Dropbox token' },
      { status: 500 }
    )
  }
} 