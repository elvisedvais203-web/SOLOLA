import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/nextalkenv";
import { ApiError } from "../utils/nextalkapierror";

const UPLOAD_ROOT = path.join(process.cwd(), "storage", "uploads");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function assertCloudinaryConfigured(): { cloudName: string; apiKey: string; apiSecret: string } {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new ApiError(503, "Stockage media non configure. Contactez l'administrateur.");
  }
  return { cloudName, apiKey, apiSecret };
}

async function persistLocalUpload(filePath: string, folder: string, publicBaseUrl?: string): Promise<string> {
  const ext = path.extname(filePath) || ".bin";
  const fileName = `${randomUUID()}${ext}`;
  const destDir = path.join(UPLOAD_ROOT, folder);
  await mkdir(destDir, { recursive: true });
  await copyFile(filePath, path.join(destDir, fileName));

  const relative = `/api/media/files/${folder}/${fileName}`;
  const base = String(publicBaseUrl ?? process.env.MEDIA_PUBLIC_BASE_URL ?? "").replace(/\/+$/, "");
  if (base) {
    return `${base}${relative}`;
  }
  return relative;
}

export async function uploadMedia(filePath: string, folder: string, options?: { publicBaseUrl?: string }): Promise<string> {
  const useCloudinary = env.mediaProvider === "cloudinary";

  if (useCloudinary) {
    try {
      assertCloudinaryConfigured();
      const uploaded = await cloudinary.uploader.upload(filePath, {
        folder,
        resource_type: "auto"
      });
      return uploaded.secure_url;
    } catch (error) {
      if (env.nodeEnv === "production") {
        throw error instanceof ApiError ? error : new ApiError(503, "Echec upload Cloudinary.");
      }
    }
  }

  return persistLocalUpload(filePath, folder, options?.publicBaseUrl);
}

export function createSignedUploadPayload(params: {
  folder: string;
  publicId?: string;
  resourceType?: "image" | "video" | "raw" | "auto";
}) {
  if (env.mediaProvider !== "cloudinary") {
    throw new ApiError(400, "Les signatures d'upload direct sont disponibles uniquement avec MEDIA_PROVIDER=cloudinary.");
  }

  const { cloudName, apiKey, apiSecret } = assertCloudinaryConfigured();
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign: Record<string, string | number> = {
    folder: params.folder,
    timestamp,
    resource_type: params.resourceType ?? "auto"
  };

  if (params.publicId) {
    toSign.public_id = params.publicId;
  }

  const signature = cloudinary.utils.api_sign_request(toSign, apiSecret);

  return {
    cloudName,
    apiKey,
    timestamp,
    signature,
    folder: params.folder,
    resourceType: params.resourceType ?? "auto",
    publicId: params.publicId,
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${params.resourceType ?? "auto"}/upload`
  };
}
