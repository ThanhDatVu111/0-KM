import cloudinary from '../../utils/cloudinary';

export async function uploadToCloudinary(fileBuffer: Buffer, fileName: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'image', public_id: fileName },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          if (result && result.secure_url) {
            resolve(result.secure_url); // Return the URL of the uploaded image
          } else {
            reject(new Error('Upload failed: No secure URL returned.'));
          }
        }
      },
    );

    // Write the file buffer to the upload stream
    uploadStream.end(fileBuffer);
  });
}
