import InfoBox from './InfoBox';
import SkillBadge from './SkillBadge';

export default function TaskCard({ task, compact = false }) {
    // Compact version for use in hover overlays
    if (compact) {
        const spotsAvailable = (task.total_needed || 0) - (task.total_accepted || 0);
        
        return (
            <div className="neu-task-box cursor-pointer hover:bg-white/60 transition-all">
                <span className="material-symbols-outlined text-primary">assignment</span>
                <div className="flex-1 min-w-0">
                    <span className="block truncate font-bold text-gray-600">{task.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                        {spotsAvailable > 0 ? `${spotsAvailable} plekken` : 'Vol'}
                    </span>
                </div>
                {task.status && (
                    <span className={`shrink-0 ${
                        task.status === 'completed' ? 'neu-badge-success' : 
                        task.status === 'in_progress' ? 'neu-badge-info' : 
                        'neu-badge-gray'
                    }`}>
                        {task.status === 'completed' ? 'Klaar' : 
                         task.status === 'in_progress' ? 'Bezig' : 'Open'}
                    </span>
                )}
            </div>
        );
    }

    // Full version
    const spotsAvailable = (task.total_needed || 0) - (task.total_accepted || 0);
    const progress = task.total_needed > 0 
        ? Math.round(((task.total_accepted || 0) / task.total_needed) * 100) 
        : 0;

    return (
        <div className="neu-flat p-5 hover:ring-2 hover:ring-primary/30 transition-all duration-300 cursor-pointer">
            <div className="flex flex-col gap-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="neu-icon-container-sm text-primary">
                            <span className="material-symbols-outlined">assignment</span>
                        </div>
                        <div>
                            <h5 className="text-lg font-extrabold tracking-tight text-gray-700">
                                {task.name}
                            </h5>
                            <span className="neu-label">Taak</span>
                        </div>
                    </div>
                    {task.status && (
                        <span className={`shrink-0 ${
                            task.status === 'completed' ? 'neu-badge-success-solid' : 
                            task.status === 'in_progress' ? 'neu-badge-info' : 
                            'neu-badge-gray'
                        }`}>
                            {task.status === 'completed' ? 'Voltooid' : 
                             task.status === 'in_progress' ? 'In Progress' : 'Open'}
                        </span>
                    )}
                </div>

                {/* Progress */}
                <div>
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                        <span>Beschikbaarheid</span>
                        <span className="text-primary">{spotsAvailable} van {task.total_needed}</span>
                    </div>
                    <div className="neu-progress">
                        <div className="neu-progress-bar" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Registration info */}
                {task.total_registered !== undefined && task.total_registered > 0 && (
                    <div className="neu-task-box !bg-primary/5 !border-primary/20">
                        <span className="material-symbols-outlined text-primary">pending</span>
                        <span><strong className="text-primary">{task.total_registered}</strong> openstaande aanmeldingen</span>
                    </div>
                )}

                {/* Skills */}
                {task.skills && task.skills.length > 0 && (
                    <div className="space-y-2">
                        <span className="neu-label">Benodigde skills</span>
                        <div className="flex flex-wrap items-center gap-2">
                            {task.skills.map((skill) => (
                                <SkillBadge
                                    key={skill.skillId || skill.id}
                                    skillName={skill.name}
                                    isPending={skill.isPending || skill.is_pending}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
