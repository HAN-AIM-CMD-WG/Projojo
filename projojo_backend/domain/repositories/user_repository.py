from collections import defaultdict
from typing import Any
from urllib.parse import urlparse
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import User, Supervisor, Student, Teacher
from domain.models.authentication import OAuthProvider
from service.image_service import save_image_from_url
from service.uuid_service import generate_uuid

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User, "user")

    def get_by_id(self, id: str) -> User | None:
        # First try to find as a supervisor
        supervisor = self.get_supervisor_by_id(id)
        if supervisor:
            return supervisor

        # Then try as a student
        student = self.get_student_by_id(id)
        if student:
            return student

        # Finally try as a teacher
        teacher = self.get_teacher_by_id(id)
        if teacher:
            return teacher

        if not supervisor and not student and not teacher:
            raise ItemRetrievalException(User, f"Gebruiker met ID {id} niet gevonden")
        return None

    def get_all(self) -> list[User]:
        # Combine all user types
        users = []
        users.extend(self.get_all_supervisors())
        users.extend(self.get_all_students())
        users.extend(self.get_all_teachers())
        return users

    def get_supervisor_by_id(self, id: str) -> Supervisor | None :
        query = """
            match
                $supervisor isa supervisor,
                has id ~id,
                has id $id,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
                $business isa business;
                $manages isa manages( $supervisor, $business );
            fetch {
                'id': $id,
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'business_association_id': $business.id
            };
        """
        results = Db.read_transact(query, {"id": id})
        if not results:
            return None

        # Get projects for this supervisor
        project_query = """
            match
                $supervisor isa supervisor,
                has id ~id;
                $project isa project;
                $creates isa creates( $supervisor, $project);
            fetch {
                'created_project_id': $project.id
            };
        """
        project_results = Db.read_transact(project_query, {"id": id})

        # Merge project data with supervisor data
        merged_results = []
        if project_results:
            for result in results:
                for proj in project_results:
                    merged_result = result.copy()
                    merged_result['created_project_id'] = proj['created_project_id']
                    merged_results.append(merged_result)
        else:
            # Supervisor with no projects
            for result in results:
                merged_result = result.copy()
                merged_result['created_project_id'] = None
                merged_results.append(merged_result)

        grouped = UserRepository.group_supervisor_by_id(merged_results)

        return self._map_supervisor(next(iter(grouped.values())))

    def get_student_by_id(self, id: str) -> dict | None:
        query = """
            match
                $student isa student,
                has id ~id;
            fetch {
                'id': $student.id,
                'email': $student.email,
                'full_name': $student.fullName,
                'image_path': $student.imagePath,
                'type': 'student',
                'description': $student.description,
                'cv_path': $student.cvPath,
                'registered_task_ids': [
                    match
                        $task isa task;
                        $registration isa registersForTask( $student, $task );
                    fetch { 'task_id': $task.id };
                ],
                'skill_ids': [
                    match
                        $skill isa skill;
                        $hasSkill isa hasSkill( $skill, $student );
                    fetch { 'skill_id': $skill.id };
                ],
                'Skills': [
                    match
                        $skill isa skill;
                        $hasSkill isa hasSkill( $skill, $student );
                    fetch {
                        'id': $skill.id,
                        'name': $skill.name,
                        'is_pending': $skill.isPending,
                        'created_at': $skill.createdAt,
                        'description': $hasSkill.description
                    };
                ]
            };
        """
        result = Db.read_transact(query, {"id": id})
        if not result:
            return None

        return result[0]


    def get_teacher_by_id(self, id: str) -> Teacher | None:
        query = """
            match
                $teacher isa teacher,
                has id ~id,
                has id $id,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
            fetch {
                'id': $id,
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath
            };
        """
        results = Db.read_transact(query, {"id": id})
        if not results:
            return None

        return self._map_teacher(results[0])

    def get_all_supervisors(self) -> list[Supervisor]:
        query = """
            match
                $supervisor isa supervisor,
                has id $id,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
                $business isa business;
                $manages isa manages( $supervisor, $business );
            fetch {
                'id': $id,
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'business_association_id': $business.id
            };
        """
        results = Db.read_transact(query)

        # Get projects separately for each supervisor
        project_query = """
            match
                $supervisor isa supervisor,
                has id $id;
                $project isa project;
                $creates isa creates( $supervisor, $project);
            fetch {
                'id': $id,
                'created_project_id': $project.id
            };
        """
        project_results = Db.read_transact(project_query)

        # Merge the results
        merged_results = []
        supervisor_projects = defaultdict(list)

        # Group projects by supervisor id
        for proj in project_results:
            supervisor_projects[proj['id']].append(proj['created_project_id'])

        # Add project data to supervisor results
        for result in results:
            supervisor_id = result['id']
            if supervisor_id in supervisor_projects:
                for project_id in supervisor_projects[supervisor_id]:
                    merged_result = result.copy()
                    merged_result['created_project_id'] = project_id
                    merged_results.append(merged_result)
            else:
                # Supervisor with no projects
                merged_result = result.copy()
                merged_result['created_project_id'] = None
                merged_results.append(merged_result)

        grouped = UserRepository.group_supervisor_by_id(merged_results)

        return [self._map_supervisor(data) for data in grouped.values()]


    def get_all_students(self) -> list[Student]:
        query = """
            match
                $student isa student,
                has id $id,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
            fetch {
                'id': $id,
                'email': $email,
                'full_name': $fullName,
                'type': 'student',
                'image_path': $imagePath,
                'registered_task_ids': [
                    match
                        $task isa task;
                        $registersForTask isa registersForTask( $student, $task );
                    fetch { 'task_id': $task.id };
                ],
                'skill_ids': [
                    match
                        $skill isa skill;
                        $hasSkill isa hasSkill( $student, $skill );
                    fetch { 'skill_id': $skill.id };
                ]
            };
        """
        results = Db.read_transact(query)

        return results

    def get_all_teachers(self) -> list[Teacher]:
        query = """
            match
                $teacher isa teacher,
                has id $id,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
            fetch {
                'id': $id,
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath
            };
        """
        results = Db.read_transact(query)
        return [self._map_teacher(result) for result in results]

    def _base_user_data(self, result: dict[str, Any]) -> dict[str, Any]:
        # Extract OAuth providers and create OAuthProvider objects (only if present in query result)
        oauth_providers = []
        if "oauth_providers" in result:
            for provider_data in result.get("oauth_providers", []):
                if "provider_name" in provider_data and "oauth_sub" in provider_data:
                    oauth_provider = OAuthProvider(
                        provider_name=provider_data["provider_name"],
                        oauth_sub=provider_data["oauth_sub"]
                    )
                    oauth_providers.append(oauth_provider)

        return {
            "id": result.get("id", ""),
            "email": result.get("email", ""),
            "full_name": result.get("fullName", ""),
            "image_path": result.get("imagePath", ""),
            "oauth_providers": oauth_providers if oauth_providers else None,
        }

    def _map_to_model(self, result: dict[str, Any]) -> User:
        data = self._base_user_data(result)
        user_type = result.get("usertype", {}).get("label", "").lower()
        data["type"] = user_type
        return User(**data)


    def _map_supervisor(self, result: dict[str, Any]) -> Supervisor:
        data = self._base_user_data(result)
        data.update({
            "business_association_id": result.get("business_association_id", ""),
            "created_project_ids": result.get("created_project_ids", []),
        })
        return Supervisor(**data)

    def _map_student(self, result: dict[str, Any]) -> Student:
        data = self._base_user_data(result)
        data.update({
            "skill_ids": [skill["skill_id"] for skill in result.get("skill_ids", [])],
            "registered_task_ids": [task["task_id"] for task in result.get("registered_task_ids", [])],
        })
        return Student(**data)

    def _map_teacher(self, result: dict[str, Any]) -> Teacher:
        data = self._base_user_data(result)
        return Teacher(**data)

    @staticmethod
    def group_supervisor_by_id(results):
        grouped = defaultdict(lambda: {
            "id": None,
            "email": None,
            "fullName": None,
            "imagePath": None,
            "business_association_id": None,
            "created_project_ids": []
        })
        for result in results:
            id = result["id"]
            grouped[id]["id"] = id
            grouped[id]["email"] = result["email"]
            grouped[id]["fullName"] = result["fullName"]
            grouped[id]["imagePath"] = result["imagePath"]
            grouped[id]["business_association_id"] = result["business_association_id"]
            # Only add project_id if it's not None
            project_id = result["created_project_id"]
            if project_id is not None:
                grouped[id]["created_project_ids"].append(project_id)
        return grouped

    def get_students_by_task_status(self, task_id: str, status: str) -> list[Student]:
        """
        Get students by task and their application status
        """
        query = """
            match
                $task isa task, has id ~task_id;
                $student isa student,
                has id $id,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
                $registration isa registersForTask (student: $student, task: $task);
        """

        # Add status filter based on the status parameter
        if status == "registered":
            # Students who registered but haven't been accepted or rejected yet
            query += """
                not { $registration has isAccepted true; };
                not { $registration has isAccepted false; };
            """
        elif status == "accepted":
            query += """
                $registration has isAccepted true;
            """
        elif status == "rejected":
            query += """
                $registration has isAccepted false;
            """

        query += """
            fetch {
                'id': $id,
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath
            };
        """

        results = Db.read_transact(query, {"task_id": task_id})
        students = []

        for result in results:
            student_data = {
                "id": result["id"],
                "email": result["email"],
                "fullName": result["fullName"],
                "imagePath": result["imagePath"],
                "skill_ids": []
            }
            students.append(self._map_student(student_data))

        return students

    def get_student_registrations(self, studentId) -> list[str]:
        """
        Get all registrations for a student
        """
        query = """
            match
                $student isa student, has id ~student_id;
                $registration isa registersForTask (student: $student, task: $task);
            fetch {
                'id': $task.id,
            };
        """

        results = Db.read_transact(query, {"student_id": studentId})
        if not results:
            return []

        # Extract task IDs from results
        task_ids = [result['id'] for result in results]
        return task_ids

    def get_colleagues(self, task_id: str, excluded_id: str) -> list[str]:
        """
        Get supervisors linked to the same business as the given task

        Args:
            task_id: The task ID
            excluded_id: Supervisor ID to exclude from results (or teacher ID, but teachers wouldn't be included anyway)

        Returns:
            List of supervisor emails
        """
        query = """
            match
                $task isa task, has id ~task_id;
                $ct isa containsTask (project: $project, task: $task);
                $hp isa hasProjects (business: $business, project: $project);
                $m isa manages (supervisor: $supervisor, business: $business);
                not { $supervisor has id ~excluded_id; };
            fetch {
                "email": $supervisor.email
            };
        """
        results = Db.read_transact(query, {
            "task_id": task_id,
            "excluded_id": excluded_id
        })
        if not results:
            return []
        return [result['email'] for result in results]

    def update_student(self, id: str, description: str | None = None, image_path: str | None = None, cv_path: str | None = None) -> None:
        """
        Update student profile information (description, profile picture, CV)
        """
        # Build update statements for provided fields
        update_statements = []
        params = {"id": id}

        if description is not None:
            update_statements.append('$student has description ~description;')
            params["description"] = description

        if image_path is not None:
            update_statements.append('$student has imagePath ~image_path;')
            params["image_path"] = image_path

        if cv_path is not None:
            if cv_path == "":
                # Empty string means delete the CV
                delete_query = """
                    match
                        $student isa student,
                        has id ~id,
                        has cvPath $cvPath;
                    delete
                        has $cvPath of $student;
                """
                Db.write_transact(delete_query, {"id": id})
            else:
                update_statements.append('$student has cvPath ~cv_path;')
                params["cv_path"] = cv_path

        # Only execute if there are updates to make
        if update_statements:
            update_query = f"""
                match
                    $student isa student, has id ~id;
                update
                    {' '.join(update_statements)}
            """
            Db.write_transact(update_query, params)

    def get_by_sub_and_provider(self, sub: str, provider: str) -> User | None:
        """Get user from database by OAuth sub (provider user ID) and provider"""
        query = """
            match
                $user isa user;
                $provider isa oauthProvider, has name ~provider_name;
                $auth isa oauthAuthentication($user, $provider),
                has oauthSub ~oauth_sub;
                $user isa $usertype;
            fetch {
                'id': $user.id,
                'email': $user.email,
                'fullName': $user.fullName,
                'imagePath': $user.imagePath,
                'usertype': $usertype,
                'oauth_providers': [
                    match
                        $oauth_provider isa oauthProvider;
                        $oauth_auth isa oauthAuthentication($user, $oauth_provider);
                    fetch {
                        'provider_name': $oauth_provider.name,
                        'oauth_sub': $oauth_auth.oauthSub
                    };
                ]
            };
        """

        results = Db.read_transact(query, {"provider_name": provider, "oauth_sub": sub})
        if not results:
            return None

        return self._map_to_model(results[0])

    def create_user(self, user: User) -> User:
        """Create a new user in database with OAuth provider"""
        # TODO: still need to determine the user type (probably based on email domain)
        # Currently always creates a student

        if not user.oauth_providers or len(user.oauth_providers) == 0:
            raise ValueError("OAuth-providerinformatie ontbreekt")

        if len(user.oauth_providers) > 1:
            raise ValueError("Je kan maar met één provider een account aanmaken")

        # Get the OAuth provider
        oauth_provider = user.oauth_providers[0]

        # Check if OAuth provider exists (with case-insensitive match)
        provider_query = """
            match
                $provider isa oauthProvider, has name $name;
                $name like ~provider_pattern;
            fetch { 'name': $provider.name };
        """
        provider_results = Db.read_transact(provider_query, {
            "provider_pattern": f"(?i){oauth_provider.provider_name}"
        })

        if not provider_results:
            raise ValueError(f"We ondersteunen '{oauth_provider.provider_name}' nog niet")

        id = generate_uuid()

        # Handle image path - could be a URL (Google/GitHub) or already a filename (Microsoft)
        downloaded_image_name = ""
        if user.image_path:
            parsed_url = urlparse(user.image_path)
            # Check if it's a URL with http or https scheme
            if parsed_url.scheme in ('http', 'https'):
                downloaded_image_name = save_image_from_url(user.image_path)
            else:
                # It's already a filename or local path
                downloaded_image_name = user.image_path

        create_user_query = """
            match
                $provider isa oauthProvider, has name ~provider_name;
            insert
                $student isa student,
                has id ~id,
                has email ~email,
                has fullName ~full_name,
                has imagePath ~image_path;
                $auth isa oauthAuthentication($student, $provider),
                has oauthSub ~oauth_sub;
        """

        Db.write_transact(create_user_query, {
            "provider_name": oauth_provider.provider_name,
            "id": id,
            "email": user.email,
            "full_name": user.full_name,
            "image_path": downloaded_image_name,
            "oauth_sub": oauth_provider.oauth_sub
        })

        # if user is a student, it returns a dict which needs to be mapped to Student model
        created_user = self.get_by_id(id)
        if isinstance(created_user, dict):
            created_user = self._map_student(created_user)

        # Return the created user
        return created_user

    async def get_supervisor_accessible_resources(self, supervisor_company_id: str, resource_id: str) -> dict:
        """
        Fetch all accessible resources (projects, tasks, users) for a supervisor's company.

        Args:
            supervisor_company_id: The supervisor's business ID
            resource_id: The resource ID to check against all resource types

        Returns:
            dict with keys 'projects', 'tasks', 'users' containing lists of matching resource IDs
        """
        query = """
            match
                $business isa business, has id ~business_id;
            fetch {
                'projects': [
                    match
                        $p1 isa project, has id ~project_id;
                        $hp1 isa hasProjects(business: $business, project: $p1);
                    fetch { 'project_id': $p1.id };
                ],
                'tasks': [
                    match
                        $p2 isa project;
                        $hp2 isa hasProjects(business: $business, project: $p2);
                        $t2 isa task, has id ~task_id;
                        $ct2 isa containsTask(project: $p2, task: $t2);
                    fetch { 'task_id': $t2.id };
                ],
                'users': [
                    match
                        $u3 isa supervisor, has id ~supervisor_id;
                        $m3 isa manages(supervisor: $u3, business: $business);
                    fetch { 'user_id': $u3.id };
                ]
            };
        """

        results = Db.read_transact(query, {
            "business_id": supervisor_company_id,
            "project_id": resource_id,
            "task_id": resource_id,
            "supervisor_id": resource_id
        })

        if not results:
            return {'projects': [], 'tasks': [], 'users': []}

        result = results[0]
        return {
            'projects': [item['project_id'] for item in result.get('projects', [])],
            'tasks': [item['task_id'] for item in result.get('tasks', [])],
            'users': [item['user_id'] for item in result.get('users', [])]
        }
