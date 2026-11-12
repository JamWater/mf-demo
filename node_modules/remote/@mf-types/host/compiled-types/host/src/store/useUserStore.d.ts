interface UserInfo {
    id: string;
    name: string;
    avatar?: string;
    permissions: string[];
}
interface UserState {
    token: string | null;
    userInfo: UserInfo | null;
    setToken: (token: string) => void;
    setUserInfo: (info: UserInfo) => void;
    logout: () => void;
}
export declare const useUserStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<UserState>, "setState" | "persist"> & {
    setState(partial: UserState | Partial<UserState> | ((state: UserState) => UserState | Partial<UserState>), replace?: false | undefined): unknown;
    setState(state: UserState | ((state: UserState) => UserState), replace: true): unknown;
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<UserState, UserState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: UserState) => void) => () => void;
        onFinishHydration: (fn: (state: UserState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<UserState, UserState, unknown>>;
    };
}>;
export {};
