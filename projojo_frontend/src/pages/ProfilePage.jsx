import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import StudentProfile from "../components/StudentProfile";
import { getSkillsFromStudent } from "../services";
import NotFound from "./NotFound";
import { useAuth } from "../auth/AuthProvider";


export default function ProfilePage() {
    const { authData } = useAuth();
    const [student, setStudent] = useState({ skills: [] });
    const [error, setError] = useState({ statusCode: null, message: null });
    const { profileId } = useParams();
    const [fetchAmount, setFetchAmount] = useState(0);

    const isOwnProfile = authData.type === "student" && authData.userId === profileId;

    useEffect(() => {
        let ignore = false;

        getSkillsFromStudent(profileId)
            .then(data => {
                if (ignore) return;
                const studentWithCV = {
                    ...data,
                };
                setStudent(studentWithCV);
            })
            .catch(error => {
                if (ignore) return;
                setError(error);
            });

        return () => {
            ignore = true;
        }
    }, [profileId, fetchAmount]);

    if (error?.statusCode == 404) {
        return <NotFound />;
    } else if (error?.statusCode == 403) {
        return (
            <div className="neu-flat p-8 rounded-2xl flex flex-col items-center gap-4 max-w-md mx-auto mt-10">
                <div className="neu-pressed rounded-full p-4">
                    <span className="material-symbols-outlined text-3xl text-gray-400">lock</span>
                </div>
                <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">Geen toegang</h1>
                <p className="text-sm text-[var(--text-muted)] text-center">Je hebt geen toegang tot dit profiel.</p>
                <Link to="/home" className="neu-btn-primary">Ga naar Home</Link>
            </div>
        )
    }

    // Get first name for personalized greeting
    const firstName = student.full_name?.split(' ')[0] || '';

    return (
        <>
            {/* Page header */}
            <div className="pt-4 mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                    {isOwnProfile ? 'Mijn profiel' : firstName ? `Profiel van ${firstName}` : 'Profiel'}
                </h1>
                <p className="text-base text-[var(--text-muted)] font-medium mt-2">
                    {isOwnProfile 
                        ? 'Beheer je skills en CV om betere matches te krijgen'
                        : student.full_name ? `Bekijk de skills en ervaring van ${student.full_name}` : 'Bekijk dit profiel'
                    }
                </p>
            </div>

            <StudentProfile student={student} setFetchAmount={setFetchAmount} />
        </>
    )
}
