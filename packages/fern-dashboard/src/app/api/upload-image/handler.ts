import "server-only";

import { NextResponse } from "next/server";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getS3Client } from "@/app/services/s3";

import { MaybeErrorResponse } from "../utils/MaybeErrorResponse";

export default async function uploadImageHandler({
  fileName,
  docsUrl,
  slug,
  contentType,
}: {
  fileName: string;
  contentType: string;
  docsUrl: string;
  slug: string;
}): Promise<
  MaybeErrorResponse<{
    uploadUrl: string;
    imageUrl: string;
    key: string;
  }>
> {
  try {
    // Generate a unique key for the uploaded image
    const timestamp = new Date().toISOString();
    // const randomId = Math.random().toString(36).substring(2, 15);
    const key = `visual-editor-images/${docsUrl}/${timestamp}/${slug}/${cleanFileName(fileName)}`;

    // Get S3 client and bucket name
    const s3Client = getS3Client();
    const bucketName = process.env.AWS_S3_BUCKET_NAME;

    if (!bucketName) {
      throw new Error("S3_BUCKET_NAME or AWS_S3_BUCKET_NAME is not set");
    }

    // Create a pre-signed URL for uploading to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 60 * 10,
    }); // 10 minutes expiry

    // The final image URL that will be accessible after upload
    const imageUrl = `https://files.buildwithfern.com/${key}`;

    return {
      data: {
        uploadUrl,
        imageUrl,
        key,
      },
    };
  } catch (error) {
    console.error("Error creating pre-signed URL:", error);
    return {
      errorResponse: NextResponse.json(
        { error: "Failed to create upload URL" },
        { status: 500 }
      ),
    };
  }
}

const cleanFileName = (fileName: string) => {
  return fileName.replaceAll(" ", "_").replaceAll("/", "-");
};
