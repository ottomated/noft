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
		switch (ev.data?.noftRequest) {
			case 'settings': {
				window.postMessage({
					noftSettingsResponse: settings,
				});
				break;
			}
			case 'whitelist': {
				if (
					!settings.whitelistedUsers.find((user) => user.id === ev.data.data.id)
				) {
					chrome.storage.sync.set({
						whitelistedUsers: [...settings.whitelistedUsers, ev.data.data],
					} as Settings);
				}
				break;
			}
			case 'doAction': {
				const oldAction = settings.actionQueue.find(
					(action) => action.id === ev.data.data.id && !action.doneAt
				);
				if (!oldAction) {
					chrome.storage.sync.set({
						actionQueue: [
							...settings.actionQueue,
							{
								id: ev.data.data.id,
								action: ev.data.data.action,
							},
						],
					} as Settings);
				}
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
