// uncomment this to log the tree to the console in localhost only (DO NOT COMMIT)
// function rehypeLog() {
//   return (_tree: Hast.Root) => {
//     // console.debug(JSON.stringify(tree));
//   };
// }
import { LocalAccountSigner } from "@aa-sdk/core";
import {
  alchemy,
  createAlchemySmartAccountClient,
  sepolia,
} from "@account-kit/infra";
import { createLightAccount } from "@account-kit/smart-contracts";
import { RehypeShikiOptions } from "@shikijs/rehype";
import {
  transformerNotationDiff,
  transformerNotationFocus,
  transformerNotationHighlight,
} from "@shikijs/transformers";
import { transformerTwoslash } from "@shikijs/twoslash";
import { bundleMDX } from "mdx-bundler";
import path from "path";
import ts from "typescript";
import { generatePrivateKey } from "viem/accounts";

import { isNonNullish } from "@fern-api/ui-core-utils";
import {
  type PluggableList,
  sanitizeBreaks,
  sanitizeMdxExpression,
  // toTree,
} from "@fern-docs/mdx";

import { rehypeShikiDisplayNotation } from "./plugins/display-shiki-notation";
import { conditionalRehypeShiki } from "./plugins/rehype-shiki-twoslash";
import { twoslashRenderer } from "./plugins/twoslashRenderer";
import { twoslasher } from "./plugins/twoslasher";

// import { FileData } from "./types";

// gracefulify fs to avoid EMFILE errors on Vercel
// gracefulify(fs);

export interface SerializeMdxResponse {
  code: string;
  jsxElements: string[];
}

// const execPromise = promisify(exec);

async function serializeTwoslashImpl(
  content: string
): Promise<SerializeMdxResponse> {
  content = sanitizeBreaks(content);
  content = sanitizeMdxExpression(content)[0];

  // let cwd: string | undefined;
  // if (filename != null) {
  //   try {
  //     cwd = path.dirname(filename);
  //   } catch {
  //     console.error("Failed to get cwd from filename", filename);
  //   }

  if (process.platform === "win32") {
    process.env.ESBUILD_BINARY_PATH = path.join(
      process.cwd(),
      "node_modules",
      "esbuild",
      "esbuild.exe"
    );
  } else {
    process.env.ESBUILD_BINARY_PATH = path.join(
      process.cwd(),
      "node_modules",
      "esbuild",
      "bin",
      "esbuild"
    );
  }

  const hasTwoslash = content.includes("twoslash");

  // Try to download package.json and install dependencies if twoslash is used and node_modules doesn't exist
  // if (hasTwoslash && !fs.existsSync("/tmp/node_modules")) {
  //   try {
  //     const dependencies: Record<string, string> = {
  //       "@aa-sdk/core": "^4.31.2",
  //       "@account-kit/core": "^4.31.2",
  //       "@account-kit/infra": "^4.31.2",
  //       "@account-kit/react": "^4.31.2",
  //       "@account-kit/react-native": "^4.31.2",
  //       "@account-kit/react-native-signer": "^4.31.2",
  //       "@account-kit/signer": "^4.31.2",
  //       "@account-kit/smart-contracts": "^4.31.2",
  //       "@tanstack/react-query": "^5.71.1",
  //       "@types/hast": "^3.0.4",
  //       "@typescript/vfs": "^1.6.1",
  //       react: "^19.0.0",
  //       "react-dom": "^19.0.0",
  //       viem: "2.22.6",
  //       google: "link:next/font/google",
  //       "parse-numeric-range": "^1.3.0",
  //       "qrcode.react": "^4.2.0",
  //       "react-native": "^0.79.2",
  //     };
  //     const devDependencies: Record<string, string> = {
  //       "@types/node": "^20.17.32",
  //       "@types/react": "^19.0.10",
  //       "@types/react-dom": "^19.0.4",
  //       tsx: "^4.7.1",
  //       typescript: "^5.0.0",
  //     };

  //     // Filter dependencies to only include those mentioned in the content
  //     const filteredDependencies: Record<string, string> = {};
  //     for (const [key, value] of Object.entries(dependencies)) {
  //       if (content.includes(key)) {
  //         filteredDependencies[key] = value;
  //       }
  //     }

  //     console.log("Attempting to create package.json for twoslash...");

  //     const packageJsonPath = path.join("/tmp", "package.json");

  //     // Write the package.json file directly
  //     await fs.promises.writeFile(
  //       packageJsonPath,
  //       JSON.stringify(
  //         {
  //           name: "docs",
  //           private: true,
  //           version: "3.8.2-alpha.1",
  //           type: "module",
  //           dependencies: filteredDependencies,
  //           devDependencies,
  //         },
  //         null,
  //         2
  //       )
  //     );

  //     console.log(`Created package.json at ${packageJsonPath}`);
  //     // Run npm install in the tmp directory
  //     console.log("Running npm install in /tmp...");
  //     await execPromise("pnpm install", {
  //       cwd: "/tmp",
  //     });
  //     console.log("Successfully installed dependencies in /tmp");
  //   } catch (error) {
  //     console.error(
  //       "Error creating package.json or installing dependencies:",
  //       error
  //     );
  //   }
  // }

  // let files: Record<string, string> = {};
  // let remoteFiles: Record<string, FileData> = {};
  const jsxElements: string[] = [];

  // remoteFiles = (await loader?.getFiles?.()) ?? {};
  // files = (await loader?.getMdxBundlerFiles?.()) ?? {};
  // files = mapKeys(files ?? {}, (_file, filename) => {
  //   if (cwd != null) {
  //     return path.relative(cwd, filename);
  //   }
  //   return filename;
  // });

  const bundled = await bundleMDX({
    source: content,
    // files,

    globals: {
      "@mdx-js/react": {
        varName: "MdxJsReact",
        namedExports: ["useMDXComponents"],
        defaultExport: false,
      },
    },

    mdxOptions: (o) => {
      // o.remarkRehypeOptions = {
      //   handlers: { heading: customHeadingHandler },
      // };

      o.providerImportSource = "@mdx-js/react";

      const rehypePlugins: PluggableList = [
        [
          conditionalRehypeShiki,
          {
            themes: {
              light: "min-light",
              dark: "material-theme-darker",
            },
            transformers: [
              transformerNotationDiff(),
              transformerNotationFocus(),
              transformerNotationHighlight(),
              hasTwoslash
                ? transformerTwoslash({
                    explicitTrigger: true,
                    throws: false,
                    twoslasher: twoslasher(),
                    renderer: twoslashRenderer(),
                    twoslashOptions: {
                      customTags: ["allowErrors"],
                      compilerOptions: {
                        target: ts.ScriptTarget.ES2020,
                        module: ts.ModuleKind.ESNext,
                        moduleResolution: ts.ModuleResolutionKind.Node10,
                        esModuleInterop: true,
                        jsx: ts.JsxEmit.ReactJSX,
                        lib: ["dom", "dom.iterable", "esnext"],
                        skipLibCheck: true,
                        allowJs: true,
                        resolveJsonModule: true,
                        isolatedModules: true,
                        noEmit: true,
                        strict: true,
                        forceConsistentCasingInFileNames: true,
                        allowSyntheticDefaultImports: true,
                        moduleDetection: ts.ModuleDetectionKind.Force,
                        verbatimModuleSyntax: true,
                        baseUrl: process.cwd(),
                        paths: {
                          "@aa-sdk/*": ["node_modules/@aa-sdk/*"],
                          "@account-kit/*": ["node_modules/@account-kit/*"],
                          "viem/*": ["node_modules/viem/*"],
                        },
                      },
                      vfsRoot: process.cwd(),
                    },
                  })
                : null,
            ].filter(isNonNullish),
          } satisfies RehypeShikiOptions,
          rehypeShikiDisplayNotation,
        ],
      ];

      // o.remarkPlugins = remarkPlugins;
      o.rehypePlugins = rehypePlugins;

      o.development = process.env.NODE_ENV === "development";

      return o;
    },

    esbuildOptions: (o) => {
      o.minify = process.env.NODE_ENV === "production";
      o.sourcemap = false;

      o.logLevel = "error"; // Reduce logging overhead

      o.logLimit = 0; // Disable logging to reduce file operations
      o.metafile = false; // Don't generate metafile (reduces file operations)

      // Add write to memory instead of disk when possible
      o.write = false;

      // Create a restricted define object that excludes process.env
      o.define = {
        "process.env.NODE_ENV": JSON.stringify(
          process.env.NODE_ENV || "development"
        ),
      };

      // Prevent direct process access
      o.inject = o.inject?.filter((path) => !path.includes("process"));

      return o;
    },
  });

  if (bundled.errors.length > 0) {
    bundled.errors.forEach((error) => {
      console.error(error);
    });
    console.debug("content", content, "code", bundled.code);
  }

  // TODO: this is doing duplicate work; figure out how to combine it with the compiler above.
  // const { jsxElements } = toTree(content, { sanitize: false });

  return { code: bundled.code, jsxElements };
}

