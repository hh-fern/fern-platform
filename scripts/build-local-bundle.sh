cross-env NODE_ENV=production pnpm --filter=@fern-docs/bundle docs:build:local
cp -r packages/fern-docs/bundle/.next/static packages/fern-docs/bundle/.next/standalone/packages/fern-docs/bundle/.next
find packages/fern-docs/bundle/.next -depth -mindepth 1 -not -path "packages/fern-docs/bundle/.next/standalone*" -exec rm -rf {} \;
# cd ./packages/fern-docs/bundle
# cp -r .next/static .next/standalone/packages/fern-docs/bundle/.next && cp -r public .next/standalone/packages/fern-docs/bundle
# find .next -depth -mindepth 1 -not -path ".next/standalone*" -exec rm -rf {} \;
# rm -rf .next/standalone/node_modules/.pnpm/esbuild@0.25.0 && rm -rf .next/standalone/node_modules/.pnpm/@esbuild+linux-x64@0.25.0
# cd ../../../
tar --no-xattrs -czf docs_bundle.tar.gz -C packages/fern-docs/bundle/.next/standalone .
# Note: The following PowerShell Compress-Archive command (for Windows) will NOT preserve symlinks; 
# any symlinks in the source directory will be included as regular files/directories (full copies of the targets).
# powershell -Command "Compress-Archive -Path packages/fern-docs/bundle/.next/standalone\* -DestinationPath docs_bundle.zip"
