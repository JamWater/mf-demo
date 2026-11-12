import { defineConfig } from "@rsbuild/core";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSass } from "@rsbuild/plugin-sass";

export default defineConfig({
  plugins: [pluginReact(), pluginSass()],

  server: {
    port: 3002, // 新端口，不能和现有应用冲突
  },

  output: {
    // 入口 HTML 命名为 index.html，dev server 的 htmlFallback 才能把 / 回退到入口页
    filename: {
      html: "index.html",
    },
  },

  source: {
    entry: {
      main: "./src/index.ts",
    },
  },

  moduleFederation: {
    options: {
      name: "remoteOrder", // 应用名必须全局唯一，不能和 host/remote 重复
      filename: "remoteEntry.js",
      // 暴露给基座的模块
      exposes: {
        "./OrderCenter": "./src/pages/OrderCenter", // 暴露整个订单中心路由模块  老模式路由
        "./meta": "./src/mf-meta", //子组件注册暴露
        "./routes": "./src/routes", //新模式路由
      },
      // 消费基座的全局能力
      remotes: {
        common: "common@http://localhost:3003/remoteEntry.js",
      },
      // 共享依赖，和基座对齐，保证单例
      shared: {
        react: { singleton: true },
        "react-dom": { singleton: true },
        "react-router-dom": { singleton: true },
        zustand: { singleton: true },
      },
    },
  },
});
