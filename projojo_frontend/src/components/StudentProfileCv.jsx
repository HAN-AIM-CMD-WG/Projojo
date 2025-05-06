import { FILE_BASE_URL } from "../services";
import PdfPreview from "./PdfPreview";

export default function StudentProfileCv({ cv }) {
    return (
        <div className="flex flex-col gap-4 w-full bg-gray-100 rounded-b-lg overflow-hidden">
            {cv === null
                ? <h2>Er is geen cv om weer te geven</h2>
                : (
                    <PdfPreview link={cv ? `${FILE_BASE_URL}${cv}` : "/loading.gif"} />
                )
            }
        </div>
    )
}