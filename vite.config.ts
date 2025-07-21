import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
// import { visualizer } from 'rollup-plugin-visualizer'
import { splitVendorChunkPlugin } from 'vite'
// import { VitePWA } from 'vite-plugin-pwa'
// import { compressionPlugin } from 'vite-plugin-compression'
// import { chunkSplitPlugin } from 'vite-plugin-chunk-split'
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
      
      // Advanced chunk splitting for better caching
      // chunkSplitPlugin({
      //   strategy: 'split-by-experience',
      //   customSplitting: {
      //     // Critical libraries that change frequently
      //     'react-vendor': ['react', 'react-dom', 'react-router-dom'],
      //     
      //     // Heavy UI libraries
      //     'ui-heavy': ['framer-motion', 'embla-carousel-react'],
      //     
      //     // Backend services
      //     'backend-services': ['@supabase/supabase-js', 'stripe'],
      //     
      //     // Utilities that rarely change
      //     'utils-stable': ['date-fns', 'geolib', 'class-variance-authority'],
      //     
      //     // State management
      //     'state-management': ['zustand'],
      //     
      //     // Development tools (dev only)
      //     'dev-tools': ['@testing-library/react', 'vitest']
      //   }
      // }),
      
      splitVendorChunkPlugin(),
      
      // Compression for production
      // isProduction && compressionPlugin({
      //   ext: '.gz',
      //   algorithm: 'gzip',
      //   threshold: 1024,
      //   deleteOriginFile: false
      // }),
      
      // isProduction && compressionPlugin({
      //   ext: '.br',
      //   algorithm: 'brotliCompress',
      //   threshold: 1024,
      //   deleteOriginFile: false
      // }),
      
      // PWA with service worker for advanced caching
      // TODO: Re-enable PWA when vite-plugin-pwa is properly installed
      
      // Bundle analyzer with advanced metrics
      // command === 'build' && visualizer({
      //   filename: 'dist/stats.html',
      //   open: true,
      //   gzipSize: true,
      //   brotliSize: true,
      //   template: 'treemap'
      // }),
      
      // Bundle size monitoring
      // command === 'build' && bundleAnalyzer({
      //   analyzerMode: 'server',
      //   openAnalyzer: false,
      //   generateStatsFile: true,
      //   statsFilename: 'dist/bundle-stats.json'
      // })
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
      sourcemap: isProduction ? false : 'inline',
      chunkSizeWarningLimit: 1000,
      
      // Performance budgets
      assetsInlineLimit: 4096, // Inline assets < 4KB
      
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
          // Advanced chunk naming with performance hints
          manualChunks: (id) => {
            // Critical path optimizations
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('scheduler/')) {
              return 'react-core'
            }
            
            if (id.includes('react-router')) {
              return 'router'
            }
            
            // Heavy UI libraries - separate chunks for better caching
            if (id.includes('framer-motion')) {
              return 'animation-engine'
            }
            
            if (id.includes('embla-carousel')) {
              return 'carousel-engine'
            }
            
            if (id.includes('lucide-react')) {
              return 'icons'
            }
            
            // Backend services - critical but separate
            if (id.includes('@supabase/supabase-js')) {
              return 'backend-core'
            }
            
            if (id.includes('stripe')) {
              return 'payment-engine'
            }
            
            if (id.includes('ioredis')) {
              return 'cache-engine'
            }
            
            // Utilities - stable chunks
            if (id.includes('date-fns')) {
              return 'date-utils'
            }
            
            if (id.includes('geolib')) {
              return 'geo-utils'
            }
            
            if (id.includes('zustand')) {
              return 'state-management'
            }
            
            if (id.includes('class-variance-authority')) {
              return 'css-utils'
            }
            
            if (id.includes('react-intersection-observer')) {
              return 'intersection-observer'
            }
            
            // Advanced page chunking with priority
            if (id.includes('/pages/auth/')) {
              return 'pages-auth'
            }
            
            if (id.includes('/pages/onboarding/')) {
              return 'pages-onboarding'
            }
            
            if (id.includes('/pages/community/')) {
              return 'pages-community'
            }
            
            if (id.includes('/pages/learning/')) {
              return 'pages-learning'
            }
            
            if (id.includes('/pages/settings/')) {
              return 'pages-settings'
            }
            
            if (id.includes('/pages/messages/')) {
              return 'pages-messaging'
            }
            
            // Core pages (high priority)
            if (id.includes('/pages/Home') || id.includes('/pages/Dashboard') || id.includes('/pages/Profile')) {
              return 'pages-core'
            }
            
            // Coach-related pages
            if (id.includes('/pages/Coach') || id.includes('/pages/Booking') || id.includes('/pages/MySessions')) {
              return 'pages-coaching'
            }
            
            // Info pages (low priority)
            if (id.includes('/pages/')) {
              return 'pages-info'
            }
            
            // Component chunking with better granularity
            if (id.includes('/components/auth/')) {
              return 'components-auth'
            }
            
            if (id.includes('/components/sections/')) {
              return 'components-sections'
            }
            
            if (id.includes('/components/ui/')) {
              return 'components-ui'
            }
            
            if (id.includes('/components/')) {
              return 'components-common'
            }
            
            // Services chunking
            if (id.includes('/services/')) {
              return 'services'
            }
            
            // Hooks and utilities
            if (id.includes('/hooks/') || id.includes('/lib/')) {
              return 'utils'
            }
            
            // Fallback for other node_modules
            if (id.includes('node_modules')) {
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
          pure_funcs: isProduction ? ['console.log', 'console.info'] : [],
          passes: 2
        },
        mangle: {
          properties: false
        },
        format: {
          comments: false
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
