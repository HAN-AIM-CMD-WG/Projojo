import InfoBox from './InfoBox';
import SkillBadge from './SkillBadge';

export default function TaskCard({ task }) {
    return (
        <div className="max-w-sm bg-slate-100 border border-gray-200 rounded-lg shadow-lg hover:rounded-lg hover:ring-4 hover:ring-pink-300 transition-all duration-300 ease-in-out">
            <div className="flex flex-col gap-3 p-4">
                <h5 className="text-xl font-bold tracking-tight text-slate-800 group-hover:text-slate-700 transition-colors">
                    Taak: {task.title}
                </h5>
                <InfoBox className="flex flex-col px-2 py-[0.25rem]">
                    <span className="text-md font-semibold text-slate-700"><strong className="text-primary">{task.totalNeeded - task.totalAccepted}</strong> van de {task.totalNeeded} plekken beschikbaar</span>
                    <hr className="my-1 border border-gray-300" />
                    <span className="text-md font-semibold text-slate-700"><strong className="text-primary">{task.totalRegistered}</strong> openstaande aanmelding</span>
                </InfoBox>
                <div className="flex flex-wrap items-center gap-3">
                    <span className="text-lg font-semibold text-slate-700">Skills:</span>
                    {task.skills.length === 0 && (
                        <span className="text-slate-600">Geen specifieke skills</span>
                    )}
                    {task.skills.map((skill) => (
                        <SkillBadge
                            key={skill.skillId}
                            skillName={skill.name}
                            isPending={skill.isPending}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}