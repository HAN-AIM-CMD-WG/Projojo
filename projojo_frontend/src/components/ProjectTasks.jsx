import { useEffect, useRef, useState } from 'react';
import { useLocation } from "react-router-dom";
import { getSkills, getStudentRegistrations } from '../services';
import Alert from './Alert';
import { useAuth } from "../auth/AuthProvider";
import Task from "./Task";

/**
 *
 * @param {{ tasks: { name: string }[] }} param0
 * @returns
 */
export default function ProjectTasks({ tasks, fetchAmount, setFetchAmount, businessId, lastTaskRef }) {
    const isEmpty = !tasks;
    const taskRefs = useRef({});
    const location = useLocation();
    const [allSkills, setAllSkills] = useState([]);
    const [error, setError] = useState("");
    const { authData } = useAuth();
    const [currentRegistrations, setCurrentRegistrations] = useState([]);

    useEffect(() => {
        if (authData.type !== "student") {
            return;
        }
        let ignore = false;

        getStudentRegistrations()
            .then((data) => {
                if (ignore) return;
                setCurrentRegistrations(data);
            })
            .catch(error => {
                if (ignore) return;
                setError(error.message)
            });

    }, [fetchAmount, authData.type]);

    useEffect(() => {
        if (fetchAmount <= 0 && location.hash) {
            const id = location.hash.replace("#task-", "");
            const targetTask = taskRefs.current[id];
            if (targetTask) {
                const nestedTask = targetTask.querySelector(".target");
                if (nestedTask)
                    setTimeout(() => {
                        nestedTask.scrollIntoView({ behavior: "smooth", block: "center" });
                        nestedTask.classList.add("animate-highlight");
                        setTimeout(() => {
                            nestedTask.classList.remove("animate-highlight");
                        }, 1500);
                    }, 100);
            }
        }

        let ignore = false;

        getSkills()
            .then(data => {
                if (ignore) return;
                setAllSkills(data);
            })
            .catch(err => {
                if (ignore) return;
                setError(err.message);
            });

        return () => {
            ignore = true;
        }
    }, [fetchAmount, location.hash, tasks]);

    return (
        <div className="p-6 pt-0">
            {/* Section header */}
            <div className="flex items-center gap-3 mb-6">
                <div className="neu-icon-container text-primary">
                    <span className="material-symbols-outlined">list_alt</span>
                </div>
                <div>
                    <h2 className="text-xl font-extrabold text-[var(--text-primary)]">Beschikbare taken</h2>
                    <span className="text-sm text-[var(--text-muted)]">{tasks?.length || 0} {tasks?.length === 1 ? 'taak' : 'taken'}</span>
                </div>
            </div>

            <Alert text={error} />
            
            {isEmpty ? (
                <div className="neu-pressed p-8 rounded-2xl text-center">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">inbox</span>
                    <p className="text-[var(--text-muted)]">Er zijn nog geen taken voor dit project</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {tasks.map((task, index) => {
                        const isLast = index === tasks.length - 1;
                        return (
                            <div
                                ref={(el) => {
                                    taskRefs.current[task.id] = el;
                                    if (isLast && lastTaskRef) lastTaskRef.current = el;
                                }}
                                key={task.id}
                                id={`task-${task.id}`}
                                className="h-full"
                            >
                                <Task 
                                    task={task} 
                                    setFetchAmount={setFetchAmount} 
                                    businessId={businessId} 
                                    allSkills={allSkills} 
                                    studentAlreadyRegistered={currentRegistrations.includes(task.id)} 
                                />
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    )
}
