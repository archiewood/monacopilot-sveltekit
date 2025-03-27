import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['monaco-editor/esm/vs/editor/editor.worker']
	},
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					jsonWorker: ['monaco-editor/esm/vs/language/json/json.worker'],
					cssWorker: ['monaco-editor/esm/vs/language/css/css.worker'],
					htmlWorker: ['monaco-editor/esm/vs/language/html/html.worker'],
					tsWorker: ['monaco-editor/esm/vs/language/typescript/ts.worker'],
					editorWorker: ['monaco-editor/esm/vs/editor/editor.worker'],
				},
			},
		},
	},
	ssr: {
		noExternal: ['monaco-editor']
	},
	css: {
		preprocessorOptions: {
			scss: {
				additionalData: `@import "monaco-editor/esm/vs/editor/standalone/browser/standalone-tokens.css";`
			}
		}
	}
});
