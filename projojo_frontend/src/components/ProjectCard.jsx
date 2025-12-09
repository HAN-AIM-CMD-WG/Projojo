import { Link, useNavigate } from "react-router-dom";
import { IMAGE_BASE_URL } from '../services';
import RichTextViewer from "./RichTextViewer";
import TaskCard from "./TaskCard";

// Status mapping voor badges
const statusConfig = {
  'active': { label: 'In Progress', className: 'neu-badge-success' },
  'in_progress': { label: 'In Progress', className: 'neu-badge-success' },
  'planning': { label: 'Planning', className: 'neu-badge-gray' },
  'pending': { label: 'Pending', className: 'neu-badge-warning' },
  'review': { label: 'Review', className: 'neu-badge-info' },
  'completed': { label: 'Completed', className: 'neu-badge-success-solid' },
  'default': { label: 'Active', className: 'neu-badge-success' }
};

export default function ProjectCard({ project, index = 0, isExpanded = false }) {
  const navigate = useNavigate();

  const handleTaskClick = (taskId) => (e) => {
    e.preventDefault();
    navigate(`/projects/${project.id}#task-${taskId}`);
  }

  // Get status config
  const status = project.status?.toLowerCase() || 'default';
  const { label: statusLabel, className: statusClassName } = statusConfig[status] || statusConfig.default;

  // Calculate progress (mock for now, can be derived from tasks)
  const completedTasks = project.tasks?.filter(t => t.status === 'completed').length || 0;
  const totalTasks = project.tasks?.length || 1;
  const progress = Math.round((completedTasks / totalTasks) * 100);

  // Animation delay based on index
  const animationClass = `fade-in-up-${(index % 4) + 1}`;

  return (
    <article className={`neu-project-card h-[400px] w-full relative group fade-in-up ${animationClass} ${!isExpanded && (index == 2 ? 'hidden [@media(min-width:1195px)]:block' : index == 1 && 'hidden [@media(min-width:813px)]:block')}`}>
      <Link
        to={`/projects/${project.id}`}
        className="block h-full focus:outline-none"
      >
        {/* Image section with gradient overlay */}
        <div className="h-44 w-full relative overflow-hidden">
          <img
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            src={`${IMAGE_BASE_URL}${project.image_path}`}
            alt={project.title || project.name}
          />
          {/* Gradient overlay */}
          <div className="neu-image-overlay" />
          
          {/* Title overlay at bottom of image */}
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <h4 className="font-bold text-lg leading-tight drop-shadow-sm line-clamp-2">
              {project.title || project.name}
            </h4>
            {project.role && (
              <p className="text-xs font-semibold opacity-90 mt-1">{project.role}</p>
            )}
          </div>

          {/* Status badge - top right */}
          <div className={`absolute top-3 right-3 ${statusClassName}`}>
            {statusLabel}
          </div>
        </div>
        
        {/* Content section */}
        <div className="p-5 flex flex-col flex-1">
          {/* Progress bar */}
          <div className="mb-5">
            <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="neu-progress">
              <div className="neu-progress-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>

          {/* Description */}
          <div className="line-clamp-2 text-sm text-text-muted mb-4 flex-1">
            <RichTextViewer text={project.description} flatten={true} />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button className="flex-1 neu-flat py-2.5 text-xs hover:text-primary transition-colors font-bold uppercase tracking-wide">
              Details
            </button>
            <button className="neu-icon-btn w-10 h-10">
              <span className="material-symbols-outlined text-lg">chat</span>
            </button>
          </div>
        </div>

        {/* Hover overlay with tasks */}
        <div className="hidden sm:group-hover:flex group-focus:flex absolute inset-0 z-10 bg-neu-bg/98 backdrop-blur-sm overflow-y-auto p-6 custom-scroll flex-col">
          <div className="space-y-3 flex-1">
            {/* Header card */}
            <div className="neu-flat p-4 mb-4 hover:ring-2 hover:ring-primary/30 transition-all duration-300">
              <h4 className="text-lg font-extrabold tracking-tight text-primary mb-1">
                {project.title || project.name}
              </h4>
              <span className="text-xs font-bold text-text-muted flex items-center gap-2 uppercase tracking-wide">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                Naar projectpagina
              </span>
            </div>

            {/* Tasks */}
            {project.tasks && project.tasks.length > 0 ? (
              project.tasks.slice(0, 3).map((task) => (
                <div key={task.id} onClick={handleTaskClick(task.id)}>
                  <TaskCard task={task} compact />
                </div>
              ))
            ) : (
              <div className="neu-task-box">
                <span className="material-symbols-outlined">assignment</span>
                <span className="truncate">Geen taken beschikbaar</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}
