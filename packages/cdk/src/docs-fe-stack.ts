import archiver from "archiver";
import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AnyPrincipal, PolicyStatement } from "aws-cdk-lib/aws-iam";
import { Bucket, HttpMethods } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { Construct } from "constructs";
import * as fs from "fs";
import path from "path";

import { EnvironmentType } from "@fern-fern/fern-cloud-sdk/api";

export const LOCAL_PREVIEW_BUNDLE_OUT_DIR = path.resolve(
  __dirname,
  "../../fern-docs/bundle/.next"
);

export class DocsFeStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    environmentType: EnvironmentType,
    props?: StackProps
  ) {
    super(scope, id, props);
    const bucket = new Bucket(this, "local-preview-bundle4", {
      bucketName: `${environmentType.toLowerCase()}-local-preview-bundle4`,
      removalPolicy: RemovalPolicy.RETAIN,
      cors: [
        {
          allowedMethods: [HttpMethods.GET, HttpMethods.POST, HttpMethods.PUT],
          allowedOrigins: ["*"],
          allowedHeaders: ["*"],
        },
      ],
      versioned: true,
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
    });
    bucket.addToResourcePolicy(
      new PolicyStatement({
        resources: [bucket.arnForObjects("*"), bucket.bucketArn],
        actions: ["s3:List*", "s3:Get*"],
        principals: [new AnyPrincipal()],
      })
    );

    const local_preview_bundle_dist_tar = resolveLocalPreviewBundleTarPath();

    zipLocalBundle(local_preview_bundle_dist_tar)
      .then(() => {
        new BucketDeployment(this, "deploy-local-preview-bundle4", {
          sources: [Source.asset(local_preview_bundle_dist_tar)],
          destinationBucket: bucket,
          extract: false,
          memoryLimit: 1024,
        });
      })
      .catch((error: unknown) => {
        throw new Error(
          `Failed to prepare and deploy bundle: ${error instanceof Error ? error.message : String(error)}`
        );
      });
  }
}

function mkdir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir);
  }
}

async function zipFolder(sourceFolder: string, zipFilePath: string) {
  mkdir(path.dirname(zipFilePath));

  // if (process.platform === "win32") {
  //   cleanExternalSymlinks(sourceFolder);
  // }

  return new Promise<void>((resolve, reject) => {
    const output = fs.createWriteStream(zipFilePath);
    // const archive = archiver("tar", {
    //   gzip: true,
    // });
    const useDereference = process.platform === "win32";
    if (useDereference) {
      // eslint-disable-next-line no-console
      console.debug("[zipFolder] Running in dereference mode for archiver (win32 platform)");
    }
    const archive = archiver("tar", useDereference
      ? { gzip: true, dereference: true } as any
      : { gzip: true }
    );

    archive.on("error", (err: unknown) => {
      reject(err instanceof Error ? err : new Error(String(err)));
    });

    output.on("close", function () {
      resolve();
    });

    archive.pipe(output);
    archive.directory(sourceFolder, false);
    void archive.finalize();
  });
}

export async function zipLocalBundle(zipFilePath: string): Promise<void> {
  if (
    !fs.existsSync(LOCAL_PREVIEW_BUNDLE_OUT_DIR) ||
    !fs.lstatSync(LOCAL_PREVIEW_BUNDLE_OUT_DIR).isDirectory()
  ) {
    throw new Error(
      `Local preview bundle not found at ${LOCAL_PREVIEW_BUNDLE_OUT_DIR}`
    );
  }

  // Copy install-esbuild.js into the .next folder
  return fs.promises
    .copyFile(
      path.resolve(__dirname, "../utilities/install-esbuild.js"),
      path.join(LOCAL_PREVIEW_BUNDLE_OUT_DIR, "install-esbuild.js")
    )
    .then(() => {
      return zipFolder(LOCAL_PREVIEW_BUNDLE_OUT_DIR, zipFilePath);
    });
}

export function resolveLocalPreviewBundleTarPath(zipFilePath?: string) {
  if (!zipFilePath) {
    return path.resolve(__dirname, "../../fern-docs/bundle/next.tar.gz");;
  }
  return path.isAbsolute(zipFilePath)
    ? zipFilePath
    : path.resolve(__dirname, zipFilePath);
}

/**
 * Recursively traverses the directory and replaces any symlink that points outside the rootDir
 * with a copy of the file or directory it points to, or deletes the symlink if deleteInsteadOfCopy is true.
 */
export async function cleanExternalSymlinks(
    rootDir: string,
    deleteInsteadOfCopy?: boolean
): Promise<void> {
    async function processEntry(entryPath: string) {
        const stat = await fs.promises.lstat(entryPath);
        if (stat.isSymbolicLink()) {
            const linkTarget = await fs.promises.readlink(entryPath);
            // Resolve the absolute path of the symlink target
            const absTarget = path.resolve(path.dirname(entryPath), linkTarget);
            const realTarget = await fs.promises.realpath(absTarget);
            // Check if the real target is outside the rootDir
            const relative = path.relative(rootDir, realTarget);
            if (relative.startsWith("..") || path.isAbsolute(relative)) {
                // Remove the symlink
                await fs.promises.unlink(entryPath);
                if (!deleteInsteadOfCopy) {
                    // Copy the file or directory in its place
                    const targetStat = await fs.promises.stat(realTarget);
                    if (targetStat.isDirectory()) {
                        await copyDir(realTarget, entryPath);
                    } else {
                        await fs.promises.copyFile(realTarget, entryPath);
                    }
                }
                // If deleteInsteadOfCopy is true, do nothing else
            }
        } else if (stat.isDirectory()) {
            const entries = await fs.promises.readdir(entryPath);
            for (const entry of entries) {
                await processEntry(path.join(entryPath, entry));
            }
        }
    }
    await processEntry(rootDir);
}

// Helper to recursively copy a directory
async function copyDir(src: string, dest: string) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await copyDir(srcPath, destPath);
        } else if (entry.isSymbolicLink()) {
            // Copy the symlink as a symlink (could also resolve/copy target if desired)
            const linkTarget = await fs.promises.readlink(srcPath);
            await fs.promises.symlink(linkTarget, destPath);
        } else {
            await fs.promises.copyFile(srcPath, destPath);
        }
    }
}
