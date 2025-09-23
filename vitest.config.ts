import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'jsdom', // <-- change 'node' to 'jsdom'
		coverage: {
			reporter: ['text', 'json', 'html'],
		},
	},
})
