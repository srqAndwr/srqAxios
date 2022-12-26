
const path = require('path');
const TerserPlugin = require("terser-webpack-plugin");
module.exports = {
    mode: 'production',
    entry: path.resolve(__dirname, 'src/index.ts'),
    output: {
        path: path.resolve(__dirname, 'lib'),
        filename:'[name].js'
    },
    resolve: {
        extensions:[".ts", ".js", ".cjs", ".json"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use:'ts-loader'
            }
        ]
    },
    optimization: {
        minimize: true,
        minimizer: [
          new TerserPlugin({
            terserOptions: {
              format: {
                comments: false,
              },
            },
            extractComments: false,
          }),
        ],
      },
}