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
    <div className={`h-[350px] w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden transition-all transform hover:scale-102 hover:shadow-2xl ${!isExpanded && (index == 2 ? 'hidden [@media(min-width:1195px)]:block' : index == 1 && 'hidden [@media(min-width:813px)]:block')}`}>
      <Link
        to={`/projects/${project.id}`}
        className="block h-full focus:outline-none group"
      >
        <div className="relative h-full bg-slate-200">
          <img
            className="rounded-t-lg w-full h-[65%] object-cover transition-opacity duration-300 group-hover:opacity-95 group-focus:opacity-95"
            src={`${IMAGE_BASE_URL}${project.image_path}`}
            alt="Projectafbeelding"
          />
          <div className="h-fit bottom-0 left-0 right-0 p-8 pt-4">
            <h4 className="line-clamp-1 mb-2 break-all text-xl font-semibold text-black">
              {project.title || project.name}
            </h4>
            <div className="line-clamp-2 text-sm text-black-300 group-hover:text-black-200 group-focus:text-gray-200 transition-colors duration-200">
              <RichTextViewer text={project.description} flatten={true} />
            </div>
          </div>
        </div>

        <div className="hidden sm:group-hover:block group-focus:block absolute inset-0 bg-white bg-opacity-60 overflow-y-auto p-8">
          <div className="space-y-3">
            <div className="block max-w-sm bg-slate-100 border border-gray-200 rounded-lg shadow-lg mb-8 hover:rounded-lg hover:ring-4 hover:ring-pink-300 transition-all duration-300 ease-in-out">
              <div className="flex flex-col gap-3 p-4">
                <h4 className="text-2xl font-bold tracking-tight text-primary transition-colors">
                  {project.title || project.name}
                </h4>
                <span className="text-md font-semibold text-slate-700">Naar de projectpagina</span>
              </div>
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
