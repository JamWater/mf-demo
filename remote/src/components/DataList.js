import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
const mockList = [
    { id: 1, title: '我的订单', count: 12 },
    { id: 2, title: '我的收藏', count: 28 },
    { id: 3, title: '浏览历史', count: 156 },
];
export function DataList() {
    return (_jsx("ul", { style: { padding: 0, listStyle: 'none' }, children: mockList.map(item => (_jsxs("li", { style: { padding: '8px 0', borderBottom: '1px dashed #eee' }, children: [item.title, " ", _jsx("span", { style: { float: 'right', color: '#999' }, children: item.count })] }, item.id))) }));
}
