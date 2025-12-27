'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { useAppStore, useSocketStore } from '@/store';
import {
	userSignIn,
	userSignUp,
	ldapUserSignIn,
	getSessionUser,
	getBackendConfig
} from '@/lib/api/auths';
import { generateInitialsImage } from '@/lib/utils';
import { WEBUI_BASE_URL } from '@/lib/constants';
import { Spinner } from '@/components/common/Spinner';
import { SensitiveInput } from '@/components/common/SensitiveInput';
import type { Config, SessionUser } from '@/types';

function getCookie(name: string): string | null {
	const match = document.cookie.match(
		new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1') + '=([^;]*)')
	);
	return match ? decodeURIComponent(match[1]) : null;
}

export default function AuthPage() {
	return (
		<Suspense fallback={<AuthLoading />}>
			<AuthContent />
		</Suspense>
	);
}

function AuthLoading() {
	return (
		<div className="w-full h-screen max-h-[100dvh] text-white relative">
			<div className="w-full h-full absolute top-0 left-0 bg-white dark:bg-black" />
			<div className="fixed bg-transparent min-h-screen w-full flex justify-center font-primary z-50 text-black dark:text-white">
				<div className="w-full px-10 min-h-screen flex flex-col text-center">
					<div className="my-auto pb-10 w-full sm:max-w-md">
						<div className="flex items-center justify-center">
							<Spinner className="size-8" />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

function AuthContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const config = useAppStore((s) => s.config);
	const setConfig = useAppStore((s) => s.setConfig);
	const user = useAppStore((s) => s.user);
	const setUser = useAppStore((s) => s.setUser);
	const WEBUI_NAME = useAppStore((s) => s.WEBUI_NAME);
	const socket = useSocketStore((s) => s.socket);

	const [loaded, setLoaded] = useState(false);
	const [mode, setMode] = useState<'signin' | 'signup' | 'ldap'>('signin');
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [confirmPassword, setConfirmPassword] = useState('');
	const [ldapUsername, setLdapUsername] = useState('');

	const setSessionUser = useCallback(
		async (sessionUser: SessionUser, redirectPath: string | null = null) => {
			if (sessionUser) {
				toast.success("You're now logged in.");
				if (sessionUser.token) {
					localStorage.setItem('token', sessionUser.token);
				}
				socket?.emit('user-join', { auth: { token: sessionUser.token } });
				setUser(sessionUser);
				const newConfig = (await getBackendConfig()) as Config;
				setConfig(newConfig);

				if (!redirectPath) {
					redirectPath = searchParams.get('redirect') || '/';
				}

				router.push(redirectPath);
				localStorage.removeItem('redirectPath');
			}
		},
		[socket, setUser, setConfig, searchParams, router]
	);

	const signInHandler = useCallback(async () => {
		try {
			const sessionUser = await userSignIn(email, password);
			await setSessionUser(sessionUser);
		} catch (error) {
			toast.error(`${error}`);
		}
	}, [email, password, setSessionUser]);

	const signUpHandler = useCallback(async () => {
		if (config?.features?.enable_signup_password_confirmation) {
			if (password !== confirmPassword) {
				toast.error('Passwords do not match.');
				return;
			}
		}

		try {
			const sessionUser = await userSignUp(name, email, password, generateInitialsImage(name));
			await setSessionUser(sessionUser);
		} catch (error) {
			toast.error(`${error}`);
		}
	}, [config, name, email, password, confirmPassword, setSessionUser]);

	const ldapSignInHandler = useCallback(async () => {
		try {
			const sessionUser = await ldapUserSignIn(ldapUsername, password);
			await setSessionUser(sessionUser);
		} catch (error) {
			toast.error(`${error}`);
		}
	}, [ldapUsername, password, setSessionUser]);

	const submitHandler = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();
			if (mode === 'ldap') {
				await ldapSignInHandler();
			} else if (mode === 'signin') {
				await signInHandler();
			} else {
				await signUpHandler();
			}
		},
		[mode, ldapSignInHandler, signInHandler, signUpHandler]
	);

	const oauthCallbackHandler = useCallback(async () => {
		const token = getCookie('token');
		if (!token) return;

		try {
			const sessionUser = await getSessionUser(token);
			if (sessionUser) {
				localStorage.setItem('token', token);
				await setSessionUser(sessionUser, localStorage.getItem('redirectPath') || null);
			}
		} catch (error) {
			toast.error(`${error}`);
		}
	}, [setSessionUser]);

	useEffect(() => {
		const init = async () => {
			const redirectPath = searchParams.get('redirect');
			if (user !== undefined) {
				router.push(redirectPath || '/');
				return;
			}

			if (redirectPath) {
				localStorage.setItem('redirectPath', redirectPath);
			}

			const error = searchParams.get('error');
			if (error) {
				toast.error(error);
			}

			await oauthCallbackHandler();

			if (config?.features?.enable_ldap) {
				setMode('ldap');
			}

			setLoaded(true);

			if ((config?.features?.auth_trusted_header ?? false) || config?.features?.auth === false) {
				await signInHandler();
			}
		};

		init();
	}, [config, user, searchParams, router, oauthCallbackHandler, signInHandler]);

	const oauthProviders = config?.oauth?.providers ?? {};

	return (
		<div className="w-full h-screen max-h-[100dvh] text-white relative" id="auth-page">
			<div className="w-full h-full absolute top-0 left-0 bg-white dark:bg-black" />

			<div className="w-full absolute top-0 left-0 right-0 h-8 drag-region" />

			{loaded && (
				<div
					className="fixed bg-transparent min-h-screen w-full flex justify-center font-primary z-50 text-black dark:text-white"
					id="auth-container"
				>
					<div className="w-full px-10 min-h-screen flex flex-col text-center">
						{(config?.features?.auth_trusted_header ?? false) ||
						config?.features?.auth === false ? (
							<div className="my-auto pb-10 w-full sm:max-w-md">
								<div className="flex items-center justify-center gap-3 text-xl sm:text-2xl text-center font-medium dark:text-gray-200">
									<div>{`Signing in to ${WEBUI_NAME}`}</div>
									<div>
										<Spinner className="size-5" />
									</div>
								</div>
							</div>
						) : (
							<div className="my-auto flex flex-col justify-center items-center">
								<div className="sm:max-w-md my-auto pb-10 w-full dark:text-gray-100">
									{config?.metadata?.auth_logo_position === 'center' && (
										<div className="flex justify-center mb-6">
											<img
												id="logo"
												crossOrigin="anonymous"
												src={`${WEBUI_BASE_URL}/static/favicon.png`}
												className="size-24 rounded-full"
												alt=""
											/>
										</div>
									)}

									<form className="flex flex-col justify-center" onSubmit={submitHandler}>
										<div className="mb-1">
											<div className="text-2xl font-medium">
												{config?.onboarding
													? `Get started with ${WEBUI_NAME}`
													: mode === 'ldap'
														? `Sign in to ${WEBUI_NAME} with LDAP`
														: mode === 'signin'
															? `Sign in to ${WEBUI_NAME}`
															: `Sign up to ${WEBUI_NAME}`}
											</div>

											{config?.onboarding && (
												<div className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-500">
													ⓘ {WEBUI_NAME} does not make any external connections, and your data stays
													securely on your locally hosted server.
												</div>
											)}
										</div>

										{(config?.features?.enable_login_form || config?.features?.enable_ldap) && (
											<div className="flex flex-col mt-4">
												{mode === 'signup' && (
													<div className="mb-2">
														<label
															htmlFor="name"
															className="text-sm font-medium text-left mb-1 block"
														>
															Name
														</label>
														<input
															value={name}
															onChange={(e) => setName(e.target.value)}
															type="text"
															id="name"
															className="my-0.5 w-full text-sm outline-hidden bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600"
															autoComplete="name"
															placeholder="Enter Your Full Name"
															required
														/>
													</div>
												)}

												{mode === 'ldap' ? (
													<div className="mb-2">
														<label
															htmlFor="username"
															className="text-sm font-medium text-left mb-1 block"
														>
															Username
														</label>
														<input
															value={ldapUsername}
															onChange={(e) => setLdapUsername(e.target.value)}
															type="text"
															className="my-0.5 w-full text-sm outline-hidden bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600"
															autoComplete="username"
															name="username"
															id="username"
															placeholder="Enter Your Username"
															required
														/>
													</div>
												) : (
													<div className="mb-2">
														<label
															htmlFor="email"
															className="text-sm font-medium text-left mb-1 block"
														>
															Email
														</label>
														<input
															value={email}
															onChange={(e) => setEmail(e.target.value)}
															type="email"
															id="email"
															className="my-0.5 w-full text-sm outline-hidden bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600"
															autoComplete="email"
															name="email"
															placeholder="Enter Your Email"
															required
														/>
													</div>
												)}

												<div>
													<label
														htmlFor="password"
														className="text-sm font-medium text-left mb-1 block"
													>
														Password
													</label>
													<SensitiveInput
														id="password"
														value={password}
														onChange={setPassword}
														type="password"
														placeholder="Enter Your Password"
														required
														inputClassName="my-0.5 w-full text-sm outline-hidden bg-transparent placeholder:text-gray-300 dark:placeholder:text-gray-600"
													/>
												</div>

												{mode === 'signup' &&
													config?.features?.enable_signup_password_confirmation && (
														<div className="mt-2">
															<label
																htmlFor="confirm-password"
																className="text-sm font-medium text-left mb-1 block"
															>
																Confirm Password
															</label>
															<SensitiveInput
																id="confirm-password"
																value={confirmPassword}
																onChange={setConfirmPassword}
																type="password"
																placeholder="Confirm Your Password"
																required
																inputClassName="my-0.5 w-full text-sm outline-hidden bg-transparent"
															/>
														</div>
													)}
											</div>
										)}

										<div className="mt-5">
											{(config?.features?.enable_login_form || config?.features?.enable_ldap) && (
												<>
													<button
														className="bg-gray-700/5 hover:bg-gray-700/10 dark:bg-gray-100/5 dark:hover:bg-gray-100/10 dark:text-gray-300 dark:hover:text-white transition w-full rounded-full font-medium text-sm py-2.5"
														type="submit"
													>
														{mode === 'ldap'
															? 'Authenticate'
															: mode === 'signin'
																? 'Sign in'
																: config?.onboarding
																	? 'Create Admin Account'
																	: 'Create Account'}
													</button>

													{config?.features?.enable_signup &&
														!config?.onboarding &&
														mode !== 'ldap' && (
															<div className="mt-4 text-sm text-center">
																{mode === 'signin'
																	? "Don't have an account?"
																	: 'Already have an account?'}
																<button
																	className="font-medium underline ml-1"
																	type="button"
																	onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
																>
																	{mode === 'signin' ? 'Sign up' : 'Sign in'}
																</button>
															</div>
														)}
												</>
											)}
										</div>
									</form>

									{Object.keys(oauthProviders).length > 0 && (
										<>
											<div className="inline-flex items-center justify-center w-full">
												<hr className="w-32 h-px my-4 border-0 dark:bg-gray-100/10 bg-gray-700/10" />
												{(config?.features?.enable_login_form || config?.features?.enable_ldap) && (
													<span className="px-3 text-sm font-medium text-gray-900 dark:text-white bg-transparent">
														or
													</span>
												)}
												<hr className="w-32 h-px my-4 border-0 dark:bg-gray-100/10 bg-gray-700/10" />
											</div>

											<div className="flex flex-col space-y-2">
												{oauthProviders.google && (
													<button
														className="flex justify-center items-center bg-gray-700/5 hover:bg-gray-700/10 dark:bg-gray-100/5 dark:hover:bg-gray-100/10 dark:text-gray-300 dark:hover:text-white transition w-full rounded-full font-medium text-sm py-2.5"
														onClick={() => {
															window.location.href = `${WEBUI_BASE_URL}/oauth/google/login`;
														}}
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 48 48"
															className="size-6 mr-3"
														>
															<path
																fill="#EA4335"
																d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
															/>
															<path
																fill="#4285F4"
																d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
															/>
															<path
																fill="#FBBC05"
																d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
															/>
															<path
																fill="#34A853"
																d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
															/>
														</svg>
														<span>Continue with Google</span>
													</button>
												)}

												{oauthProviders.microsoft && (
													<button
														className="flex justify-center items-center bg-gray-700/5 hover:bg-gray-700/10 dark:bg-gray-100/5 dark:hover:bg-gray-100/10 dark:text-gray-300 dark:hover:text-white transition w-full rounded-full font-medium text-sm py-2.5"
														onClick={() => {
															window.location.href = `${WEBUI_BASE_URL}/oauth/microsoft/login`;
														}}
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 21 21"
															className="size-6 mr-3"
														>
															<rect x="1" y="1" width="9" height="9" fill="#f25022" />
															<rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
															<rect x="11" y="1" width="9" height="9" fill="#7fba00" />
															<rect x="11" y="11" width="9" height="9" fill="#ffb900" />
														</svg>
														<span>Continue with Microsoft</span>
													</button>
												)}

												{oauthProviders.github && (
													<button
														className="flex justify-center items-center bg-gray-700/5 hover:bg-gray-700/10 dark:bg-gray-100/5 dark:hover:bg-gray-100/10 dark:text-gray-300 dark:hover:text-white transition w-full rounded-full font-medium text-sm py-2.5"
														onClick={() => {
															window.location.href = `${WEBUI_BASE_URL}/oauth/github/login`;
														}}
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															viewBox="0 0 24 24"
															className="size-6 mr-3"
														>
															<path
																fill="currentColor"
																d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.92 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57C20.565 21.795 24 17.31 24 12c0-6.63-5.37-12-12-12z"
															/>
														</svg>
														<span>Continue with GitHub</span>
													</button>
												)}

												{oauthProviders.oidc && (
													<button
														className="flex justify-center items-center bg-gray-700/5 hover:bg-gray-700/10 dark:bg-gray-100/5 dark:hover:bg-gray-100/10 dark:text-gray-300 dark:hover:text-white transition w-full rounded-full font-medium text-sm py-2.5"
														onClick={() => {
															window.location.href = `${WEBUI_BASE_URL}/oauth/oidc/login`;
														}}
													>
														<svg
															xmlns="http://www.w3.org/2000/svg"
															fill="none"
															viewBox="0 0 24 24"
															strokeWidth="1.5"
															stroke="currentColor"
															className="size-6 mr-3"
														>
															<path
																strokeLinecap="round"
																strokeLinejoin="round"
																d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z"
															/>
														</svg>
														<span>{`Continue with ${oauthProviders.oidc || 'SSO'}`}</span>
													</button>
												)}
											</div>
										</>
									)}

									{config?.features?.enable_ldap && config?.features?.enable_login_form && (
										<div className="mt-2">
											<button
												className="flex justify-center items-center text-xs w-full text-center underline"
												type="button"
												onClick={() => {
													if (mode === 'ldap') {
														setMode(config?.onboarding ? 'signup' : 'signin');
													} else {
														setMode('ldap');
													}
												}}
											>
												<span>
													{mode === 'ldap' ? 'Continue with Email' : 'Continue with LDAP'}
												</span>
											</button>
										</div>
									)}
								</div>

								{config?.metadata?.login_footer && (
									<div className="max-w-3xl mx-auto">
										<div
											className="mt-2 text-[0.7rem] text-gray-500 dark:text-gray-400 marked"
											dangerouslySetInnerHTML={{
												__html: DOMPurify.sanitize(marked(config.metadata.login_footer) as string)
											}}
										/>
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			)}

			{!config?.metadata?.auth_logo_position && (
				<div className="fixed m-10 z-50">
					<div className="flex space-x-2">
						<div className="self-center">
							<img
								id="logo"
								crossOrigin="anonymous"
								src={`${WEBUI_BASE_URL}/static/favicon.png`}
								className="w-6 rounded-full"
								alt=""
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
