'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/app/lib/api-client';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string | null;
    organizationName: string | null;
    allowedTabs: string[];
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        loadUser();
    }, []);

    // Auto refresh token every 14 minutes (before 15min expiration)
    useEffect(() => {
        if (!user) return;

        const interval = setInterval(() => {
            refreshAuth();
        }, 14 * 60 * 1000); // 14 minutes

        return () => clearInterval(interval);
    }, [user]);

    const loadUser = async () => {
        const token = localStorage.getItem('accessToken');

        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const { user } = await api.auth.getMe();
            setUser(user);
        } catch (error) {
            // Token inválido, tentar refresh
            await tryRefreshToken();
        } finally {
            setLoading(false);
        }
    };

    const tryRefreshToken = async () => {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
            logout();
            return;
        }

        try {
            const { accessToken, refreshToken: newRefreshToken, user } = await api.auth.refresh(refreshToken);
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            setUser(user);
        } catch (error) {
            logout();
        }
    };

    const login = async (email: string, password: string) => {
        const { accessToken, refreshToken, user } = await api.auth.login(email, password);

        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setUser(user);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('selectedOrgId');
        setUser(null);
        router.push('/login');
    };

    const refreshAuth = async () => {
        await tryRefreshToken();
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, logout, refreshAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
