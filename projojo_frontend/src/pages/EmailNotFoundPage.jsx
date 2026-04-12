import { useState } from "react";
import FormInput from "../components/FormInput";
import Loading from "../components/Loading";
import { /*setEmail*/ } from "../services";
import { useNavigate } from "react-router-dom";

export default function EmailNotFound() {
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(undefined);
    const navigate = useNavigate();

    function onSubmit(event) {
        event.preventDefault();

        setSaving(true);

        const email = new FormData(event.target).get("email");
        setEmail(email).then(() => {
            navigate("/home");
        }).catch(error => {
            setError(error.message);
            setSaving(false);
        });
    }

    return (
        <div className="max-w-md mx-auto px-4 py-12">
            <div className="neu-flat rounded-2xl p-8">
                <div className="text-center mb-6">
                    <span className="material-symbols-outlined text-5xl text-primary mb-4">mail</span>
                    <h2 className="text-2xl font-extrabold text-[var(--text-primary)]">Email niet gevonden</h2>
                    <p className="text-[var(--text-muted)] mt-2">Uw email kon niet opgehaald worden bij het maken van uw account. Voer deze hieronder in.</p>
                </div>
                
                <form className="flex flex-col gap-4" onSubmit={onSubmit}>
                    <FormInput label="Email" type="email" name="email" autocomplete="email" required />
                    
                    <button 
                        type="submit" 
                        disabled={saving}
                        className="neu-btn-primary w-full py-3 font-bold flex items-center justify-center gap-2"
                    >
                        {saving ? (
                            <Loading />
                        ) : (
                            <>
                                <span className="material-symbols-outlined">check</span>
                                Opslaan
                            </>
                        )}
                    </button>
                    
                    {error && (
                        <p className="text-primary text-sm text-center flex items-center justify-center gap-1">
                            <span className="material-symbols-outlined text-base">error</span>
                            {error}
                        </p>
                    )}
                </form>
            </div>
        </div>
    );
}
