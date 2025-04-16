import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/widget.js',
      name: 'BixbyWidget',
      fileName: 'bixby-widget',
      formats: ['iife']
    },
    rollupOptions: {
      output: {
        manualChunks: undefined,
        entryFileNames: 'bixby-widget.js',
        assetFileNames: 'bixby-widget.[ext]',
        compact: true,
        generatedCode: {
          preset: 'smallest'
        }
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        pure_getters: true,
        unsafe: true,
        unsafe_arrows: true,
        unsafe_comps: true,
        unsafe_Function: true,
        unsafe_math: true,
        unsafe_methods: true,
        unsafe_proto: true,
        unsafe_regexp: true,
        unsafe_undefined: true
      },
      mangle: {
        properties: {
          regex: /^_/
        }
      },
      format: {
        comments: false,
        ecma: 5,
        wrap_iife: true,
        webkit: true
      }
    },
    sourcemap: true,
    target: 'es5',
    reportCompressedSize: true
  },
  server: {
    port: 5174
  }
});