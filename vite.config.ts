import { svelte } from '@sveltejs/vite-plugin-svelte';
import type { UserConfig } from 'vite';
import path from 'path';

const config: UserConfig = {
  plugins: [svelte()],
  resolve: {
    alias: {
      $lib: path.resolve(__dirname, './src/lib')
    }
  },
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/lib/index.js'),
      name: 'SvelteDayPicker',
      fileName: format => `svelte-day-picker.${format}.js`
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: ['svelte'],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {
          svelte: 'Svelte'
        }
      }
    }
  }
};

export default config;
