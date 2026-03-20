import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import basicSsl from '@vitejs/plugin-basic-ssl'

// three.js r183 accidentally ships a live debug import in three.webgpu.js:
//   import 'https://greggman.github.io/...'
// The source has it commented out but the build step stripped the comment.
// When that URL fetch fails (CORS, CSP, firewall, offline) the entire
// WebGPUBackend module throws during import, three.js catches it and silently
// falls back to WebGL2. Strip it at transform time so WebGPU initialises cleanly.
const stripThreeDebugImport = {
  name: 'strip-three-webgpu-debug-import',
  transform(code: string, id: string) {
    if (/three[/\\]build[/\\]three\.webgpu/.test(id)) {
      return code.replace(
        /import\s+'https:\/\/greggman\.github\.io[^']*';/g,
        '/* debug import stripped */',
      )
    }
  },
}

export default defineConfig({
  plugins: [basicSsl(), stripThreeDebugImport, svelte()],
  server: { host: true },
})
