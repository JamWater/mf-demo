# DBS React DaaS Host 整体技术架构

## 一、整体技术架构

**DBS React DaaS Host**

> 主应用 / Shell / 统一入口  
> 路由 · 布局 · 认证相关状态 · 全局数据 · MFE 加载

**↓**  
**Module Federation 2.0 · 运行时加载**

- **Accounts MFE**
- **Payments MFE**
- **等等 MFE**

**共享基础设施**：React · DaaS SDK · DBS Design System · 全局状态与跨 MFE 通信

---

Host 负责搭建整个银行前端的公共框架，具体业务由独立的 MFE 实现。Host 再通过微前端机制把它们组合成一个完整的个人银行应用。

> **注意：** 不同 MFE 可以独立构建和部署，但需要遵守 Host 规定的集成方式。

---

## 二、Host 使用的技术和框架详解

### 1. React 18 + TypeScript

**前端核心**

React 负责构建页面、组件和交互；TypeScript 在 JavaScript 基础上增加类型检查，帮助发现数据类型错误。

- `*.tsx`：通常包含 React 组件和 JSX。
- `*.ts`：通常包含类型定义、工具函数、配置和业务逻辑。
- `useState`、`useEffect`、自定义 Hooks：常见的 React 编程方式。

> **排查时看什么：** 页面组件、props、Hooks、接口数据类型，以及错误是否发生在组件渲染阶段。

### 2. Module Federation 2.0

**微前端核心**

不同项目可以在运行时加载彼此暴露的模块，而不必把所有业务代码打包成一个应用。

关键概念：

- **Host**：主应用，负责加载和协调远程模块。
- **Remote MFE**：远程微前端，暴露组件或页面供 Host 使用。
- **Expose**：远程项目对外提供的模块。
- **Remote Entry**：远程模块的入口元数据，常见文件名为 `remoteEntry.js`，在 DBS 应用中也是以 `remoteEntry.js` 命名的。
- **Shared**：多个应用共享的依赖，例如 React 和 DBS DaaS SDK。

> **排查时看什么：** Remote URL、模块暴露名称、远程加载失败、共享依赖版本和 singleton 配置。
>
> 例如，登录后某个 Account MFE 无法显示，但是 Payment MFE 的功能是正常的，即使 Host 本身启动正常，也可能是远程入口地址、Expose 名称或网络加载出错。

### 3. Rsbuild + Rspack

**构建工具**

> **排查时看什么：**
>
> - `package.json` 的 scripts 和依赖版本。
> - Rsbuild 配置文件，例如 `rsbuild.config.ts`。
> - 构建错误、依赖解析失败、静态资源路径错误。
>
> _注意：仅针对 Host 使用 Rsbuild/Rspack，每个子 MFE 的构建工具还不确定。_

### 4. React Router v7

**路由管理**

负责 URL 与页面之间的映射，决定用户访问某个地址时显示哪个页面或 MFE。

文档列出的路由包括：

- `/`：默认 Dashboard。
- `/mfe/:mfe/*`：动态 MFE 路由。
- `/:app/mfe/:mfe/*`：带应用范围的 MFE 路由。
- `/auth`：认证页面。

> **排查时看什么：** `src/Landing.tsx`、`src/router.config.tsx`、路由参数、页面跳转及路由对应的加载组件。
>
> **特别注意：** DaaS 文档规定，`navigate()` 属于 Host 的导航机制，MFE 不应自行接管 Host 的 Router。

### 5. Zustand + Immer

**状态管理**

Zustand 用来保存和更新 React 应用的共享状态；Immer 帮助开发人员以更方便的方式处理不可变状态更新。

例如，Host 需要让多个 MFE 访问共同的数据或上下文时，就可能通过全局 Store 管理相关状态。比如项目中有出现 `…/stores/global.ts` 就是 Zustand 全局状态相关文件。

> **排查时看什么：** Store 的初始值、状态更新方法、订阅逻辑，以及某个值为什么在一个组件里更新、另一个组件却没有同步。

### 6. Styled Components + Tailwind CSS

**样式系统统一由 Weizong UI framework 团队维护，所以跟 Ideal 一样**

> **排查时看什么：** 略。

### 7. DBS DaaS SDK + DBS Design System

**DBS 内部集成**

理解项目的重点：

- `@dbs/webstudio-hub-athena-daas`：DaaS SDK，负责平台约定的共享能力及跨 MFE 通信；文档要求在 Host 与相关 MFE 间按 singleton 方式共享。
- `@dbs/webstudio-dls`：DBS Design System，提供统一的设计规范和 UI 组件。
- `@webstudio/analytics`：银行应用的数据分析集成。

> **排查时看什么：** SDK 初始化、依赖共享配置、跨 MFE 数据请求、统一 UI 组件，以及分析事件集成。

