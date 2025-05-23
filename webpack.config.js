import { fileURLToPath } from 'url';
import ESLintPlugin from 'eslint-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import { readFile } from 'fs/promises';

// Read version from package.json (but don't call it ultraviolet)
const pk = JSON.parse(await readFile(new URL('package.json', import.meta.url)));
process.env.PROXY_VERSION = pk.version;

const isDevelopment = process.env.NODE_ENV !== 'production';

/**
 * @type {import('webpack').Configuration}
 */
const config = {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'eval' : 'source-map',
    entry: {
        bundle: fileURLToPath(new URL('./src/rewrite/index.js', import.meta.url)),
        client: fileURLToPath(new URL('./src/client/index.js', import.meta.url)),
        handler: fileURLToPath(new URL('./src/proxy.handler.js', import.meta.url)), // RENAMED
        sw: fileURLToPath(new URL('./src/proxy.sw.js', import.meta.url)), // RENAMED
    },
    output: {
        path: fileURLToPath(new URL('./dist/', import.meta.url)),
        filename: 'proxy.[name].js', // RENAMED from uv.[name].js
    },
    module: {
        rules: [
            {
                test: /\.(js|mjs)$/,
                enforce: 'pre',
                use: [
                    {
                        loader: 'source-map-loader',
                        options: {
                            filterSourceMappingUrl: (url, resourcePath) =>
                                !resourcePath.includes('parse5'),
                        },
                    },
                ],
            },
        ],
    },
    optimization: {
        minimize: !isDevelopment,
        minimizer: [
            new TerserPlugin({
                exclude: ['sw.js', 'proxy.config.js'], // RENAMED
            }),
        ],
    },
    plugins: [
        new ESLintPlugin(),
        new CopyPlugin({
            patterns: [
                {
                    from: fileURLToPath(new URL('./src/proxy.config.js', import.meta.url)), // RENAMED
                },
                {
                    from: fileURLToPath(new URL('./src/sw.js', import.meta.url)),
                },
            ],
        }),
        new webpack.EnvironmentPlugin('PROXY_VERSION'), // RENAMED
    ],
    performance: {
        hints: false,
    },
};

export default config;
