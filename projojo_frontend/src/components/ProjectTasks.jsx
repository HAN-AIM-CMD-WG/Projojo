import { useEffect, useRef, useState } from 'react';
import { useLocation } from "react-router-dom";
import { getSkills, /*getUserRegistrations*/ } from '../services';
import Alert from './Alert';
import { useAuth } from "./AuthProvider";
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

        // getUserRegistrations()
        //     .then((data) => {
        //         if (ignore) return;
        //         setCurrentRegistrations(data);
        //     })
        //     .catch(error => {
        //         if (ignore) return;
        //         setError(error.message)
        //     });

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
        <div className="flex flex-col gap-4 w-full p-4 rounded-b-lg">
            <Alert text={error} />
            {isEmpty
                ? <h2>Er zijn geen taken om weer te geven</h2>
                : tasks.map((task, index) => {
                    const isLast = index === tasks.length - 1;
                    // Ensure task has the expected format for the components
                    const formattedTask = {
                        ...task,
                        taskId: task.name,
                        title: task.name,
                        totalNeeded: task.total_needed,
                        totalAccepted: 0, // Default value since it's not in the new API
                        totalRegistered: 0, // Default value since it's not in the new API
                        
                    };
                    return (
                        <div
                            ref={(el) => {
                                taskRefs.current[formattedTask.taskId] = el;
                                if (isLast && lastTaskRef) lastTaskRef.current = el;
                            }}
                            key={formattedTask.taskId}
                            id={`task-${formattedTask.taskId}`}>
                            <Task task={formattedTask} setFetchAmount={setFetchAmount} businessId={businessId} allSkills={allSkills} isNotAllowedToRegister={currentRegistrations.includes(formattedTask.taskId)} />
                        </div >
                    )
                })}
        </div >
    )
}
