// declare module 'remote/Button' {
//   export function Button(): JSX.Element;
// }

// declare module 'remote/UserCenter' {
//   export function UserCenter(props?: { basePath?: string; username?: string }): JSX.Element;
// }

// declare module 'remoteOrder/OrderCenter' {
//   export function OrderCenter(props?: { basePath?: string }): JSX.Element;
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
