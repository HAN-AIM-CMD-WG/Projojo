import TestUserSelector from "../components/TestUserSelector";
import { API_BASE_URL } from "../services";

export default function LoginPage() {
  return (
    <div className="w-full min-h-dvh flex items-center justify-center">
      <div className="flex flex-col gap-2 w-96 p-4 border border-gray-300 rounded-lg shadow-md">

        <h1 className="text-4xl text-center font-bold mb-3">
          Projojo
          {/* CMD Opdrachtenbox */}
        </h1>

        <TestUserSelector />

        <a href={`${API_BASE_URL}auth/login/surf`} className="w-full bg-white text-gray-900 font-semibold py-3 px-6 rounded-lg border border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors duration-200 flex items-center justify-center gap-3">
          <svg version="1.1" id="Laag_1" viewBox="0 0 100 52" className="h-5 w-auto">
            <path id="a_1_" d="M92.4 31.4c4.2 0 7.6 3.5 7.6 7.8v5c0 4.3-3.4 7.8-7.6 7.8H80.9c-4.2 0-7.6-3.5-7.6-7.8v-3.1c0-5.4-4.3-9.7-9.5-9.7H9.5c-5.3 0-9.5-4.3-9.5-9.7v-12C0 4.3 4.3 0 9.5 0h54.3c5.3 0 9.5 4.3 9.5 9.7v12c0 5.4 4.3 9.7 9.5 9.7h9.6z" fill="#000" />
            <path d="M60.6 17.8c1 0 1.5-.5 1.5-1.5s-.5-1.6-1.5-1.6h-3.8v-3h6c1 0 1.5-.5 1.5-1.6 0-1-.5-1.5-1.5-1.5h-7.6c-1 0-1.6.5-1.6 1.6v11c0 1.1.5 1.6 1.6 1.6 1 0 1.6-.5 1.6-1.6v-3.5c0 .1 3.8.1 3.8.1zm-12.5-.3c1.4-.7 2.2-2.1 2.2-3.9 0-2.9-2.1-5-5.1-5h-4.5c-1 0-1.6.5-1.6 1.6v11c0 1.1.5 1.6 1.6 1.6 1 0 1.6-.5 1.6-1.6v-2.9H45l1.6 3.4c.3.7.7 1 1.3 1 .8 0 1.8-.6 1.8-1.5 0-.3-.1-.6-.2-.9l-1.4-2.8zm-3.3-2h-2.7v-3.8h2.7c1.2 0 2.2.6 2.2 1.9 0 1.3-1 1.9-2.2 1.9zm-12.7.8c0 2.2-1.3 3.5-3.1 3.5s-3.1-1.3-3.1-3.5v-6.2c0-1.1-.5-1.6-1.6-1.6-1 0-1.6.5-1.6 1.6v6.2c0 4.1 2.7 6.7 6.3 6.7 3.6 0 6.3-2.6 6.3-6.7v-6.2c0-1.1-.5-1.6-1.6-1.6-1 0-1.6.5-1.6 1.6v6.2zM14.2 20c-1.2 0-2.1-.3-2.7-.5-.5-.2-.9-.3-1.4-.3-.9 0-1.4.6-1.4 1.5 0 1.5 3 2.3 5.6 2.3 3.1 0 5.5-1.7 5.5-4.3 0-2.4-1.6-3.5-3.3-4.1l-2.6-.8c-1.1-.3-1.6-.6-1.6-1.3 0-.7 1.1-1.1 2-1.1 1.1 0 1.9.3 2.5.5.4.1.8.3 1.3.3.8 0 1.3-.6 1.3-1.5 0-1.5-2.7-2.3-5.1-2.3-3 0-5.2 1.7-5.2 4.2 0 2.1 1.5 3.3 3.1 3.8l2.3.7c1.2.4 2.1.7 2.1 1.4-.2 1-1.4 1.5-2.4 1.5z" fill="#fff" />
          </svg>
          Studenten login (SURF)
        </a>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Docenten / Supervisors</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

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

      </div>
    </div>
  );
}
