import React from "react";
import { useLoaderData, useParams } from "react-router-dom";

interface Order {
  id: string;
  title: string;
  status: string;
  amount: number;
}

export default function OrderDetail() {
  const { order } = useLoaderData() as { order: Order };
  const { id } = useParams();

  return (
    <div>
      <h3>订单详情</h3>
      <p>订单ID（useParams）：{id}</p>
      <p>标题：{order.title}</p>
      <p>金额：¥{order.amount}</p>
      <p>订单状态：{order.status}</p>
    </div>
  );
}
