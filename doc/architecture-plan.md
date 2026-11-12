# mf-demo 架构改造计划：契约下沉

## 目标

消除 host 与子应用之间的**双向联邦**（子应用反向 `import 'host/useUserStore'`），
让子应用真正做到**独立开发、独立运行、独立部署**。

**验收硬指标**：host 页面 Network 里只出现 `common` / `remote` / `remoteOrder` 三个
remoteEntry **绝不出现 host 自己的**。

---

## 一、目标架构

```
        ┌───────────────────────────────────┐
        │   @mf-demo/shared（本地包）         │
        │   类型契约 + 无状态工具              │
        │   types / permission / http         │
        └───────────────────────────────────┘
                     ▲ 编译期类型引用（三方都引）
                     │
   host ─────────────┼──────────────► common (3003)
   remote ───────────┘                useUserStore / eventBus
   remoteOrder ─────────────────────► 有状态单例，运行时共享
```

**核心判据（最容易搞错的地方）**：

- **有状态**（store、事件总线、全局缓存）→ 必须放 `common` 容器，运行时单例
- **无状态**（类型、纯函数、常量）→ 放 `shared` 本地包，各应用各打一份不影响

> 反例：把 store 放进 `shared` 本地包 → 每个应用打包一份 → 多份 zustand 实例 → 跨应用同步失效。

---

## 二、分步实施（每步可独立验证）

### Step 1 — 建 `shared/` 本地包

- [ ] 新建 `shared/package.json`（`name: "@mf-demo/shared"`，`main`/`types` 指向 `src/index.ts`）
- [ ] `src/types/user.ts`：`UserInfo` / `UserState`
- [ ] `src/utils/permission.ts`：`hasPermission(...)` 等纯函数
- [ ] `src/index.ts` 统一导出
- [ ] host / remote / remoteOrder 通过 workspace 或 `file:../shared` 引入
- [ ] **删除** `remote/src/host-typings.d.ts`、`remote-order/src/host-typings.d.ts`、`host/src/remote-typings.d.ts` 里对手写模块声明的依赖

> 这一步直接消灭手写 d.ts 漂移导致的 TS2307 / TS2322。

### Step 2 — 建 `common` 容器（端口 3003）

- [ ] `name: 'common'`、`server.port: 3003`
- [ ] `exposes`:
      - `'./useUserStore': './src/store/useUserStore'`
      - `'./eventBus': './src/eventBus'`（后续跨应用事件通信用）
- [ ] 把 `host/src/store/useUserStore.ts` **整体搬迁**到 common
- [ ] `shared` 只声明 `zustand`（单例），**不加 `eager`**
- [ ] common 自己**不消费任何远程**，保持最底层

### Step 3 — 重连三个应用

| 应用 | 改动 |
|---|---|
| host | `remotes` 增加 `common@http://localhost:3003/remoteEntry.js`；**删除 `exposes` 里的 `./useUserStore`**；改为 `import { useUserStore } from 'common/useUserStore'` |
| remote | `remotes` 由 `host` 改为 `common`；`Profile.tsx` 改为 `from 'common/useUserStore'` |
| remoteOrder | `remotes` 由 `host` 改为 `common`；`OrderList.tsx` 改为 `from 'common/useUserStore'` |

改完后子应用对 host **零反向依赖**。

### Step 4 — 启动编排

- [ ] 用 `concurrently` 或根 workspaces 一条命令启动 4 个服务
- [ ] 注意启动顺序：`common` 先起（或子应用容忍其未启动）
- [ ] 各应用 `zustand` 版本统一（host 现为 `^5.0.16`），三方都进 shared singleton 名单

---

## 三、验收清单

- [ ] host 页面 Network：仅 `common` / `remote` / `remoteOrder`，**无 host**
- [ ] host 内修改用户名 → remote 的 Profile、remoteOrder 的 OrderList 同步更新
- [ ] 停掉 host（3000）→ remote（3001）、remoteOrder（3002）单独访问仍可用
- [ ] 无 `undefined (reading 'call')`、无 `does not exist in container` 报错
- [ ] 类型提示来自真实源码，不再依赖手写 d.ts

---

## 四、已知坑位速查

| 坑 | 症状 | 规避 |
|---|---|---|
| 有状态模块放本地包 | 改了这边那边不动 | 一律放 `common` 容器 |
| `eager: true` | `Cannot read properties of undefined (reading 'call')` | 容器侧共享依赖不加 eager |
| zustand 版本不一致 | 两份实例，hooks 报错 | 三方锁同版本 + singleton |
| exposes 的 key ≠ 文件内导出名 | `Lazy element type must resolve to: undefined` | 模块名 / 导出名 / 文件名三者对齐 |
| 嵌套 `<Routes>` 用绝对 path | 页面空白 | 子路由用相对路径，前缀交给基座 |
| 通配路由内相对链接 | `/user/profile` 下跳转变 `/user/profile/settings` | 基座注入 `basePath`，子应用拼绝对路径 |

---

## 五、可选加分项

- 用已安装的 `@module-federation/dts-plugin` 让 `common` 自动生成 `@mf-types`，
  其他应用直接获得真实类型（可省掉部分 workspace 包的类型维护）
- `common` 里加 `eventBus`（发布订阅），补齐"业务能力"维度的跨应用事件通信
