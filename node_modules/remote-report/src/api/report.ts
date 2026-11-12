export interface ReportItem {
  id: string;
  title: string;
  value: number;
}

export async function fetchReports(): Promise<ReportItem[]> {
  await new Promise((r) => setTimeout(r, 800)); // 模拟网络延迟
  return [
    { id: "r1", title: "日活用户", value: 12800 },
    { id: "r2", title: "订单总量", value: 3560 },
    { id: "r3", title: "支付成功率", value: 99.2 },
  ];
}
