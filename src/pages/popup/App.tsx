import React, { useEffect, useState } from 'react';
import { Settings, settingsDefaults } from '../../common/settings.types';

const App = ({
	initialSettings,
}: {
	initialSettings: Settings;
}): JSX.Element => {
	const [settings, setSettings] = useState(initialSettings);

	useEffect(() => {
		chrome.storage.onChanged.addListener(async (_, area) => {
			if (area !== 'sync') return;
			chrome.storage.sync.get((settings) =>
				setSettings({ ...settingsDefaults, ...settings } as Settings)
			);
		});
	}, []);

	const setSetting = <T extends keyof Settings>(
		setting: T,
		value: Settings[T]
	) => {
		chrome.storage.sync.set({ [setting]: value });
	};

	const removeWhitelist = (id: string) => {
		chrome.storage.sync.set({
			whitelistedUsers: settings.whitelistedUsers.filter((u) => u.id !== id),
		});
	};

	const action = settings.action === 'block' ? 'Block' : 'Mute';

	return (
		<div>
			<div className="row">
				<img src="/assets/icon.png" width={48} height={48} />
				<h1>NoFT Options</h1>
			</div>
			<div className="row">
				<select
					id="action"
					className="dropdown"
					value={settings.action}
					onChange={(ev) =>
						setSetting('action', ev.target.value as 'block' | 'mute')
					}
				>
					<option value="block">Block</option>
					<option value="mute">Mute</option>
				</select>
				<label htmlFor="action">detected accounts</label>
			</div>
			<div className="row">
				<input
					id="followed-by"
					type="checkbox"
					checked={settings.actionOnFollowedByAccounts}
					onChange={(ev) =>
						setSetting('actionOnFollowedByAccounts', ev.target.checked)
					}
				/>
				<label htmlFor="followed-by">{action} accounts that follow you</label>
			</div>
			<div className="row">
				<input
					id="following"
					type="checkbox"
					checked={settings.actionOnFollowingAccounts}
					onChange={(ev) =>
						setSetting('actionOnFollowingAccounts', ev.target.checked)
					}
				/>
				<label htmlFor="following">{action} accounts that you follow</label>
			</div>
			<div className="row">
				<input
					id="verified"
					type="checkbox"
					checked={settings.actionOnVerifiedAccounts}
					onChange={(ev) =>
						setSetting('actionOnVerifiedAccounts', ev.target.checked)
					}
				/>
				<label htmlFor="following">{action} verified accounts</label>
			</div>
			<h3>Whitelisted Users</h3>
			<p className="help-text">
				Users are whitelisted when you press "UNDO" in the NoFT popup
			</p>
			<div className="whitelist">
				{settings.whitelistedUsers.map((user) => (
					<div className="whitelist-entry" key={user.id} data-userId={user.id}>
						<span>@{user.name}</span>
						<a
							href="#"
							onClick={() => removeWhitelist(user.id)}
							className="unwhitelist"
						>
							un-whitelist
						</a>
					</div>
				))}
			</div>
		</div>
	);
};

export default App;
