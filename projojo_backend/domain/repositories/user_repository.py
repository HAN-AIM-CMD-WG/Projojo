from typing import List, Optional, Dict, Any
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import User, Supervisor, Student, Teacher
import uuid
from datetime import datetime

class UserRepository(BaseRepository[User]):
    def __init__(self):
        super().__init__(User, "user")
    
    def get_by_id(self, id: str) -> Optional[User]:
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

    def get_all(self) -> List[User]:
        # Combine all user types
        users = []
        users.extend(self.get_all_supervisors())
        users.extend(self.get_all_students())
        users.extend(self.get_all_teachers())
        return users
    
    def get_supervisor_by_id(self, email: str) -> Optional[Supervisor]:
        # Escape any double quotes in the email
        escaped_email = email.replace('"', '\\"')
        
        query = f"""
            match
                $supervisor isa supervisor,
                has email "{escaped_email}",
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath;
            fetch {{
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath
            }};
        """
        results = Db.read_transact(query)
        if not results:
            return None
        
        return self._map_supervisor(results[0])
    
    def get_student_by_id(self, email: str) -> Optional[Student]:
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
        
        return self._map_student(results[0])

    
    def get_teacher_by_id(self, email: str) -> Optional[Teacher]:
        # Escape any double quotes in the email
        escaped_email = email.replace('"', '\\"')
        
        query = f"""
            match
                $teacher isa teacher,
                has email "{escaped_email}",
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath,
                has schoolAccountName $schoolAccountName;
            fetch {{
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'schoolAccountName': $schoolAccountName
            }};
        """
        results = Db.read_transact(query)
        if not results:
            return None
        
        return self._map_teacher(results[0])
    
    def get_all_supervisors(self) -> List[Supervisor]:
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
                'business_association_id': $b.name
            };
        """
        results = Db.read_transact(query)
        return [self._map_supervisor(result) for result in results]
    
    def get_all_students(self) -> List[Student]:
        query = """
            match
                $student isa student,
                has email $email,
                has fullName $fullName,
                has imagePath $imagePath,
                has schoolAccountName $schoolAccountName,
                has password_hash $password_hash;
            fetch {
                'email': $email,
                'fullName': $fullName,
                'imagePath': $imagePath,
                'schoolAccountName': $schoolAccountName,
                'password_hash': $password_hash,
            };
        """
        results = Db.read_transact(query)
        return [self._map_student(result) for result in results]
    
    def get_all_teachers(self) -> List[Teacher]:
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

    def _map_to_model(self, result: Dict[str, Any]) -> User:
        email = result.get("email", "")
        full_name = result.get("fullName", "")
        image_path = result.get("imagePath", "")
        password_hash = result.get("password_hash", "")
        
        return User(
            id=email,
            email=email,
            full_name=full_name,
            image_path=image_path,
            password_hash=password_hash
        )
    
    def _map_supervisor(self, result: Dict[str, Any]) -> Supervisor:
        email = result.get("email", "")
        full_name = result.get("fullName", "")
        image_path = result.get("imagePath", "")
        business_association_id = result.get("business_association_id", "")
        
        return Supervisor(
            id=email,
            email=email,
            full_name=full_name,
            image_path=image_path,
            authentication_ids=[],
            business_association_id=business_association_id,
            created_project_ids=[]
        )
    
    def _map_student(self, result: Dict[str, Any]) -> Student:
        email = result.get("email", "")
        full_name = result.get("fullName", "")
        image_path = result.get("imagePath", "")
        school_account_name = result.get("schoolAccountName", "")
        password_hash = result.get("password_hash", "")
        
        return Student(
            id=email,
            email=email,
            full_name=full_name,
            image_path=image_path,
            school_account_name=school_account_name,
            skill_ids=[],
            registered_task_ids=[],
            password_hash=password_hash
        )
    
    def _map_teacher(self, result: Dict[str, Any]) -> Teacher:
        email = result.get("email", "")
        full_name = result.get("fullName", "")
        image_path = result.get("imagePath", "")
        school_account_name = result.get("schoolAccountName", "")
        
        return Teacher(
            id=email,
            email=email,
            full_name=full_name,
            image_path=image_path,
            school_account_name=school_account_name
        )
