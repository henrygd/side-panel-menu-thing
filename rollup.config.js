import svelte from 'rollup-plugin-svelte'
import resolve from '@rollup/plugin-node-resolve'
// import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import size from 'rollup-plugin-size'
import modify from 'rollup-plugin-modify'

const production = !process.env.ROLLUP_WATCH

// find replace to make vanilla bundle smaller
const findReplaceOptions = [
	[/^\s*validate_store.+$|throw.+interpolate.+$/gm, ''],
	['if (options.hydrate)', 'if (false)'],
	['if (options.intro)', 'if (false)'],
	[`, important ? 'important' : ''`, ''],
	[/if \('props' in \$\$props.+;$/gm, ''],
	[/\$\$self\.\$\$set = \$\$props => {\s+};$/gm, ''],
	[
		/if \(type === 'object'\) {(.|\n)+if \(type === 'number'\)/gm,
		`if (type === 'number')`,
	],
	[': blank_object()', ': {}'],
	[`typeof window !== 'undefined'`, 'true'],
	['const doc = get_root_for_style(node)', 'const doc = document'],
	[/get_root_for_style\(node\),/g, 'document,'],
].map(([find, replace]) => modify({ find, replace }))

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
				compilerOptions: {
					dev: !production,
				},
			}),
			resolve({ browser: true }),
			...findReplaceOptions,
			production &&
				terser({
					compress: {
						booleans_as_integers: true,
						pure_getters: true,
					},
				}),
			size(),
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
		plugins: [svelte(), resolve({ browser: true })],
	})
}

export default config
