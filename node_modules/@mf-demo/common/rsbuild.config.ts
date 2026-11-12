import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  server: { port: 3003 },
  source: { entry: { main: './src/index.ts' } },
  moduleFederation: {
    options: {
      name: 'common',
      filename: 'remoteEntry.js',
      exposes: {
        './useUserStore': './src/store/useUserStore',
        './eventBus': './src/eventBus', // 下一步做业务能力时再加
      },
      shared: {
        react: { singleton: true },
        zustand: { singleton: true }, // 只共享 zustand，不加 eager
      },
    },
  },
});
