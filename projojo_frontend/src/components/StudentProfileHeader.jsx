import { Link } from "react-router-dom";
import { IMAGE_BASE_URL } from "../services";
import { useAuth } from "../auth/AuthProvider";
import RichTextViewer from "./RichTextViewer";

export default function StudentProfileHeader({ student }) {
    const { authData } = useAuth();

    return (
        <div className="flex flex-col items-center bg-slate-200 border border-gray-200 rounded-lg shadow md:flex-row w-full  ">
            <img className="w-full h-full rounded-t-lg md:h-48 md:w-48 md:rounded-none md:rounded-s-lg object-cover" src={student?.image_path ? `${IMAGE_BASE_URL}${student?.image_path}` : "/loading.gif"} alt="Bedrijfslogo" />
            <div className="flex flex-col justify-between p-4 leading-normal">
                <h2 className="mb-1 text-4xl font-bold tracking-tight text-gray-900">{student.full_name}</h2>
                <h2 className="mb-1 text-md tracking-tight text-gray-900"><RichTextViewer text={student.description} flatten={true} /></h2>
            </div>
            {
                authData.type == "student" && authData.userId == student.id &&
                <div className="md:ml-auto p-4 flex gap-3 flex-col">
                    <Link to="/profile/update" className="btn-primary">Profiel aanpassen</Link>
                </div>
            }
        </div>
    )
}
