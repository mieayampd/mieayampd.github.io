import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Custom Plugin for Blog Generation
const blogWatcher = () => ({
  name: 'blog-watcher',
  configureServer(server) {
    const runGen = () => {
      exec('node scripts/blog-gen.js', (err, stdout, stderr) => {
        if (err) console.error('Blog Gen Error:', err);
        if (stdout) console.log('Blog Gen:', stdout.trim());
        server.ws.send({ type: 'full-reload' });
      });
    };

    server.watcher.add([
      path.resolve(__dirname, 'content/blog/*.md'),
      path.resolve(__dirname, 'blog/template.html')
    ]);
    
    server.watcher.on('change', (file) => {
      if (file.endsWith('.md') || file.endsWith('template.html')) {
        runGen();
      }
    });
  }
});

export default defineConfig({
  plugins: [
    tailwindcss(),
    blogWatcher(),
    ViteImageOptimizer({
      test: /\.(jpe?g|png|gif|tiff|webp|svg|avif)$/i,
      exclude: undefined,
      include: undefined,
      includePublic: true,
      logStats: true,
      ansiColors: true,
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                cleanupNumericValues: false,
                removeViewBox: false, // keep viewBox because it's important for scaling
                noSpaceAfterFlags:  true,
              },
            },
          },
          'sortAttrs',
          {
            name: 'addAttributesToSVGElement',
            params: {
              attributes: [{ xmlns: 'http://www.w3.org/2000/svg' }],
            },
          },
        ],
      },
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      webp: {
        lossless: false,
        quality: 80,
      },
      avif: {
        lossless: false,
        quality: 70,
      },
    }),
  ],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      /* MABE_INPUTS_START */
      input: {
        'main': './index.html',
        'order': './order/index.html',
        'menu': './menu/index.html',
        'game': './game/index.html',
        'blog': './blog/index.html',
        'blog-bot-whatsapp-printer-kasir-solusi-cerdas-and-murah-untuk-warung-mie-ayam': './blog/bot-whatsapp-printer-kasir-solusi-cerdas-and-murah-untuk-warung-mie-ayam/index.html',
        'blog-panduan-menghubungkan-vps-ke-cloudflare-amankan-ip-and-proteksi-maksimal': './blog/panduan-menghubungkan-vps-ke-cloudflare-amankan-ip-and-proteksi-maksimal/index.html',
        'blog-bagaimana-situs-kami-mencapai-skor-pagespeed-100percent': './blog/bagaimana-situs-kami-mencapai-skor-pagespeed-100percent/index.html',
        'blog-sekilas-tentang-mie-ayam-pak-dul': './blog/sekilas-tentang-mie-ayam-pak-dul/index.html'
      }
      /* MABE_INPUTS_END */
    },
  },
});
