// host/src/utils/permission.ts
type UserInfo = {
  name: string;
  permissions: string[];
};

// 模拟拉取用户信息
export async function fetchUserInfo(token: string): Promise<UserInfo> {
  // 这里替换成真实接口请求
  console.log('根据token拉取用户信息：', token);
  return {
    name: '基座用户',
    permissions: ['home', 'user-center'],
  };
}

// 初始化权限
export function initPermission(permissions: string[]) {
  console.log('初始化权限列表', permissions);
  localStorage.setItem('permissions', JSON.stringify(permissions));
}
