import { Link } from "react-router-dom";
import { IMAGE_BASE_URL } from '../services';
import { useStudentSkills } from '../context/StudentSkillsContext';
import RichTextViewer from "./RichTextViewer";
import { getCountdownText, formatDateShort } from "../utils/dates";

// Status mapping - Clean, small badges
// Green = available (universal), others only for special cases
const statusConfig = {
  'active': { 
    label: 'Open', 
    className: 'bg-emerald-500 text-white shadow-sm'
  },
  'in_progress': { 
    label: 'Loopt', 
    className: 'bg-emerald-500 text-white shadow-sm'
  },
  'planning': { 
    label: 'Binnenkort', 
    className: 'bg-gray-500 text-white shadow-sm'
  },
  'pending': { 
    label: 'In behandeling', 
    className: 'bg-amber-500 text-white shadow-sm'
  },
  'review': { 
    label: 'In review', 
    className: 'bg-blue-500 text-white shadow-sm'
  },
  'completed': { 
    label: 'Afgerond', 
    className: 'bg-gray-400 text-white shadow-sm'
  },
  'default': { 
    label: 'Open', 
    className: 'bg-emerald-500 text-white shadow-sm'
  }
};

/**
 * ProjectCard Component
 * 
 * Design Principles Applied:
 * - Progressive Disclosure: Card shows summary, detail page shows full info
 * - Recognition over Recall: Consistent layout, no hidden content
 * - Aesthetic & Minimalist: Only essential info visible
 * - Entire card clickable: Primary action = navigate to detail
 * - Subtle hover feedback: Elevation change, no content replacement
 */
