import React from 'react';
interface UserCenterProps {
    /** 基座分配的路由前缀，外部注入，子应用不感知具体值 */
    basePath?: string;
}
export declare function UserCenter({ basePath }: UserCenterProps): React.JSX.Element;
export default UserCenter;
