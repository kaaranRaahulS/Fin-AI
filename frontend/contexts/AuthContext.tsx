// contexts/AuthContext.tsx
import * as SecureStore from "expo-secure-store";
import React, { createContext, useContext, useEffect, useState } from "react";

type User = { id: string; name: string; email: string };

type AuthContextType = {
	ready: boolean;
	user: User | null;
	token: string | null;
	login: (
		user: User,
		token?: string | null,
		remember?: boolean
	) => Promise<void>;
	register: (
		user: User,
		token?: string | null,
		remember?: boolean
	) => Promise<void>;
	logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
	ready: false,
	user: null,
	token: null,
	login: async () => { },
	register: async () => { },
	logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
	const [ready, setReady] = useState(false);
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);

	// Bootstrap session
	useEffect(() => {
		(async () => {
			try {
				const [storedToken, storedUser] = await Promise.all([
					SecureStore.getItemAsync(TOKEN_KEY),
					SecureStore.getItemAsync(USER_KEY),
				]);
				if (storedToken && storedUser) {
					setToken(storedToken);
					setUser(JSON.parse(storedUser));
				}
			} finally {
				setReady(true);
			}
		})();
	}, []);

	const persist = async (u: User, t?: string | null) => {
		if (t) await SecureStore.setItemAsync(TOKEN_KEY, t);
		await SecureStore.setItemAsync(USER_KEY, JSON.stringify(u));
	};

	const clearPersisted = async () => {
		await Promise.all([
			SecureStore.deleteItemAsync(TOKEN_KEY),
			SecureStore.deleteItemAsync(USER_KEY),
		]);
	};

	const login = async (u: User, t?: string | null, remember?: boolean) => {
		setUser(u);
		setToken(t ?? null);
		if (remember) await persist(u, t ?? undefined);
	};

	const register = async (u: User, t?: string | null, remember?: boolean) => {
		setUser(u);
		setToken(t ?? null);
		if (remember) await persist(u, t ?? undefined);
	};

	const logout = async () => {
		await clearPersisted(); // <-- IMPORTANT!
		setUser(null);
		setToken(null);
	};

	return (
		<AuthContext.Provider
			value={{ ready, user, token, login, register, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
};
