import type { SubAppMeta } from '@mf-demo/shared';

const meta: SubAppMeta = {
  name: 'remote',
  title: '用户中心',
  basePath: '/user',
  entry: 'UserCenter',
  requiredPermissions: ['user:view'],
};

export default meta;
