import StudentProfileCv from "./StudentProfileCv";
import StudentProfileHeader from "./StudentProfileHeader";
import StudentProfileSkills from "./StudentProfileSkills";

export default function StudentProfile({ student, setFetchAmount }) {
    return (
        <div className="bg-slate-100">
            <StudentProfileHeader student={student} />
            <div className="flex flex-col gap-4 p-4 lg:flex-row">
                <StudentProfileSkills student={student} setFetchAmount={setFetchAmount} />
                <StudentProfileCv cv={student?.cv_path} />
            </div>
        </div>
    )
}