---

## 三、Host 的关键代码目录

| 文件或目录                      | 主要职责                              |
| ------------------------------- | ------------------------------------- |
| `src/index.tsx`                 | 主入口，通过动态导入进入初始化流程    |
| `src/bootstrap.tsx`             | 初始化应用，包含错误边界相关逻辑      |
| `src/Landing.tsx`               | Router Provider 设置                  |
| `src/router.config.tsx`         | 路由定义，以及 HOC 包装               |
| `src/providers/`                | Provider 链，负责组合上下文及应用能力 |
| `src/components/MasterLoader/`  | 核心 MFE 加载逻辑                     |
| `src/stores/global.ts`          | Zustand 全局状态                      |
| `src/layout/`                   | Mobile、Desktop、Simple 等布局        |
| `config/regions/`               | 构建时的区域、产品、渠道配置          |
| `public/remote/config/regions/` | 运行时远程配置                        |
| `src/projects/`                 | 区域、产品、渠道的项目定制            |

_(注：这些是文档描述的目录；实际以 git 项目分支为主。)_

---

## 四、把 Host 的启动和微前端加载串起来

下面步骤是一个页面从启动到显示业务内容的过程。

1. **启动开发服务器或部署后的应用**（`npm scripts` · `Rsbuild/Rspack`）
2. **主入口初始化**（`src/index.tsx` → `src/bootstrap.tsx`）
3. **加载全局上下文与路由**（`Landing.tsx` · `Provider Chain` · `Zustand`）
4. **用户进入某个业务页面**（React Router 匹配路径）
5. **MasterLoader / Module Federation**（解析并加载目标远程 MFE）
6. **MFE 组件渲染**（共享 React、DaaS SDK，使用统一设计系统）

_(注：这是根据文档中各模块职责整理出的逻辑关系，不代表每一步都严格按这个顺序同步执行；动态导入、路由懒加载和 Provider 初始化可能存在交错。)_

---

## 五、排查问题时，应该先看哪个技术

### MFE 页面加载失败

优先检查以下内容：

- Module Federation 配置
- Remote Entry 状态
- MasterLoader 加载逻辑
- 运行时配置
- 浏览器 Network 网络请求

### URL 正确，但打开了错误页面

优先检查以下内容：

- React Router 配置
- `router.config.tsx` 路由定义
- 路由参数传递

### React Hook 报错或依赖冲突

检查以下内容：

- Module Federation 的 `shared` 配置
- React 版本一致性
- SDK 是否按要求共享为 `singleton`

### MFE 间数据不同步

检查以下内容：

- `src/stores/global.ts` 全局状态
- DaaS SDK 的数据请求接口
- 跨 MFE 通信约定

---

## 补充：关于 React Native 与 WebView 的说明

> 文档有提到 React Native，但 DBS React DaaS Host 的手机端主要是运行在原生银行 App 的 WebView 中的 React Web 应用，并不是 Host 本身使用 React Native 开发。

### 1. 文档中的相关章节

- **architecture/platform-overview**：Provider Chain 中包含 `withWebView`，注释明确写着 Native app integration。
- **native-communications/react-native-communication-standards**：介绍 React WebView 与 Native App 之间的双向通信。
- **architecture/regional-projects**：说明新加坡 digibank 手机 App 使用 WebView，并逐步迁移到 React DaaS。

### 2. 手机端的实际架构

```text
DBS 原生手机银行 App
  └─ Native iOS / Android 层
       ├─ 原生功能、Native Bridge
       └─ WebView
            └─ React DaaS Host
                 ├─ React + TypeScript + Module Federation
                 └─ MFE
                      ├─ Accounts
                      ├─ Payments
                      └─ 等 React Web 页面
```

---

## 参考链接

- [技术架构总览] (- site/digi-web/doc/daas/architecture/platform-overview/index.html) — 整体技术栈、Host、Provider Chain、路由、状态管理和环境变量。

- [Module Federation Basics] (- site/digi-web/doc/daas/faq/module-federation-basics/index.html) — 微前端、共享依赖以及如何避免重复加载依赖。
- [Architecture — Regional Projects] (- site/digi-web/doc/daas/architecture/regional-projects/index.html) — 不同 Region、Product、Channel 的项目结构和定制方式。
- [Native Integration — Overview] (- site/digi-web/doc/daas/native-integration/overview/index.html) — 原生 App、WebView 和 DaaS 之间的集成关系。
- [Native Communications — React Native Communication Standards] (- site/digi-web/doc/daas/native-communications/react-native-communication-standards/index.html) — Native 与 WebView 之间的双向通信约定。
  > **注：** 以上html来自离线的React DaaS Host文档zip包。
