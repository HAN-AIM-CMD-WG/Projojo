import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import ProjectDetails from "../components/ProjectDetails";
import ProjectTasks from "../components/ProjectTasks";
import { getProject, getProjectsWithBusinessId, getTasks, getTaskSkills } from "../services";
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
                const allSkills = data.tasks?.flatMap(task => task.skills) || [];

                const skillCounts = allSkills.reduce((acc, skill) => {
                    if (!acc[skill.name]) {
                        acc[skill.name] = { count: 0, is_pending: skill.is_pending };
                    }
                    acc[skill.name].count++;
                    return acc;
                }, {});

                const topSkills = Object.entries(skillCounts)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 5)
                    .map(([name, { is_pending }]) => ({ name, is_pending }));

                setProject({ ...data, topSkills });
                setTasks(data.tasks);
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
