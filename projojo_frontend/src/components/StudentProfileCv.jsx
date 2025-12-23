import { PDF_BASE_URL } from "../services";
import { useEffect, useState } from "react";
import PdfPreview from "./PdfPreview";


export default function StudentProfileCv({ cv }) {

    const [exists, setExists] = useState(null);

    // Check if the CV exists by making a HEAD request to the URL
    useEffect(() => {
        if (!cv) {
            setExists(false);
            return;
        }

        const url = `${PDF_BASE_URL}${cv}`;

        fetch(url, { method: "HEAD" })
            .then(res => setExists(res.ok))
            .catch(() => setExists(false));
    }, [cv]);

    return (
        <div className="flex flex-col gap-4 w-full bg-gray-100 rounded-b-lg overflow-hidden">
            <div className="bg-gray-200 p-3 rounded-lg">
                <h2 className="text-lg ms-1 mb-2 font-semibold">CV</h2>
                {(exists === null || exists === undefined) && (
                    <img src="/loading.gif" alt="Laden..." className="h-6 w-6" />
                )}
                {exists === false && <h2>Er is geen cv om weer te geven</h2>}
                {exists === true && <PdfPreview url={`${PDF_BASE_URL}${cv}`} />}
            </div>
        </div>
    )
}