import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { VitePWA } from 'vite-plugin-pwa'
import compression from 'vite-plugin-compression2'
// import { bundleAnalyzer } from 'vite-bundle-analyzer'
import autoprefixer from 'autoprefixer'
import tailwindcss from 'tailwindcss'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isProduction = mode === 'production'
  
  return {
    plugins: [
      react(),
      
      // Modern compression with vite-plugin-compression2
      isProduction && compression({
        include: /\.(js|css|html|svg)$/,
        algorithm: 'gzip',
        threshold: 1024,
        deleteOriginFile: false
      }),
      
      isProduction && compression({
        include: /\.(js|css|html|svg)$/,
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
        deleteOriginFile: false
      }),
      
      // PWA with service worker for advanced caching
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'iPEC Coach Connect',
          short_name: 'iPEC Connect',
          description: 'Connect with certified iPEC coaches for personalized coaching sessions',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      }),
      
      // Bundle analyzer with advanced metrics
      command === 'build' && visualizer({
        filename: 'dist/stats.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
        template: 'treemap'
      })
    ].filter(Boolean),
    
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'zustand',
        'date-fns',
        'geolib',
        'react-intersection-observer',
        'class-variance-authority',
        '@supabase/supabase-js',
        '@supabase/postgrest-js',
        '@supabase/realtime-js',
        '@supabase/storage-js',
        '@supabase/auth-js'
      ],
      exclude: [
        'lucide-react',
        'framer-motion', // Lazy load this heavy library
        'embla-carousel-react', // Lazy load carousel components
        'stripe' // Only load when needed for payments
      ],
      esbuildOptions: {
        target: 'esnext',
        supported: {
          'top-level-await': true
        },
        define: {
          global: 'globalThis'
        }
      },
      // Force pre-bundling of Supabase packages to resolve CommonJS/ESM issues
      force: true
    },
    
    // Advanced dependency optimization
    ssr: {
      noExternal: [
        '@supabase/supabase-js',
        '@supabase/postgrest-js',
        '@supabase/storage-js', 
        '@supabase/realtime-js',
        '@supabase/auth-js'
      ]
    },
    
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      },
    },
    
    build: {
      target: ['esnext', 'edge88', 'firefox78', 'chrome87', 'safari14'],
      minify: 'terser',
      cssCodeSplit: true,
      sourcemap: false, // Disable sourcemaps in production
      chunkSizeWarningLimit: 1000,
      
      // Performance budgets
      assetsInlineLimit: 4096, // Inline assets < 4KB
      
      // Prevent empty chunks
      emptyOutDir: true,
      
      // Output optimization
      reportCompressedSize: false, // Faster builds
      
      // Rollup options for advanced optimization
      rollupOptions: {
        // External dependencies for CDN loading (optional)
        external: [],
        
        // Input options
        input: {
          main: resolve(__dirname, 'index.html'),
          // Preload critical resources
          preload: resolve(__dirname, 'src/utils/preload.ts')
        },
        
        // Tree shaking configuration
        treeshake: {
          moduleSideEffects: false,
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false
        },
      
        output: {
          // Modern chunk splitting for better caching (replaces vite-plugin-chunk-split)
          manualChunks: (id) => {
            // Vendor chunks from node_modules
            if (id.includes('node_modules')) {
              // React ecosystem
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
                return 'react-vendor'
              }
              
              // Heavy UI libraries
              if (id.includes('framer-motion') || id.includes('embla-carousel')) {
                return 'ui-heavy'
              }
              
              // Backend services
              if (id.includes('@supabase') || id.includes('stripe')) {
                return 'backend-services'
              }
              
              // Utilities that rarely change
              if (id.includes('date-fns') || id.includes('geolib') || id.includes('class-variance-authority')) {
                return 'utils-stable'
              }
              
              // State management
              if (id.includes('zustand')) {
                return 'state-management'
              }
              
              // Testing libraries (shouldn't be in production but just in case)
              if (id.includes('@testing-library') || id.includes('vitest')) {
                return 'dev-tools'
              }
              
              // Everything else from node_modules goes to vendor
              return 'vendor'
            }
          },
          
          // Optimize asset filenames
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            
            if (/\.(woff|woff2|eot|ttf|otf)$/.test(assetInfo.name)) {
              return `assets/fonts/[name]-[hash][extname]`
            }
            
            if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/.test(assetInfo.name)) {
              return `assets/images/[name]-[hash][extname]`
            }
            
            if (ext === 'css') {
              return `assets/css/[name]-[hash][extname]`
            }
            
            return `assets/[name]-[hash][extname]`
          },
          
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[^/.]+$/, '')
            : 'chunk'
            
            return `assets/js/[name]-[hash].js`
          },
          
          entryFileNames: 'assets/js/[name]-[hash].js'
        }
      },
      
      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug', 'console.warn'] : [],
          passes: 2,
          dead_code: true,
          unused: true,
          reduce_vars: true,
          collapse_vars: true
        },
        mangle: {
          properties: false,
          safari10: true
        },
        format: {
          comments: false,
          ecma: 2020
        }
      }
    },
    
    server: {
      host: true,
      port: 5173,
      open: true,
      hmr: {
        overlay: false
      }
    },
    
    preview: {
      host: true,
      port: 4173,
      open: true
    },
    
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __DEV__: !isProduction
    },
    
    // CSS optimization
    css: {
      postcss: {
        plugins: [
          tailwindcss,
          autoprefixer
        ]
      }
    }
  }
})
