import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { pluginSass } from '@rsbuild/plugin-sass';

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],

  server: {
    port: 3001,
  },

  output: {
    // 入口 HTML 命名为 index.html，dev server 的 htmlFallback 才能把 / 回退到入口页
    filename: {
      html: 'index.html',
    },
  },

  moduleFederation: {
    options: {
      name: 'remote',
      filename: 'remoteEntry.js',
      // 暴露给子应用的模块
      exposes: {
        './UserCenter': './src/pages/UserCenter',
        './meta': './src/mf-meta', //子组件注册暴露
      },
      // 消费远程子应用
      remotes: {
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
