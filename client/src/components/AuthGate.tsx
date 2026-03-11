import { useState, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

const USER_STORAGE_KEY = "mw_user_info";

type SessionUser = { name: string; email: string; picture: string };

function readStoredUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (!parsed?.email) return null;
    return {
      name: parsed.name || "",
      email: parsed.email || "",
      picture: parsed.picture || "/favicon.png",
    };
  } catch {
    return null;
  }
}

function storeUser(user: SessionUser) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

async function fetchSessionUser(): Promise<SessionUser | null> {
  try {
    const res = await fetch("/api/auth-me", {
      method: "GET",
      credentials: "include",
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.user?.email) return null;

    return {
      name: data.user.name || "",
      email: data.user.email || "",
      picture: data.user.picture || "/favicon.png",
    };
  } catch {
    return null;
  }
}

export function getUserInfo(): SessionUser | null {
  return readStoredUser();
}

export async function signOut() {
  try {
    await fetch("/api/auth-logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // no-op: still perform local signout
  }

  googleLogout();
  clearStoredUser();
  window.location.href = "/login";
}

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [authenticating, setAuthenticating] = useState(false);

  useEffect(() => {
    let active = true;

    (async () => {
      const user = await fetchSessionUser();
      if (!active) return;

      if (user) {
        storeUser(user);
        setIsAuthenticated(true);
      } else {
        clearStoredUser();
        setIsAuthenticated(false);
      }
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && window.location.pathname === "/login") {
      window.location.replace("/");
    }
  }, [isAuthenticated]);

  if (loading) return null;

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex flex-col items-center justify-center px-4">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-6">
            <img src="/favicon.png" alt="MatoWork" className="w-10 h-10 rounded-lg object-contain" />
            <span className="font-bold text-2xl tracking-tight text-slate-900">
              Mato<span className="text-slate-400">Work</span>
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Welcome back.
          </h1>
          <p className="text-slate-500 text-base font-medium max-w-sm mx-auto">
            Sign in with your Google account to access the MatoWork portal.
          </p>
        </div>

        <div className="bg-white border border-slate-100 rounded-sm shadow-sm p-8 w-full max-w-sm flex flex-col items-center gap-4">
          <GoogleLogin
            onSuccess={async (response) => {
              if (!response.credential) {
                setError("Sign-in failed. Missing credential.");
                return;
              }

              setAuthenticating(true);
              setError("");
              try {
                const res = await fetch("/api/auth-session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ credential: response.credential }),
                });

                const data = await res.json().catch(() => null);
                if (!res.ok || !data?.user?.email) {
                  setError(data?.message || "Sign-in failed. Please try again.");
                  return;
                }

                storeUser({
                  name: data.user.name || "",
                  email: data.user.email || "",
                  picture: data.user.picture || "/favicon.png",
                });
                setIsAuthenticated(true);

                const next = new URLSearchParams(window.location.search).get("next");
                window.location.href = next && next.startsWith("/") ? next : "/";
              } catch {
                setError("Sign-in failed. Please try again.");
              } finally {
                setAuthenticating(false);
              }
            }}
            onError={() => setError("Sign-in failed. Please try again.")}
            useOneTap
            shape="rectangular"
            size="large"
            text="signin_with"
            width="280"
          />
          {authenticating && (
            <p className="text-slate-500 text-sm font-medium">Verifying account...</p>
          )}
          {error && (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          )}
        </div>

        <p className="text-slate-400 text-xs font-medium mt-8 tracking-wide">
          &copy; {new Date().getFullYear()} MatoWork. All rights reserved.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
