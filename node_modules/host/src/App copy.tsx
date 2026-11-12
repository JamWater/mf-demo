import React, { lazy, Suspense, useMemo } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { ErrorBoundary } from './ErrorBoundary';
import RouteGuard from './router/guard';
import Logins from './pages/Login';
import { useUserStore } from 'common/useUserStore';
import { loadRemote } from '@module-federation/runtime';
import type { ComponentType } from 'react';
import type { SubAppMeta } from '@mf-demo/shared';

// 本地公共页面
const Home = lazy(() => import('./pages/Home'));

// 动态加载后注释
// // 远程子应用的页面：MF 懒加载
// const RemoteUserCenter = lazy(() =>
//   import('remote/UserCenter').then((mod) => ({ default: mod.UserCenter }))
// );

// const RemoteOrderCenter = React.lazy(() =>
//   import('remoteOrder/OrderCenter').then((mod) => ({ default: mod.OrderCenter }))
// );

// 子组件注册后注释
// const RemoteUserCenter = lazy(() =>
//   loadRemote<{ UserCenter: ComponentType<{ basePath?: string }> }>('remote/UserCenter').then(
//     (mod) => ({ default: mod!.UserCenter })
//   )
// );

// const RemoteOrderCenter = lazy(() =>
//   loadRemote<{ OrderCenter: ComponentType<{ basePath?: string }> }>('remoteOrder/OrderCenter').then(
//     (mod) => ({ default: mod!.OrderCenter })
//   )
// );

interface AppProps {
  metas: SubAppMeta[];
}

function createRemoteComponent(m: SubAppMeta) {
  return lazy(() =>
    loadRemote<{ default: ComponentType<{ basePath?: string }> }>(`${m.name}/${m.entry}`).then(
      (mod) => ({ default: mod!.default })
    )
  );
}

/** 基座顶部导航：已登录时显示，未登录不显示 */
function HeaderNav({ metas }: { metas: SubAppMeta[] }) {
  const token = useUserStore((state) => state.token);
  const user = useUserStore((state) => state.userInfo);
  const logout = useUserStore((state) => state.logout);
  const navigate = useNavigate();

  // 未登录不显示导航栏
  if (!token) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav
      style={{ padding: 16, borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center' }}
    >
      <NavLink to="/" style={{ marginRight: 20 }}>
        首页
      </NavLink>
      {/* <NavLink to="/user" style={{ marginRight: 20 }}>
        用户中心(远程)
      </NavLink>
      <NavLink to="/order" style={{ marginRight: 24, textDecoration: 'none', color: '#333' }}>
        订单中心(远程)
      </NavLink> */}
      {metas.map((m) => (
        <NavLink key={m.name} to={m.basePath} style={{ marginRight: 20 }}>
          {m.title}
        </NavLink>
      ))}
      <button
        onClick={handleLogout}
        style={{
          marginLeft: 'auto',
          border: 'none',
          background: 'none',
          color: '#1677ff',
          cursor: 'pointer',
        }}
      >
        {user?.name}
        退出登录
      </button>
    </nav>
  );
}

export default function App({ metas }: { metas: SubAppMeta[] }) {
  const remoteComponents = useMemo(
    () => metas.map((m) => ({ meta: m, Component: createRemoteComponent(m) })),
    [metas]
  );

  return (
    <BrowserRouter>
      {/* 基座公共导航 */}
      <HeaderNav metas={metas} />
      {/* <nav style={{ padding: 16, borderBottom: '1px solid #eee' }}>
        <NavLink to="/" style={{ marginRight: 20 }}>
          首页
        </NavLink>
        <NavLink to="/user">用户中心(远程)</NavLink>
      </nav> */}

      <Suspense fallback={<div>加载中...</div>}>
        <ErrorBoundary>
          {/* 子应用路由前缀，后续子应用内部路由都基于这个前缀 */}
          {/* basePath 必须传入：否则子应用内部相对链接会基于完整 URL 解析，
                导致 /user/profile 下点"账号设置"变成 /user/profile/settings 而白屏 */}
          {/* <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/user/*" element={<RemoteUserCenter basePath="/user" />} />
          </Routes> */}
          <Routes>
            <Route path="/login" element={<Logins />} />
            {/* 受保护路由：需要登录 + user:view 权限 */}
            <Route
              path="/"
              element={
                <RouteGuard>
                  <Home />
                </RouteGuard>
              }
            />
            {remoteComponents.map(({ meta, Component }) => (
              <Route
                key={meta.name}
                path={`${meta.basePath}/*`}
                element={
                  <RouteGuard requiredPermission={meta.requiredPermissions?.[0]}>
                    <Component basePath={meta.basePath} />
                  </RouteGuard>
                }
              />
            ))}
            {/* <Route
              path="/user/*"
              element={
                <RouteGuard requiredPermission="user:view">
                  <RemoteUserCenter basePath="/user" />
                </RouteGuard>
              }
            />
            <Route
              path="/order/*"
              element={
                <RouteGuard requiredPermission="order:view">
                  <RemoteOrderCenter basePath="/order" />
                </RouteGuard>
              }
            /> */}
          </Routes>
        </ErrorBoundary>
      </Suspense>
    </BrowserRouter>
  );
}
