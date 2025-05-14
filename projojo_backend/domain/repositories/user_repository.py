from collections import defaultdict
from typing import Any
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import User, Supervisor, Student, Teacher
import uuid
from datetime import datetime

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
                has imagePath $imagePath,
                has password_hash $password_hash;
                $user isa $usertype;
            fetch {{
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'password_hash': $password_hash,
                'usertype': $usertype
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
                has imagePath $imagePath,
                has password_hash $password_hash;
                $business isa business;
                $project isa project;
                $creates isa creates( $supervisor, $project);
                $manages isa manages( $supervisor, $business );
            fetch {{
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'password_hash': $password_hash,
                'business_association_id': $business.name,
                'created_project_id': $project.name
            }};
        """
        results = Db.read_transact(query)
        if not results:
            return None

        grouped = self.group_supervisor_by_email(results)

        return self._map_supervisor(next(iter(grouped.values())))
    
    def get_student_by_id(self, email: str) -> Student | None:
        # Escape any double quotes in the email
        escaped_email = email.replace('"', '\\"')
        
        query = f"""
            match
                $student isa student,
                has email "{escaped_email}",
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath,
                has schoolAccountName $schoolAccountName,
                has password_hash $password_hash;
                $skill isa skill;
                hasSkill( $skill, $student );
            fetch {{
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'schoolAccountName': $schoolAccountName,
                'password_hash': $password_hash,
                'skill_ids': $skill.name
            }};
        """
        results = Db.read_transact(query)
        if not results:
            return None

        grouped = self.group_student_by_email(results)
        
        return self._map_student(next(iter(grouped.values())))

    
    def get_teacher_by_id(self, email: str) -> Teacher | None:
        # Escape any double quotes in the email
        escaped_email = email.replace('"', '\\"')
        
        query = f"""
            match
                $teacher isa teacher,
                has email "{escaped_email}",
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath,
                has schoolAccountName $schoolAccountName,
                has password_hash $password_hash;
            fetch {{
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'schoolAccountName': $schoolAccountName,
                'password_hash': $password_hash
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
                has password_hash $password_hash,
                has imagePath $imagePath;
                $business isa business;
                $project isa project;
                $creates isa creates( $supervisor, $project);
                $manages isa manages( $supervisor, $business );
            fetch {
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'business_association_id': $business.name,
                'created_project_id': $project.name,
                'password_hash': $password_hash
            };
        """
        results = Db.read_transact(query)

        grouped = self.group_supervisor_by_email(results)

        return [self._map_supervisor(data) for data in grouped.values()]


    def get_all_students(self) -> list[Student]:
        query = """
            match
                $student isa student,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath,
                has schoolAccountName $schoolAccountName,
                has password_hash $password_hash;
                $skill isa skill;
                hasSkill( $skill, $student );
            fetch {
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'schoolAccountName': $schoolAccountName,
                'password_hash': $password_hash,
                'skill_ids': $skill.name
            };
        """
        results = Db.read_transact(query)

        grouped = self.group_student_by_email(results)

        return [self._map_student(data) for data in grouped.values()]
    
    def get_all_teachers(self) -> list[Teacher]:
        query = """
            match
                $teacher isa teacher,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath,
                has schoolAccountName $schoolAccountName;
            fetch {
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'schoolAccountName': $schoolAccountName
            };
        """
        results = Db.read_transact(query)
        return [self._map_teacher(result) for result in results]

    def _base_user_data(self, result: dict[str, Any]) -> dict[str, Any]:
        return {
            "id": result.get("email", ""),
            "email": result.get("email", ""),
            "full_name": result.get("fullName", ""),
            "image_path": result.get("imagePath", ""),
            "password_hash": result.get("password_hash", ""),
        }

    def _map_to_model(self, result: dict[str, Any]) -> User:
        data = self._base_user_data(result)
        user_type = result.get("usertype", {}).get("label", "").lower()
        data["type"] = user_type
        return User(**data)


    def _map_supervisor(self, result: dict[str, Any]) -> Supervisor:
        data = self._base_user_data(result)
        data.update({
            "authentication_ids": [],
            "business_association_id": result.get("business_association_id", ""),
            "created_project_ids": result.get("created_project_ids", []),
        })
        return Supervisor(**data)

    def _map_student(self, result: dict[str, Any]) -> Student:
        data = self._base_user_data(result)
        data.update({
            "school_account_name": result.get("schoolAccountName", ""),
            "skill_ids": result.get("skill_ids", []),
            "registered_task_ids": [],
        })
        return Student(**data)

    def _map_teacher(self, result: dict[str, Any]) -> Teacher:
        data = self._base_user_data(result)
        data.update({
            "school_account_name": result.get("schoolAccountName", ""),
        })
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
            grouped[email]["password_hash"] = result["password_hash"]
            grouped[email]["business_association_id"] = result["business_association_id"]
            grouped[email]["created_project_ids"].append(result["created_project_id"])
        return grouped

    @staticmethod
    def group_student_by_email(results):
        grouped = defaultdict(lambda: {
            "email": None,
            "fullName": None,
            "imagePath": None,
            "schoolAccountName": None,
            "skill_ids": [],
        })
        for result in results:
            email = result["email"]
            grouped[email]["email"] = email
            grouped[email]["fullName"] = result["fullName"]
            grouped[email]["imagePath"] = result["imagePath"]
            grouped[email]["password_hash"] = result["password_hash"]
            grouped[email]["schoolAccountName"] = result["schoolAccountName"]
            grouped[email]["skill_ids"].append(result["skill_ids"])
        return grouped
