const { NODE_ENV, BABEL_ENV } = process.env;
const test = NODE_ENV === 'test';
const isEs = BABEL_ENV === 'es';
const loose = true;

module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                modules: isEs ? false : 'commonjs',
                loose
            }
        ],
        '@babel/preset-react',
        //'@babel/preset-flow'
    ],
    plugins: [
        '@babel/plugin-transform-runtime',
        '@babel/plugin-transform-arrow-functions',
        '@babel/plugin-transform-flow-strip-types',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-syntax-import-meta',
        ['@babel/plugin-proposal-class-properties', { loose }],
        '@babel/plugin-proposal-json-strings',
        [
            '@babel/plugin-proposal-decorators',
            {
                legacy: true
            }
        ],
        '@babel/plugin-proposal-export-namespace-from',
        '@babel/plugin-proposal-numeric-separator',
        test && '@babel/plugin-transform-react-jsx-source'
    ].filter(Boolean)
}