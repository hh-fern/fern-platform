import { useParams } from "next/navigation";

import { DashboardApiClient } from "@/app/services/dashboard-api/client";
import { parseDocsUrlParam } from "@/utils/parseDocsUrlParam";

import { ErrorUploadImageToast } from "../../EditorToasts";
import ImageUploadNode from "./image-upload-node-extension";

export const ConfiguredImageUploadNode = () => {
  const { slug: slugArray, docsUrl: docsUrlParam } = useParams();

  const docsUrl = parseDocsUrlParam({ docsUrl: String(docsUrlParam) });
  const slug = Array.isArray(slugArray)
    ? slugArray?.join("/")
    : String(slugArray);

  return ImageUploadNode.configure({
    accept: "image/*",
    maxSize: 1024 * 1024 * 5, // 5MB
    upload: async (
      file: File,
      onProgress?: (event: { progress: number }) => void,
      signal?: AbortSignal
    ) => {
      try {
        onProgress?.({ progress: 20 });

        // Get pre-signed URL from our API
        const response = await DashboardApiClient.generateSignedUploadUrl({
          fileName: file.name,
          contentType: file.type,
          docsUrl,
          slug,
        });
        onProgress?.({ progress: 90 });

        // Upload file directly to S3 using pre-signed URL (avoids excess server load)
        const uploadResponse = await fetch(response.uploadUrl, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
          signal,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("S3 upload failed:", {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            errorText,
          });
          throw new Error(
            `Failed to upload file: ${uploadResponse.status} ${uploadResponse.statusText}. ${errorText}`
          );
        }

        // Report progress as completed
        onProgress?.({ progress: 100 });

        return response.imageUrl;
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }
        throw new Error("Upload failed");
      }
    },
    onError: (error) => ErrorUploadImageToast(error),
  });
};
