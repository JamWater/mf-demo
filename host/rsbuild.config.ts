import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],

  server: {
    port: 3000,
  },

  output: {
    // 入口 HTML 命名为 index.html，dev server 的 htmlFallback 才能把 / 回退到入口页
    filename: {
      html: 'index.html',
    },
  },

  moduleFederation: {
    options: {
      name: 'host',
      filename: 'remoteEntry.js',
      // 暴露给子应用的模块
      //   exposes: {
      //     './useUserStore': './src/store/useUserStore',
      //   },
      // 消费远程子应用
      remotes: {
        // remote: 'remote@http://localhost:3001/remoteEntry.js',
        // remoteOrder: 'remoteOrder@http://localhost:3002/remoteEntry.js', // 新增
        common: 'common@http://localhost:3003/remoteEntry.js',
      },
      // 共享依赖
      shared: {
        react: { singleton: true },
        'react-dom': { singleton: true },
        'react-router-dom': { singleton: true },
        zustand: { singleton: true },
      },
    },
  },
});
