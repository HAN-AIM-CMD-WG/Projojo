import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import Breadcrumb from "../components/Breadcrumb";
import ProjectDetails from "../components/ProjectDetails";
import ProjectTasks from "../components/ProjectTasks";
import { getProject } from "../services";
import { normalizeSkill } from "../utils/skills";
import NotFoundPage from "./NotFound";


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
                    const key = skill.skillId;
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

    // Detect archived: explicitly archived, completed status, or end_date in the past
    const isArchived = project?.is_archived || project?.status === 'completed' || (project?.end_date && new Date(project.end_date) < new Date());

    const breadcrumbItems = [
        { label: "Ontdek", to: "/ontdek" },
        ...(project?.business ? [{ label: project.business.name, to: `/business/${project.business.id}` }] : []),
        { label: project?.name || "Laden..." },
    ];

    return (
        <>
            <Breadcrumb items={breadcrumbItems} />

            {/* Archive banner */}
            {isArchived && (
                <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-xl bg-[var(--neu-bg)] border border-[var(--neu-border)] text-[var(--text-muted)]">
                    <span className="material-symbols-outlined text-lg">inventory_2</span>
                    <span className="text-sm font-semibold">Dit project is afgerond en staat in het archief.</span>
                </div>
            )}

            <div className={`neu-flat overflow-hidden ${isArchived ? 'grayscale opacity-80' : ''}`}>
                <ProjectDetails 
                    project={project} 
                    tasks={tasks}
                    businessId={project?.business_id} 
                    refreshData={() => {
                        fetchProjectAndTasks();
                        scrollToLastTask();
                    }} 
                />
                <ProjectTasks tasks={tasks} fetchAmount={fetchAmount} setFetchAmount={setFetchAmount} businessId={project?.business_id} lastTaskRef={lastTaskRef} />
            </div>
        </>
    )
}
