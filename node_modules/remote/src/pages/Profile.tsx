import React, { useEffect, useState } from 'react';
import { useUserStore } from 'common/useUserStore';
import eventBus from 'common/eventBus';

export default function Profile() {
  const userInfo = useUserStore((state) => state.userInfo);
  const setUserInfo = useUserStore((state) => state.setUserInfo);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    // 返回值正好是取消订阅函数，给 effect cleanup 用
    return eventBus.on('order:changed', ({ orderId, action }) => {
      setNotice(`订单 #${orderId} 已${action === 'shipped' ? '发货' : '创建'}`);
    });
  }, []);

  const handleUpdateName = () => {
    setUserInfo({
      ...userInfo!,
      name: '修改后的用户名',
    });
  };

  return (
    <div style={{ padding: 16, border: '1px solid #eee' }}>
      {notice && (
        <p style={{ color: '#1677ff', background: '#e6f4ff', padding: '4px 8px', borderRadius: 4 }}>
          {notice}
        </p>
      )}
      <h4>个人资料</h4>
      <p>用户ID：{userInfo?.id || '--'}</p>
      <p>用户名：{userInfo?.name || '--'}</p>
      <p>权限列表：{userInfo?.permissions?.join('、') || '--'}</p>
      <button onClick={handleUpdateName} style={{ marginTop: 12 }}>
        修改用户名（测试跨应用同步）
      </button>
    </div>
  );
}
