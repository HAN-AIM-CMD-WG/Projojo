import { useState } from "react";
import { respondToStatusRequest } from "../services";

/**
 * StatusRequestBanner - Shows a prominent banner for pending status change requests.
 * Displayed on task pages where a consensus request is pending.
 * 
 * @param {Object} props
 * @param {Object} props.pendingRequest - The pending status change request
 * @param {string} props.currentUserId - The ID of the current logged-in user
 * @param {string} props.currentUserRole - The role of the current user
 * @param {Function} props.onResponseComplete - Callback after response is submitted
 */
export default function StatusRequestBanner({ 
    pendingRequest, 
    currentUserId, 
    currentUserRole,
    onResponseComplete 
}) {
    const [responseMessage, setResponseMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResponseForm, setShowResponseForm] = useState(false);
    const [selectedAction, setSelectedAction] = useState(null); // "approve" | "deny"

    if (!pendingRequest) return null;

    const { id, request_type, reason, requester, auto_approve_at } = pendingRequest;
    
    // Determine if current user initiated the request
    const isRequester = requester?.id === currentUserId;
    
    // Labels based on request type
    const typeLabels = {
        completion: { title: "Afrondverzoek", icon: "check_circle", color: "green" },
        cancellation: { title: "Afbreekverzoek", icon: "cancel", color: "amber" },
        end_review: { title: "Eindbeoordeling", icon: "schedule", color: "blue" },
    };
    
    const label = typeLabels[request_type] || typeLabels.end_review;

    // Format auto-approve date
    const autoApproveDate = auto_approve_at 
        ? new Date(auto_approve_at).toLocaleDateString('nl-NL', { 
            day: 'numeric', month: 'long', year: 'numeric' 
        })
        : null;

    const handleSubmitResponse = async (approved) => {
        setIsSubmitting(true);
        try {
            await respondToStatusRequest(id, approved, responseMessage);
            if (onResponseComplete) {
                onResponseComplete(approved);
            }
        } catch (error) {
            console.error("Error responding to status request:", error);
        } finally {
            setIsSubmitting(false);
            setShowResponseForm(false);
        }
    };

    const bgColorClass = {
        green: "bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700",
        amber: "bg-amber-50 border-amber-300 dark:bg-amber-900/20 dark:border-amber-700",
        blue: "bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700",
    }[label.color];

    const iconColorClass = {
        green: "text-green-600 dark:text-green-400",
        amber: "text-amber-600 dark:text-amber-400",
        blue: "text-blue-600 dark:text-blue-400",
    }[label.color];

    return (
        <div className={`rounded-xl border-2 p-4 mb-4 ${bgColorClass}`}>
            {/* Header */}
            <div className="flex items-start gap-3">
                <span className={`material-symbols-outlined text-2xl shrink-0 ${iconColorClass}`}>
                    {label.icon}
                </span>
                <div className="flex-1">
                    <h3 className="font-semibold text-[var(--text-primary)] text-sm">
                        {label.title}
                        {isRequester && (
                            <span className="ml-2 text-xs font-normal text-[var(--text-muted)]">
                                (door jou ingediend)
                            </span>
                        )}
                    </h3>
                    
                    {/* Request details */}
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        {request_type === "end_review" 
                            ? "De taakperiode is verstreken. Beoordeel of de taak is afgerond of afgebroken."
                            : reason
                        }
                    </p>

                    {requester && !isRequester && (
                        <p className="text-xs text-[var(--text-muted)] mt-1">
                            Ingediend door <strong>{requester.full_name}</strong>
                        </p>
                    )}

                    {autoApproveDate && (
                        <p className="text-xs text-[var(--text-muted)] mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">timer</span>
                            Automatisch goedgekeurd op {autoApproveDate} als er niet wordt gereageerd
                        </p>
                    )}

                    {/* Action buttons (only if not the requester) */}
                    {!isRequester && !showResponseForm && (
                        <div className="flex gap-2 mt-3">
                            <button
                                onClick={() => { setSelectedAction("approve"); setShowResponseForm(true); }}
                                className="neu-btn-primary !rounded-lg !px-4 !py-1.5 text-sm flex items-center gap-1.5"
                                disabled={isSubmitting}
                            >
                                <span className="material-symbols-outlined text-base">thumb_up</span>
                                Akkoord
                            </button>
                            <button
                                onClick={() => { setSelectedAction("deny"); setShowResponseForm(true); }}
                                className="neu-btn !rounded-lg !px-4 !py-1.5 text-sm flex items-center gap-1.5 text-red-600"
                                disabled={isSubmitting}
                            >
                                <span className="material-symbols-outlined text-base">thumb_down</span>
                                Niet akkoord
                            </button>
                        </div>
                    )}

                    {/* Response form */}
                    {showResponseForm && (
                        <div className="mt-3 space-y-2">
                            <textarea
                                value={responseMessage}
                                onChange={(e) => setResponseMessage(e.target.value)}
                                placeholder={selectedAction === "approve" 
                                    ? "Optioneel: toelichting bij goedkeuring..." 
                                    : "Geef een reden waarom je niet akkoord gaat..."
                                }
                                className="w-full px-3 py-2 rounded-lg neu-pressed text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                                rows={2}
                            />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleSubmitResponse(selectedAction === "approve")}
                                    disabled={isSubmitting || (selectedAction === "deny" && !responseMessage.trim())}
                                    className={`text-sm px-4 py-1.5 rounded-lg font-medium transition-colors ${
                                        selectedAction === "approve"
                                            ? "bg-green-600 text-white hover:bg-green-700 disabled:bg-green-400"
                                            : "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-400"
                                    }`}
                                >
                                    {isSubmitting ? "Verwerken..." : (selectedAction === "approve" ? "Bevestig goedkeuring" : "Bevestig afwijzing")}
                                </button>
                                <button
                                    onClick={() => { setShowResponseForm(false); setResponseMessage(""); }}
                                    className="text-sm px-4 py-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                                    disabled={isSubmitting}
                                >
                                    Annuleren
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Waiting state (if requester) */}
                    {isRequester && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-[var(--text-muted)]">
                            <span className="material-symbols-outlined text-base animate-pulse">hourglass_top</span>
                            Wachten op reactie van de andere partij...
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
