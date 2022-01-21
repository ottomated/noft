export interface Settings {
	action: 'block' | 'mute';
	actionOnFollowingAccounts: boolean;
	actionOnFollowedByAccounts: boolean;
	actionOnVerifiedAccounts: boolean;
	whitelistedUsers: { id: string; name: string }[];
}

export const settingsDefaults: Settings = {
	action: 'block',
	actionOnFollowingAccounts: false,
	actionOnFollowedByAccounts: true,
	actionOnVerifiedAccounts: true,
	whitelistedUsers: [],
};
