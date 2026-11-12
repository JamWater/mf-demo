// remote/src/pages/UserCenter.tsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import OrderList from "./OrderList";
import OrderDetail from "./OrderDetail";
import AppNavLink from "../components/AppNavLink";

interface OrderCenterProps {
  /** 基座分配的路由前缀，外部注入，子应用不感知具体值 */
  basePath?: string;
}

export function OrderCenter({ basePath = "" }: OrderCenterProps) {
  // 统一拼接完整路径，内部业务只写子路由名
  const resolvePath = (path: string) =>
    basePath ? `${basePath}/${path}` : path;

  return (
    <div style={{ padding: 20 }}>
      <h3>用户中心（远程子应用2）</h3>
      <div style={{ margin: "12px 0" }}>
        <AppNavLink to={resolvePath("list")} style={{ marginRight: 16 }}>
          订单详情
        </AppNavLink>
        <AppNavLink to={resolvePath("detail")}>订单列表</AppNavLink>
      </div>

      <Routes>
        <Route index element={<Navigate to={resolvePath("list")} replace />} />
        <Route path="list" element={<OrderList />} />
        <Route path="detail" element={<OrderDetail />} />
      </Routes>
    </div>
  );
}
export default OrderCenter; // ← 新增这一行
