import { createClient } from '@supabase/supabase-js'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const bucketName = process.env.SUPABASE_BUCKET_NAME || 'nso-uploads'

let supabase = null

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey)
}

/**
 * Helper to determine MIME type by file extension.
 */
function getContentTypeByExt(ext) {
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf'
  }
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream'
}

/**
 * Uploads a file buffer to Supabase Storage and returns the public URL.
 * 
 * @param {Buffer} fileBuffer - File contents in memory
 * @param {string} originalName - Original filename
 * @param {string} folder - Destination folder in bucket ('ktp' or 'receipts')
 * @returns {Promise<string>} Public URL of the uploaded asset
 */
export async function uploadToSupabase(fileBuffer, originalName, folder) {
  if (!supabase) {
    throw new Error('Supabase Storage Client is not initialized. Please verify SUPABASE_URL and SUPABASE_ANON_KEY in server/.env.')
  }

  // Attempt to check/create bucket
  try {
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === bucketName)
    
    if (!bucketExists) {
      console.log(`Bucket "${bucketName}" not found. Attempting to create it...`)
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
        fileSizeLimit: 5 * 1024 * 1024 // 5MB limit
      })
      if (error) {
        console.warn(`Could not create bucket "${bucketName}". It might already exist or you might have insufficient permissions: ${error.message}`)
      } else {
        console.log(`✓ Public bucket "${bucketName}" created successfully`)
      }
    }
  } catch (err) {
    console.warn(`Warning checking/creating bucket: ${err.message}. Attempting to upload directly...`)
  }

  const ext = path.extname(originalName)
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
  const fileName = `${folder}-${uniqueSuffix}${ext}`
  const filePath = `${folder}/${fileName}`

  const { error } = await supabase.storage
    .from(bucketName)
    .upload(filePath, fileBuffer, {
      contentType: getContentTypeByExt(ext),
      upsert: true
    })

  if (error) {
    throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`)
  }

  // Retrieve public URL
  const { data: urlData } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath)

  return urlData.publicUrl
}
