const devCerts = require('office-addin-dev-certs');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');
const webpack = require('webpack');

module.exports = async (env, options) => {
  const dev = options.mode === 'development';
  const config = {
    devtool: 'source-map',
    entry: {
      polyfill: '@babel/polyfill',
      taskpane: './src/taskpane/taskpane.js',
      commands: './src/commands/commands.js',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.html', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
        {
          test: /\.html$/,
          exclude: /node_modules/,
          use: 'html-loader',
        },
        {
          test: /\.(png|jpg|jpeg|gif)$/,
          use: 'file-loader',
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new HtmlWebpackPlugin({
        filename: 'taskpane.html',
        template: './src/taskpane/taskpane.html',
        chunks: ['polyfill', 'taskpane'],
      }),
      new CopyWebpackPlugin([
        {
          to: 'taskpane.css',
          from: './src/taskpane/taskpane.css',
        },
      ]),/*
      New CopyWebpackPlugin([
        {
          to: 'pioneer.json',
          from: './src/data/pioneer.json',
        },
      ]),
      new CopyWebpackPlugin([
        {
          to: 'allsets.json',
          from: './src/data/allsets.json',
        },
      ]),*/
      new HtmlWebpackPlugin({
        filename: 'commands.html',
        template: './src/commands/commands.html',
        chunks: ['polyfill', 'commands'],
      }),
    ],
    devServer: {
      headers: {
        'Access-Control-Allow-Origin': '*',
      },
      https: (options.https !== undefined) ? options.https : await devCerts.getHttpsServerOptions(),
      port: process.env.npm_package_config_dev_server_port || 3000,
    },
  };

  return config;
};
