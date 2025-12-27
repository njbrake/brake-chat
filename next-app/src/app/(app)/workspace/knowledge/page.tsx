'use client';

import { useState, useEffect } from 'react';
import { WEBUI_API_BASE_URL } from '@/lib/constants';
import { Spinner } from '@/components/common/Spinner';
import { Plus, Pencil, Trash2, FileText } from 'lucide-react';

interface KnowledgeBase {
	id: string;
	name: string;
	description?: string;
	created_at?: string;
	updated_at?: string;
}

export default function KnowledgePage() {
	const [loading, setLoading] = useState(true);
	const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
	const [searchQuery, setSearchQuery] = useState('');

	useEffect(() => {
		const loadKnowledge = async () => {
			const token = localStorage.getItem('token');
			if (!token) return;

			try {
				const res = await fetch(`${WEBUI_API_BASE_URL}/knowledge`, {
					headers: { Authorization: `Bearer ${token}` }
				});

				if (res.ok) {
					const data = await res.json();
					setKnowledgeBases(data);
				}
			} catch (error) {
				console.error('Failed to load knowledge bases:', error);
				setKnowledgeBases([]);
			} finally {
				setLoading(false);
			}
		};

		loadKnowledge();
	}, []);

	const filteredKnowledge = knowledgeBases.filter(
		(kb) =>
			kb.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			kb.description?.toLowerCase().includes(searchQuery.toLowerCase())
	);

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<Spinner className="size-8" />
			</div>
		);
	}

	return (
		<div className="py-4">
			<div className="flex items-center justify-between mb-4">
				<h1 className="text-2xl font-semibold">Knowledge</h1>
				<button className="flex items-center gap-2 px-4 py-2 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:opacity-80 transition">
					<Plus className="size-4" />
					Create Knowledge Base
				</button>
			</div>

			<div className="mb-4">
				<input
					type="text"
					placeholder="Search knowledge bases..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full max-w-md px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
				/>
			</div>

			<div className="grid gap-4">
				{filteredKnowledge.map((kb) => (
					<div
						key={kb.id}
						className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
					>
						<div className="flex items-center gap-3">
							<div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
								<FileText className="size-5" />
							</div>
							<div className="flex-1">
								<div className="font-medium">{kb.name}</div>
								{kb.description && (
									<div className="text-sm text-gray-500 dark:text-gray-400">{kb.description}</div>
								)}
							</div>
						</div>
						<div className="flex items-center gap-2">
							<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
								<Pencil className="size-4" />
							</button>
							<button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition text-red-500">
								<Trash2 className="size-4" />
							</button>
						</div>
					</div>
				))}
				{filteredKnowledge.length === 0 && (
					<div className="text-center py-8 text-gray-500 dark:text-gray-400">
						No knowledge bases found
					</div>
				)}
			</div>
		</div>
	);
}
