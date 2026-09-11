import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'hlvqsigf',
  api_key: process.env.CLOUDINARY_API_KEY || '781664993594166',
  api_secret: process.env.CLOUDINARY_API_SECRET || '7SktpiGIM7bu4E4yp3hEh-gS0Yc',
  secure: true,
});

export async function uploadToCloudinary(
  fileBuffer: Buffer,
  folder: string = 'diecast/products',
  publicId?: string
): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const uploadOptions: Record<string, any> = {
      folder,
      public_id: publicId,
      resource_type: 'image',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    if (process.env.CLOUDINARY_UPLOAD_PRESET) {
      uploadOptions.upload_preset = process.env.CLOUDINARY_UPLOAD_PRESET;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error || !result) {
          const errMsg = error && typeof error === 'object' && 'message' in error
            ? String((error as { message: unknown }).message)
            : 'Upload to Cloudinary failed';
          return reject(new Error(errMsg));
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

export { cloudinary };
