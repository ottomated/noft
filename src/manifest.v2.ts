const manifest: chrome.runtime.ManifestV2 = {
	name: 'NoFT',
	manifest_version: 2,
	version: process.env.npm_package_version || '1.0.0',
	background: {
		scripts: ['background.ts'],
	},
	icons: {
		'128': 'assets/icon128.png',
		'48': 'assets/icon48.png',
		'16': 'assets/icon16.png',
	},
	permissions: ['storage', 'alarms', 'cookies', '*://*.twitter.com/*'],
	content_scripts: [
		{
			js: ['content/index.ts'],
			// run_at: 'document_start',
			matches: ['*://*.twitter.com/*'],
		},
	],
	options_ui: {
		page: 'pages/popup/index.html',
		browser_style: true,
	} as chrome.runtime.ManifestV2['options_ui'],
	browser_action: {
		default_popup: 'pages/popup/index.html',
	},
	web_accessible_resources: [
		'content/closeInfoPopup.ts',
		'content/autoBlock.ts',
	],
	browser_specific_settings: {
		gecko: {
			id: 'noft@ottomated.net',
			strict_min_version: '89.0',
		},
	},
};

export default manifest;
