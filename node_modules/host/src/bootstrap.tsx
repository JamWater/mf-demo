// host/src/bootstrap.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/global.scss';
import { initPermission, fetchUserInfo } from './utils/permission';
import { useUserStore } from 'common/useUserStore';
import { registerRemotes, loadRemote } from '@module-federation/runtime';
import type { SubAppMeta } from '@mf-demo/shared'; // 收集 metas
import { RouteObject } from 'react-router-dom';

// host 与子应用之间升级后的契约：meta 必有，routes 可选
export interface RemoteEntry {
  meta: SubAppMeta;
  routes: RouteObject[] | null; // null = 该子应用没暴露 ./routes，走组件模式
}

async function bootstrap() {
  // 0. 拉清单并运行时注册（放在最前面）
  const manifest = await fetch('/manifest.json', { cache: 'no-cache' }).then((r) => r.json());
  registerRemotes(manifest);

  // 0.1 子组件注册
  // const metas: SubAppMeta[] = await Promise.all(
  //   manifest.map(async ({ name }: { name: string }) => {
  //     const mod = await loadRemote<{ default: SubAppMeta }>(`${name}/meta`);
  //     return mod!.default;
  //   })
  // );

  const remotes: RemoteEntry[] = await Promise.all(
    manifest.map(async ({ name }: { name: string }) => {
      const metaMod = await loadRemote<{ default: SubAppMeta }>(`${name}/meta`);

      // 尝试拉路由配置；没暴露会 reject（或返回空），catch 住就是组件模式
      let routes: RouteObject[] | null = null;
      try {
        const routesMod = await loadRemote<{ default: RouteObject[] }>(`${name}/routes`);
        routes = Array.isArray(routesMod?.default) ? routesMod.default : null;
      } catch {
        routes = null; // 没暴露 ./routes 的子应用（如 remote）落到这里
      }

      return { meta: metaMod!.default, routes };
    })
  );

  // 1. 权限初始化：获取 token、拉取用户信息
  const token = localStorage.getItem('token');
  if (token) {
    // 真实项目替换为后端接口请求
    const mockUserInfo = {
      id: '1001',
      name: '管理员',
      permissions: ['user:view', 'user:edit', 'order:view'],
    };
    useUserStore.getState().setUserInfo(mockUserInfo);
  }

  // 2. 渲染应用
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App remotes={remotes} />
    </React.StrictMode>
  );
}

bootstrap();
