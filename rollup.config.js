import path from 'path';

import { terser } from 'rollup-plugin-terser';
import css from 'rollup-plugin-postcss';
import image from '@rollup/plugin-image';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

import {
	chromeExtension,
	simpleReloader,
} from 'rollup-plugin-chrome-extension';
import { emptyDir } from 'rollup-plugin-empty-dir';
import zip from 'rollup-plugin-zip';
import replace from '@rollup/plugin-replace';
import { readFileSync } from 'fs';

const isProduction = process.env.NODE_ENV === 'production';

const env = Object.fromEntries(
	readFileSync('.env', 'utf8')
		.split('\n')
		.map((l) => {
			const [k, v] = l.split('=');
			return ['process.env.' + k, JSON.stringify(v)];
		})
);

const getConfig = (version) => ({
	input: `src/manifest.${version}.ts`,
	output: {
		dir: 'dist/' + version,
		format: 'esm',
		chunkFileNames: path.join('chunks', '[name]-[hash].js'),
	},
	plugins: [
		replace({
			'process.env.NODE_ENV': isProduction
				? JSON.stringify('production')
				: JSON.stringify('development'),
			...env,
			preventAssignment: true,
		}),
		chromeExtension(),
		// Adds a Chrome extension reloader during watch mode
		simpleReloader(),
		resolve(),
		commonjs(),
		typescript(),
		css(),
		image(),
		// Empties the output dir before a new build
		emptyDir(),
		isProduction && terser(),
		// Outputs a zip file in ./releases
		isProduction && zip({ dir: 'releases/' + version }),
	],
});

const configs = [getConfig('v3')];
if (isProduction) configs.push(getConfig('v2'));

export default configs;
