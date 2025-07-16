rm docs_bundle.tar.gz
tar -czf docs_bundle.tar.gz -C packages/fern-docs/bundle/.next/standalone .
rm -rf .next
mkdir .next
cd .next
mkdir standalone
cd ..
tar -xzf docs_bundle.tar.gz -C .next/standalone
