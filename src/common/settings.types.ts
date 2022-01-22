export interface Settings {
	action: 'block' | 'mute' | 'none';
	actionOnFollowingAccounts: boolean;
	actionOnFollowedByAccounts: boolean;
	actionOnVerifiedAccounts: boolean;
	whitelistedUsers: { id: string; name: string }[];
	actionQueue: {
		id: string;
		action: Settings['action'];
		doneAt?: number;
	}[];
}

export const settingsDefaults: Settings = {
	action: 'block',
	actionOnFollowingAccounts: false,
	actionOnFollowedByAccounts: true,
	actionOnVerifiedAccounts: true,
	whitelistedUsers: [],
	actionQueue: [],
};
