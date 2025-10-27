import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ProjectDetails from "../components/ProjectDetails";
import ProjectTasks from "../components/ProjectTasks";
import { getProject, getProjectsWithBusinessId, getTasks, getTaskSkills } from "../services";
import { normalizeSkill } from "../utils/skills";
import NotFoundPage from "./NotFound";
import PageHeader from '../components/PageHeader';


export default function ProjectDetailsPage() {
    const { projectId } = useParams()
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState(null);
    const [fetchAmount, setFetchAmount] = useState(0);
    const [showNotFound, setShowNotFound] = useState(false);
    const lastTaskRef = useRef(null);

    const fetchProjectAndTasks = () => {
        getProject(projectId)
            .then(data => {
                // Normalize skills from tasks
                const allSkills = (data.tasks || []).flatMap(task => (task.skills || []).map(s => normalizeSkill(s)).filter(Boolean));

                // Aggregate by stable key (skillId fallback to name)
                const skillCounts = allSkills.reduce((acc, skill) => {
                    const key = skill.skillId ?? skill.name;
                    if (!acc[key]) {
                        acc[key] = { count: 0, isPending: skill.isPending, name: skill.name, skillId: key };
                    }
                    acc[key].count++;
                    return acc;
                }, {});

                const topSkills = Object.entries(skillCounts)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 5)
                    .map(([, { name, isPending, skillId }]) => ({ skillId, name, isPending }));

                // Normalize each task's skills as well
                const normalizedTasks = (data.tasks || []).map(task => ({
                    ...task,
                    skills: (task.skills || []).map(normalizeSkill).filter(Boolean)
                }));

                setProject({ ...data, topSkills });
                setTasks(normalizedTasks);
            })
            .catch(() => setShowNotFound(true));
    };

    useEffect(() => {
        fetchProjectAndTasks();
    }, [projectId, fetchAmount]);

    const scrollToLastTask = () => {
        if (!lastTaskRef.current) return;
        lastTaskRef.current?.scrollIntoView({ behavior: "smooth" });
        setTimeout(() => {
            lastTaskRef.current.classList.add("animate-highlight");
            setTimeout(() => {
                lastTaskRef.current.classList.remove("animate-highlight");
            }, 1500);
        }, 300);
    };

    if (!projectId || showNotFound) return <NotFoundPage />

    return (
        <>
            <PageHeader name={'Projectpagina'} />
            <div className="bg-gray-100 rounded-lg">
                <ProjectDetails project={project} businessId={project?.business_id} refreshData={() => {
                    fetchProjectAndTasks();
                    scrollToLastTask();
                }} />
                <ProjectTasks tasks={tasks} fetchAmount={fetchAmount} setFetchAmount={setFetchAmount} businessId={project?.business_id} lastTaskRef={lastTaskRef} />
            </div>
        </>
    )
}
