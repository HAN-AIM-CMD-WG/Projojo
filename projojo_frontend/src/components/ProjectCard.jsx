import { Link, useNavigate } from "react-router-dom";
import { IMAGE_BASE_URL } from '../services';
import RichTextViewer from "./RichTextViewer";
import TaskCard from "./TaskCard";

export default function ProjectCard({ project, index = 0, isExpanded = false }) {
  const navigate = useNavigate();

  const handleTaskClick = (taskId) => (e) => {
    e.preventDefault();
    navigate(`/projects/${project.id}#task-${taskId}`);
  }

  return (
    <div className={`h-[350px] w-full neu-flat overflow-hidden relative ${!isExpanded && (index == 2 ? 'hidden [@media(min-width:1195px)]:block' : index == 1 && 'hidden [@media(min-width:813px)]:block')}`}>
      <Link
        to={`/projects/${project.id}`}
        className="block h-full focus:outline-none group"
      >
        <div className="h-full bg-neu-bg">
          <img
            className="rounded-t-2xl w-full h-[65%] object-cover transition-all duration-300 group-hover:opacity-90"
            src={`${IMAGE_BASE_URL}${project.image_path}`}
            alt="Projectafbeelding"
          />
          <div className="h-fit bottom-0 left-0 right-0 p-6 pt-4">
            <h4 className="line-clamp-1 mb-2 break-all text-xl font-bold text-text-primary">
              {project.title || project.name}
            </h4>
            <div className="line-clamp-2 text-sm text-text-muted transition-colors duration-200">
              <RichTextViewer text={project.description} flatten={true} />
            </div>
          </div>
        </div>

        {/* Hover overlay */}
        <div className="hidden sm:group-hover:block group-focus:block absolute inset-0 z-10 bg-neu-bg/95 backdrop-blur-sm overflow-y-auto p-6 custom-scroll">
          <div className="space-y-3">
            <div className="neu-flat p-4 mb-6 hover:ring-2 hover:ring-primary/30 transition-all duration-300">
              <h4 className="text-xl font-bold tracking-tight text-primary mb-1">
                {project.title || project.name}
              </h4>
              <span className="text-sm font-semibold text-text-muted flex items-center gap-2">
                <span className="material-symbols-outlined text-base">arrow_forward</span>
                Naar de projectpagina
              </span>
            </div>

            {project.tasks && project.tasks.map((task) => (
              <div key={task.id} onClick={handleTaskClick(task.id)}>
                <TaskCard task={task} />
              </div>
            ))}
          </div>
        </div>
      </Link>
    </div>
  );
}
