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

function addItemToList<K extends 'whitelistedUsers' | 'actionQueue'>(
	key: K,
	item: Settings[K][number]
) {
	return new Promise<void>((resolve) => {
		chrome.storage.sync.get(key, (settings) => {
			const list = settings[key] as typeof item[];
			list.push(item);
			chrome.storage.sync.set(
				{
					[key]: list,
				},
				() => resolve()
			);
		});
	});
}

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
					addItemToList('whitelistedUsers', ev.data.data);
				}
				break;
			}
			case 'doAction': {
				const oldAction = settings.actionQueue.find(
					(action) => action.id === ev.data.data.id && !action.doneAt
				);
				if (!oldAction) {
					addItemToList('actionQueue', ev.data.data);
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
