import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/components/SearchWidget.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  external: ['react', 'react-dom', 'next'],
  outDir: 'dist',
  minify: true,
  bundle: true
})