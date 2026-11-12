import type { PermissionCode } from "../types/user";

/** 单码鉴权：支持 '*' 超管通配 */
export function hasPermission(
  permissions: PermissionCode[] | undefined | null,
  code: PermissionCode,
): boolean {
  if (!permissions?.length) return false;
  return permissions.includes("*") || permissions.includes(code);
}

/** 任一命中 */
export function hasAnyPermission(
  permissions: PermissionCode[] | undefined | null,
  codes: PermissionCode[],
): boolean {
  return codes.some((code) => hasPermission(permissions, code));
}

/** 全部命中 */
export function hasAllPermissions(
  permissions: PermissionCode[] | undefined | null,
  codes: PermissionCode[],
): boolean {
  return codes.every((code) => hasPermission(permissions, code));
}
