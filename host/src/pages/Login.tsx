import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUserStore } from 'common/useUserStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useUserStore((state) => state.token);
  const setToken = useUserStore((state) => state.setToken);
  const setUserInfo = useUserStore((state) => state.setUserInfo);

  // 表单状态
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // 登录后跳转的目标路径
  const targetPath = (location.state as any)?.from || '/';

  // 已登录状态访问登录页，自动跳转到首页
  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  // 处理登录
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    // 模拟接口请求延迟
    await new Promise((resolve) => setTimeout(resolve, 600));

    try {
      // 模拟账号校验：admin / 123456 为正确账号
      if (username !== 'admin' || password !== '123456') {
        throw new Error('用户名或密码错误');
      }

      // 登录成功：写入全局状态
      setToken('mock-token-2026');
      setUserInfo({
        id: 'u1001',
        name: '测试管理员',
        permissions: ['user:view', 'user:edit', 'order:view', 'report:view'], // 路由拦截
      });

      // 跳转到目标页面
      navigate(targetPath, { replace: true });
    } catch (err: any) {
      // 登录失败：显示错误提示
      setErrorMsg(err.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 360,
        margin: '120px auto',
        padding: '32px 24px',
        border: '1px solid #e5e7eb',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 24, marginTop: 0 }}>系统登录</h2>

      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 6, fontSize: 14, color: '#333' }}>用户名</div>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              boxSizing: 'border-box',
              fontSize: 14,
            }}
            placeholder="请输入用户名"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ marginBottom: 6, fontSize: 14, color: '#333' }}>密码</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              boxSizing: 'border-box',
              fontSize: 14,
            }}
            placeholder="请输入密码"
          />
        </div>

        {/* 错误提示 */}
        {errorMsg && (
          <div
            style={{
              padding: '8px 12px',
              marginBottom: 16,
              background: '#fff2f0',
              border: '1px solid #ffccc7',
              color: '#ff4d4f',
              borderRadius: 4,
              fontSize: 13,
            }}
          >
            {errorMsg}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px 0',
            background: loading ? '#91caff' : '#1677ff',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: 14,
          }}
        >
          {loading ? '登录中...' : '登 录'}
        </button>

        <div style={{ marginTop: 12, fontSize: 12, color: '#999', textAlign: 'center' }}>
          默认账号：admin / 123456
        </div>
      </form>
    </div>
  );
}
