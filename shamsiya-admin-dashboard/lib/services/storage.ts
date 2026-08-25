import { supabase } from '@/lib/supabase/client'

const FOOD_IMAGE_BUCKET = 'food-images'

export async function uploadFoodImage(file: File) {
  if (!file) {
    throw new Error('Please select an image.')
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select a valid image file.')
  }

  // Maximum 5 MB
  const maxSize = 5 * 1024 * 1024

  if (file.size > maxSize) {
    throw new Error('Image must be smaller than 5MB.')
  }

  const extension =
    file.name.split('.').pop()?.toLowerCase() || 'jpg'

  const fileName = `${crypto.randomUUID()}.${extension}`

  const filePath = `foods/${fileName}`

  const { error } = await supabase.storage
    .from(FOOD_IMAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    })

  if (error) {
    throw error
  }

  const {
    data: { publicUrl },
  } = supabase.storage
    .from(FOOD_IMAGE_BUCKET)
    .getPublicUrl(filePath)

  return publicUrl
}