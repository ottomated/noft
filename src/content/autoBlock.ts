import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import './toast.css';
import icon from '../assets/icon128.png';
import { Settings } from '../common/settings.types';

let settings: Settings | undefined;

window.postMessage({
	noftRequest: 'settings',
});

window.addEventListener('message', (ev) => {
	if (ev.data?.noftSettingsResponse) {
		settings = ev.data.noftSettingsResponse;
	}
});

const openPopups = new Set<string>();

function onNFTDetected(user: User): CallbackRes {
	if (!settings) return undefined;
	if (settings.action === 'replace')
		return [undefined, undefined, settings.replaceUrl];
	// Cancel if already blocked
	if (user.alreadyBlocked || user.alreadyMuted) return;
	// Check settings
	if (user.verified && !settings.actionOnVerifiedAccounts) return;
	if (user.following && !settings.actionOnFollowingAccounts) return;
	if (user.followed_by && !settings.actionOnFollowedByAccounts) return;
	// Check open popups
	if (openPopups.has(user.id))
		return [
			settings.action === 'block' || undefined,
			settings.action === 'mute' || undefined,
			undefined,
		];
	// Check whitelist
	if (
		settings.whitelistedUsers.find((whitelisted) => whitelisted.id === user.id)
	)
		return;
	// Check pending actions
	const queuedAction = settings.actionQueue.find(
		(queued) => queued.id === user.id && !queued.doneAt
	);
	if (queuedAction)
		return [
			queuedAction.action === 'block' || undefined,
			queuedAction.action === 'mute' || undefined,
			undefined,
		];
	openPopups.add(user.id);
	iziToast.show({
		title: `${settings.action === 'block' ? 'Blocked' : 'Muted'} ${user.name}`,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		iconUrl: icon,
		theme: 'dark',
		drag: false,
		position: 'bottomLeft',
		timeout: 5000,
		buttons: [
			[
				'<button>UNDO</button>',
				function (toast, instance) {
					toast.hide({}, instance, 'undo');
				},
				false,
			],
		],
		onClosing: (_, __, closedBy) => {
			openPopups.delete(user.id);
			if (closedBy === 'undo') {
				window.postMessage({
					noftRequest: 'whitelist',
					data: { id: user.id, name: user.name },
				});
			}
		},
		onOpened: () => {
			window.postMessage({
				noftRequest: 'doAction',
				data: {
					id: user.id,
					action: settings?.action,
				},
			});
		},
	});
	return [
		settings.action === 'block' || undefined,
		settings.action === 'mute' || undefined,
		undefined,
	];
}

function processRequest(text: string): string {
	try {
		const json = JSON.parse(text);
		recursivelyDetectNFTs(json, onNFTDetected);
		return JSON.stringify(json);
	} catch (_) {
		// noop
		return text;
	}
}

interface User {
	id: string;
	name: string;

	following: boolean;
	followed_by: boolean;
	verified: boolean;

	alreadyMuted: boolean;
	alreadyBlocked: boolean;
}

function blockEthUsername(userName?: string) {
	console.log(userName);
	return !settings?.actionOnEthUsernames || !userName
		? false
		: new RegExp('.eth', 'gi').test(userName);
}

type CallbackRes =
	| [boolean | undefined, boolean | undefined, string | undefined]
	| undefined;
function recursivelyDetectNFTs(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	json: any,
	callback: (user: User) => CallbackRes
) {
	for (const key of Object.keys(json)) {
		const value = json[key];
		if (!value) continue;
		if (
			value.id_str &&
			(value.ext_has_nft_avatar || blockEthUsername(value.name))
		) {
			const res = callback({
				id: value.id_str,
				name: value.screen_name,

				verified: value.verified ?? false,
				followed_by: value.followed_by ?? false,
				following: value.following ?? false,

				alreadyBlocked: value.blocking ?? false,
				alreadyMuted: value.muting ?? false,
			});
			if (res) {
				const [blocking, muting, avatar_url] = res;

				if (blocking !== undefined) {
					value.blocking = blocking;
					if (blocking) value.following = false;
				}
				if (muting !== undefined) value.muting = muting;
				if (avatar_url !== undefined) {
					value.profile_image_url_https = avatar_url;
					value.profile_image_url_http = avatar_url;
				}
			}
		} else if (
			value.rest_id &&
			(value.has_nft_avatar || blockEthUsername(value.legacy.name))
		) {
			const res = callback({
				id: value.rest_id,
				name: value.legacy?.screen_name ?? '',

				verified: value.legacy?.verified ?? false,
				followed_by: value.legacy?.followed_by ?? false,
				following: value.legacy?.following ?? false,

				alreadyBlocked: value.legacy?.blocking ?? false,
				alreadyMuted: value.legacy?.muting ?? false,
			});
			if (res) {
				const [blocking, muting, avatar_url] = res;
				if (blocking !== undefined) {
					value.legacy.blocking = blocking;
					if (blocking) value.legacy.following = false;
				}
				if (muting !== undefined) value.legacy.muting = muting;
				if (avatar_url !== undefined) {
					value.legacy.profile_image_url_https = avatar_url;
				}
			}
		} else if (Array.isArray(value)) {
			for (const item of value) {
				recursivelyDetectNFTs(item, callback);
			}
		} else if (typeof value === 'object') {
			recursivelyDetectNFTs(value, callback);
		}
	}
}

const XHR = XMLHttpRequest.prototype;

const descriptor = Object.getOwnPropertyDescriptor(XHR, 'responseText');

if (descriptor?.get) {
	const _getResponseText = descriptor.get;
	Object.defineProperty(XHR, 'responseText', {
		get: function () {
			const value = _getResponseText.apply(this);
			const newValue = processRequest(value);
			return newValue;
		},
	});
} else {
	const _send = XHR.send;

	XHR.send = function (...args) {
		this.addEventListener('load', () => {
			if (this.responseType !== 'text' && this.responseType !== '') return;
			processRequest(this.responseText);
		});
		return _send.apply(this, args);
	};
}
