import cloudinary from "@configs/cloudinary.config";

export const imageDeleter = async (
  folder: string, 
  fileName: string ,
  resourceType: string = "image"
) => {

  const cloudinaryResponse = await cloudinary.api.delete_resources(
    [`${folder}/${fileName}`], 
    { resource_type: resourceType }
  );
  
  return cloudinaryResponse;
}

