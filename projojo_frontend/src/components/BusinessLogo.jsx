import { useEffect, useState } from "react";
import { getBusinessLogoUrl } from "../services";

const SIZE_CLASSES = {
    sm: "w-10 h-10 text-lg",
    md: "w-14 h-14 text-xl",
    lg: "w-20 h-20 text-3xl",
};

function initialsFor(name) {
    if (!name) return "B";
    return name
        .split(" ")
        .map((word) => word[0])
        .filter(Boolean)
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

function Placeholder({ name, size }) {
    return (
        <div className={`${SIZE_CLASSES[size] || SIZE_CLASSES.md} rounded-[10px] bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center`}>
            <span className="font-bold text-primary">{initialsFor(name)}</span>
        </div>
    );
}

/**
 * Business logo with automatic favicon fallback.
 * - When `image` is a real uploaded file → served from the backend.
 * - Otherwise, when `website` is set → Google favicon for that domain.
 * - On load failure (e.g. favicon 404) → initials placeholder.
 */
export default function BusinessLogo({
    image,
    website,
    name,
    size = "md",
    className = "",
}) {
    const initialUrl = getBusinessLogoUrl(image, website, { size: 128 });
    const [src, setSrc] = useState(initialUrl);
    const [errored, setErrored] = useState(false);

    useEffect(() => {
        setSrc(getBusinessLogoUrl(image, website, { size: 128 }));
        setErrored(false);
    }, [image, website]);

    if (errored || !src) {
        return <Placeholder name={name} size={size} />;
    }

    return (
        <img
            className={`w-full h-full object-cover rounded-[10px] ${className}`}
            src={src}
            alt={`Logo van ${name}`}
            onError={() => setErrored(true)}
        />
    );
}
