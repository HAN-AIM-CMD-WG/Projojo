import { Link } from "react-router-dom";
import { PDF_BASE_URL } from "../services";
import { useAuth } from "../auth/AuthProvider";
import PdfPreview from "./PdfPreview";


export default function StudentProfileCv({ cv, studentId }) {
    const { authData } = useAuth();
    const isOwnProfile = authData.type === "student" && authData.userId === studentId;
    
    // If cv_path exists in the database, we trust the file exists
    // This avoids CORS issues with HEAD requests to static files
    const exists = !!cv;

    return (
        <div className="neu-flat p-6 rounded-2xl">
            {/* Section header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="font-extrabold text-gray-700 flex items-center gap-2 text-lg">
                    <span className="material-symbols-outlined text-primary">description</span>
                    Curriculum Vitae
                </h2>
                <div className="flex items-center gap-2">
                    {exists && (
                        <a 
                            href={`${PDF_BASE_URL}${cv}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="neu-btn flex items-center gap-2 text-sm"
                        >
                            <span className="material-symbols-outlined text-lg">open_in_new</span>
                            <span className="font-bold hidden sm:inline">Openen</span>
                        </a>
                    )}
                    {isOwnProfile && (
                        <Link 
                            to="/student/update"
                            className="neu-btn flex items-center gap-2 text-sm"
                            title={exists ? "CV wijzigen" : "CV uploaden"}
                        >
                            <span className="material-symbols-outlined text-lg">
                                {exists ? 'edit' : 'upload'}
                            </span>
                            <span className="font-bold hidden sm:inline">
                                {exists ? 'Wijzigen' : 'Uploaden'}
                            </span>
                        </Link>
                    )}
                </div>
            </div>

            {/* Empty state */}
            {!exists && (
                <div className="neu-pressed p-8 rounded-xl text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">upload_file</span>
                    <p className="text-sm text-gray-500 font-medium">
                        Er is nog geen CV geupload.
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Upload een CV om je profiel compleet te maken.
                    </p>
                    {isOwnProfile && (
                        <Link 
                            to="/student/update"
                            className="neu-btn-primary mt-4 inline-flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">upload</span>
                            CV uploaden
                        </Link>
                    )}
                </div>
            )}

            {/* PDF Preview */}
            {exists && (
                <div className="neu-pressed p-2 rounded-xl overflow-hidden">
                    <PdfPreview url={`${PDF_BASE_URL}${cv}`} />
                </div>
            )}
        </div>
    )
}
