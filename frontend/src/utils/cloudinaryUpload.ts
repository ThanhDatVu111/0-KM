const CLOUDINARY_CLOUD_NAME = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_API_KEY = process.env.EXPO_PUBLIC_CLOUDINARY_API_KEY;
const CLOUDINARY_SIGN_URL = process.env.EXPO_PUBLIC_CLOUDINARY_SIGN_URL;

/**
 * Upload media to Cloudinary
 * @param uri - The local URI of the file to upload
 * @param type - The type of media ('image' or 'video')
 * @returns Promise<string> - The secure URL of the uploaded file
 */
export async function uploadToCloudinary(
  uri: string,
  type: 'image' | 'video' = 'image',
): Promise<string> {
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_SIGN_URL) {
    throw new Error(
      'Define EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME, EXPO_PUBLIC_CLOUDINARY_API_KEY & EXPO_PUBLIC_CLOUDINARY_SIGN_URL in .env',
    );
  }

  let signature: string, timestamp: number;
  try {
    const sigRes = await fetch(CLOUDINARY_SIGN_URL);
    const sigJson = await sigRes.json();
    signature = sigJson.signature;
    timestamp = sigJson.timestamp;
  } catch (err: any) {
    console.error('❌ Error fetching signature', err);
    throw err;
  }

  const form = new FormData();
  form.append('file', {
    uri,
    name: type === 'video' ? 'video.mp4' : 'photo.jpg',
    type: type === 'video' ? 'video/mp4' : 'image/jpeg',
  } as any);
  form.append('api_key', CLOUDINARY_API_KEY);
  form.append('timestamp', timestamp.toString());
  form.append('signature', signature);

  let uploadRes: Response, uploadJson: any;
  try {
    uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${type}/upload`,
      { method: 'POST', body: form },
    );
    uploadJson = await uploadRes.json();
  } catch (err: any) {
    console.error('❌ Network error uploading to Cloudinary', err);
    throw err;
  }

  if (!uploadRes.ok) {
    console.error('❌ Cloudinary returned an error', uploadJson.error);
    throw new Error(uploadJson.error?.message || 'Cloudinary upload failed');
  }

  return uploadJson.secure_url;
}
