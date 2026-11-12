import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
export function UserCard({ username, role }) {
    const [followed, setFollowed] = useState(false);
    return (_jsxs("div", { style: { padding: 16, background: '#f5f5f5', borderRadius: 8, margin: '12px 0' }, children: [_jsxs("p", { children: [_jsx("strong", { children: "\u7528\u6237\u540D\uFF1A" }), username] }), _jsxs("p", { children: [_jsx("strong", { children: "\u89D2\u8272\uFF1A" }), role] }), _jsx("button", { onClick: () => setFollowed(!followed), children: followed ? '已关注' : '关注' })] }));
}