export function serializeTwoslash(
  content: string | undefined
): Promise<SerializeMdxResponse | undefined> {
  const abortController = new AbortController();
  const { signal } = abortController;

  return new Promise<SerializeMdxResponse | undefined>((resolve, reject) => {
    if (!content?.trimStart().length) {
      resolve(undefined);
      return;
    }

    const timeoutId = setTimeout(() => {
      if (!signal.aborted) {
        abortController.abort();
        console.error("Serialize MDX timed out after 10 seconds");
        reject(new Error("Serialize MDX timed out"));
      }
    }, 60_000);

    serializeTwoslashImpl(content).then(
      (result) => {
        clearTimeout(timeoutId);
        resolve(result);
      },
      (error: unknown) => {
        clearTimeout(timeoutId);
        reject(error instanceof Error ? error : new Error(String(error)));
        console.error(error);
      }
    );
  });
}

// }

// eslint-disable-next-line unused-imports/no-unused-vars
const doNotRun = async () => {
  // with account hoisting
  const transport = alchemy({ apiKey: "your-api-key" });
  const hoistedClient = createAlchemySmartAccountClient({
    transport,
    chain: sepolia,
    account: await createLightAccount({
      signer:
        LocalAccountSigner.privateKeyToAccountSigner(generatePrivateKey()),
      chain: sepolia,
      transport,
    }),
  });

  const signature = await hoistedClient.signMessage({
    message: "Hello world! ",
  });
  console.log(signature);

  // without account hoisting
  const nonHoistedClient = createAlchemySmartAccountClient({
    transport,
    chain: sepolia,
  });

  const lightAccount = await createLightAccount({
    signer: LocalAccountSigner.privateKeyToAccountSigner(generatePrivateKey()),
    chain: sepolia,
    transport,
  });

  const signature2 = await nonHoistedClient.signMessage({
    message: "Hello world! ",
    account: lightAccount,
  });
  console.log(signature2);
};
