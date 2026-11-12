// remote/src/host-typings.d.ts
// declare module 'common/useUserStore' {
//   import type { UserState } from '@mf-demo/shared';
//   export const useUserStore: <T>(selector: StoreSelector<T>) => T;
// }

declare module 'common/useUserStore' {
  import type { UseBoundStore, StoreApi } from 'zustand';
  import type { UserState } from '@mf-demo/shared';
  export const useUserStore: UseBoundStore<StoreApi<UserState>>;
}

declare module 'common/eventBus' {
  import type { IEventBus } from '@mf-demo/shared';
  export const eventBus: IEventBus;
  export default eventBus;
}
