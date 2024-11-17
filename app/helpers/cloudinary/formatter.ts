import { extractCloudinaryPublicId } from "./extractor";


export const formatToDeleteDocument = (url: string, resourceType: string): { publicId: string, resourceType: string } => {
  const publicId = extractCloudinaryPublicId(url);
  return { publicId: publicId, resourceType };
}