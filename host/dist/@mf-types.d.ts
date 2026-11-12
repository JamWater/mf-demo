
    export type RemoteKeys = 'REMOTE_ALIAS_IDENTIFIER/useUserStore';
    type PackageType<T> = T extends 'REMOTE_ALIAS_IDENTIFIER/useUserStore' ? typeof import('REMOTE_ALIAS_IDENTIFIER/useUserStore') :any;