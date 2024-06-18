import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue'
import Checker from 'vite-plugin-checker'
import { VitePWA } from 'vite-plugin-pwa'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate', devOptions: {
        enabled: true
      }
    }),
    Checker({ typescript: true }),
    AutoImport({
      imports: [
        'vue',
        {
          'naive-ui': ['useDialog', 'useMessage', 'useNotification', 'useLoadingBar'],
        },
      ],
    }),
    Components({
      resolvers: [NaiveUiResolver()]
    })
  ],
  server: {
    port: Number(loadEnv('', process.cwd(), 'VITE_PORT')?.['VITE_PORT']) || 8080, 
    proxy: {
      '/api': {
        target: 'http://localhost:' + loadEnv('', process.cwd(), 'VITE_PROXY')?.['VITE_PROXY'] || 8081,
        changeOrigin: true,
        secure: false,
        ws: true,
      }
    }
  }
})
