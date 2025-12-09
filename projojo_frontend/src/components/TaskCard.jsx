import SkillBadge from './SkillBadge';

// Status labels in Dutch
const statusLabels = {
    'completed': 'Voltooid',
    'in_progress': 'Bezig',
    'open': 'Open',
    'pending': 'In afwachting'
};

export default function TaskCard({ task, compact = false }) {
    // Compact version for inline display
    if (compact) {
        const spotsAvailable = (task.total_needed || 0) - (task.total_accepted || 0);
        const statusKey = task.status || 'open';
        
        return (
            <div className="neu-task-box cursor-pointer hover:bg-white/60 transition-all">
                <span className="material-symbols-outlined text-primary">assignment</span>
                <div className="flex-1 min-w-0">
                    <span className="block truncate font-bold text-gray-600">{task.name}</span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                        {spotsAvailable > 0 ? `${spotsAvailable} plekken beschikbaar` : 'Geen plekken'}
                    </span>
                </div>
                {task.status && (
                    <span className={`shrink-0 ${
                        statusKey === 'completed' ? 'neu-badge-success' : 
                        statusKey === 'in_progress' ? 'neu-badge-info' : 
                        'neu-badge-gray'
                    }`}>
                        {statusLabels[statusKey] || 'Open'}
                    </span>
                )}
            </div>
        );
    }

    // Full version
    const spotsAvailable = (task.total_needed || 0) - (task.total_accepted || 0);
    const spotsTotal = task.total_needed || 0;
    const progress = spotsTotal > 0 
        ? Math.round(((task.total_accepted || 0) / spotsTotal) * 100) 
        : 0;
    const statusKey = task.status || 'open';

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
                            statusKey === 'completed' ? 'neu-badge-success-solid' : 
                            statusKey === 'in_progress' ? 'neu-badge-info' : 
                            'neu-badge-gray'
                        }`}>
                            {statusLabels[statusKey] || 'Open'}
                        </span>
                    )}
                </div>

                {/* Availability progress */}
                {spotsTotal > 0 && (
                    <div>
                        <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                            <span>Bezetting</span>
                            <span className="text-primary">{task.total_accepted || 0} van {spotsTotal} plekken</span>
                        </div>
                        <div className="neu-progress">
                            <div className="neu-progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                        {spotsAvailable > 0 && (
                            <p className="text-[10px] text-green-600 font-semibold mt-1.5">
                                {spotsAvailable} {spotsAvailable === 1 ? 'plek' : 'plekken'} beschikbaar
                            </p>
                        )}
                    </div>
                )}

                {/* Registration info */}
                {task.total_registered !== undefined && task.total_registered > 0 && (
                    <div className="neu-task-box !bg-amber-50 !border-amber-200">
                        <span className="material-symbols-outlined text-amber-600">schedule</span>
                        <span className="text-amber-700">
                            <strong>{task.total_registered}</strong> {task.total_registered === 1 ? 'aanmelding' : 'aanmeldingen'} in behandeling
                        </span>
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
