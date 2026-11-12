import { Navigate, type RouteObject } from 'react-router-dom';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

export function createUserRoutes(basePath: string): RouteObject[] {
  const resolve = (p: string) => `${basePath}/${p}`;
  return [
    { index: true, element: <Navigate to={resolve('profile')} replace /> },
    { path: 'profile', element: <Profile /> },
    { path: 'settings', element: <Settings /> },
  ];
}

export function resolvePath(basePath: string, path: string) {
  return basePath ? `${basePath}/${path}` : path;
}
