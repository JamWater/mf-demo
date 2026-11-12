import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer'; // 正确导入路径
import type { UserInfo, UserState } from '@mf-demo/shared';

export const useUserStore = create<UserState>()(
  persist(
    immer((set) => ({
      token: null,
      userInfo: null,

      setToken: (token) => set({ token }),
      setUserInfo: (info) => set({ userInfo: info }),
      logout: () => set({ token: null, userInfo: null }),
    })),
    {
      name: 'user-storage', // 持久化到 localStorage，刷新页面不丢失
    }
  )
);
