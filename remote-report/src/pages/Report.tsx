// remote/src/pages/UserCenter.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useUserStore } from "common/useUserStore";
import ReportCenter from "./ReportCenter";

interface OrderCenterProps {
  /** 基座分配的路由前缀，外部注入，子应用不感知具体值 */
  basePath?: string;
}

export function Report({ basePath = "" }: OrderCenterProps) {
  // 统一拼接完整路径，内部业务只写子路由名
  const resolvePath = (path: string) =>
    basePath ? `${basePath}/${path}` : path;
  const userInfo = useUserStore((state) => state.userInfo);

  return (
    <div style={{ padding: 20 }}>
      <h3>Report</h3>
      <p>
        当前user: {userInfo?.name}, {userInfo?.id}
      </p>
      <Routes>
        <Route index element={<ReportCenter />} />
      </Routes>
    </div>
  );
}
export default Report; // ← 新增这一行
