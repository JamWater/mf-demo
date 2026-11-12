const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ModuleFederationPlugin = require('webpack/lib/container/ModuleFederationPlugin');

module.exports = {
  entry: './src/index.tsx',
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: 'auto',
  },
  devServer: {
    port: 3000,
    hot: true,
    open: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.(scss|css)$/,
        use: [
          'style-loader', // 把样式注入到页面
          'css-loader', // 解析 CSS 文件
          'sass-loader', // 把 SCSS 编译成 CSS
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      templateContent: '<div id="root"></div>',
    }),
    new ModuleFederationPlugin({
      name: 'host',
      exposes: {
        './useUserStore': './src/store/useUserStore', // 暴露给子应用的模块
      },
      remotes: {
        // key=名字remote，值=名字@远程地址/remoteEntry.js
        remote: 'remote@http://localhost:3001/remoteEntry.js',
      },
      shared: {
        react: { singleton: true, eager: true },
        'react-dom': { singleton: true, eager: true },
        'react/jsx-runtime': { singleton: true, eager: true },
        'react-router-dom': { singleton: true, eager: true },
        zustand: { singleton: true, eager: true },
      },
    }),
  ],
};
