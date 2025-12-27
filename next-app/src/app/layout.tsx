import type { Metadata } from 'next';
import './globals.css';
import { APP_NAME } from '@/lib/constants';

export const metadata: Metadata = {
	title: APP_NAME,
	description: 'AI Chat Interface'
};

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script
					dangerouslySetInnerHTML={{
						__html: `
              (function() {
                try {
                  const theme = localStorage.getItem('brake-chat-settings');
                  if (theme) {
                    const parsed = JSON.parse(theme);
                    const userTheme = parsed.state?.theme || 'system';
                    if (userTheme === 'dark' || (userTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                      document.documentElement.classList.add('dark');
                    }
                  } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `
					}}
				/>
			</head>
			<body className="antialiased">{children}</body>
		</html>
	);
}
