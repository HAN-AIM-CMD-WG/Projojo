import { useState } from "react";
import { API_BASE_URL } from "../services";

export default function TestSendEmail() {
    // Only show test functionality on localhost
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    const [testEmail, setTestEmail] = useState("test@example.com");
    const [emailStatus, setEmailStatus] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSendTestEmail = async () => {
        setIsLoading(true);
        setEmailStatus(null);
        try {
            const response = await fetch(`${API_BASE_URL}test/email`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ recipient_email: testEmail }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || result.detail || "Failed to send email");
            }

            setEmailStatus({ type: result.status, message: result.message });
        } catch (error) {
            setEmailStatus({ type: "error", message: error.message || "Failed to send email" });
        } finally {
            setIsLoading(false);
        }
    };

    // Don't render anything if not on localhost
    if (!isLocalhost) {
        return null;
    }

    return (
        <div className="w-full max-w-md p-3 border-2 border-dashed border-orange-400 bg-orange-50 rounded-md">
            <h3 className="font-bold text-orange-700 mb-2">
                EMAIL TEST (Development Only)
            </h3>
            <div className="flex flex-col gap-2">
                <label className="block text-sm font-medium text-orange-700 mb-1">
                    {/* Selecteer een testgebruiker om direct in te loggen: */}
                    Verstuur een test e-mail naar:
                </label>
                <input
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                    className="w-full px-3 py-2 border border-orange-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                />
                <button
                    onClick={handleSendTestEmail}
                    disabled={isLoading}
                    className="w-full bg-orange-500 text-white font-semibold py-2 px-4 rounded-md hover:bg-orange-600 disabled:bg-orange-300 transition-colors duration-200 text-sm"
                >
                    {isLoading ? "Versturen..." : "Verstuur test e-mail"}
                </button>
                {emailStatus && (
                    <p className={`text-xs ${emailStatus.type === "success" ? "text-green-600" : "text-red-600"}`}>
                        {emailStatus.message}
                    </p>
                )}
                <p className="text-xs text-orange-500">
                    Zie mails in MailHog: <a href="http://localhost:10106" target="_blank" rel="noopener noreferrer" className="underline">http://localhost:10106</a>
                </p>
            </div>
        </div>
    );
}
