import InfoBox from './InfoBox';
import SkillBadge from './SkillBadge';
import { useAuth } from '../auth/AuthProvider';
import { filterVisibleSkillsForUser } from '../utils/skills';

export default function TaskCard({ task }) {
    const { authData } = useAuth();
    const visibleSkills = filterVisibleSkillsForUser(authData, task.skills || []);
    return (
        <div className="max-w-sm bg-slate-100 border border-gray-200 rounded-lg shadow-lg hover:rounded-lg hover:ring-4 hover:ring-pink-300 transition-all duration-300 ease-in-out">
            <div className="flex flex-col gap-3 p-4">
                <h5 className="text-xl font-bold tracking-tight text-slate-800 group-hover:text-slate-700 transition-colors break-words">
                    Taak: {task.name}
                </h5>
                <InfoBox className="flex flex-col px-2 py-[0.25rem]">
                    <span className="text-md font-semibold text-slate-700"><strong className="text-primary">{task.total_needed - task.total_accepted}</strong> van de {task.total_needed} plekken beschikbaar</span>
                    {task.total_registered !== undefined && (
                        <>
                            <hr className="my-1 border border-gray-300" />
                            <span className="text-md font-semibold text-slate-700"><strong className="text-primary">{task.total_registered}</strong> openstaande aanmelding</span>
                        </>
                    )}
                </InfoBox>
                {visibleSkills.length > 0 && (
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-lg font-semibold text-slate-700">Skills:</span>
                        {visibleSkills.map((skill) => (
                            <SkillBadge
                                key={skill.skillId || skill.id}
                                skillName={skill.name}
                                isPending={skill.isPending || skill.is_pending}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
