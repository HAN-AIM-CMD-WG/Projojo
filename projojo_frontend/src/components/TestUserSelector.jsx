import { useState, useEffect } from "react";
import { API_BASE_URL } from "../services";

export default function TestUserSelector({ onUserSelect }) {
	const [testUsers, setTestUsers] = useState([]);
	const [isTestUsersLoading, setIsTestUsersLoading] = useState(false);

	// Fetch test users when component mounts
	useEffect(() => {
		const fetchTestUsers = async () => {
			setIsTestUsersLoading(true);
			try {
				const response = await fetch(`${API_BASE_URL}users/`);
				if (response.ok) {
					const data = await response.json();
					setTestUsers(data);
				}
			} catch (error) {
				console.error("Error fetching test users:", error);
			} finally {
				setIsTestUsersLoading(false);
			}
		};

		fetchTestUsers();
	}, []);

	// Handle test user selection
	const handleTestUserSelect = (e) => {
		const selectedUserId = e.target.value;
		if (!selectedUserId) return;

		const selectedUser = testUsers.find(user => user.id === selectedUserId);
		if (selectedUser && onUserSelect) {
			onUserSelect({
				email: selectedUser.email,
				password: selectedUser.password_hash
			});
		}
	};

	return (
		<div className="mb-6 p-3 border-2 border-dashed border-orange-400 bg-orange-50 rounded-md">
			<h3 className="font-bold text-orange-700 mb-2">
				TEST GEBRUIKERS
			</h3>
			<label className="block text-sm font-medium mb-1 text-orange-700">
				Selecteer een testgebruiker:
			</label>
			<select
				className="w-full p-2 border border-orange-300 rounded-md bg-white"
				onChange={handleTestUserSelect}
				disabled={isTestUsersLoading}
			>
				<option value="">-- Selecteer een gebruiker --</option>

				{/* Dynamically create optgroups based on available user types */}
				{[...new Set(testUsers.map(user => user.type))]
					.sort()
					.map(userType => (
						<optgroup key={userType} label={userType.charAt(0).toUpperCase() + userType.slice(1) + "s"}>
							{testUsers
								.filter(user => user.type === userType)
								.map(user => (
									<option key={user.id} value={user.id}>
										{user.full_name} - {user.email}
									</option>
								))}
						</optgroup>
					))
				}
			</select>
			{isTestUsersLoading && <p className="text-xs text-orange-600 mt-1">Gebruikers laden...</p>}
		</div>
	);
}
