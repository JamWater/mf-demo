import React from "react";
// @ts-ignore
import { useUserStore } from "common/useUserStore";
import { useLoaderData, Link } from "react-router-dom";
import eventBus from "common/eventBus";

interface Order {
  id: string;
  title: string;
  status: string;
  amount: number;
}

export default function OrderList() {
  const { orders } = useLoaderData() as { orders: Order[] };
  const userInfo = useUserStore((state: any) => state.userInfo);

  const handleShip = (orderId: string) => {
    // 发布事件：不关心谁在听（用户中心的 Profile 页在听）
    eventBus.emit("order:changed", { orderId, action: "shipped" });
  };

  return (
    <div>
      <h3>订单列表</h3>
      <p>当前登录用户：{userInfo?.name || "--"}</p>
      <ul>
        {orders.map((o) => (
          <li key={o.id}>
            <Link to={`../detail/${o.id}`}>
              {o.title} · {o.status} · ¥{o.amount}{" "}
            </Link>
            <button onClick={() => handleShip(o.id)}>发货</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
