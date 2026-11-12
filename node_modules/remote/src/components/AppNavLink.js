import { jsx as _jsx } from "react/jsx-runtime";
import { NavLink } from 'react-router-dom';
export default function AppNavLink({ to, style, children }) {
    return (_jsx(NavLink, { to: to, style: ({ isActive }) => ({
            ...style,
            fontWeight: isActive ? 600 : 400,
            color: isActive ? '#1677ff' : '#333',
        }), children: children }));
}
