import type { Settings } from './common/settings.types';

chrome.runtime.onInstalled.addListener(() => {
	chrome.alarms.create({
		periodInMinutes: 1,
	});
});

chrome.alarms.onAlarm.addListener(doQueueLoop(20, 2, 60));

function doQueueLoop(
	secondsBetweenActions: number,
	randomness: number,
	totalSeconds: number
) {
	return () => {
		const startTime = Date.now();
		console.log('alarm called', startTime);
		const fn = async () => {
			const [queue, whitelist] = await getActionQueue();
			const action = getFirstUndone(queue, whitelist);
			if (action) {
				await performAction(action, queue);
				const timeout =
					(secondsBetweenActions + (Math.random() - 0.5) * randomness) * 1000;
				if (Date.now() + timeout - startTime < totalSeconds * 1000) {
					setTimeout(fn, timeout);
				}
			}
		};
		fn();
	};
}

async function performAction(
	action: Settings['actionQueue'][number],
	queue: Settings['actionQueue']
) {
	console.log('Performing action:', action);
	let result: 'success' | 'retry' | 'fail' | 'delay';
	switch (action.action) {
		case 'block':
			result = await fetchApi('/blocks/create.json', 'user_id=' + action.id);
			break;
		case 'follow':
			result = await fetchApi(
				'/friendships/create.json',
				'user_id=' + action.id
			);
			break;
		case 'mute':
			result = await fetchApi(
				'/mutes/users/create.json',
				'user_id=' + action.id
			);
			break;
		default:
			result = 'success';
			break;
	}
	console.log('Result:', result);
	switch (result) {
		case 'success':
		case 'fail': {
			action.doneAt = Date.now();
			await new Promise<void>((resolve) => {
				chrome.storage.sync.set({ actionQueue: queue }, () => resolve());
			});
			break;
		}
		case 'retry':
			break;
		case 'delay': {
			queue.push(queue.splice(queue.indexOf(action), 1)[0]);
			await new Promise<void>((resolve) => {
				chrome.storage.sync.set({ actionQueue: queue }, () => resolve());
			});
			break;
		}
	}
}

function getFirstUndone(
	queue: Settings['actionQueue'],
	whitelist: Settings['whitelistedUsers']
) {
	const whitelistSet = new Set(whitelist.map((w) => w.id));
	for (let i = 0; i < queue.length; i++) {
		// If it's undone
		if (queue[i].doneAt === undefined && !whitelistSet.has(queue[i].id)) {
			const lastDone = queue[i - 1]?.doneAt;
			// Do it if the last one is undone
			if (!lastDone) return queue[i];
			const timeSinceLast = Date.now() - lastDone;
			// If it's been more than 10 seconds
			if (timeSinceLast > 10000) return queue[i];
			else return undefined;
		}
	}
	return undefined;
}

function getActionQueue(): Promise<
	[Settings['actionQueue'], Settings['whitelistedUsers']]
> {
	return new Promise((r) => {
		chrome.storage.sync.get(['actionQueue', 'whitelistedUsers'], (settings) => {
			const { actionQueue, whitelistedUsers } = settings as Settings;
			r([actionQueue ?? [], whitelistedUsers ?? []]);
		});
	});
}

function fetchApi(path: string, body: string) {
	return new Promise<'success' | 'retry' | 'fail' | 'delay'>((r) => {
		chrome.cookies.get(
			{ url: 'https://twitter.com', name: 'ct0' },
			async (cookie) => {
				if (!cookie) return r('retry');
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
				if (res.status !== 200) r('delay');

				r('success');
			}
		);
	});
}
