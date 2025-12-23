const path = require('node:path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    target: 'node',
    entry: './src/main.ts',

    output: {
        path: path.resolve(__dirname, 'dist-bundle'),
        filename: 'main.js',
        libraryTarget: 'commonjs2',
    },

    resolve: {
        extensions: ['.ts', '.js', '.json'],
        // Resolver módulos desde el workspace root (npm hoisting)
        modules: [
            path.resolve(__dirname, '../../node_modules'),
            'node_modules',
        ],
        // Fallbacks para módulos opcionales de NestJS
        fallback: {
            '@nestjs/microservices': false,
            '@nestjs/websockets': false,
            'cache-manager': false,
            'class-transformer/storage': false,
        },
    },

    // Resolver loaders desde el workspace root
    resolveLoader: {
        modules: [
            path.resolve(__dirname, '../../node_modules'),
            'node_modules',
        ],
    },

    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: 'ts-loader',
                    options: {
                        transpileOnly: true,
                        configFile: 'tsconfig.build.json',
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },

    plugins: [
        // Ignorar warnings de opcionales que no existen
        new webpack.IgnorePlugin({
            checkResource(resource) {
                const lazyImports = [
                    '@nestjs/microservices',
                    '@nestjs/websockets',
                    '@nestjs/platform-socket.io',
                    'class-transformer/storage',
                    'cache-manager',
                    'ioredis',
                    '@nestjs/microservices/microservices-module',
                    '@nestjs/websockets/socket-module',
                ];
                if (!lazyImports.includes(resource)) {
                    return false;
                }
                try {
                    require.resolve(resource, { paths: [__dirname] });
                    return false;
                } catch (err) {
                    return true;
                }
            },
        }),

        // Copiar assets (templates, etc)
        new CopyPlugin({
            patterns: [
                {
                    from: 'src/assets',
                    to: 'assets',
                    noErrorOnMissing: true,
                },
            ],
        }),
    ],

    // Externals - Módulos que NO se deben bundlear
    externals: [
        function ({ request }, callback) {
            // Express y sus dependencias críticas que tienen problemas de bundling
            // El módulo mime usado por express tiene problemas cuando se bundlea
            const expressRelated = [
                'express',
                'mime',
                'mime-types',
                'mime-db',
                'send',
                'serve-static',
                'content-disposition',
                'content-type',
            ];
            if (expressRelated.includes(request) ||
                expressRelated.some(mod => request.startsWith(mod + '/'))) {
                return callback(null, 'commonjs ' + request);
            }

            // Todo lo demás se bundlea
            callback();
        },
    ],

    optimization: {
        minimize: false, // No minificar para mejor debugging
    },

    devtool: 'source-map',

    // Suprimir warnings conocidos
    ignoreWarnings: [
        { message: /Critical dependency/ },
        { message: /the request of a dependency is an expression/ },
    ],
};
