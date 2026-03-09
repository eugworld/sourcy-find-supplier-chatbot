export function toImageProxyUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) {
    return null;
  }

  if (imageUrl.startsWith('/')) {
    return imageUrl;
  }

  return `/api/image?src=${encodeURIComponent(imageUrl)}`;
}
