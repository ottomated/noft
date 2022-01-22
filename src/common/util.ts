import { Settings } from './settings.types';

let adding = false;
export async function addItemToList<
	K extends 'whitelistedUsers' | 'actionQueue'
>(
	key: K,
	item: Settings[K][number],
	position: 'prepend' | 'append' = 'append'
) {
	await new Promise<void>((resolve) => {
		const interval = setInterval(() => {
			if (!adding) {
				adding = true;
				clearInterval(interval);
				resolve();
			}
		}, 100);
	});

	return new Promise<void>((resolve) => {
		chrome.storage.sync.get(key, (settings) => {
			const list = (settings[key] as typeof item[]) ?? [];
			if (position === 'append') list.push(item);
			else list.unshift(item);
			chrome.storage.sync.set(
				{
					[key]: list,
				},
				() => {
					resolve();
					adding = false;
				}
			);
		});
	});
}
