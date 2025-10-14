import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const ONE_WEEK_IN_SECONDS = 604800;

interface S3Config {
    publicDocsCDNUrl: string;
    publicDocsS3BucketName: string;
    publicDocsS3BucketRegion: string;
    privateDocsS3BucketName: string;
    privateDocsS3BucketRegion: string;
    awsAccessKeyId?: string;
    awsSecretAccessKey?: string;
}

// Initialize S3 clients lazily
let publicDocsS3Client: S3Client | undefined;
let privateDocsS3Client: S3Client | undefined;
let s3Config: S3Config | undefined;

export function initializeS3(config: S3Config): void {
    s3Config = config;

    const credentials = config.awsAccessKeyId && config.awsSecretAccessKey
        ? {
            accessKeyId: config.awsAccessKeyId,
            secretAccessKey: config.awsSecretAccessKey
        }
        : undefined;

    publicDocsS3Client = new S3Client({
        region: config.publicDocsS3BucketRegion,
        credentials
    });

    privateDocsS3Client = new S3Client({
        region: config.privateDocsS3BucketRegion,
        credentials
    });
}

export async function getPresignedDocsAssetsDownloadUrl({
    key,
    isPrivate
}: {
    key: string;
    isPrivate: boolean;
}): Promise<string> {
    if (!s3Config) {
        throw new Error("S3 not initialized. Call initializeS3() first.");
    }

    if (isPrivate) {
        if (!privateDocsS3Client) {
            throw new Error("Private S3 client not initialized");
        }

        const command = new GetObjectCommand({
            Bucket: s3Config.privateDocsS3BucketName,
            Key: key
        });

        const signedUrl = await getSignedUrl(privateDocsS3Client, command, {
            expiresIn: ONE_WEEK_IN_SECONDS
        });

        return signedUrl;
    }

    return `${s3Config.publicDocsCDNUrl}/${key}`;
}
