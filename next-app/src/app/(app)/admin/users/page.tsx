'use client';

import { useState, useEffect } from 'react';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { Spinner } from '@/components/common/Spinner';
import { Plus, Pencil, Trash2, User as UserIcon, Shield, ShieldCheck } from 'lucide-react';

interface User {
	id: string;
	email: string;
	name: string;
	role: 'admin' | 'user' | 'pending';
	profile_image_url?: string;
	created_at?: string;
	last_active_at?: string;
}

export default function UsersPage() {
	const [loading, setLoading] = useState(true);
	const [users, setUsers] = useState<User[]>([]);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		const loadUsers = async () => {
			const token = localStorage.getItem('token');
			if (!token) return;

			try {
				const res = await fetch(`${WEBUI_API_BASE_URL}/users`, {
					headers: { Authorization: `Bearer ${token}` }
				});

				if (res.ok) {
					const data = await res.json();
					setUsers(data);
				}
			} catch (error) {
				console.error('Failed to load users:', error);
				setUsers([]);
			} finally {
				setLoading(false);
			}
		};

		loadUsers();
	}, []);

	const filteredUsers = users.filter(
		(user) =>
			user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			user.email?.toLowerCase().includes(searchQuery.toLowerCase())
	);

	const getRoleIcon = (role: string) => {
		switch (role) {
			case 'admin':
				return <ShieldCheck className="size-4 text-blue-500" />;
			case 'pending':
				return <Shield className="size-4 text-yellow-500" />;
			default:
				return <UserIcon className="size-4 text-gray-500" />;
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Spinner className="size-8" />
			</div>
		);
	}

	return (
		<div className="p-4">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-semibold">Users</h1>
				<button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition">
					<Plus className="size-4" />
					Add User
				</button>
			</div>

			<div className="mb-4">
				<input
					type="text"
					placeholder="Search users..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div className="overflow-x-auto">
				<table className="w-full">
					<thead>
						<tr className="border-b border-gray-200 dark:border-gray-700">
							<th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
								User
							</th>
							<th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
								Role
							</th>
							<th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
								Created
							</th>
							<th className="text-right py-3 px-4 font-medium text-gray-500 dark:text-gray-400">
								Actions
							</th>
						</tr>
					</thead>
					<tbody>
						{filteredUsers.map((user) => (
							<tr
								key={user.id}
								className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
							>
								<td className="py-3 px-4">
									<div className="flex items-center gap-3">
										<div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
											{user.profile_image_url ? (
												<img
													src={user.profile_image_url}
													alt={user.name}
													className="w-full h-full object-cover"
												/>
											) : (
												<span className="text-sm font-medium">
													{user.name?.charAt(0)?.toUpperCase() || '?'}
												</span>
											)}
										</div>
										<div>
											<div className="font-medium">{user.name}</div>
											<div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
										</div>
									</div>
								</td>
								<td className="py-3 px-4">
									<div className="flex items-center gap-2">
										{getRoleIcon(user.role)}
										<span className="capitalize">{user.role}</span>
									</div>
								</td>
								<td className="py-3 px-4 text-gray-500 dark:text-gray-400">
									{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
								</td>
								<td className="py-3 px-4">
									<div className="flex items-center justify-end gap-2">
										<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
											<Pencil className="size-4" />
										</button>
										<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-red-500">
											<Trash2 className="size-4" />
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				{filteredUsers.length === 0 && (
					<div className="text-center py-8 text-gray-500 dark:text-gray-400">No users found</div>
				)}
			</div>
		</div>
	);
}
