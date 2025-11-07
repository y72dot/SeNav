import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";
import path from "path";
import BackgroundManifestPlugin from "./scripts/vite-plugin-background-manifest.mjs";

const deployTarget = process.env.DEPLOY_TARGET || 'github';

// https://vitejs.dev/config/
export default defineConfig({
  base: deployTarget === 'halo' ? '/SeNav/' : './',
  plugins: [
    vue(),
    // 开发期间自动维护 public/background/manifest.json
    BackgroundManifestPlugin(),
    // PWA
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /(.*?)\.(woff2|woff|ttf)/,
            handler: "CacheFirst",
            options: {
              cacheName: "file-cache",
            },
          },
          {
            urlPattern: /(.*?)\.(webp|png|jpe?g|svg|gif|bmp|psd|tiff|tga|eps)/,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
            },
          },
        ],
      },
      manifest: {
        name: "SeNav",
        short_name: "SeNav",
        description: "一个极致简约的导航页",
        display: "standalone",
        start_url: "./",
        theme_color: "#fff",
        background_color: "#efefef",
        icons: [
          {
            src: "./icon/logo-144.png",
            sizes: "144x144",
            type: "image/png",
          },
        ],
      },
    }),
    // viteCompression
    viteCompression(),
  ],
  server: {
    port: 5588,
    open: true,
  },
  resolve: {
    // 配置路径别名
    alias: {
      // eslint-disable-next-line no-undef
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
      }
    }
  },
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        // 生产环境时移除 console
        pure_funcs: ["console.log"],
      },
    },
  },
});
