import { useState, useEffect } from "react";
import { GoogleLogin, googleLogout } from "@react-oauth/google";

const STORAGE_KEY = "mw_google_credential";

function decodeJwt(token: string): Record<string, any> | null {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function isSessionValid(): boolean {
  const credential = localStorage.getItem(STORAGE_KEY);
  if (!credential) return false;
  const payload = decodeJwt(credential);
  if (!payload) return false;
  return payload.exp * 1000 > Date.now();
}

export function getUserInfo(): { name: string; email: string; picture: string } | null {
  const credential = localStorage.getItem(STORAGE_KEY);
  if (!credential) return null;
  const payload = decodeJwt(credential);
  if (!payload) return null;
  return { name: payload.name, email: payload.email, picture: payload.picture };
}

export function signOut() {
  googleLogout();
  localStorage.removeItem(STORAGE_KEY);
  window.location.reload();
}

interface AuthGateProps {
  children: React.ReactNode;
}

export default function AuthGate({ children }: AuthGateProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsAuthenticated(isSessionValid());
    setLoading(false);
  }, []);

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
            onSuccess={(response) => {
              if (response.credential) {
                localStorage.setItem(STORAGE_KEY, response.credential);
                setIsAuthenticated(true);
                setError("");
                // Log login activity — fire-and-forget, never blocks the user
                const payload = decodeJwt(response.credential);
                if (payload) {
                  fetch("/api/log-activity", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      name: payload.name || "",
                      email: payload.email || "",
                      action: "login",
                    }),
                  }).catch(() => {});
                }
              }
            }}
            onError={() => setError("Sign-in failed. Please try again.")}
            useOneTap
            shape="rectangular"
            size="large"
            text="signin_with"
            width="280"
          />
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
