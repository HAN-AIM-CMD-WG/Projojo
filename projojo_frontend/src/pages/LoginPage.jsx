import { useState } from "react";
import TestUserSelector from "../components/TestUserSelector";
import TestSendEmail from "../components/TestSendEmail";
import { API_BASE_URL } from "../services";

export default function LoginPage() {

  return (
    <div className="w-full min-h-dvh flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-6 w-full max-w-4xl p-4">

        <h1 className="text-4xl font-bold text-gray-900 mb-4">Projojo</h1>

        <TestUserSelector />

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden w-full flex flex-col md:flex-row">
          <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-start pt-12 border-b-2 md:border-b-0 md:border-r-2 border-gray-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Studenten & Docenten</h2>
            <p className="text-gray-600 text-center mb-8">
              Log in met je HAN account.
            </p>

            <a href={`${API_BASE_URL}auth/login/surf`} className="w-full max-w-xs bg-white text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-3">
              <img src="/han_logo.png" alt="HAN Logo" className="h-6 mt-1" />
              Inloggen met HAN account
            </a>
            <p className="text-sm text-orange-500 mt-2">Inloggen met SURF is nog niet geïmplementeerd.</p>
          </div>

          <div className="flex-1 p-8 md:p-12 flex flex-col items-center justify-start pt-12">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Externe Begeleiders</h2>
            <p className="text-gray-600 text-center mb-8">
              Log in met een extern account.
            </p>

            <div className="flex flex-col gap-3 w-full max-w-xs">
              <a href={`${API_BASE_URL}auth/login/google`} className="w-full bg-white text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-3">
                <img src="/assets/icons/google.svg" alt="Google" className="h-5 w-5" />
                Google
              </a>

              <a href={`${API_BASE_URL}auth/login/microsoft`} className="w-full bg-white text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-3">
                <img src="/assets/icons/microsoft.svg" alt="Microsoft" className="h-5 w-5" />
                Microsoft
              </a>

              <a href={`${API_BASE_URL}auth/login/github`} className="w-full bg-white text-gray-700 font-medium py-2.5 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200 flex items-center justify-center gap-3">
                <img src="/assets/icons/github.svg" alt="GitHub" className="h-5 w-5" />
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-500">
            Je wordt doorgestuurd om de authenticatie te voltooien
          </p>
        </div>

        <TestSendEmail />

      </div>
    </div>
  );
}
