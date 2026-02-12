import { useState } from "react";
import { Link } from "react-router-dom";
import TestUserSelector from "../components/TestUserSelector";
import { API_BASE_URL, sendTestEmail } from "../services";

export default function LoginPage() {
  // ============================================================================
  // EMAIL TEST STATE - REMOVE AFTER TESTING
  // ============================================================================
  const [testEmail, setTestEmail] = useState("test@example.com");
  const [emailStatus, setEmailStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTestEmail = async () => {
    setIsLoading(true);
    setEmailStatus(null);
    try {
      const result = await sendTestEmail(testEmail);
      setEmailStatus({ type: result.status, message: result.message });
    } catch (error) {
      setEmailStatus({ type: "error", message: error.message || "Failed to send email" });
    } finally {
      setIsLoading(false);
    }
  };
  // ============================================================================
  // END EMAIL TEST STATE - REMOVE AFTER TESTING
  // ============================================================================

  return (
    <div className="w-full min-h-dvh flex items-center justify-center bg-neu-bg p-6">
      <div className="neu-card-lg w-full max-w-md sm:max-w-xl fade-in-up">
        {/* Back to landing */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-primary transition-colors mb-6 text-sm font-semibold"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          Terug naar home
        </Link>

        {/* Logo & Header */}
        <div className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl neu-pressed flex items-center justify-center text-primary relative overflow-hidden shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/15 pointer-events-none"></div>
              <span className="material-symbols-outlined text-3xl drop-shadow-sm">school</span>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight leading-none">
                Projojo
              </h1>
              <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mt-1">
                Student Hub
              </p>
            </div>
          </div>
          <p className="text-text-muted text-center text-sm font-semibold mt-1">
            Log in om verder te gaan
          </p>
        </div>

        <TestUserSelector />

        {/* OAuth buttons */}
        <div className="flex flex-col gap-4">
          <a 
            href={`${API_BASE_URL}auth/login/google`} 
            className="neu-btn w-full flex items-center justify-center gap-3 py-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span className="font-bold text-sm">Inloggen met Google</span>
          </a>

          <a 
            href={`${API_BASE_URL}auth/login/microsoft`} 
            className="neu-btn w-full flex items-center justify-center gap-3 py-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <rect x="1" y="1" width="10" height="10" fill="#F25022" />
              <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
              <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
              <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
            </svg>
            <span className="font-bold text-sm">Inloggen met Microsoft</span>
          </a>

          <a 
            href={`${API_BASE_URL}auth/login/github`} 
            className="neu-btn w-full flex items-center justify-center gap-3 py-4"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
            <span className="font-bold text-sm">Inloggen met GitHub</span>
          </a>
        </div>

        {/* Footer text */}
        <div className="text-center mt-8 pt-6 border-t border-gray-200/40">
          <p className="text-xs text-text-muted font-semibold">
            Je wordt doorgestuurd om de authenticatie te voltooien
          </p>
        </div>
        {/* ============================================================================ */}
        {/* EMAIL TEST SECTION - REMOVE AFTER TESTING */}
        {/* ============================================================================ */}
        <div className="mt-4 neu-pressed rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-sm">mail</span>
            </div>
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide">
              Email Test
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="neu-input flex-1 !py-2 !text-sm"
            />
            <button
              onClick={handleSendTestEmail}
              disabled={isLoading}
              className="neu-btn-primary !py-2 !px-4 text-sm font-bold shrink-0 disabled:opacity-40"
            >
              {isLoading ? "..." : "Verstuur"}
            </button>
          </div>
          {emailStatus && (
            <p className={`text-xs mt-2 font-semibold ${emailStatus.type === "success" ? "text-primary" : "text-red-500"}`}>
              {emailStatus.message}
            </p>
          )}
          <p className="text-[11px] text-[var(--text-muted)] mt-2">
            Bekijk emails: <a href="http://localhost:8025" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-semibold">localhost:8025</a>
          </p>
        </div>
        {/* ============================================================================ */}
        {/* END EMAIL TEST SECTION - REMOVE AFTER TESTING */}
        {/* ============================================================================ */}

      </div>
    </div>
  );
}
