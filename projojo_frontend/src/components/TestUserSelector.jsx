import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services";
import { notification } from "./notifications/NotifySystem";

export default function TestUserSelector() {
	const navigate = useNavigate();
	const [testUsers, setTestUsers] = useState([]);
	const [isTestUsersLoading, setIsTestUsersLoading] = useState(false);
	const [isLoggingIn, setIsLoggingIn] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState(null);
	const dropdownRef = useRef(null);

	// Only show test functionality on localhost
	const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

	// Fetch test users when component mounts (only on localhost)
	useEffect(() => {
		if (!isLocalhost) return;
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
	}, [isLocalhost]);

	// Close dropdown when clicking outside
	useEffect(() => {
		const handleClickOutside = (event) => {
			if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
				setIsOpen(false);
			}
		};

		if (isOpen) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [isOpen]);
	// Handle test user selection
	const handleTestUserSelect = async (user) => {
		if (!user) {
			setSelectedUser(null);
			setIsOpen(false);
			return;
		}

		setSelectedUser(user);
		setIsOpen(false);
		setIsLoggingIn(true);

		try {
			// Call the test login endpoint to get a JWT token
			const response = await fetch(`${API_BASE_URL}auth/test/login/${user.id}`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				}
			});

			if (!response.ok) {
				throw new Error('Kan testtoken niet genereren');
			}

			const data = await response.json();
			const token = data.access_token;

			// Store the token in localStorage
			localStorage.setItem('token', token);

			navigate('/home');

		} catch (error) {
			console.error("Error logging in with test user:", error);
			notification.error("Fout bij inloggen met testgebruiker");
		} finally {
			setIsLoggingIn(false);
		}
	};

	// Don't render anything if not on localhost
	if (!isLocalhost) {
		return null;
	}

	return (<div className="mb-6 p-3 border-2 border-dashed border-orange-400 bg-orange-50 rounded-md">
		<h3 className="font-bold text-orange-700 mb-2">
			TEST GEBRUIKERS
		</h3>
		<div>
			<label className="block text-sm font-medium text-orange-700 mb-1">
				Selecteer een testgebruiker om direct in te loggen:
			</label>
			<div className="relative mt-2" ref={dropdownRef}>
				<button
					type="button"
					className="grid w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pr-2 pl-3 text-left text-gray-900 outline-1 -outline-offset-1 outline-orange-300 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600 sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
					aria-haspopup="listbox"
					aria-expanded={isOpen}
					onClick={() => !isTestUsersLoading && !isLoggingIn && setIsOpen(!isOpen)}
					disabled={isTestUsersLoading || isLoggingIn}
					title={selectedUser ? `${selectedUser.full_name} - ${selectedUser.email}` : ""}
				>
					<span className="col-start-1 row-start-1 flex items-center gap-3 pr-6">
						{selectedUser && selectedUser.image_path && (
							<img
								src={`${API_BASE_URL}image/${selectedUser.image_path}`}
								alt={selectedUser.full_name}
								className="h-6 w-6 rounded-full object-cover flex-shrink-0"
							/>
						)}
						<span className="block truncate">
							{isLoggingIn ? "Inloggen..." : selectedUser ? `${selectedUser.full_name} - ${selectedUser.email}` : "-- Selecteer een gebruiker --"}
						</span>
					</span>
					<svg className="col-start-1 row-start-1 size-5 self-center justify-self-end text-gray-500 sm:size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
						<path fillRule="evenodd" d="M5.22 10.22a.75.75 0 0 1 1.06 0L8 11.94l1.72-1.72a.75.75 0 1 1 1.06 1.06l-2.25 2.25a.75.75 0 0 1-1.06 0l-2.25-2.25a.75.75 0 0 1 0-1.06ZM10.78 5.78a.75.75 0 0 1-1.06 0L8 4.06 6.28 5.78a.75.75 0 0 1-1.06-1.06l2.25-2.25a.75.75 0 0 1 1.06 0l2.25 2.25a.75.75 0 0 1 0 1.06Z" clipRule="evenodd" />
					</svg>
				</button>

				{isOpen && (
					<ul className="absolute z-10 mt-1 max-h-96 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-hidden sm:text-sm" tabIndex="-1" role="listbox">
						{/* Default option */}
						<li
							className="relative cursor-pointer py-2 pr-9 pl-3 text-gray-900 select-none hover:bg-orange-100"
							onClick={() => handleTestUserSelect(null)}
						>
							<div className="flex items-center gap-3">
								<span className="block truncate font-normal">-- Selecteer een gebruiker --</span>
							</div>
							{!selectedUser && (
								<span className="absolute inset-y-0 right-0 flex items-center pr-4 text-orange-600">
									<svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
										<path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
									</svg>
								</span>
							)}
						</li>

						{/* Dynamically create groups based on available user types */}
						{[...new Set(testUsers.map(user => user.type))]
							.sort()
							.map(userType => (
								<div key={userType}>
									{/* Group header */}
									<li className="py-1 px-3 text-xs font-semibold text-orange-700 bg-orange-50 border-b border-orange-200">
										{userType.charAt(0).toUpperCase() + userType.slice(1) + "s"}
									</li>
									{/* Group items */}
									{testUsers
										.filter(user => user.type === userType)
										.map(user => (
											<li
												key={user.id}
												className="relative cursor-pointer py-2 px-3 text-gray-900 select-none hover:bg-orange-100"
												onClick={() => handleTestUserSelect(user)}
												title={`${user.full_name} - ${user.email}`}
											>
												<div className="flex items-center gap-3">
													{user.image_path && (
														<img
															src={`${API_BASE_URL}image/${user.image_path}`}
															alt={user.full_name}
															className="h-6 w-6 rounded-full object-cover flex-shrink-0"
														/>
													)}
													<span className="block truncate font-normal">
														{user.full_name} - {user.email}
													</span>
												</div>
												{selectedUser?.id === user.id && (
													<span className="absolute inset-y-0 right-0 flex items-center pr-4 text-orange-600">
														<svg className="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
															<path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
														</svg>
													</span>
												)}
											</li>
										))}
								</div>
							))
						}
					</ul>
				)}
			</div>
		</div>
		{isTestUsersLoading && <p className="text-xs text-orange-600 mt-1">Gebruikers laden...</p>}
		{isLoggingIn && <p className="text-xs text-orange-600 mt-1">Inloggen met geselecteerde gebruiker...</p>}
	</div>
	);
}
