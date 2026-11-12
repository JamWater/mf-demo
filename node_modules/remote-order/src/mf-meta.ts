import type { SubAppMeta } from "@mf-demo/shared";

const meta: SubAppMeta = {
  name: "remoteOrder",
  title: "订单中心",
  basePath: "/order",
  entry: "OrderCenter",
  requiredPermissions: ["order:view"],
};

export default meta;
