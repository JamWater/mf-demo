// remote/src/pages/UserCenter.tsx
import React from 'react';
import AppNavLink from '../components/AppNavLink';
import { useRoutes } from 'react-router-dom';
import { createUserRoutes, resolvePath } from '../routes';

interface UserCenterProps {
  /** 基座分配的路由前缀，外部注入，子应用不感知具体值 */
  basePath?: string;
}

export function UserCenter({ basePath = '' }: UserCenterProps) {
  // // 统一拼接完整路径，内部业务只写子路由名
  // const resolvePath = (path: string) => (basePath ? `${basePath}/${path}` : path);

  const element = useRoutes(createUserRoutes(basePath));

  return (
    <div style={{ padding: 20 }}>
      <h3>用户中心（远程子应用）</h3>
      <div style={{ margin: '12px 0' }}>
        <AppNavLink to={resolvePath(basePath, 'profile')} style={{ marginRight: 16 }}>
          个人资料
        </AppNavLink>
        <AppNavLink to={resolvePath(basePath, 'settings')}>账号设置</AppNavLink>
      </div>
      {element}

      {/* <Routes>
        <Route index element={<Navigate to={resolvePath('profile')} replace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Routes> */}
    </div>
  );
}
export default UserCenter;