export default function ProjectCard({ project, index = 0 }) {
  const { studentSkills } = useStudentSkills();
  
  // Get status config (Student-friendly Dutch labels)
  const status = project.status?.toLowerCase() || 'default';
  const { label: statusLabel, className: statusClassName } = statusConfig[status] || statusConfig.default;

  // Calculate OPEN POSITIONS (marketplace model)
  // Sum up available spots across all tasks
  const openPositions = project.tasks?.reduce((sum, task) => {
    const available = (task.total_needed || 0) - (task.total_accepted || 0);
    return sum + Math.max(0, available);
  }, 0) || 0;

  const totalPositions = project.tasks?.reduce((sum, task) => {
    return sum + (task.total_needed || 0);
  }, 0) || 0;

  // Collect all unique skills required by this project's tasks
  const projectSkills = [];
  const seenSkillIds = new Set();
  project.tasks?.forEach(task => {
    task.skills?.forEach(skill => {
      const skillId = skill.skillId || skill.id;
      if (skillId && !seenSkillIds.has(skillId)) {
        seenSkillIds.add(skillId);
        projectSkills.push({
          id: skillId,
          name: skill.name,
          isPending: skill.isPending || skill.is_pending || false
        });
      }
    });
  });

  // Calculate skill match with student
  const studentSkillIds = new Set(studentSkills.map(s => s.skillId).filter(Boolean));
  const matchingSkills = projectSkills.filter(s => studentSkillIds.has(s.skillId || s.id));
  const missingSkills = projectSkills.filter(s => !studentSkillIds.has(s.skillId || s.id));
  
  // Count positions that match student skills
  const matchingPositions = project.tasks?.reduce((sum, task) => {
    const taskSkillIds = new Set(task.skills?.map(s => s.skillId || s.id) || []);
    const hasMatchingSkill = [...taskSkillIds].some(id => studentSkillIds.has(id));
    if (hasMatchingSkill) {
      const available = (task.total_needed || 0) - (task.total_accepted || 0);
      return sum + Math.max(0, available);
    }
    return sum;
  }, 0) || 0;

  // Animation delay based on index for staggered entrance
  const animationClass = `fade-in-up-${(index % 4) + 1}`;

  return (
    <article className={`fade-in-up ${animationClass} h-full`}>
      <Link
        to={`/projects/${project.id}`}
        className="block neu-flat-interactive h-full overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/30 group"
      >
        {/* Image section with gradient overlay */}
        <div className="h-40 w-full relative overflow-hidden">
          <img
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            src={`${IMAGE_BASE_URL}${project.image_path}`}
            alt={project.title || project.name}
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Status badge - only show if NOT open (avoid redundant "OPEN" on every card) */}
          {status !== 'active' && status !== 'default' && project.status && (
          <div className={`absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${statusClassName}`}>
            {statusLabel}
          </div>
          )}

          {/* Title overlay at bottom of image */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h4 className="font-extrabold text-white text-lg leading-tight drop-shadow-md line-clamp-2">
              {project.title || project.name}
            </h4>
          </div>
        </div>
        
        {/* Content section */}
        <div className="p-5">
          {/* Open positions - Marketplace model */}
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className={`material-symbols-outlined text-lg w-[18px] text-center ${openPositions > 0 ? 'text-primary' : 'text-[var(--text-muted)]'}`}>
                {openPositions > 0 ? 'work' : 'block'}
              </span>
              <span className="text-sm font-bold text-[var(--text-primary)]">
                {openPositions > 0 ? (
                  <>{openPositions} {openPositions === 1 ? 'plek' : 'plekken'} beschikbaar</>
                ) : (
                  'Geen plekken beschikbaar'
                )}
              </span>
              {/* Match badge - alleen tonen als student skills heeft en er matches zijn */}
            {studentSkills.length > 0 && matchingPositions > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#156064] dark:bg-[#00C49A] text-white dark:text-[#1A1512]">
                  Match!
                </span>
              )}
              </div>
          </div>

          {/* Deadline countdown - only show if we have valid date text */}
          {project.end_date && getCountdownText(project.end_date) && (
            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)] mb-4">
              <span className="material-symbols-outlined text-sm">schedule</span>
              <span>{getCountdownText(project.end_date)} • deadline {formatDateShort(project.end_date)}</span>
            </div>
          )}

          {/* Skills match indicator - Outline style for visual harmony */}
          {projectSkills.length > 0 && (
            <div className="mb-4">
              <span className="neu-label mb-2 block">Gevraagde skills</span>
              <div className="flex flex-wrap gap-1.5">
                {matchingSkills.slice(0, 3).map(skill => (
                  <span 
                    key={skill.skillId || skill.id} 
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-[#156064] dark:text-[#00C49A] border border-[#156064] dark:border-[#00C49A] bg-[var(--neu-bg)]/50"
                    title={`Je hebt deze skill: ${skill.name}`}
                  >
                    <span className="material-symbols-outlined text-[12px]">check</span>
                    {skill.name}
                  </span>
                ))}
                {missingSkills.slice(0, 2).map(skill => (
                  <span 
                    key={skill.skillId || skill.id} 
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-[var(--text-muted)] border border-[var(--gray-300)] bg-[var(--neu-bg)]/50"
                    title={`Gevraagde skill: ${skill.name}`}
                  >
                    {skill.name}
                  </span>
                ))}
                {(matchingSkills.length + missingSkills.length > 5) && (
                  <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-[10px] font-semibold text-[var(--text-muted)] border border-[var(--gray-300)] bg-[var(--neu-bg)]/50">
                    +{projectSkills.length - 5}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Description - brief */}
          <div className="line-clamp-2 text-sm text-text-muted mb-4">
            <RichTextViewer text={project.description} flatten={true} />
          </div>

          {/* Call-to-action hint - subtle */}
          <div className="mt-4 flex items-center justify-between">
            <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wide group-hover:text-primary transition-colors">
              Bekijk project
            </span>
            <span className="material-symbols-outlined text-[var(--text-muted)] group-hover:text-primary group-hover:translate-x-1 transition-all">
              arrow_forward
            </span>
          </div>
        </div>
      </Link>
    </article>
  );
}
