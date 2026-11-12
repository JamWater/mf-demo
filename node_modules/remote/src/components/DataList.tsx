import React from 'react';

const mockList = [
  { id: 1, title: '我的订单', count: 12 },
  { id: 2, title: '我的收藏', count: 28 },
  { id: 3, title: '浏览历史', count: 156 },
];

export function DataList() {
  return (
    <ul style={{ padding: 0, listStyle: 'none' }}>
      {mockList.map(item => (
        <li key={item.id} style={{ padding: '8px 0', borderBottom: '1px dashed #eee' }}>
          {item.title} <span style={{ float: 'right', color: '#999' }}>{item.count}</span>
        </li>
      ))}
    </ul>
  );
}
