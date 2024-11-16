

export const extractCloudinaryPublicId = (url: string): string => {
  const splitUrl = url.split('/');
  const publicId = splitUrl[splitUrl.length - 1].split('.')[0];
  return publicId;
}

