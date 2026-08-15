import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { api, saveToken, clearToken, loadToken, setToken, User } from "@/src/api";

WebBrowser.maybeCompleteAuthSession();

type AuthState = {
  user: User | null;
  loading: boolean;
  loginEmail: (email: string, password: string) => Promise<void>;
  registerEmail: (
    email: string,
    password: string,
    name: string,
    role: string,
  ) => Promise<void>;
  loginGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  setRole: (role: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({} as AuthState);
export const useAuth = () => useContext(AuthContext);

function extractSessionId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/[?#&]session_id=([^&#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const processed = useRef<Set<string>>(new Set());
  const capturedUrl = useRef<string | null>(null);

  const exchangeSession = useCallback(async (sessionId: string) => {
    if (processed.current.has(sessionId)) return;
    processed.current.add(sessionId);
    try {
      const res = await api.post<{ session_token: string; user: User }>(
        "/auth/session",
        { session_id: sessionId },
      );
      await saveToken(res.session_token);
      setUser(res.user);
    } catch (e) {
      // silent — user stays on login
      console.log("session exchange failed", e);
    }
  }, []);

  const checkExisting = useCallback(async () => {
    const token = await loadToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: User }>("/auth/me");
      setUser(res.user);
    } catch (e: any) {
      if (e?.status === 401) await clearToken();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function boot() {
      // Web: parse session_id from URL first
      if (Platform.OS === "web") {
        const sid =
          extractSessionId(window.location.hash) ||
          extractSessionId(window.location.search);
        if (sid) {
          await exchangeSession(sid);
          try {
            const url = new URL(window.location.href);
            url.hash = "";
            url.searchParams.delete("session_id");
            window.history.replaceState(window.history.state, "", url.toString());
          } catch {}
          if (mounted) setLoading(false);
          return;
        }
      } else {
        // Mobile cold start
        const initial = await Linking.getInitialURL();
        const sid = extractSessionId(initial) || extractSessionId(capturedUrl.current);
        if (sid) {
          await exchangeSession(sid);
          if (mounted) setLoading(false);
          return;
        }
      }
      await checkExisting();
    }

    const sub = Linking.addEventListener("url", ({ url }) => {
      capturedUrl.current = url;
      const sid = extractSessionId(url);
      if (sid) exchangeSession(sid).then(() => setLoading(false));
    });

    boot();
    return () => {
      mounted = false;
      sub.remove();
    };
  }, [checkExisting, exchangeSession]);

  const loginEmail = async (email: string, password: string) => {
    const res = await api.post<{ session_token: string; user: User }>("/auth/login", {
      email,
      password,
    });
    await saveToken(res.session_token);
    setUser(res.user);
  };

  const registerEmail = async (
    email: string,
    password: string,
    name: string,
    role: string,
  ) => {
    const res = await api.post<{ session_token: string; user: User }>("/auth/register", {
      email,
      password,
      name,
      role,
    });
    await saveToken(res.session_token);
    setUser(res.user);
  };

  const loginGoogle = async () => {
    const redirectUrl =
      Platform.OS === "web"
        ? window.location.origin + "/"
        : Linking.createURL("");
    const authUrl = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(
      redirectUrl,
    )}`;

    if (Platform.OS === "web") {
      window.location.href = authUrl;
      return;
    }

    const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);
    let url: string | null = null;
    if (result.type === "success" && (result as any).url) {
      url = (result as any).url;
    }
    const sid =
      extractSessionId(url) ||
      extractSessionId(capturedUrl.current) ||
      extractSessionId(await Linking.getInitialURL());
    if (sid) {
      await exchangeSession(sid);
    }
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}
    await clearToken();
    setToken(null);
    setUser(null);
  };

  const setRole = async (role: string) => {
    const res = await api.put<{ user: User }>("/auth/role", { role });
    setUser(res.user);
  };

  const refresh = async () => {
    try {
      const res = await api.get<{ user: User }>("/auth/me");
      setUser(res.user);
    } catch {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginEmail,
        registerEmail,
        loginGoogle,
        logout,
        setRole,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
