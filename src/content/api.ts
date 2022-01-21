import Cookies from 'js-cookie';

const webpackRequire = window.webpackJsonp.push([
	[],
	{
		noftRequire: (module, exports, __internal_require__) =>
			(module.exports = __internal_require__),
	},
	[['noftRequire']],
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
]) as unknown as { c: Record<string, { exports: any }> };

console.log(webpackRequire);

const authTokenModule = Object.values(webpackRequire.c).find((module) => {
	const token = module.exports.d;
	if (!token) return false;
	if (typeof token !== 'string') return false;
	if (!token.startsWith('AAA')) return false;
	return true;
});

const authToken = authTokenModule?.exports.d;
export const authed = !!authToken;

export async function callTwitterApi(method: string, body: string) {
	await fetch('https://twitter.com/i/api/1.1' + method, {
		method: 'POST',
		headers: {
			Authorization: 'Bearer ' + authToken,
			'Content-Type': 'application/x-www-form-urlencoded',
			'x-twitter-active-user': 'yes',
			'x-csrf-token': Cookies.get('ct0') || '',
			'x-twitter-auth-type': 'OAuth2Session',
			'x-twitter-client-language': 'en',
		},
		credentials: 'include',
		mode: 'cors',
		body,
	});
}

export async function blockUser(id: string) {
	await callTwitterApi('/blocks/create.json', 'user_id=' + id);
}
export async function unblockUser(id: string) {
	await callTwitterApi('/blocks/destroy.json', 'user_id=' + id);
}
export async function muteUser(id: string) {
	await callTwitterApi('/mutes/users/create.json', 'user_id=' + id);
}
export async function unmuteUser(id: string) {
	await callTwitterApi('/mutes/users/destroy.json', 'user_id=' + id);
}
