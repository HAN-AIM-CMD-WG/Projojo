from collections import defaultdict
from typing import Any
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import User, Supervisor, Student, Teacher
from domain.models.authentication import OAuthProvider

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User, "user")

    def get_credentials(self, id: str) -> User | None:
        query = f"""
            match
                $user isa user,
                has email "{id}",
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
                $user isa $usertype;
            fetch {{
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'usertype': $usertype,
                'oauth_providers': [
                    match
                        $provider isa oauthProvider;
                        $auth isa oauthAuthentication($user, $provider);
                    fetch {{
                        'provider_name': $provider.name,
                        'oauth_sub': $auth.oauthSub
                    }};
                ]
            }};
        """
        results = Db.read_transact(query)
        if not results:
            raise ItemRetrievalException(User, f"User with ID {id} not found.")
        print(results)
        return self._map_to_model(results[1])

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
            raise ItemRetrievalException(User, f"User with ID {id} not found.")
        return None

    def get_all(self) -> list[User]:
        # Combine all user types
        users = []
        users.extend(self.get_all_supervisors())
        users.extend(self.get_all_students())
        users.extend(self.get_all_teachers())
        return users

    def get_supervisor_by_id(self, email: str) -> Supervisor | None :
        # Escape any double quotes in the email
        escaped_email = email.replace('"', '\\"')

        query = f"""
            match
                $supervisor isa supervisor,
                has email "{escaped_email}",
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
                $business isa business;
                $manages isa manages( $supervisor, $business );
            fetch {{
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'business_association_id': $business.name,
                'oauth_providers': [
                    match
                        $provider isa oauthProvider;
                        $auth isa oauthAuthentication($supervisor, $provider);
                    fetch {{
                        'provider_name': $provider.name,
                        'oauth_sub': $auth.oauthSub
                    }};
                ]
            }};
        """
        results = Db.read_transact(query)
        if not results:
            return None

        # Get projects for this supervisor
        project_query = f"""
            match
                $supervisor isa supervisor,
                has email "{escaped_email}";
                $project isa project;
                $creates isa creates( $supervisor, $project);
            fetch {{
                'created_project_id': $project.name
            }};
        """
        project_results = Db.read_transact(project_query)

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

        grouped = UserRepository.group_supervisor_by_email(merged_results)

        return self._map_supervisor(next(iter(grouped.values())))

    def get_student_by_id(self, email: str) -> dict | None:
        # Escape any double quotes in the email
        escaped_email = email.replace('"', '\\"')

        query = f"""
            match
                $student isa student,
                has email "{escaped_email}";
            fetch {{
                'id': $student.email,
                'email': $student.email,
                'full_name': $student.fullName,
                'image_path': $student.imagePath,
                'type': 'student',
                'oauth_providers': [
                    match
                        $provider isa oauthProvider;
                        $auth isa oauthAuthentication($student, $provider);
                    fetch {{
                        'provider_name': $provider.name,
                        'oauth_sub': $auth.oauthSub
                    }};
                ],
                'registered_task_ids': [
                    match
                        $task isa task;
                        $registration isa registersForTask( $student, $task );
                    fetch {{ 'task_name': $task.name }};
                ],
                'skill_ids': [
                    match
                        $skill isa skill;
                        $hasSkill isa hasSkill( $skill, $student );
                    fetch {{ 'skill_name': $skill.name }};
                ],
                'Skills': [
                    match
                        $skill isa skill;
                        $hasSkill isa hasSkill( $skill, $student );
                    fetch {{
                        'id': $skill.name,
                        'name': $skill.name,
                        'is_pending': $skill.isPending,
                        'created_at': $skill.createdAt,
                        'description': $hasSkill.description
                    }};
                ]
            }};
        """
        result = Db.read_transact(query)
        if not result:
            return None

        return result[0]


    def get_teacher_by_id(self, email: str) -> Teacher | None:
        # Escape any double quotes in the email
        escaped_email = email.replace('"', '\\"')

        query = f"""
            match
                $teacher isa teacher,
                has email "{escaped_email}",
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
            fetch {{
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'oauth_providers': [
                    match
                        $provider isa oauthProvider;
                        $auth isa oauthAuthentication($teacher, $provider);
                    fetch {{
                        'provider_name': $provider.name,
                        'oauth_sub': $auth.oauthSub
                    }};
                ]
            }};
        """
        results = Db.read_transact(query)
        if not results:
            return None

        return self._map_teacher(results[0])

    def get_all_supervisors(self) -> list[Supervisor]:
        query = """
            match
                $supervisor isa supervisor,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
                $business isa business;
                $manages isa manages( $supervisor, $business );
            fetch {
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'business_association_id': $business.name
            };
        """
        results = Db.read_transact(query)

        # Get projects separately for each supervisor
        project_query = """
            match
                $supervisor isa supervisor,
                has email $email;
                $project isa project;
                $creates isa creates( $supervisor, $project);
            fetch {
                'email': $email,
                'created_project_id': $project.name
            };
        """
        project_results = Db.read_transact(project_query)

        # Merge the results
        merged_results = []
        supervisor_projects = defaultdict(list)

        # Group projects by supervisor email
        for proj in project_results:
            supervisor_projects[proj['email']].append(proj['created_project_id'])

        # Add project data to supervisor results
        for result in results:
            supervisor_email = result['email']
            if supervisor_email in supervisor_projects:
                for project_name in supervisor_projects[supervisor_email]:
                    merged_result = result.copy()
                    merged_result['created_project_id'] = project_name
                    merged_results.append(merged_result)
            else:
                # Supervisor with no projects
                merged_result = result.copy()
                merged_result['created_project_id'] = None
                merged_results.append(merged_result)

        grouped = UserRepository.group_supervisor_by_email(merged_results)

        return [self._map_supervisor(data) for data in grouped.values()]


    def get_all_students(self) -> list[Student]:
        query = """
            match
                $student isa student,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
            fetch {
                'id': $email,
                'email': $email,
                'full_name': $fullName,
                'type': 'student',
                'image_path': $imagePath,
                'registered_task_ids': [
                    match
                        $task isa task;
                        $registersForTask isa registersForTask( $student, $task );
                    fetch { 'task_id': $task.name };
                ],
                'skill_ids': [
                    match
                        $skill isa skill;
                        $hasSkill isa hasSkill( $student, $skill );
                    fetch { 'skill_id': $skill.name };
                ]
            };
        """
        results = Db.read_transact(query)

        return results

    def get_all_teachers(self) -> list[Teacher]:
        query = """
            match
                $teacher isa teacher,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
            fetch {
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
            "id": result.get("email", ""),
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
            "skill_ids": result.get("skill_ids", []),
            "registered_task_ids": [],
        })
        return Student(**data)

    def _map_teacher(self, result: dict[str, Any]) -> Teacher:
        data = self._base_user_data(result)
        return Teacher(**data)

    @staticmethod
    def group_supervisor_by_email(results):
        grouped = defaultdict(lambda: {
            "email": None,
            "fullName": None,
            "imagePath": None,
            "business_association_id": None,
            "created_project_ids": []
        })
        for result in results:
            email = result["email"]
            grouped[email]["email"] = email
            grouped[email]["fullName"] = result["fullName"]
            grouped[email]["imagePath"] = result["imagePath"]
            grouped[email]["business_association_id"] = result["business_association_id"]
            # Only add project_id if it's not None
            project_id = result["created_project_id"]
            if project_id is not None:
                grouped[email]["created_project_ids"].append(project_id)
        return grouped

    def get_students_by_task_status(self, task_name: str, status: str) -> list[Student]:
        """
        Get students by task and their application status
        """
        escaped_task_name = task_name.replace('"', '\\"')

        query = f"""
            match
                $task isa task, has name "{escaped_task_name}";
                $student isa student,
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
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath
            };
        """

        results = Db.read_transact(query)
        students = []

        for result in results:
            student_data = {
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
        escaped_student_id = studentId.replace('"', '\\"')

        query = f"""
            match
                $student isa student, has email "{escaped_student_id}";
                $registration isa registersForTask (student: $student, task: $task);
            fetch {{
                'id': $task.name,
            }};
        """

        results = Db.read_transact(query)
        if not results:
            return []

        # Extract task IDs from results
        task_ids = [result['id'] for result in results]
        return task_ids

    def get_colleagues(self, supervisor_email: str) -> list[User]:
        """
        Get supervisors who work in the same business as the authenticated supervisor
        """
        # Escape the supervisor email to prevent injection
        escaped_email = supervisor_email.replace('"', '\\"')

        query = f"""
            match
                $auth_supervisor isa supervisor, has email "{escaped_email}";
                $manages_auth isa manages (supervisor: $auth_supervisor, business: $business);
                $manages_colleague isa manages (supervisor: $colleague, business: $business);
                $colleague isa supervisor,
                has email $email,
                has fullName $fullName;
            fetch {{
                'id': $email,
                'email': $email,
                'full_name': $fullName,
            }};
        """

        results = Db.read_transact(query)
        return [User(**result) for result in results]

    # TODO: test if this works (generated by Copilot)
    def get_user_by_sub_and_provider(self, sub: str, provider: str) -> User | None:
        """Get user from database by OAuth sub (provider user ID) and provider"""
        # Escape inputs to prevent injection
        escaped_sub = sub.replace('"', '\\"')
        escaped_provider = provider.replace('"', '\\"')

        query = f"""
            match
                $user isa user,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
                $provider isa oauthProvider, has name "{escaped_provider}";
                $auth isa oauthAuthentication($user, $provider),
                has oauthSub "{escaped_sub}";
                $user isa $usertype;
            fetch {{
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'usertype': $usertype,
                'oauth_providers': [{{
                    'provider_name': "{escaped_provider}",
                    'oauth_sub': "{escaped_sub}"
                }}]
            }};
        """

        results = Db.read_transact(query)
        if not results:
            return None

        return self._map_to_model(results[0])

    # TODO: test if this works (generated by Copilot)
    def create_user(self, user: User) -> User:
        """Create a new user in database with OAuth provider"""
        # For now, we'll create a student by default
        # In a real implementation, you'd need to determine the user type

        # Escape inputs
        escaped_email = user.email.replace('"', '\\"')
        escaped_full_name = user.full_name.replace('"', '\\"')
        escaped_image_path = (user.image_path or "").replace('"', '\\"')

        # Insert the student
        create_user_query = f"""
            insert
                $student isa student,
                has email "{escaped_email}",
                has fullName "{escaped_full_name}",
                has imagePath "{escaped_image_path}";
        """

        Db.write_transact(create_user_query)

        # Create OAuth provider and authentication if OAuth data exists
        if user.oauth_providers:
            for oauth_provider in user.oauth_providers:
                escaped_provider_name = oauth_provider.provider_name.replace('"', '\\"')
                escaped_oauth_sub = oauth_provider.oauth_sub.replace('"', '\\"')

                # Insert or get OAuth provider
                provider_query = f"""
                    match $provider isa oauthProvider, has name "{escaped_provider_name}";
                    fetch $provider;
                """
                provider_results = Db.read_transact(provider_query)

                if not provider_results:
                    # Create the OAuth provider if it doesn't exist
                    create_provider_query = f"""
                        insert
                            $provider isa oauthProvider,
                            has name "{escaped_provider_name}";
                    """
                    Db.write_transact(create_provider_query)

                # Create OAuth authentication relationship
                auth_query = f"""
                    match
                        $student isa student, has email "{escaped_email}";
                        $provider isa oauthProvider, has name "{escaped_provider_name}";
                    insert
                        $auth isa oauthAuthentication($student, $provider),
                        has oauthSub "{escaped_oauth_sub}";
                """
                Db.write_transact(auth_query)

        # Return the created user
        return self.get_user_by_id(user.email)

    # TODO: test if this works (generated by Copilot)
    def get_user_by_id(self, user_id: str) -> User | None:
        """Get user from database by user ID (email in this case)"""
        # This method already exists as get_by_id, but we need it with this exact name for OAuth compatibility
        return self.get_by_id(user_id)
