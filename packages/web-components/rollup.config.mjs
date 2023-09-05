import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json' assert { type: 'json' };
import terser from '@rollup/plugin-terser';

export default [
    // browser-friendly UMD build
    {
        input: 'src/index.ts',
        output: {
            name: 'Relewise-Web-Components',
            file: pkg.browser,
            format: 'umd',
            sourcemap: 'inline',
        },
        external: ['cross-fetch', 'cross-fetch/polyfill'],
        plugins: [
            typescript({ tsconfig: './tsconfig.json' }),
            resolve(),
            commonjs(),
        ],
    },
    // CommonJS (for Node) and ES module (for bundlers) build.
    {
        input: 'src/index.ts',
        output: [
            { file: pkg.main, format: 'cjs', sourcemap: 'inline' },
            { file: pkg.module, format: 'es', sourcemap: 'inline' },
            { 
                file: 'dist/relewise-web-components.min.js',
                format: 'umd',
                name: 'Relewise-Web-Components',
                plugins: [resolve(), terser()],
            },
        ],
        plugins: [
            resolve(),
            typescript({ tsconfig: './tsconfig.json' })],
    },
];