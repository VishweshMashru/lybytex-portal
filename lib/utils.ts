export function generateOrderId(): string {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 90000) + 10000
  return `LBT-${year}-${random}`
}

export function getCloudinaryUrl(publicId: string, width = 400): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "djx10ffrj"
  return `https://res.cloudinary.com/${cloud}/image/upload/w_${width},c_fill,q_auto,f_auto/${publicId}`
}
