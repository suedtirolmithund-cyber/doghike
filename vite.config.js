import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { fetchProxiedImage } from './api/image-proxy.js'

async function handleImageProxy(req, res) {
  const requestUrl = new URL(req.url ?? '', 'http://localhost')
  const result = await fetchProxiedImage(requestUrl.searchParams.get('url'), req.method)

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
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/image-proxy', handleImageProxy)
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
