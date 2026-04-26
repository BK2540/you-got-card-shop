import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

const CARD_IMAGE_TRANSFORMATION = {
  width: 400,
  height: 600,
  crop: "fill" as const,
  quality: "auto",
  fetch_format: "auto",
};

export const getCardImageUrl = (publicId: string) =>
  cloudinary.url(publicId, {
    secure: true,
    ...CARD_IMAGE_TRANSFORMATION,
  });

export const uploadCardImage = async (file: File) => {
  const buffer = Buffer.from(await file.arrayBuffer());

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "cards",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result?.public_id) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }

        resolve({
          publicId: result.public_id,
          url: getCardImageUrl(result.public_id),
        });
      },
    );

    stream.end(buffer);
  });
};

export const extractPublicIdFromUrl = (imageUrl: string) => {
  try {
    const parsedUrl = new URL(imageUrl);
    const segments = parsedUrl.pathname.split("/").filter(Boolean);
    const uploadIndex = segments.indexOf("upload");

    if (uploadIndex < 0) {
      return null;
    }

    const tail = segments.slice(uploadIndex + 1);
    if (tail.length === 0) {
      return null;
    }

    const versionIndex = tail.findIndex((segment) => /^v\d+$/.test(segment));
    let publicIdSegments = versionIndex >= 0 ? tail.slice(versionIndex + 1) : tail;

    if (
      versionIndex < 0 &&
      publicIdSegments[0] &&
      (publicIdSegments[0].includes(",") || publicIdSegments[0].includes("_"))
    ) {
      publicIdSegments = publicIdSegments.slice(1);
    }

    if (publicIdSegments.length === 0) {
      return null;
    }

    const filePath = publicIdSegments.join("/");
    return filePath.replace(/\.[a-zA-Z0-9]+$/, "");
  } catch {
    return null;
  }
};

export const destroyImageByPublicId = async (publicId: string) => {
  await cloudinary.uploader.destroy(publicId);
};

export default cloudinary;
