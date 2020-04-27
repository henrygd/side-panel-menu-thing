import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
// import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import buble from '@rollup/plugin-buble'
import filesize from 'rollup-plugin-filesize'

const production = !process.env.ROLLUP_WATCH

let iifeOutput = [
	{
		// demo site / dev file
		format: 'iife',
		name: 'sidePanel',
		file: 'public/side-panel-menu-thing.js',
		strict: false,
	},
]

production &&
	iifeOutput.push({
		// dist file
		format: 'iife',
		name: 'sidePanel',
		file: 'dist/side-panel-menu-thing.min.js',
		strict: false,
	})
production &&
	iifeOutput.push({
		// dist file
		format: 'umd',
		name: 'sidePanel',
		file: 'dist/side-panel-menu-thing.umd.js',
		strict: false,
	})

let config = [
	{
		input: 'src/side-panel-menu-thing.js',
		output: iifeOutput,
		plugins: [
			svelte({
				dev: !production,
			}),
			resolve(),
			production &&
				terser({
					compress: {
						booleans_as_integers: true,
						pure_getters: true,
					},
				}),
			buble({
				transforms: { forOf: false },
			}),
			filesize({
				showMinifiedSize: !production,
			}),
		],
	},
]

if (production) {
	// es file
	config.push({
		input: 'src/side-panel-menu-thing.js',
		output: {
			format: 'es',
			file: 'dist/side-panel-menu-thing.mjs',
		},
		plugins: [
			svelte(),
			resolve(),
			buble({
				transforms: { forOf: false },
			}),
		],
	})
}

export default config
