// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="env.d.ts" />

// import { GenerateSW, InjectManifest } from "workbox-webpack-plugin";
import { pluginModuleFederation } from "@module-federation/rsbuild-plugin";
import { ConfigParams, logger, RsbuildConfig } from "@rsbuild/core";
import { pluginBabel } from "@rsbuild/plugin-babel";
import { pluginEslint } from "@rsbuild/plugin-eslint";
import { pluginReact } from "@rsbuild/plugin-react";
import { pluginSvgr } from "@rsbuild/plugin-svgr";
import { RsdoctorRspackPlugin } from "@rsdoctor/rspack-plugin";
import { CopyRspackPlugin } from "@rspack/core";
import merge from "lodash/merge";
import path from "node:path";

import { createDevServerProxyConfig } from "./config/rsbuild";
import { DaaSBuildConfigType } from "./env";
import moduleFederationConfig from "./module-federation.config";
import { getBuildEnv } from "./src/utils/env";
import swConfig from "./workbox";
// Project UID follows the format: {region}-{product}-{channel}-{environment}
// Example: sg-digibank-shared-dev, hk-digibank-shared-webuat
// packages for display default loading component
const baseGroup = [
  "/react/",
  "/react-dom/",
  "/styled-components/",
  "react-error-boundary",
  "react-fast-compare",
  "react-is",
  "@swc",
  "@babel",
  "invariant",
  "shallowequal",
  "module-federation",
  "@emotion",
  "pubsub-js",
  "scheduler",
  "hoist-non-react-statics",
];
const sharedGroup = ["polyfill", "core-js"];
// const vendorGroup = [
//   "rc-",
//   "@dbs",
//   "@athena-ui-components",
//   "webstudio",
//   "i18",
//   "react-router",
//   "react-device-detect",
//   "dayjs",
//   "tslib",
//   "ahook",
//   "classnames",
//   "lodash",
// ];
const { mockServiceWorkerURL } = getBuildEnv();
const isLocalEnv = process.env.PUBLIC_IS_LOCAL === "1";
const defineDaasConfig = async ({ env, command, envMode = "unknown" }: ConfigParams) => {
  // envMode structure = <country>-<product>-<environment>
  // e.g., "sg-digibank-dev"
  const parts = envMode.split("-");
  console.log(parts);
  // Validate that we have all four required parts
  if (parts.length !== 4) {
    logger.error(
      `Invalid project UID format: ${envMode}"\n` +
        "Expected format: {region}-{product}-{channel}-{environment}\n" +
        "Example: sg-digibank-shared-dev or hk-digibank-shared-webuat\n" +
        "Run with: npm run dev <region>-<product>-<channel>-<environment>",
    );
    process.exit(1);
  }

  const [region, product, channel, environment] = parts;

  // Validate each component individually
  const missingComponents: string[] = [];
  if (!region) missingComponents.push("region");
  if (!product) missingComponents.push("product");
  if (!channel) missingComponents.push("channel");
  if (!environment) missingComponents.push("environment");

  if (missingComponents.length > 0) {
    logger.error(
      `Missing project UID component(s): ${missingComponents.join(", ")}\n` +
        "Expected format: {region}-{product}-{channel}-{environment}\n" +
        "Example: sg-digibank-shared-dev or hk-digibank-shared-webuat\n" +
        "Run with: npm run dev <region>-<product>-<channel>-<environment>",
    );
    process.exit(1);
  }

  // Validate known regions (add more as needed)
  const validRegions = ["sg", "hk", "tw", "id", "in", "cn"];
  if (!validRegions.includes(region)) {
    logger.warn(`Warning: Unrecognized region "${region}". Valid regions are: ${validRegions.join(", ")}`);
  }
  const projectCode = `${region}/${product}/${channel}`;

  // Auto-configure environment variables from TypeScript config
  const getProjectEnvConfig = async (region: string, product: string, channel: string) => {
    try {
      const { default: config } = await import("./config/env.config");
      // TypeScript config provides better type safety and comments
      const mergedChannel = (
        channel === "shared" ? (process.env.PUBLIC_DEV_HOST ? "mb" : channel) : channel
      ).toLocaleLowerCase();
      // Start with channel defaults
      const channelDefaults =
        config.channelDefaults[mergedChannel as keyof typeof config.channelDefaults] ||
        config.channelDefaults.ib;

      // Apply product overrides with region
      const regionConfig = config.productOverrides[region];
      const productConfig = regionConfig?.[product];
      const productOverrides = productConfig?.[mergedChannel] || {};

      // Merge configurations (productOverrides override channelDefaults)
      const mergedConfig = {
        ...channelDefaults,
        ...productOverrides,
        PUBLIC_DEV_HOST: mergedChannel === "mb" ? "MB" : "IB",
      };

      logger.log("Loaded environment config from TypeScript:", mergedConfig);
      return mergedConfig;
    } catch (error) {
      logger.warn("Failed to load env.config.ts, using fallback:", error);
      // Fallback to original logic
      const fallbackConfig = {
        PUBLIC_DEV_HOST: channel === "mb" ? "MB" : "IB",
        PUBLIC_CHANNEL_TYPE: channel === "mb" ? "mobile" : "desktop",
        DAAS_LANDING_MFE: "dashboard",
        DAAS_APP_VERSION: "26.0.000",
        DAAS_MFE_DEFAULT_DOMAIN: "",
      };
      return fallbackConfig;
    }
  };

  const projectEnvConfig = await getProjectEnvConfig(region, product, channel);

  const productionEnvironments = ["webproduction", "webpat", "webpilot"];
  const isLocalBuild = isLocalEnv;

  const isProdBuild = productionEnvironments.includes(environment) && !isLocalEnv;

  const mergedInputs: BuildInputParameterType = {
    env,
    command,
    envMode,
    region,
    product,
    channel,
    environment,
    projectCode,
    isProdBuild,
    isLocalBuild,
    devHostName: projectEnvConfig.PUBLIC_DEV_HOST,
  };
  console.log("Build configuration:", mergedInputs);
  console.log("Auto-configured environment variables:", projectEnvConfig);

  // Import the configuration asynchronously
  const getRegionConfig = async () => {
    try {
      const regionConfig = await import(`./config/regions/${region}/${product}/${channel}`);
      return regionConfig.default(mergedInputs);
    } catch (error) {
      logger.error(`Failed to load region config for ${region}/${product}/${channel}:`, error);
      return null;
    }
  };
  const regionConfig: DaaSBuildConfigType = await getRegionConfig();
  if (regionConfig) {
    logger.log("Region configuration loaded:", regionConfig);
    // Use regionConfig in your application setup
  } else {
    logger.error("Failed to load region configuration. Using default settings.");
    // Implement fallback logic or default configuration
  }

  const devBase = regionConfig.development?.base || "/";
  const cleanBase = devBase.replace(/\/+$/, "");

  const developmentServerConfig = {
    host: "127.0.0.1",
    port: regionConfig.development?.port,
    base: regionConfig.development?.base,
    open: false, // Disable automatic browser opening
    headers: {
      "Service-Worker-Allowed": "/",
    },
    proxy: await createDevServerProxyConfig({
      port: regionConfig.development?.port || 5100,
      cleanBase,
      mockServiceWorkerURL,
      remoteTarget: projectEnvConfig.DAAS_MFE_DEFAULT_DOMAIN,
      region,
      product,
      channel,
    }),
  };
  logger.log("developmentServerConfig", developmentServerConfig);

  // Get BUILD_CHANNEL from environment (set by dev/build script when channel= parameter is passed)
  const buildChannel = process.env.BUILD_CHANNEL;

  const envVariables = {
    "import.meta.env.DAAS_PROD_FLAG": JSON.stringify(isProdBuild),
    "import.meta.env.DAAS_LOCAL_FLAG": JSON.stringify(isLocalBuild),
    "import.meta.env.DAAS_ENV": JSON.stringify(environment),
    "import.meta.env.DAAS_REGION": JSON.stringify(region),
    "import.meta.env.DAAS_PRODUCT": JSON.stringify(product),
    "import.meta.env.DAAS_CHANNEL": JSON.stringify(channel),
    "import.meta.env.DAAS_VERSION": JSON.stringify(regionConfig.rsbuild?.html?.meta?.version),
    "import.meta.env.DAAS_PROJECT_CODE": JSON.stringify(`${region}/${product}/${channel}`),
    "import.meta.env.DAAS_BASE": JSON.stringify(env === "development" ? regionConfig.development?.base : undefined),
    ...(buildChannel && {
      "import.meta.env.PUBLIC_BUILD_CHANNEL": `${buildChannel}`,
    }),

    "import.meta.env.PUBLIC_CHANNEL_TYPE": JSON.stringify(projectEnvConfig.PUBLIC_CHANNEL_TYPE),
    ...(isLocalEnv && {
      "import.meta.env.DAAS_LANDING_MFE": JSON.stringify(projectEnvConfig.DAAS_LANDING_MFE),
      "import.meta.env.DAAS_APP_VERSION": JSON.stringify(projectEnvConfig.DAAS_APP_VERSION),
      "import.meta.env.DAAS_MFE_DEFAULT_DOMAIN": JSON.stringify(projectEnvConfig.DAAS_MFE_DEFAULT_DOMAIN),
    }),
  };
  logger.log("envVariables", envVariables);

  const config: RsbuildConfig = {
    security: {
      nonce: "CSP_NONCE_PLACEHOLDER",
    },
    plugins: [
      // Disabled: styled-components v5 + React 19 type conflicts
      // pluginTypeCheck({
      //   tsCheckerOptions: {},
      // }),
      pluginReact(),
      pluginBabel({
        include: /\.(?:js|tsx)$/,
        babelLoaderOptions(opts) {
          // React Compiler configured for React 18
          opts.plugins?.unshift(["babel-plugin-react-compiler", { target: "18" }]);
        },
      }),

      pluginModuleFederation(
        {
          ...moduleFederationConfig,
          // Merge region-specific Module Federation config (e.g., DTS settings)
          ...(regionConfig.moduleFederation || {}),
        },
        {},
      ),
      pluginEslint({
        // enable: false,
        eslintPluginOptions: {
          fix: true,
          cwd: __dirname,
          configType: "flat",
        },
      }),
      pluginSvgr({
        svgrOptions: {
          exportType: "named",
        },
      }),
      // pluginWebPack(),
    ],
    server: {
      ...developmentServerConfig,
      publicDir: false, // Disable default public directory copying completely
    },
    dev: {
      progressBar: true,
      client: {
        overlay: false,
      },
      lazyCompilation: false,
      writeToDisk: false,
      hmr: false, // disable this one to prevent dev mode initial load webpack undefined error
      watchFiles: {
        paths: ["config/env.config.ts", "module-federation.config.ts"],
        type: "reload-server",
      },
    },
    browser: {
      stackTrace: "Full",
    },
    liveReload: false, // Stops automatic page refresh and console clearing
    html: {
      meta: {
        viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no",
      },
      templateParameters: {
        isProd: isProdBuild,
      },
      tags: [
        ...(isLocalEnv
          ? [
              {
                tag: "script",
                attrs: {
                  src: "./static/js/auto.global.js",
                },
                append: false,
              },
            ]
          : []),
        {
          tag: "script",
          attrs: {
            src: "./static/js/encryption.js",
            defer: true,
            nonce: "CSP_NONCE_PLACEHOLDER",
          },
          append: false,
        },
        {
          tag: "script",
          attrs: {
            src: "./static/js/pinEncryption.js",
            defer: true,
            nonce: "CSP_NONCE_PLACEHOLDER",
          },
          append: true,
        },
      ],
    },
    output: {
      // publicPath:
      //   env === "development"
      //     ? `http://${developmentServerConfig.host}:${developmentServerConfig.port}${regionConfig.host?.base}`
      //     : "auto",
      polyfill: "usage",
      filenameHash: "fullhash:8", // cspell:disable-line
      sourceMap: !isProdBuild,
      manifest: true,
      minify: !isLocalBuild,
      assetPrefix: "auto", // regionConfig.host?.base,
      distPath: {
        root: "build",
      },
    },
    source: {
      // entry: "src/page1.tsx",
      // entry: "src/page1.tsx",
      tsconfigPath: "./tsconfig.build.json",
      assetsInclude: /\.pdf$/,
      define: envVariables,
      include: ["./src"],
      exclude: [
        "**/*.test.*",
        "**/*.spec.*",
        "**/__tests__/**",
        "**/playwright/**",
        "**/e2e-tests/**",
        "**/*.e2e.*",
        "**/test-results/**",
        "**/playwright-report/**",
        "playwright.config.*",
      ],
    },
    resolve: {
      alias: {
        // Map @/projects/current to the actual project config based on build-time environment
        // This provides IDE code intelligence and eliminates async chunks
        // IMPORTANT: Must be defined before general @/ mapping to take precedence
        "@/projects/current": path.resolve(__dirname, `src/projects/${region}/${product}/${channel}`),
        // Keep existing @ alias for other paths
        "@": path.resolve(__dirname, "src"),
        "@daas/devtools/panels": path.resolve(__dirname, "packages/zustand-engine/packages/devtools/panels"),
        "@daas/devtools": path.resolve(__dirname, "packages/zustand-engine/packages/devtools/src/index.ts"),
        "@daas/zustand-engine": path.resolve(__dirname, "packages/zustand-engine/src/index.ts"),
      },
    },
    tools: {
      rspack: (config) => {
        config.externals = {
          vitest: "vitest",
        };

        // Exclude test files from HMR/watch to prevent unnecessary rebuilds
        config.watchOptions = {
          ...config.watchOptions,
          ignored: [
            "**/node_modules/**",
            "**/__tests__/**",
            "**/*.test.*",
            "**/*.spec.*",
            "**/test/**",
            "**/tests/**",
            "**/playwright/**",
            "**/playwright-report/**",
            "**/vitest.config.*",
            "**/playwright.config.*",
            "**/doc-site/**",
            "**/build/**",
          ],
        };

        // Ensure optimization.chunkIds is set to 'named'
        config.optimization = {
          ...config.optimization,
          // Enable more meaningful file name for size troubleshooting
          chunkIds: isProdBuild ? "deterministic" : "named",
        };

        // Configure custom file copying to build/static

        // Add custom copy configuration for all public files with custom locations
        const copyPlugin = new CopyRspackPlugin({
          patterns: [
            // Copy all public files except umd and remote (default behavior)
            {
              from: "public",
              to: "",
              globOptions: {
                ignore: [
                  "**/umd/**",
                  "**/remote/**",
                  "**/.DS_Store",
                  ...(isProdBuild ? ["**/mockServiceWorker.js"] : []),
                ],
              },
            },
            // Move UMD files to build/static/js/
            {
              from: "public/umd",
              to: "static/js",
              globOptions: {
                ignore: ["**/.DS_Store"],
              },
            },
            // Move remote config to build/static/remote/config/regions/
            {
              from: "public/remote/config/regions",
              to: "static/remote/config/regions",
              globOptions: {
                ignore: ["**/.DS_Store"],
              },
            },
            {
              from: `public/remote/config/regions/${region}/${product}/${channel}/htaccess/${environment}/.htaccess`,
              to: ".htaccess",
            },
          ],
        });

        // Add Rsdoctor plugin when enabled
        const rsdoctorPlugins = process.env.RSDOCTOR
          ? [
              new RsdoctorRspackPlugin({
                // Generate static HTML report for easy sharing and viewing
                disableClientServer: false,
                mode: "normal", // Use "normal" for full details, "brief" for faster analysis
                features: {
                  loader: true,
                  plugins: true,
                  resolver: true,
                  bundle: true,
                },
                linter: {
                  level: "Warn",
                  rules: {
                    "ecma-version-check": "off",
                    "duplicate-package": "on",
                  },
                },
              }),
            ]
          : [];

        // Append your existing plugin
        config.plugins = [
          ...(config.plugins || []),
          copyPlugin,
          ...rsdoctorPlugins,
          ...(env === "development" ? [] : [swConfig]),
        ];
      },
    },
    performance: {
      ...(regionConfig.performance?.analyze
        ? {
            bundleAnalyze: {
              generateStatsFile: true,
            },
          }
        : {}),
      // chunkSplit: {
      //   strategy: "custom",
      //   splitChunks: {
      //     cacheGroups: {
      //       // Antd UI libraries - highest priority to ensure they are split separately
      //       antd: {
      //         test(module: any) {
      //           const context = module.nameForCondition?.();
      //           return context && /[\\/]node_modules[\\/]antd[\\/]/.test(context);
      //         },
      //         name: "vendors/antd",
      //         chunks: "all",
      //         priority: 5,
      //         enforce: true,
      //       },
      //       antdMobile: {
      //         test(module: any) {
      //           ...
      //         },
      //       },
      //       vendors: {
      //         test: /[\\/]node_modules[\\/]/,
      //         name: "vendors/others",
      //         chunks: "all",
      //         enforce: true,
      //         priority: -2,
      //       },
      //     },
      //   },
      // },
      // environments:{
      //   uat: {
      //   }
      // }
    },
  };

  const merged = merge(config, regionConfig.rsbuild);
  // console.log(JSON.stringify(merged, "merged config")); // cspell:disable-line
  return merged;
};

export default defineDaasConfig;
