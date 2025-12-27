'use client';

import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
	page: number;
	count: number;
	perPage?: number;
	onPageChange: (page: number) => void;
}

export function Pagination({ page, count, perPage = 20, onPageChange }: PaginationProps) {
	const totalPages = Math.ceil(count / perPage);

	const pages = useMemo(() => {
		const result: Array<{ type: 'page' | 'ellipsis'; value: number; key: string }> = [];

		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) {
				result.push({ type: 'page', value: i, key: `page-${i}` });
			}
		} else {
			result.push({ type: 'page', value: 1, key: 'page-1' });

			if (page > 3) {
				result.push({ type: 'ellipsis', value: 0, key: 'ellipsis-start' });
			}

			const start = Math.max(2, page - 1);
			const end = Math.min(totalPages - 1, page + 1);

			for (let i = start; i <= end; i++) {
				result.push({ type: 'page', value: i, key: `page-${i}` });
			}

			if (page < totalPages - 2) {
				result.push({ type: 'ellipsis', value: 0, key: 'ellipsis-end' });
			}

			result.push({ type: 'page', value: totalPages, key: `page-${totalPages}` });
		}

		return result;
	}, [page, totalPages]);

	if (totalPages <= 1) return null;

	return (
		<div className="flex justify-center">
			<div className="my-2 flex items-center">
				<button
					className="mr-[25px] inline-flex size-8 items-center justify-center rounded-[9px] bg-transparent hover:bg-gray-50 dark:hover:bg-gray-850 active:scale-98 disabled:cursor-not-allowed disabled:text-gray-400 dark:disabled:text-gray-700 hover:disabled:bg-transparent dark:hover:disabled:bg-transparent"
					onClick={() => onPageChange(page - 1)}
					disabled={page <= 1}
				>
					<ChevronLeft className="size-4" strokeWidth={2} />
				</button>

				<div className="flex items-center gap-2.5">
					{pages.map((p) =>
						p.type === 'ellipsis' ? (
							<div key={p.key} className="text-sm font-medium text-gray-500 dark:text-gray-400">
								...
							</div>
						) : (
							<button
								key={p.key}
								className={`inline-flex size-8 items-center justify-center rounded-[9px] bg-transparent hover:bg-gray-50 dark:hover:bg-gray-850 text-sm font-medium active:scale-98 disabled:cursor-not-allowed disabled:opacity-50 hover:disabled:bg-transparent transition ${
									p.value === page
										? 'bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-850 dark:text-gray-50 dark:hover:bg-gray-800'
										: ''
								}`}
								onClick={() => onPageChange(p.value)}
							>
								{p.value}
							</button>
						)
					)}
				</div>

				<button
					className="ml-[25px] inline-flex size-8 items-center justify-center rounded-[9px] bg-transparent hover:bg-gray-50 dark:hover:bg-gray-850 active:scale-98 disabled:cursor-not-allowed disabled:text-gray-400 dark:disabled:text-gray-700 hover:disabled:bg-transparent dark:hover:disabled:bg-transparent"
					onClick={() => onPageChange(page + 1)}
					disabled={page >= totalPages}
				>
					<ChevronRight className="size-4" strokeWidth={2} />
				</button>
			</div>
		</div>
	);
}
