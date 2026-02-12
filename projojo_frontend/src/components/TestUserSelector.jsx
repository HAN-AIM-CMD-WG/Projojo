import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services";
import { notification } from "./notifications/NotifySystem";

const ROLE_CONFIG = {
	student:    { icon: 'school',     label: 'Student',    color: 'bg-emerald-500' },
	supervisor: { icon: 'business',   label: 'Begeleider', color: 'bg-blue-500' },
	teacher:    { icon: 'menu_book',  label: 'Docent',     color: 'bg-amber-500' },
};

export default function TestUserSelector() {
	const navigate = useNavigate();
	const [testUsers, setTestUsers] = useState([]);
	const [isTestUsersLoading, setIsTestUsersLoading] = useState(false);
	const [isLoggingIn, setIsLoggingIn] = useState(null); // user id being logged in
	const [activeRole, setActiveRole] = useState(null);

	const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

	useEffect(() => {
		if (!isLocalhost) return;
		const fetchTestUsers = async () => {
			setIsTestUsersLoading(true);
			try {
				const response = await fetch(`${API_BASE_URL}users/`);
				if (response.ok) {
					const data = await response.json();
					setTestUsers(data);
					// Auto-select first available role
					const roles = [...new Set(data.map(u => u.type))].sort();
					if (roles.length > 0) setActiveRole(roles[0]);
				} else {
					const data = await response.json();
					notification.error(data.detail, response.status);
				}
			} catch (error) {
				console.error("Error fetching test users:", error);
			} finally {
				setIsTestUsersLoading(false);
			}
		};
		fetchTestUsers();
	}, [isLocalhost]);

	const handleLogin = async (user) => {
		setIsLoggingIn(user.id);
		try {
			const response = await fetch(`${API_BASE_URL}auth/test/login/${user.id}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});
			if (!response.ok) throw new Error('Kan testtoken niet genereren');
			const data = await response.json();
			localStorage.setItem('token', data.access_token);
			navigate('/home');
		} catch (error) {
			console.error("Error logging in with test user:", error);
			notification.error("Fout bij inloggen met testgebruiker");
		} finally {
			setIsLoggingIn(null);
		}
	};

	if (!isLocalhost) return null;

	const availableRoles = [...new Set(testUsers.map(u => u.type))].sort();
	const filteredUsers = testUsers.filter(u => u.type === activeRole);

	return (
		<div className="mb-8">
			<div className="neu-pressed rounded-2xl p-4">
				{/* Header */}
				<div className="flex items-center gap-2 mb-4">
					<div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
						<span className="material-symbols-outlined text-primary text-sm">bug_report</span>
					</div>
					<span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">
						Demo Login
					</span>
				</div>

				{/* Role tabs */}
				{isTestUsersLoading ? (
					<div className="flex items-center justify-center gap-2 py-4">
						<div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
						<span className="text-xs font-semibold text-[var(--text-muted)]">Gebruikers laden...</span>
					</div>
				) : (
					<>
						<div className="grid mb-4 gap-2" style={{ gridTemplateColumns: `repeat(${availableRoles.length}, 1fr)` }}>
							{availableRoles.map(role => {
								const config = ROLE_CONFIG[role] || { icon: 'person', label: role, color: 'bg-gray-500' };
								const count = testUsers.filter(u => u.type === role).length;
								const isActive = activeRole === role;
								return (
									<button
										key={role}
										onClick={() => setActiveRole(role)}
										className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-center transition-all duration-200 cursor-pointer ${
											isActive
												? 'bg-primary text-white font-bold shadow-sm'
												: 'text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-[var(--gray-100)]'
										}`}
									>
										<span className="material-symbols-outlined text-base">{config.icon}</span>
										<span className="text-xs font-bold">{config.label}</span>
										<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
											isActive ? 'bg-white/25' : 'bg-[var(--gray-200)]'
										}`}>{count}</span>
									</button>
								);
							})}
						</div>

						{/* User list for active role */}
						<div className="space-y-1 max-h-[156px] overflow-y-auto overflow-x-hidden scrollbar-thin">
							{filteredUsers.map(user => {
								const config = ROLE_CONFIG[user.type] || { color: 'bg-gray-500' };
								const isActive = isLoggingIn === user.id;
								return (
									<button
										key={user.id}
										onClick={() => handleLogin(user)}
										disabled={isLoggingIn !== null}
										className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-all duration-150 cursor-pointer ${
											isActive
												? 'bg-primary/10'
												: isLoggingIn !== null
													? 'opacity-30 cursor-not-allowed'
													: 'hover:bg-primary/5 hover:translate-x-1'
										}`}
									>
										{user.image_path ? (
											<img
												src={`${API_BASE_URL}image/${user.image_path}`}
												alt={user.full_name}
												className="w-8 h-8 rounded-full object-cover shrink-0"
											/>
										) : (
											<div className={`w-8 h-8 rounded-full ${config.color} flex items-center justify-center shrink-0`}>
												<span className="material-symbols-outlined text-white text-sm">person</span>
											</div>
										)}
										<div className="min-w-0 flex-1">
											<p className="text-sm font-bold text-[var(--text-primary)] truncate">{user.full_name}</p>
											<p className="text-[11px] text-[var(--text-muted)] truncate">{user.email}</p>
										</div>
										{isActive && (
											<div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0"></div>
										)}
									</button>
								);
							})}
						</div>
					</>
				)}
			</div>
		</div>
	);
}
