// remote-order/src/routes.tsx
import React, { useEffect, useState } from "react";
import {
  Outlet,
  redirect,
  type LoaderFunctionArgs,
  type RouteObject,
} from "react-router-dom";
import AppNavLink from "./components/AppNavLink";
import { eventBus } from "common/eventBus";

// 模拟后端数据（真实项目换成 fetch）
const MOCK_ORDERS = [
  { id: "1001", title: "订单 #1001", status: "已完成", amount: 1280 },
  { id: "1002", title: "订单 #1002", status: "待发货", amount: 460 },
  { id: "1003", title: "订单 #1003", status: "已取消", amount: 99 },
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 进入列表页之前预取数据：组件渲染时数据已经在手上了 */
async function orderListLoader() {
  await sleep(600); // 模拟网络延迟，方便观察 loader 先于渲染执行
  return { orders: MOCK_ORDERS };
}

/** 详情页按 params.id 预取 */
async function orderDetailLoader({ params }: LoaderFunctionArgs) {
  await sleep(400);
  const order = MOCK_ORDERS.find((o) => o.id === params.id) ?? null;
  if (!order) throw new Response("订单不存在", { status: 404 });
  return { order };
}

/** 外壳：标题 + 子导航 + 内容出口 */
function OrderLayout() {
  const [toast, setToast] = useState("");
  useEffect(() => {
    // 第二个订阅者：和 host 的 RootLayout 监听同一条事件
    return eventBus.on("order:changed", ({ orderId, action }) => {
      setToast(
        `本区操作：订单 #${orderId} 已${action === "shipped" ? "发货" : "创建"}`,
      );
    });
  }, []);
  return (
    <div style={{ padding: 20 }}>
      <h3>订单中心（远程子应用 · 数据路由）</h3>
      {toast && (
        <div
          style={{
            padding: "4px 8px",
            background: "#f6ffed",
            color: "#389e0d",
            border: "1px solid #b7eb8f",
            borderRadius: 4,
            margin: "8px 0",
          }}
        >
          {toast}
        </div>
      )}
      <div style={{ margin: "12px 0" }}>
        <AppNavLink to="list">订单列表</AppNavLink>
      </div>
      <Outlet />
    </div>
  );
}

export function createOrderRoutes(): RouteObject[] {
  return [
    {
      element: <OrderLayout />,
      children: [
        // 默认页：用 loader 重定向，比 <Navigate> 更适合数据路由
        { index: true, loader: () => redirect("list") },
        {
          path: "list",
          loader: orderListLoader,
          // 路由级懒加载：host 启动时只拿到配置，页面代码访问时才下载
          lazy: async () => ({
            Component: (await import("./pages/OrderList")).default,
          }),
        },
        {
          path: "detail/:id",
          loader: orderDetailLoader,
          lazy: async () => ({
            Component: (await import("./pages/OrderDetail")).default,
          }),
        },
      ],
    },
  ];
}

// 契约：默认导出一个 RouteObject[]，host 直接 spread 进自己的路由表
export default createOrderRoutes();
