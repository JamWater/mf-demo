import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

export default function RouteError() {
  const error = useRouteError();
  if (isRouteErrorResponse(error)) {
    return (
      <div style={{ padding: 40 }}>
        <h3>
          {error.status} — {error.statusText}
        </h3>
        <p>资源不存在或无权访问</p>
      </div>
    );
  }
  return (
    <div style={{ padding: 40 }}>
      <h3>页面出错了</h3>
    </div>
  );
}
