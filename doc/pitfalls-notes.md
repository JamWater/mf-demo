# mf-demo 踩坑与知识点复盘（2026-10-30 ~ 11-03）

> 覆盖范围：webpack → Rsbuild 迁移、新增 remoteOrder 子应用、双向往来依赖治理（契约下沉）、workspaces 工程化。

---

## 一、Module Federation 的三层命名（最容易混的地方）

一次远程模块加载，要连续匹配三层，**任何一层不对，报错信息都不一样**：

| 层             | 配置位置                                                                                 | 例子                                                 | 断了会怎样                                                                                                   |
| ------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| ① 容器名         | 提供方 `moduleFederation.options.name` ↔ 消费方 `remotes.<key>` ↔ `remotes` 值前缀 `name@url` | `remoteOrder@http://localhost:3002/remoteEntry.js` | 连不上容器，`Loading chunk failed` / 容器未初始化                                                                   |
| ② 模块路径        | 提供方 `exposes.<key>` ↔ 消费方 `import('<name>/<key>')`                                   | `'./OrderCenter'`                                  | `Module "./OrderCenter" does not exist in container`                                                    |
| ③ **模块内的导出名** | 文件里 `export ...` ↔ 消费方 `mod.XXX`                                                     | `export function OrderCenter` ↔ `mod.OrderCenter`  | `Lazy element type must resolve to a class or function. Received a promise that resolves to: undefined` |

**关键认知**：`exposes` 的 key 只是一个"模块 ID"，**与文件内部的导出名毫无关系**。  
`exposes: { './OrderCenter': './src/App' }` 里 App 若只有 `default` 导出，`mod.OrderCenter` 就是 `undefined`。

**排查顺序固定为：容器名 → exposes key → 导出名**，按报错文案对号入座，比盲猜快得多。

---

## 二、Rsbuild 迁移篇

| 现象                                                                       | 原因                                                                                                      | 修法                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| 启动即报 `Module not found: Can't resolve 'host/useUserStore'`               | `rsbuild.config.ts` 从 host 复制过来，`remotes` 方向没改（key 是 `remote` 而不是 `host`）                               | `remotes: { host: 'host@http://localhost:3000/remoteEntry.js' }` |
| `Module "./useUserStore" does not exist in container`                    | `name` / `port` 也没改：两个应用都叫 `host`、都抢 3000；后启动的被自动顶到 3001，浏览器访问的 3000 其实是子应用自己                           | 子应用必须改 `name: 'remote'`、`port: 3001`                             |
| `Failed to start dev server. Module Federation runtime is not installed` | 新应用只 `npm i` 了 rsbuild，缺 MF 运行时；`runtime-tools` 是 `@module-federation/rsbuild-plugin` 的**传递依赖**，声明了插件才有 | `npm i -D @module-federation/rsbuild-plugin@<与其它应用相同版本>`         |
| 子应用 `package.json` 几乎是空的，但 `rsbuild dev` 能跑                              | 复用了旧的 `node_modules` 或目录残留，掩盖了依赖缺失                                                                      | 新建子应用照抄同类应用的依赖清单，再 `npm install`                                 |

**验证服务身份的小技巧**（不用开浏览器）：

```bash
curl -s http://localhost:3002/remoteEntry.js | head -c 60   # 第一行 var remoteOrder; 就是容器名
curl -s http://localhost:3002/remoteEntry.js | grep -o '"\./OrderCenter"'
```

`var <name>;` 直接暴露容器名，能在秒级判断"这个端口上跑的到底是谁"。

---

## 三、构建与依赖篇

### 3.1 `eager: true` 与"既提供又消费"的容器不兼容

**症状**：`Cannot read properties of undefined (reading 'call')`，栈落在 react-dom 内部。

**原因**：`eager: true` 的共享依赖被编进**主入口 chunk**；跨容器加载暴露模块时只会拉 `remoteEntry.js` + expose chunk，主入口不会加载 → 模块工厂不存在 → `undefined.call`。

**修法**：容器侧 `shared` 全部去掉 `eager`，配合 `import('./bootstrap')` 异步边界即可。这也是 MF 官方推荐的入口写法。



