import { jsx as _jsx } from "react/jsx-runtime";
export function SectionHeader({ title }) {
    return (_jsx("h3", { style: { borderBottom: '1px solid #eee', paddingBottom: 8 }, children: title }));
}
