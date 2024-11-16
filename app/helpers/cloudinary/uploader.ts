import cloudinary from "@configs/cloudinary.config";

export const imageUploader = async (
  buffer: Buffer, 
  mimetype: string, 
  folder: string, 
  fileName: string,
  width: number, 
  height: number
) => {

  const b64 = Buffer.from(buffer).toString("base64");
  let dataURL = "data:" + mimetype + ";base64," + b64;
  const cloudinaryResponse = await cloudinary.uploader
  .upload(dataURL, {
    folder: folder,
    resource_type: 'image',
    public_id: fileName,
    transformation: [
      { quality: 'auto' },
      { fetch_format: 'auto' },
      { width: width, height: height, crop: 'fill'},
    ],
  })

  return cloudinaryResponse;
}

export const FileUploader = async (
  buffer: Buffer, 
  mimetype: string, 
  folder: string, 
  fileName: string,
) => {
  const b64 = Buffer.from(buffer).toString("base64");
  let dataURL = "data:" + mimetype + ";base64," + b64;
  const cloudinaryResponse = await cloudinary.uploader
  .upload(dataURL, {
    folder: folder,
    resource_type: 'auto',
    public_id: fileName,
  })

  return cloudinaryResponse;
}
