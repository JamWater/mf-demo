
    export type RemoteKeys = 'host/useUserStore';
    type PackageType<T> = T extends 'host/useUserStore' ? typeof import('host/useUserStore') :any;