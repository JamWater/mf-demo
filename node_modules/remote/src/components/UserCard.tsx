import React, { useState } from 'react';

interface Props {
  username: string;
  role: string;
}

export function UserCard({ username, role }: Props) {
  const [followed, setFollowed] = useState(false);

  return (
    <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, margin: '12px 0' }}>
      <p>
        <strong>用户名：</strong>
        {username}
      </p>
      <p>
        <strong>角色：</strong>
        {role}
      </p>
      <button onClick={() => setFollowed(!followed)}>{followed ? '已关注' : '关注'}</button>
    </div>
  );
}
