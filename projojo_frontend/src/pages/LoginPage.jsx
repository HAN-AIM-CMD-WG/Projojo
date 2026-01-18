import { useState } from "react";
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
    <div className="w-full min-h-dvh flex items-center justify-center">
      <div className="flex flex-col gap-2 w-96 p-4 border border-gray-300 rounded-lg shadow-md">

        <h1 className="text-4xl text-center font-bold mb-3">
          {/* Projojo */}
          HAN Opdrachtenbox
        </h1>

        <TestUserSelector />

        <a href={`${API_BASE_URL}auth/login/google`} className="w-full bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors duration-200 flex items-center justify-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Inloggen met Google
        </a>

        <a href={`${API_BASE_URL}auth/login/microsoft`} className="w-full bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors duration-200 flex items-center justify-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <rect x="1" y="1" width="10" height="10" fill="#F25022" />
            <rect x="13" y="1" width="10" height="10" fill="#7FBA00" />
            <rect x="1" y="13" width="10" height="10" fill="#00A4EF" />
            <rect x="13" y="13" width="10" height="10" fill="#FFB900" />
          </svg>
          Inloggen met Microsoft
        </a>

        <a href={`${API_BASE_URL}auth/login/github`} className="w-full bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors duration-200 flex items-center justify-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Inloggen met GitHub
        </a>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            Je wordt doorgestuurd om de authenticatie te voltooien
          </p>
        </div>

        {/* ============================================================================ */}
        {/* EMAIL TEST SECTION - REMOVE AFTER TESTING */}
        {/* ============================================================================ */}
        <div className="mt-4 pt-4 border-t border-dashed border-orange-300 bg-orange-50 p-3 rounded-lg">
          <p className="text-xs text-orange-600 font-semibold mb-2">
            EMAIL TEST (Development Only)
          </p>
          <div className="flex flex-col gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-3 py-2 border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <button
              onClick={handleSendTestEmail}
              disabled={isLoading}
              className="w-full bg-orange-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-orange-600 disabled:bg-orange-300 transition-colors duration-200 text-sm"
            >
              {isLoading ? "Sending..." : "Send Test Email"}
            </button>
            {emailStatus && (
              <p className={`text-xs ${emailStatus.type === "success" ? "text-green-600" : "text-red-600"}`}>
                {emailStatus.message}
              </p>
            )}
            <p className="text-xs text-orange-500">
              View emails at: <a href="http://localhost:8025" target="_blank" rel="noopener noreferrer" className="underline">http://localhost:8025</a>
            </p>
          </div>
        </div>
        {/* ============================================================================ */}
        {/* END EMAIL TEST SECTION - REMOVE AFTER TESTING */}
        {/* ============================================================================ */}

      </div>
    </div>
  );
}
