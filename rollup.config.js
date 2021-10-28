import svelte from 'rollup-plugin-svelte';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import postcss from 'rollup-plugin-postcss';
import livereload from 'rollup-plugin-livereload';
import { terser } from 'rollup-plugin-terser';
import typescript from '@rollup/plugin-typescript';
import preprocess from 'svelte-preprocess';
import nodePolyfills from 'rollup-plugin-node-polyfills';
import autoprefixer from 'autoprefixer';
import sass from 'sass';
import path from 'path';


const production = !process.env.ROLLUP_WATCH;

let watch = {
		clearScreen: false
	}

function _svelte(name) {
	return svelte({
		// enable run-time checks when not in production
		dev: !production,
		extensions: [".svelte"],
		preprocess: preprocess(),

		// we'll extract any component CSS out into
		// a separate file - better for performance
		// css: css => {
		// 	css.write('public/build/' + name + '.css');
		// }
		emitCss: true
	})
}

function _post_css() {
	return postcss({
      extract: true,
	  minimize: true,
      plugins: [
        autoprefixer,
      ],
      use: [
        ['sass', {
          includePaths: [
            './src/theme',
            './node_modules'
          ]
        }]
      ]
	})
	// return postcss({
    //   loaders: [
    //     {
    //       name: 'sass',
    //       test: /\.(sass|scss)$/,
    //       process: (ctx) => {
    //         const result = sass.renderSync({
    //           data: ctx.code,
    //           includePaths: [
	// 			  path.join(__dirname, 'node_modules'),
	// 				'./src/theme',
	// 				'./node_modules'
	// 			],
	// 		});
	// 		console.log('@@', result)
    //         return {code: result.css.toString()};
    //       },
    //     },
    //   ],
    //   plugins: [
    //     autoprefixer,
    //   ],
	//   extract: true,
	// //   minimize: true,
    //   extensions: ['.css', '.scss'],
    // })
}



let plugins = [
		// _svelte('bundle'),

		// If you have external dependencies installed from
		// npm, you'll most likely need these plugins. In
		// some cases you'll need additional configuration -
		// consult the documentation for details:
		// https://github.com/rollup/plugins/tree/master/packages/commonjs
		resolve({
			browser: true,
			dedupe: ['svelte']
		}),
		commonjs(),
		_post_css(),

		// In dev mode, call `npm run start` once
		// the bundle has been generated
		!production && serve(),

		// Watch the `public` directory and refresh the
		// browser on changes when not in production
		!production && livereload('public'),

		// If we're building for production (npm run build
		// instead of npm run dev), minify
		production && terser()
	]

export default [
	{
		input: 'src/edit.ts',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'edit',
			file: 'public/build/edit.js'
		},
		plugins: [_svelte('edit'), typescript(), ...plugins],
		watch
	},
	{
		input: 'src/find.ts',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'find',
			file: 'public/build/find.js'
		},
		plugins: [_svelte('find'), typescript(), ...plugins],
		watch
	},
	{
		input: 'src/conf.ts',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'find',
			file: 'public/build/conf.js'
		},
		plugins: [_svelte('conf'), typescript(), ...plugins],
		watch
	},
	{
		input: 'src/background.mjs',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'background',
			file: 'public/build/background.js'
		},
		plugins: [nodePolyfills(), ...plugins],
		watch
	},
	{
		input: 'src/extract_content.js',
		output: {
			sourcemap: true,
			format: 'iife',
			name: 'background',
			file: 'public/build/extract_content.js'
		},
		plugins: [nodePolyfills(), ...plugins],
		watch
	}

]

function serve() {
	let started = false;

	return {
		writeBundle() {
			if (!started) {
				started = true;

				require('child_process').spawn('npm', ['run', 'start', '--', '--dev'], {
					stdio: ['ignore', 'inherit', 'inherit'],
					shell: true
				});
			}
		}
	};
}
