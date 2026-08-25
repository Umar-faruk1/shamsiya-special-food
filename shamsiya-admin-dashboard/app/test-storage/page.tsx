'use client'

import { useState } from 'react'
import { uploadFoodImage } from '@/lib/services/storage'

export default function TestStorage() {
  const [file, setFile] = useState<File | null>(null)
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function upload() {
    if (!file) {
      setError('Select an image first.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const imageUrl = await uploadFoodImage(file)
      setUrl(imageUrl)
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Upload failed.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ padding: 40 }}>
      <h1>Test Food Image Upload</h1>

      <input
        type="file"
        accept="image/*"
        onChange={(event) => {
          setFile(event.target.files?.[0] ?? null)
        }}
      />

      <br />
      <br />

      <button
        onClick={() => void upload()}
        disabled={loading}
      >
        {loading ? 'Uploading...' : 'Upload image'}
      </button>

      {error && (
        <p style={{ color: 'red' }}>
          {error}
        </p>
      )}

      {url && (
        <div>
          <p>Upload successful:</p>

          <img
            src={url}
            alt="Uploaded food"
            style={{
              width: 300,
              borderRadius: 12,
            }}
          />

          <p>{url}</p>
        </div>
      )}
    </main>
  )
}