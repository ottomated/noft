import type { Settings } from './common/settings.types';

chrome.runtime.onInstalled.addListener(() => {
	chrome.alarms.create({
		periodInMinutes: 2,
	});
});

chrome.storage.onChanged.addListener((changes, area) => {
	if (area !== 'sync') return;
	for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
		if (key === 'actionQueue' && oldValue.length !== newValue.length) {
			console.log('queue called');
			const action = getFirstUndone(newValue);
			if (action) performAction(action, newValue);
			return;
		}
	}
});

chrome.alarms.onAlarm.addListener(() => {
	const startTime = Date.now();
	console.log('alarm called', startTime);
	const fn = async () => {
		const queue = await getActionQueue();
		const action = getFirstUndone(queue);
		if (action) {
			await performAction(action, queue);
			const timeout = Math.random() * 60000 + 30000;
			console.log('timeout set for ', timeout);
			if (Date.now() - startTime < 60 * 5 * 1000) setTimeout(fn, timeout);
		}
	};
	fn();
});

async function performAction(
	action: Settings['actionQueue'][number],
	queue: Settings['actionQueue']
) {
	console.log('Performing action:', action);
	// switch (action.action) {
	// 	case 'block':
	// 		await fetchApi('/blocks/create.json', 'user_id=' + action.id);
	// 		break;
	// 	case 'mute':
	// 		await fetchApi('/mutes/users/create.json', 'user_id=' + action.id);
	// 		break;
	// }
	action.doneAt = Date.now();
	// chrome.storage.sync.set({ actionQueue: queue });
}

function getFirstUndone(queue: Settings['actionQueue']) {
	for (let i = 0; i < queue.length; i++) {
		// If it's undone
		if (queue[i].doneAt === undefined) {
			const lastDone = queue[i - 1]?.doneAt;
			// Do it if the last one is undone
			if (!lastDone) return queue[i];
			const timeSinceLast = Date.now() - lastDone;
			// If it's been more than 30 seconds
			if (timeSinceLast > 30000) return queue[i];
			else return undefined;
		}
	}
	return undefined;
}

function getActionQueue(): Promise<Settings['actionQueue']> {
	return new Promise((r) => {
		chrome.storage.sync.get('actionQueue', (settings) => {
			const { actionQueue } = settings as Settings;
			r(actionQueue);
		});
	});
}

function fetchApi(path: string, body: string): Promise<boolean> {
	return new Promise<boolean>((r) => {
		chrome.cookies.get(
			{ url: 'https://twitter.com', name: 'ct0' },
			async (cookie) => {
				if (!cookie) return r(false);
				const res = await fetch('https://twitter.com/i/api/1.1' + path, {
					method: 'POST',
					headers: {
						Authorization: 'Bearer ' + process.env.TWITTER_GUEST_TOKEN,
						'Content-Type': 'application/x-www-form-urlencoded',
						'x-twitter-active-user': 'yes',
						'x-csrf-token': cookie.value,
						'x-twitter-auth-type': 'OAuth2Session',
						'x-twitter-client-language': 'en',
					},
					credentials: 'include',
					mode: 'cors',
					body,
				});
				if (res.status !== 200) r(false);

				r(true);
			}
		);
	});
}
