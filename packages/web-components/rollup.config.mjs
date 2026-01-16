import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import pkg from './package.json' with { type: 'json' };
import terser from '@rollup/plugin-terser';

export default [
    // browser-friendly UMD build
    {
        input: 'src/index.ts',
        output: {
            name: 'RelewiseWebComponents',
            file: pkg.browser,
            format: 'umd',
            sourcemap: true,
        },
        plugins: [
            typescript({
                tsconfig: './tsconfig.json',
                tsconfigOverride: { compilerOptions: { outDir: './dist/browser' } },
            }),
            resolve(),
            commonjs(),
        ],
    },
    // CommonJS (for Node) and ES module (for bundlers) build.
    {
        input: 'src/index.ts',
        output: [
            { file: pkg.main, format: 'cjs', sourcemap: true },
            { file: pkg.module, format: 'es', sourcemap: true },
            {
                file: 'dist/relewise-web-components.min.js',
                format: 'umd',
                name: 'RelewiseWebComponents',
                plugins: [terser()],
            },
        ],
        plugins: [
            resolve(),
            typescript({ tsconfig: './tsconfig.json' })],
    },
];