/** 单码鉴权：支持 '*' 超管通配 */
export function hasPermission(permissions, code) {
    if (!permissions?.length)
        return false;
    return permissions.includes("*") || permissions.includes(code);
}
/** 任一命中 */
export function hasAnyPermission(permissions, codes) {
    return codes.some((code) => hasPermission(permissions, code));
}
/** 全部命中 */
export function hasAllPermissions(permissions, codes) {
    return codes.every((code) => hasPermission(permissions, code));
}
