/** 用户信息，host 的 store 与各子应用共用同一份定义 */
export interface UserInfo {
    id: string;
    name: string;
    avatar?: string;
    permissions: string[];
}
/** 全局用户状态契约，签名要和 zustand store 实际实现保持一致 */
export interface UserState {
    token: string | null;
    userInfo: UserInfo | null;
    setToken: (token: string) => void;
    setUserInfo: (info: UserInfo) => void;
    logout: () => void;
}
export type PermissionCode = string;
