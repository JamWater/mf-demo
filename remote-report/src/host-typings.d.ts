declare module "common/useUserStore" {
  import type { UseBoundStore, StoreApi } from "zustand";
  import type { UserState } from "@mf-demo/shared";
  export const useUserStore: UseBoundStore<StoreApi<UserState>>;
}
