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

  let folderToZip = sourceFolder;
  let tempDir: string | undefined;

  if (process.platform === "win32") {
    // Create a temp directory
    const os = await import("os");
    const tempBase = os.tmpdir();
    tempDir = fs.mkdtempSync(path.join(tempBase, "fern-docs-bundle-"));
    // Deep copy the source folder into the temp directory
    await fs.promises.cp(sourceFolder, tempDir, { recursive: true, dereference: false });
    // Dereference symlinks in the temp directory
    dereferenceSymlinks(tempDir);
    folderToZip = tempDir;
  }

  try {
   await new Promise<void>((resolve, reject) => {
      const output = fs.createWriteStream(zipFilePath);
      const archive = archiver("tar", {
        gzip: true,
      });

      archive.on("error", (err: unknown) => {
        reject(err instanceof Error ? err : new Error(String(err)));
      });

      output.on("close", function () {
        resolve();
      });

      archive.pipe(output);
      archive.directory(folderToZip, false);
      void archive.finalize();
    });
  } finally {
    if (tempDir) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  }
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
  return (
    zipFilePath ?? path.resolve(__dirname, "../../fern-docs/bundle/next.tar.gz")
  );
}

/**
 * Recursively replaces all symlinks in a directory with deep copies of their targets.
 * @param dir The root directory to process.
 */
export function dereferenceSymlinks(dir: string) {
  if (!path.isAbsolute(dir)) {
    throw new Error(`Expected absolute path, got: ${dir}`);
  }
  for (const entry of fs.readdirSync(dir)) {
    const entryPath = path.join(dir, entry);
    const stat = fs.lstatSync(entryPath);

    if (stat.isSymbolicLink()) {
      const realPath = fs.realpathSync(entryPath);
      const realStat = fs.statSync(realPath);

      // Remove the symlink
      fs.unlinkSync(entryPath);

      if (realStat.isDirectory()) {
        // Recursively copy directory
        copyDirRecursive(realPath, entryPath);
        // Now dereference any symlinks in the newly copied directory
        dereferenceSymlinks(entryPath);
      } else {
        // Copy file
        fs.copyFileSync(realPath, entryPath);
      }
    } else if (stat.isDirectory()) {
      dereferenceSymlinks(entryPath);
    }
    // If it's a file, do nothing
  }
}

/**
 * Recursively copies a directory.
 * @param src Source directory
 * @param dest Destination directory
 */
function copyDirRecursive(src: string, dest: string) {
  if (!path.isAbsolute(src)) {
    throw new Error(`Expected absolute path, got: ${src}`);
  }
  if (!path.isAbsolute(dest)) {
    throw new Error(`Expected absolute path, got: ${dest}`);
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const srcEntry = path.join(src, entry);
    const destEntry = path.join(dest, entry);
    const stat = fs.lstatSync(srcEntry);

    if (stat.isDirectory()) {
      copyDirRecursive(srcEntry, destEntry);
    } else {
      fs.copyFileSync(srcEntry, destEntry);
    }
  }
}

