import StudentProfileCv from "./StudentProfileCv";
import StudentProfileHeader from "./StudentProfileHeader";
import StudentProfileSkills from "./StudentProfileSkills";

export default function StudentProfile({ student, setFetchAmount }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* LEFT COLUMN: Skills + CV (8 cols on desktop) */}
            <div className="lg:col-span-8 space-y-6">
                <StudentProfileSkills student={student} setFetchAmount={setFetchAmount} />
                <StudentProfileCv cv={student?.cv_path} studentId={student?.id} />
            </div>

            {/* RIGHT COLUMN: Profile Stats Widget (4 cols on desktop) */}
            <div className="lg:col-span-4">
                <StudentProfileHeader student={student} />
            </div>
        </div>
    )
}