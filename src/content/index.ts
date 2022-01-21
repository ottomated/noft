import { Settings, settingsDefaults } from '../common/settings.types';

function injectScript(url: string): void {
	const target = document.head || document.documentElement;
	const script = document.createElement('script');
	script.type = 'module';
	script.src = chrome.runtime.getURL(url);
	target.prepend(script);
}

injectScript('content/closeInfoPopup.js');
injectScript('content/autoBlock.js');

chrome.storage.sync.get((initialSettings) => {
	const settings: Settings = { ...settingsDefaults, ...initialSettings };

	window.addEventListener('message', (ev) => {
		if (ev.data?.noftSettingsRequest) {
			window.postMessage({
				noftSettingsResponse: settings,
			});
		} else if (ev.data?.noftWhitelistUser) {
			if (
				!settings.whitelistedUsers.find(
					(user) => user.id === ev.data.noftWhitelistUser
				)
			) {
				chrome.storage.sync.set({
					whitelistedUsers: [
						...settings.whitelistedUsers,
						ev.data.noftWhitelistUser,
					],
				});
			}
		}
	});

	chrome.storage.onChanged.addListener(async (changes, area) => {
		if (area !== 'sync') return;
		for (const [key, { newValue }] of Object.entries(changes)) {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(settings as any)[key] = newValue;
		}
		window.postMessage({
			noftSettingsResponse: settings,
		});
	});
});
