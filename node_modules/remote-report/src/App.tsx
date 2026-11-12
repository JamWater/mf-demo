import React from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import OrderList from "./pages/OrderList";
import OrderDetail from "./pages/OrderDetail";

interface AppProps {
  basePath?: string; // 基座传入的路由前缀
}

export default function App({ basePath }: AppProps) {
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <NavLink to={`${basePath}`} end style={{ marginRight: 20 }}>
          订单列表
        </NavLink>
        <NavLink to={`${basePath}/detail/1001`}>订单详情</NavLink>
      </div>

      <Routes>
        <Route path={basePath} element={<OrderList />} />
        <Route path={`${basePath}/detail/:id`} element={<OrderDetail />} />
      </Routes>
    </div>
  );
}
