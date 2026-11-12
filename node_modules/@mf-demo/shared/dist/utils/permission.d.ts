import type { PermissionCode } from "../types/user";
/** 单码鉴权：支持 '*' 超管通配 */
export declare function hasPermission(permissions: PermissionCode[] | undefined | null, code: PermissionCode): boolean;
/** 任一命中 */
export declare function hasAnyPermission(permissions: PermissionCode[] | undefined | null, codes: PermissionCode[]): boolean;
/** 全部命中 */
export declare function hasAllPermissions(permissions: PermissionCode[] | undefined | null, codes: PermissionCode[]): boolean;
