import { build } from 'esbuild'
import { existsSync } from 'node:fs'
import { mkdir, rename, rm } from 'node:fs/promises'

const EXTERNALS = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-native',
  'react-native-web',
]

const sharedConfig = {
  bundle: true,
  target: ['es2019'],
  jsx: 'automatic',
  logLevel: 'info',
  external: EXTERNALS,
}

await rm('dist', { recursive: true, force: true })
await mkdir('dist', { recursive: true })

await build({
  ...sharedConfig,
  entryPoints: ['src/lib/index.ts'],
  platform: 'browser',
  format: 'esm',
  outfile: 'dist/index.js',
})

if (existsSync('dist/index.css')) {
  await rename('dist/index.css', 'dist/styles.css')
}

await build({
  ...sharedConfig,
  entryPoints: ['src/lib/index.ts'],
  platform: 'browser',
  format: 'cjs',
  outfile: 'dist/index.cjs',
  loader: {
    '.css': 'empty',
  },
})

await build({
  ...sharedConfig,
  entryPoints: ['src/rn/OverlappingCardsScrollRN.native.tsx'],
  platform: 'neutral',
  format: 'esm',
  outfile: 'dist/react-native.js',
})

await build({
  ...sharedConfig,
  entryPoints: ['src/rn/OverlappingCardsScrollRN.native.tsx'],
  platform: 'neutral',
  format: 'cjs',
  outfile: 'dist/react-native.cjs',
})

await build({
  ...sharedConfig,
  entryPoints: ['src/rn/OverlappingCardsScrollRN.web.tsx'],
  platform: 'browser',
  format: 'esm',
  outfile: 'dist/react-native-web.js',
  loader: {
    '.css': 'empty',
  },
})

await build({
  ...sharedConfig,
  entryPoints: ['src/rn/OverlappingCardsScrollRN.web.tsx'],
  platform: 'browser',
  format: 'cjs',
  outfile: 'dist/react-native-web.cjs',
  loader: {
    '.css': 'empty',
  },
})

if (!existsSync('dist/styles.css')) {
  throw new Error('Package build failed because dist/styles.css was not generated.')
}
