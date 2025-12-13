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
				throw new Error('Failed to generate test token');
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

	// Get icon for user type
	const getUserTypeIcon = (type) => {
		switch (type) {
			case 'student': return 'school';
			case 'supervisor': return 'business';
			case 'teacher': return 'menu_book';
			default: return 'person';
		}
	};

	// Get label for user type
	const getUserTypeLabel = (type) => {
		switch (type) {
			case 'student': return 'Studenten';
			case 'supervisor': return 'Begeleiders';
			case 'teacher': return 'Docenten';
			default: return type.charAt(0).toUpperCase() + type.slice(1) + 's';
		}
	};

	return (
		<div className="mb-8">
			{/* Neumorphic container */}
			<div className="neu-pressed rounded-2xl p-4">
				{/* Header */}
				<div className="flex items-center gap-2 mb-3">
					<div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
						<span className="material-symbols-outlined text-primary text-sm">bug_report</span>
					</div>
					<span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
						Development Mode
					</span>
				</div>

				{/* Label */}
				<p className="text-sm font-semibold text-text-secondary mb-3">
					Selecteer een testgebruiker:
				</p>

				{/* Dropdown */}
				<div className="relative" ref={dropdownRef}>
					<button
						type="button"
						className={`w-full neu-btn-primary !rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all duration-200 ${
							isOpen ? 'ring-2 ring-white/30' : ''
						} ${isTestUsersLoading || isLoggingIn ? 'opacity-60 cursor-not-allowed' : ''}`}
						aria-haspopup="listbox"
						aria-expanded={isOpen}
						onClick={() => !isTestUsersLoading && !isLoggingIn && setIsOpen(!isOpen)}
						disabled={isTestUsersLoading || isLoggingIn}
					>
						<div className="flex items-center gap-3 min-w-0">
							{selectedUser ? (
								<>
									{selectedUser.image_path ? (
										<img
											src={`${API_BASE_URL}image/${selectedUser.image_path}`}
											alt={selectedUser.full_name}
											className="w-8 h-8 rounded-full object-cover shrink-0 ring-2 ring-white/50 shadow-sm"
										/>
									) : (
										<div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
											<span className="material-symbols-outlined text-white text-sm">
												{getUserTypeIcon(selectedUser.type)}
											</span>
										</div>
									)}
									<div className="min-w-0">
										<p className="text-sm font-bold text-white truncate">{selectedUser.full_name}</p>
										<p className="text-xs text-white/70 truncate">{selectedUser.email}</p>
									</div>
								</>
							) : (
								<>
									<div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center shrink-0">
										<span className="material-symbols-outlined text-white/80 text-sm">person_search</span>
									</div>
									<span className="text-sm font-semibold text-white/90">
										{isLoggingIn ? "Inloggen..." : isTestUsersLoading ? "Laden..." : "Kies een gebruiker"}
									</span>
								</>
							)}
						</div>
						<span className={`material-symbols-outlined text-white/80 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
							expand_more
						</span>
					</button>

					{/* Dropdown menu */}
					{isOpen && (
						<div className="absolute z-50 mt-2 w-full neu-flat rounded-xl overflow-hidden shadow-lg animate-fade-in">
							<ul className="max-h-72 overflow-auto py-2" role="listbox">
								{/* Reset option */}
								<li
									className="px-4 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3"
									onClick={() => handleTestUserSelect(null)}
								>
									<div className="w-7 h-7 rounded-full neu-pressed flex items-center justify-center shrink-0">
										<span className="material-symbols-outlined text-gray-400 text-xs">close</span>
									</div>
									<span className="text-sm font-medium text-text-muted">Geen selectie</span>
								</li>

								{/* User groups */}
								{[...new Set(testUsers.map(user => user.type))]
									.sort()
									.map(userType => (
										<div key={userType}>
											{/* Group header */}
											<li className="px-4 py-2 flex items-center gap-2 bg-gray-50/80 border-t border-b border-gray-100">
												<span className="material-symbols-outlined text-primary text-sm">
													{getUserTypeIcon(userType)}
												</span>
												<span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
													{getUserTypeLabel(userType)}
												</span>
											</li>
											{/* Users */}
											{testUsers
												.filter(user => user.type === userType)
												.map(user => (
													<li
														key={user.id}
														className={`px-4 py-2.5 cursor-pointer transition-colors flex items-center gap-3 ${
															selectedUser?.id === user.id 
																? 'bg-primary/5 border-l-2 border-primary' 
																: 'hover:bg-gray-50 border-l-2 border-transparent'
														}`}
														onClick={() => handleTestUserSelect(user)}
													>
														{user.image_path ? (
															<img
																src={`${API_BASE_URL}image/${user.image_path}`}
																alt={user.full_name}
																className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-white shadow-sm"
															/>
														) : (
															<div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
																<span className="material-symbols-outlined text-gray-400 text-xs">person</span>
															</div>
														)}
														<div className="min-w-0 flex-1">
															<p className="text-sm font-semibold text-text-primary truncate">{user.full_name}</p>
															<p className="text-xs text-text-muted truncate">{user.email}</p>
														</div>
														{selectedUser?.id === user.id && (
															<span className="material-symbols-outlined text-primary text-sm shrink-0">check_circle</span>
														)}
													</li>
												))}
										</div>
									))
								}
							</ul>
						</div>
					)}
				</div>

				{/* Loading indicator */}
				{isLoggingIn && (
					<div className="flex items-center gap-2 mt-3">
						<div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
						<span className="text-xs font-semibold text-primary">Inloggen...</span>
					</div>
				)}
			</div>
		</div>
	);
}
