import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fetchProxiedImage } from './api/image-proxy.js'

function decodeMediaSource(value) {
  if (!value) return null

  try {
    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=')
    return Buffer.from(padded, 'base64').toString('utf8')
  } catch {
    try {
      return decodeURIComponent(value)
    } catch {
      return null
    }
  }
}

async function handleImageProxy(req, res) {
  const requestUrl = new URL(req.url ?? '', 'http://localhost')
  const result = await fetchProxiedImage(requestUrl.searchParams.get('url'), req.method)

  for (const [name, value] of Object.entries(result.headers ?? {})) {
    res.setHeader(name, value)
  }

  res.statusCode = result.status
  res.end(result.body ?? undefined)
}

async function handleMedia(req, res) {
  const requestUrl = new URL(req.url ?? '', 'http://localhost')
  const result = await fetchProxiedImage(decodeMediaSource(requestUrl.searchParams.get('src')), req.method)

  for (const [name, value] of Object.entries(result.headers ?? {})) {
    res.setHeader(name, value)
  }

  res.statusCode = result.status
  res.end(result.body ?? undefined)
}

function dogtrailsImageProxyPlugin() {
  return {
    name: 'dogtrails-image-proxy',
    configureServer(server) {
      server.middlewares.use('/api/image-proxy', handleImageProxy)
      server.middlewares.use('/api/media', handleMedia)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/image-proxy', handleImageProxy)
      server.middlewares.use('/api/media', handleMedia)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  resolve: {
    alias: {
      '@/components/ui/Button': path.resolve(__dirname, './src/components/ui/button.jsx'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [
    react(),
    dogtrailsImageProxyPlugin(),
  ]
});
