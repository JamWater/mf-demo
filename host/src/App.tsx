// host/src/App.tsx
import React, { Suspense, useEffect, useMemo, useState } from 'react';
import {
  RouterProvider,
  createBrowserRouter,
  Outlet,
  useNavigate,
  NavLink,
} from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import RouteGuard from './router/guard';
import Logins from './pages/Login';
import Home from './pages/Home'; // 数据路由器下可以不再 lazy，路由器自己管
import { useUserStore } from 'common/useUserStore';
import { loadRemote } from '@module-federation/runtime';
import type { ComponentType } from 'react';
import type { SubAppMeta } from '@mf-demo/shared';
import type { RemoteEntry } from './bootstrap';
import RouteError from './pages/RouteError';
import eventBus from 'common/eventBus';

function createRemoteComponent(m: SubAppMeta) {
  return React.lazy(() =>
    loadRemote<{ default: ComponentType<{ basePath?: string }> }>(`${m.name}/${m.entry}`).then(
      (mod) => ({ default: mod!.default })
    )
  );
}

function HeaderNav({ remotes }: { remotes: RemoteEntry[] }) {
  const token = useUserStore((s) => s.token);
  const user = useUserStore((s) => s.userInfo);
  const logout = useUserStore((s) => s.logout); // const logout = useUserStore.getState().logout;  // 非订阅式读取，效果相同
  const navigate = useNavigate();

  if (!token) return null;

  return (
    <nav
      style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}
    >
      <NavLink to="/" style={{ marginRight: 20 }}>
        首页
      </NavLink>
      {remotes.map(({ meta }) => (
        <NavLink key={meta.name} to={meta.basePath} style={{ marginRight: 20 }}>
          {meta.title}
        </NavLink>
      ))}
      <button
        onClick={() => {
          logout();
          navigate('/login', { replace: true });
        }}
        style={{
          marginLeft: 'auto',
          border: 'none',
          background: 'none',
          color: '#1677ff',
          cursor: 'pointer',
        }}
      >
        {user?.name} 退出登录
      </button>
    </nav>
  );
}

/** 根布局：导航 + 内容出口（对应原来的 BrowserRouter 外壳） */
function RootLayout({ remotes }: { remotes: RemoteEntry[] }) {
  const [toast, setToast] = useState('');

  useEffect(() => {
    // RootLayout 永不卸载 → 订阅常驻，任何时刻的 emit 都能收到
    return eventBus.on('order:changed', ({ orderId, action }) => {
      setToast(`订单 #${orderId} 已${action === 'shipped' ? '发货' : '创建'}`);
    });
  }, []);

  return (
    <div>
      <HeaderNav remotes={remotes} />
      {toast && (
        <div
          style={{
            padding: '8px 16px',
            background: '#e6f4ff',
            color: '#1677ff',
            borderBottom: '1px solid #d6e8ff',
          }}
        >
          {toast}
        </div>
      )}
      <Suspense fallback={<div>加载中...</div>}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </Suspense>
    </div>
  );
}

export default function App({ remotes }: { remotes: RemoteEntry[] }) {
  const router = useMemo(
    () =>
      createBrowserRouter([
        {
          element: <RootLayout remotes={remotes} />,
          children: [
            { path: '/login', element: <Logins /> },
            {
              path: '/',
              element: (
                <RouteGuard>
                  <Home />
                </RouteGuard>
              ),
            },
            ...remotes.map(({ meta, routes }) =>
              routes
                ? // 模式 A：子应用暴露了路由配置 → 真嵌套（不用通配符）
                  {
                    path: meta.basePath,
                    element: (
                      <RouteGuard requiredPermission={meta.requiredPermissions?.[0]}>
                        <Outlet />
                      </RouteGuard>
                    ),
                    children: routes,
                    errorElement: <RouteError />, // 声明
                  }
                : // 模式 B：只有组件 → 老的通配路由
                  {
                    path: `${meta.basePath}/*`,
                    element: (
                      <RouteGuard requiredPermission={meta.requiredPermissions?.[0]}>
                        <Suspense fallback={<div>加载子应用...</div>}>
                          {createLazyElement(meta)}
                        </Suspense>
                      </RouteGuard>
                    ),
                  }
            ),
          ],
        },
      ]),
    [remotes]
  );

  return <RouterProvider router={router} />;
}

function createLazyElement(m: SubAppMeta) {
  const Component = createRemoteComponent(m);
  return <Component basePath={m.basePath} />;
}
