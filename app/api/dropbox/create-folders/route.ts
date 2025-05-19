import { NextResponse } from 'next/server'
import { Dropbox } from 'dropbox'
import fetch from 'node-fetch'

async function createDropboxClient() {
  if (!process.env.DROPBOX_ACCESS_TOKEN) {
    console.error('Dropbox access token is missing')
    throw new Error('Dropbox access token is not configured')
  }

  console.log('Creating Dropbox client with token:', process.env.DROPBOX_ACCESS_TOKEN.substring(0, 10) + '...')

  const dbx = new Dropbox({
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,
    fetch: fetch as any,
  })

  try {
    // Test the token by making a simple API call
    console.log('Testing Dropbox connection...')
    await dbx.filesListFolder({ path: '' })
    console.log('Dropbox connection successful')
    return dbx
  } catch (error: any) {
    console.error('Dropbox API error:', {
      status: error?.status,
      message: error?.message,
      error: error?.error
    })

    if (error?.status === 401 || error?.status === 400) {
      console.log('Token is expired or invalid, attempting to refresh...')
      try {
        const refreshResponse = await fetch('/api/dropbox/refresh-token', {
          method: 'POST',
        })

        if (!refreshResponse.ok) {
          const refreshError = await refreshResponse.json()
          console.error('Failed to refresh token:', refreshError)
          throw new Error('Failed to refresh Dropbox token')
        }

        console.log('Token refreshed successfully')
        // Create a new client with the refreshed token
        return new Dropbox({
          accessToken: process.env.DROPBOX_ACCESS_TOKEN,
          fetch: fetch as any,
        })
      } catch (refreshError) {
        console.error('Error during token refresh:', refreshError)
        throw new Error('Failed to refresh Dropbox token')
      }
    }
    throw error
  }
}

async function createFolderIfNotExists(dbx: Dropbox, path: string) {
  try {
    await dbx.filesCreateFolderV2({ path })
    console.log(`Created folder: ${path}`)
  } catch (error: any) {
    if (error?.status === 409) {
      console.log(`Folder already exists: ${path}`)
      return // Folder already exists, continue
    }
    throw error // Re-throw other errors
  }
}

export async function POST(request: Request) {
  try {
    const { bookingId, propertyAddress, agentName } = await request.json()

    if (!propertyAddress?.street || !agentName) {
      console.error('Missing required fields:', { propertyAddress, agentName })
      return NextResponse.json(
        { error: 'Property address and agent name are required' },
        { status: 400 }
      )
    }

    // Format the folder name using property address and agent name
    const folderName = `${propertyAddress.street} - ${agentName}`
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim()

    console.log('Creating folders for:', folderName)

    // Create main project folder
    const mainFolderPath = `/Projects/${folderName}`
    
    // Get a Dropbox client (with token refresh if needed)
    const dbx = await createDropboxClient()
    
    // Create folders (will handle existing folders gracefully)
    await createFolderIfNotExists(dbx, mainFolderPath)

    // Create subfolders
    const rawPhotosPath = `${mainFolderPath}/Raw Brackets`
    const finalEditsPath = `${mainFolderPath}/Edited Media`

    console.log('Creating subfolders:', { rawPhotosPath, finalEditsPath })
    await createFolderIfNotExists(dbx, rawPhotosPath)
    await createFolderIfNotExists(dbx, finalEditsPath)

    // Get shared links for the folders
    console.log('Creating shared links...')
    const [rawPhotosLink, finalEditsLink] = await Promise.all([
      dbx.sharingCreateSharedLinkWithSettings({ path: rawPhotosPath }),
      dbx.sharingCreateSharedLinkWithSettings({ path: finalEditsPath }),
    ])

    console.log('Folders created successfully')
    return NextResponse.json({
      rawPhotosLink: rawPhotosLink.result.url,
      finalEditsLink: finalEditsLink.result.url,
    })
  } catch (error: any) {
    console.error('Error creating Dropbox folders:', error)
    
    // Handle specific error cases
    if (error?.status === 409) {
      return NextResponse.json(
        { error: 'A folder with this name already exists' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create project folders' },
      { status: 500 }
    )
  }
} 