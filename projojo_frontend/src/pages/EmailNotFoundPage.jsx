import { useState } from "react";
import FormInput from "../components/FormInput";
import Loading from "../components/Loading";
import { setEmail } from "../services";
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

    return <form className="flex items-center flex-col" onSubmit={onSubmit}>
        <h2 className="mb-4 text-2xl tracking-tight font-extrabold text-primary-600">Uw email kon niet opgehaald worden bij het maken van uw account</h2>
        <h3 className="mb-4 text-1xl tracking-tight font-bold text-primary-600">Wilt u hier alsnog uw email invoeren</h3>
        <div className="flex flex-col gap-3 w-64">
            <FormInput label="Email" type="email" autocomplete="email" required />
            {saving ? <button className="btn-primary" type="button" disabled><Loading /></button> : <input type="submit" className="btn-primary" />}
            {error && <span className="text-primary">{error}</span>}
        </div>
    </form>

}