### 3.3 手写 `*.d.ts` 是技术债

同一个 `UserInfo` 在 host 的 store、remote 的 `host-typings.d.ts`、remoteOrder 的 `host-typings.d.ts` 各写一遍，只要漏一处就是 TS2307 / TS2322 循环。

**根因**：手写声明靠人肉同步，必然漂移。**正解是契约下沉（见第五节）**。

---

## 四、运行时与路由篇

### 4.1 persist 恢复旧结构 → 可选链救不了字段缺失

**症状**：`Cannot read properties of undefined (reading 'join')`。

**原因**：`userInfo` 存在（pendant 从 `localStorage['user-storage']` 恢复的旧结构），但里面没有 `permissions` 字段。

**关键认知**：`userInfo?.permissions.join()` 的 `?.` **只对 `userInfo` 为 null 生效**，字段缺失照样抛错，必须写 `userInfo?.permissions?.join()`。

**根治**：persist 加 `version` + `migrate`，或结构变更时清 localStorage。

### 4.2 通配路由内的相对链接按"完整 URL"解析

**症状**：`/user/profile` 下点"账号设置"，跳到 `/user/profile/settings` 后白屏。

**原因**：react-router v6 中 `/user/*` 内的相对 `to="settings"` 相对**当前完整路径**解析，而不是相对路由前缀 `/user`。内层 `Routes` 拿到剩余路径 `profile/settings` 匹配不到子路由 → 空白。

**修法**：基座注入 `basePath="/user"`，子应用内所有链接拼成**绝对路径**；`basePath` 只用于 `to`，**不参与** `Route path`。

### 4.3 嵌套 `<Routes>` 里不要用绝对 path

`<Route path={basePath}>`（`basePath='/order'`）在嵌套场景必然匹配失败——父路由已吃掉前缀，剩余 pathname 是 `""`。

**正确写法**：

```tsx
<Routes>
  <Route index element={<OrderList />} />              {/* /order */}
  <Route path="detail/:id" element={<OrderDetail />} /> {/* /order/detail/1001 */}
</Routes>
```

### 4.4 子应用独立运行的三件套

1. 自带 `BrowserRouter`（否则 `useRoutes must be used within a Router`）；
2. `basePath` 设为可选（`basePath?: string = ''`），独立运行时为空；
3. `bootstrap` 里不要用 `process.env.NODE_ENV` 判断挂载（TS 不认 `process`，且生产构建会白屏），直接无条件挂载即可——被基座消费时加载的是 expose 模块，**bootstrap 根本不会执行**。

---

## 五、架构：契约下沉（本次核心成果）

### 5.1 改造前的问题：双向联邦

- host 消费 `remote/UserCenter`、`remoteOrder/OrderCenter`；
- 子应用又反向 `import 'host/useUserStore'`。

结果：**host 在自己的页面里又加载了一遍自己的 remoteEntry**（Network 里能看到 3000 的 remoteEntry），并伴随 share scope 双份注册、`undefined.call` 风险、子应用无法独立部署。

### 5.2 改造后的结构

```
shared（本地包，无状态）          类型契约 + 纯函数，编译期引用
common（MF 容器 3003，有状态）    useUserStore / eventBus，运行时单例
host / remote / remoteOrder       只消费 common，互不依赖
```

**核心判据**：

| 类型                       | 归属             | 原因                            |
| ------------------------ | -------------- | ----------------------------- |
| 有状态（store、eventBus、全局缓存） | **common 容器**  | 走运行时共享才能保证单例；放进本地包会各打一份 → 多实例 |
| 无状态（类型、纯函数、常量）           | **shared 本地包** | 编译期即可，副本无副作用                  |

### 5.3 最隐蔽的一个坑：相对路径直接引源码

```ts
import { useUserStore } from '../../common/src/store/useUserStore';   // ❌
import { useUserStore } from 'common/useUserStore';                   // ✅
```

前者**绕过了 Module Federation**，把 store 源码编进 host 自己的 bundle → host 一份实例、common 容器一份实例 → 跨应用同步失效，且 Network 里仍会出现"host 加载自己"。

