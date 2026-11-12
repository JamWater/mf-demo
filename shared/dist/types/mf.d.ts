import type { PermissionCode } from "./user";
/** 子应用向基座申报的元数据（./meta 模块的默认导出） */
export interface SubAppMeta {
    /** 容器名，必须与 manifest 里的 name 一致 */
    name: string;
    /** 菜单标题 */
    title: string;
    /** 路由前缀，如 '/user' */
    basePath: string;
    /** 暴露的入口模块名（exposes key 去掉 './'，如 'UserCenter'） */
    entry: string;
    /** 进入该应用所需权限（可选） */
    requiredPermissions?: PermissionCode[];
}
