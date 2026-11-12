import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUserStore } from 'common/useUserStore';

interface RouteGuardProps {
  /** 子组件：受保护的页面/模块 */
  children: React.ReactNode;
  /** 访问该路由需要的权限点，不传则只校验登录态 */
  requiredPermission?: string;
}

export default function RouteGuard({ children, requiredPermission }: RouteGuardProps) {
  const location = useLocation();
  const token = useUserStore((state) => state.token);
  const userInfo = useUserStore((state) => state.userInfo);

  // 1. 未登录：跳转到登录页，携带当前路径，登录后可直接回跳
  if (!token) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // 2. 配置了权限点，但用户没有该权限：显示无权限提示
  if (requiredPermission && !userInfo?.permissions?.includes(requiredPermission)) {
    return (
      <div style={{ padding: '60px 20px', textAlign: 'center', color: '#666' }}>
        <h3>暂无访问权限</h3>
        <p>如需访问，请联系管理员开通权限</p>
      </div>
    );
  }

  // 3. 校验通过：正常渲染子内容
  return <>{children}</>;
}
