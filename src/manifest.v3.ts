const manifest: chrome.runtime.ManifestV3 = {
	name: 'NoFT',
	manifest_version: 3,
	version: '1.0.0',
	icons: {
		'128': 'assets/icon128.png',
		'48': 'assets/icon48.png',
		'16': 'assets/icon16.png',
	},
	permissions: ['storage'],
	host_permissions: ['*://*.twitter.com/*'],
	content_scripts: [
		{
			js: ['content/index.ts'],
			// run_at: 'document_start',
			matches: ['*://*.twitter.com/*'],
		},
	],
	options_page: 'pages/popup/index.html',
	action: {
		default_popup: 'pages/popup/index.html',
	},
	web_accessible_resources: [
		{
			resources: ['content/closeInfoPopup.ts', 'content/autoBlock.ts'],
			matches: ['*://*.twitter.com/*'],
		},
	],
};

export default manifest;
