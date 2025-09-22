import { useEffect, useState } from 'react';

export default function FormInput({
    label,
    placeholder,
    name = undefined,
    type = 'text',
    min = undefined,
    max = Infinity,
    step = 1,
    rows = 5,
    error: externalError = undefined,
    required = false,
    setError = () => { },
    initialValue = '',
    onChange = () => { },
    readonly = false,
    autocomplete = '',
}) {
    min ??= type === 'number' ? -Infinity : 0;
    name ??= label?.toLowerCase() ?? "";
    const id = name + (label ?? "").replace(" ", "-").toLowerCase();
    const [value, setValue] = useState(initialValue ?? '');
    const [internalError, setInternalError] = useState(externalError);

    useEffect(() => {
        setValue(initialValue ?? '');
    }, [initialValue]);

    useEffect(() => {
        setInternalError(externalError);
    }, [externalError]);

    function canValidate(value) {
        if (readonly) {
            return;
        }

        setValue(value);
        onChange(value);

        let error = null;

        if (type === 'number') {
            const num = Number(value);
            if (isNaN(num)) {
                error = `Waarde van ${label} is niet een nummer`;
            } else if (num > max) {
                error = `Waarde van ${label} mag niet groter zijn dan ${max}`;
            } else if (num < min) {
                error = `Waarde van ${label} mag niet kleiner zijn dan ${min}`;
            } else if (num % step !== 0) {
                error = `Waarde van ${label} moet deelbaar zijn door ${step}`;
            }
        } else if (type === 'text' || type === 'textarea') {
            if (required && value.length === 0) {
                error = `Waarde van ${label} is verplicht`;
            } else if (value.length > max) {
                error = `Waarde van ${label} mag niet langer zijn dan ${max} karakters`;
            } else if (value.length < min) {
                error = `Waarde van ${label} mag niet korter zijn dan ${min} karakters`;
            }
        } else if (type === 'email') {
            if (required && value.length === 0) {
                error = `Waarde van ${label} is verplicht`;
            } else if (!value.match(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/g)) {
                error = `Waarde van ${label} moet een e-mailadres zijn`;
            }
        } else if (type === "checkbox") {
            if (value !== true && value !== false) {
                error = `Waarde van ${label} moet een checkbox zijn.`;
            }
        }


        if (error) {
            setInternalError(error);
            setError(error);
            return false;
        }

        setInternalError(null);
        setError(null);
        return true;
    }

    function validate(event) {
        const value = type !== "checkbox" ? event.target.value : event.target.checked;
        if (!readonly && canValidate(value)) {
            setValue(value);
            onChange(value);
        }
    }

    const inputClass = type !== "checkbox" && type !== "radio" ? `block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 placeholder:text-gray-400 sm:text-sm sm:leading-6 p-3${readonly ? " bg-gray-100 ring-0 focus:outline-none" : ""}` :
        "w-4 h-4 border-gray-300 rounded focus:ring-blue-500 focus:ring-2";

    const labelComponent = <label className={`text-sm font-medium leading-6 text-gray-900 ${type !== "radio" ? "block" : ""}`} htmlFor={id}>
        {label} {required && <span className="text-primary">*</span>}
    </label>;

    return (
        <div className={type === "radio" || type === "checkbox" ? "flex flex-row items-center gap-1" : ""}>
            {type !== "radio" && type !== "checkbox" ? labelComponent : <></>}
            {type === 'textarea' ? (
                <textarea
                    autoComplete={autocomplete}
                    className={inputClass}
                    placeholder={placeholder}
                    onInput={validate}
                    value={value}
                    id={id}
                    name={name}
                    required={required}
                    rows={rows}
                    readOnly={readonly}
                />
            ) : (
                <input
                    autoComplete={autocomplete}
                    className={inputClass}
                    placeholder={placeholder}
                    type={type}
                    minLength={min}
                    maxLength={max}
                    onInput={validate}
                    value={value}
                    id={id}
                    name={name}
                    required={required}
                    readOnly={readonly}
                />
            )}
            {type === "radio" || type === "checkbox" ? labelComponent : <></>}
            {internalError && <span className="block text-primary">{internalError}</span>}
        </div>
    );
}