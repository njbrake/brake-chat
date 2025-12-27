'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/store';

export default function WorkspacePage() {
	const router = useRouter();
	const user = useAppStore((s) => s.user);

	useEffect(() => {
		if (user?.role !== 'admin') {
			if (user?.permissions?.workspace?.models) {
				router.push('/workspace/models');
			} else if (user?.permissions?.workspace?.knowledge) {
				router.push('/workspace/knowledge');
			} else if (user?.permissions?.workspace?.prompts) {
				router.push('/workspace/prompts');
			} else {
				router.push('/');
			}
		} else {
			router.push('/workspace/models');
		}
	}, [user, router]);

	return null;
}
