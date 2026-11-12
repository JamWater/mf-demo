import React from 'react';
import { NavLink } from 'react-router-dom';

interface Props {
  to: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function AppNavLink({ to, style, children }: Props) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        ...style,
        fontWeight: isActive ? 600 : 400,
        color: isActive ? '#1677ff' : '#333',
      })}
    >
      {children}
    </NavLink>
  );
}