**判据**：跨应用的一切能力导入，都必须走 `remotes` 前缀，绝不跨目录引源码。

### 5.4 验收标准

- [ ] Network 里只有 `common` / `remote` / `remoteOrder` 三个 remoteEntry，**没有 host**；
- [ ] 任一处改用户名，三处同步（证明单例）；
- [ ] 停掉 host，3001 / 3002 仍可独立运行；
- [ ] 子应用只依赖 `common`，不再依赖业务基座。

---

## 六、工程化篇（workspaces）

### 6.1 迁移动作顺序不能错

```bash
# 1) 停所有 dev server（Windows 上文件占用会导致删除失败）
# 2) 根 package.json 声明 workspaces
# 3) 删各子包 node_modules + package-lock.json
# 4) 根目录 npm install（只做一次）
npm ls @mf-demo/shared     # 期望 -> ./shared
```

坑位：

- 子包 `package-lock.json` **必须删**，workspaces 只认根 lock；
- 迁移后**不要**再进子目录 `npm install`，否则重新长出子包 node_modules、提升结构被破坏；
- `shared` 的 `main` 指向 `dist`，改完源码必须 `npm run build`（可用根脚本 `predev` 自动串联）；
- `doc/` 之类带 `package.json` 的参考目录**不要**加进 `workspaces`。

### 6.2 依赖版本策略

- **共享依赖**（进了 `shared` 的：react / react-dom / react-router-dom / zustand）：必须全局同版本，根 `overrides` 强压；
- **私有业务依赖**：各声明各的，允许冲突版本下沉到子包 node_modules，互不影响。

### 6.3 `export *` 的同名冲突

```
Module "./types/user" has already exported a member named 'PermissionCode'
```

`export *` 的包里**每个导出名只能有一处定义**，其他文件只 `import type` 使用，不能再 `export` 同名成员。

###

---

## 七、概念速查

### share scope 与 singleton

- 容器启动时把可共享依赖登记到全局登记处（`__webpack_share_scopes__.default`）：**包名 + 版本 + 模块工厂**；
- 消费方 `import React` 被改写成"去登记处问"：有就复用（**不发请求**），没有才用自己 bundle 里的 fallback；
- 默认按 **semver** 协商，不匹配就各用各的（多实例）；
- `singleton: true` → 即使版本不匹配也**只保留一份**，冲突降级为 warning；
- 生产应加 `requiredVersion` + `strictVersion: true`，让冲突在开发期直接报错。

### 为什么必须单例

| 库                | 两份实例的后果                                                      |
| ---------------- | ------------------------------------------------------------ |
| react            | hooks dispatcher 是模块级变量 → `Invalid hook call`                |
| react-router-dom | Router context 隔离 → `useRoutes must be used within a Router` |
| zustand          | 每个 store 独立闭包 → 改这边那边不动（本次 demo 的核心验证点）                      |

### MF 的 chunk 命名

`src_pages_OrderCenter_tsx-webpack_sharing_consume_default_react_react.js`

= 源模块路径 + "共享依赖消费包装" + 依赖的共享包名。传统单应用的 `123.chunk.js` 数字命名在 MF 下不再出现，**这是正常现象**，且从名字就能看出它依赖共享的 react。

### 复杂系统的做法差异

机制相同（share scope），差别在治理：固定共享清单（最小化）+ 锁版本 + CI 校验一致性 + `strictVersion` 早失败；或干脆外部化（externals / import maps）、或用沙箱隔离（qiankun 各带一份，体积换隔离）。

---

## 八、通用排查方法论

1. **先确认"谁在跑"**：`curl` 容器地址看 `var <name>;`，排除端口错位；
2. **按三层命名对号**：容器名 → exposes key → 导出名；
3. **看请求而不只看报错**：Network 里 remoteEntry 数量、是否有重复、是否出现自己；
4. **单例问题看"改一处是否同步"**：不同步基本就是两份实例；
5. **改一个变量验证一次**：一次只动一处（比如先装依赖跑通，再优化子路径导入），否则无法归因。
