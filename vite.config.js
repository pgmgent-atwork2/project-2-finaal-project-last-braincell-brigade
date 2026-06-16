import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        login: resolve(__dirname, 'src/views/login.html'),
        home: resolve(__dirname, 'src/views/home.html'),
        drinks: resolve(__dirname, 'src/views/drinks.html'),
        planning: resolve(__dirname, 'src/views/planning.html'),
        account: resolve(__dirname, 'src/views/myAccount.html'),
        admin: resolve(__dirname, 'src/views/admin.html'),
        drinksEditor: resolve(__dirname, 'src/views/drinks-editor.html'),
        availability: resolve(__dirname, 'src/views/availability.html'),
        users: resolve(__dirname, 'src/views/users.html'),
        orders: resolve(__dirname, 'src/views/orders.html'),
        matches: resolve(__dirname, 'src/views/matches.html'),
      }
    }
  }
});