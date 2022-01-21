const manifest: chrome.runtime.Manifest = {
	name: 'NoFT',
	manifest_version: 2,
	version: '1.0.0',
	icons: {
		256: 'assets/icon.png',
	},
	background: {
		scripts: ['background/index.ts'],
	},
	permissions: ['storage'],
	content_scripts: [
		{
			js: ['content/index.ts'],
			// run_at: 'document_start',
			matches: ['*://*.twitter.com/*'],
		},
	],
	options_page: 'pages/popup/index.html',
	browser_action: {
		default_popup: 'pages/popup/index.html',
	},
	web_accessible_resources: [
		'content/closeInfoPopup.ts',
		'content/autoBlock.ts',
	],
};

export default manifest;
