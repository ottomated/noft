import iziToast from 'izitoast';
import 'izitoast/dist/css/iziToast.min.css';
import './toast.css';
import icon from '../assets/icon128.png';
import { Settings } from '../common/settings.types';
import { authed, blockUser, muteUser } from './api';

let settings: Settings | undefined;

window.postMessage({
	noftSettingsRequest: true,
});

window.addEventListener('message', (ev) => {
	if (ev.data?.noftSettingsResponse) {
		settings = ev.data.noftSettingsResponse;
	}
});

const openPopups = new Set<string>();

function onNFTDetected(user: User) {
	if (!authed) return;
	if (!settings) return;
	if (user.alreadyBlocked || user.alreadyMuted) return;
	if (user.verified && !settings.actionOnVerifiedAccounts) return;
	if (user.following && !settings.actionOnFollowingAccounts) return;
	if (user.followed_by && !settings.actionOnFollowedByAccounts) return;
	if (openPopups.has(user.id)) return;
	if (
		settings.whitelistedUsers.find((whitelisted) => whitelisted.id === user.id)
	)
		return;
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
			if (closedBy !== 'undo') {
				if (settings?.action === 'block') {
					blockUser(user.id);
				} else {
					muteUser(user.id);
				}
			} else {
				window.postMessage({
					noftWhitelistUser: { id: user.id, name: user.name },
				});
			}
		},
	});
}

function processRequest(text: string) {
	try {
		const json = JSON.parse(text);
		recursivelyDetectNFTs(json, onNFTDetected);
	} catch (_) {
		// noop
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function recursivelyDetectNFTs(json: any, callback: (user: User) => void) {
	for (const key of Object.keys(json)) {
		const value = json[key];
		if (!value) continue;
		if (value.id_str && value.ext_has_nft_avatar) {
			callback({
				id: value.id_str,
				name: value.screen_name,

				verified: value.verified ?? false,
				followed_by: value.followed_by ?? false,
				following: value.following ?? false,

				alreadyBlocked: value.blocking ?? false,
				alreadyMuted: value.muting ?? false,
			});
		} else if (value.rest_id && value.has_nft_avatar) {
			callback({
				id: value.rest_id,
				name: value.legacy?.screen_name ?? '',

				verified: value.legacy?.verified ?? false,
				followed_by: value.legacy?.followed_by ?? false,
				following: value.legacy?.following ?? false,

				alreadyBlocked: value.legacy?.blocking ?? false,
				alreadyMuted: value.legacy?.muting ?? false,
			});
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
const _send = XHR.send;

XHR.send = function (...args) {
	this.addEventListener('load', () => {
		if (this.responseType !== 'text' && this.responseType !== '') return;
		processRequest(this.responseText);
	});
	return _send.apply(this, args);
};
