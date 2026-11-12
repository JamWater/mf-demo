import React, { useEffect, useState } from "react";
import { fetchReports, type ReportItem } from "../api/report";

/**
 * 教学样本：传统 useEffect 数据获取三件套
 * loading 态 / 竞态防御 / 错误处理
 */
export function ReportCenter() {
  // null = 还在加载（用 null 区分"空数据"和"没加载完"）
  const [reports, setReports] = useState<ReportItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false; // ← 竞态防御标记：cleanup 时置 true，作废这次请求的结果

    setReports(null); // 每次重新加载先重置，让 loading 态重新出现
    setError(null);

    fetchReports()
      .then((data) => {
        if (!ignore) setReports(data); // 组件已卸载/已重跑 → 结果作废，不 setState
      })
      .catch((e) => {
        if (!ignore) setError(e?.message || "未知错误");
      });

    return () => {
      ignore = true; // ← cleanup：下次 effect 重跑前、组件卸载时执行
    };
  }, []);

  // 错误态
  if (error) {
    return (
      <div style={{ padding: 16, color: "#cf1322" }}>
        <h4>加载失败</h4>
        <p>{error}</p>
      </div>
    );
  }

  // loading 态（先渲染骨架/文案，数据后到 —— useEffect 模式的标志）
  if (reports === null) {
    return (
      <div style={{ padding: 16, color: "#999" }}>
        <h4>报表加载中...</h4>
        <p>模拟网络延迟 800ms，注意观察：页面先出现、数据后到</p>
      </div>
    );
  }

  // 成功态
  return (
    <div style={{ padding: 16 }}>
      <h4>经营报表</h4>
      <ul style={{ paddingLeft: 0, listStyle: "none" }}>
        {reports.map((r) => (
          <li
            key={r.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderBottom: "1px solid #f0f0f0",
            }}
          >
            <span>{r.title}</span>
            <span style={{ color: "#1677ff", fontWeight: 600 }}>{r.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default ReportCenter;
