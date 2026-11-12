
    export type RemoteKeys = 'REMOTE_ALIAS_IDENTIFIER/UserCenter';
    type PackageType<T> = T extends 'REMOTE_ALIAS_IDENTIFIER/UserCenter' ? typeof import('REMOTE_ALIAS_IDENTIFIER/UserCenter') :any;