import type { SubAppMeta } from "@mf-demo/shared";

const meta: SubAppMeta = {
  name: "remoteReport", // ← 必须等于容器名！
  title: "报表中心",
  basePath: "/report",
  entry: "Report",
  requiredPermissions: ["report:view"],
};

export default meta;
