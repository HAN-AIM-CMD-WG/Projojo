from typing import Dict, Any
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .project_repository import ProjectRepository as project_repo
from .base import BaseRepository
from domain.models import Business, BusinessAssociation

class BusinessRepository(BaseRepository[Business]):
    def __init__(self):
        super().__init__(Business, "business")
    
    def get_by_id(self, id: str) -> Business | None:
        # Escape any double quotes in the ID
        
        query = f"""
            match
                $business isa business, 
                has name "{id}",
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has location $location;
            fetch {{
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'location': $location
            }};
        """
        results = Db.read_transact(query)
        if not results:
            raise ItemRetrievalException(Business, f"Business with ID {id} not found.")
        return self._map_to_model(results[0])
    
    def get_all(self) -> list[Business]:
        query = """
            match
                $business isa business,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has location $location;
            fetch { 
                'name': $name, 
                'description': $description, 
                'imagePath': $imagePath, 
                'location': $location,
            };
        """
        results = Db.read_transact(query)
        return [self._map_to_model(result) for result in results]

    def _map_to_model(self, result: Dict[str, Any]) -> Business:
        # Extract relevant information from the query result
        name = result.get("name", "")
        description = result.get("description", "")
        image_path = result.get("imagePath", "")
        
        # Handle locations as a list
        locations = result.get("location", [])
        if not isinstance(locations, list):
            locations = [locations]

        return Business(
            id=name,  # Using name as the ID since it's marked as @key
            name=name,
            description=description,
            image_path=image_path,
            location=locations,
        )
    
    def get_business_associations(self, business_id: str) -> list[BusinessAssociation]:
        # Escape any double quotes in the business ID
        escaped_business_id = business_id.replace('"', '\\"')
        
        query = f"""
            match
                $business isa business, has name "{escaped_business_id}";
                $manages isa manages,
                    has location $location,
                    (supervisor: $supervisor, business: $business);
                $supervisor isa supervisor, has email $email;
            fetch {{
                'email': $email,
                'location': $location
            }};
        """
        results = Db.read_transact(query)
        
        associations = []
        for result in results:
            supervisor_email = result.get("email", "")
            
            # Handle locations as a list
            locations = result.get("location", [])
            if not isinstance(locations, list):
                locations = [locations]
            
            associations.append(BusinessAssociation(
                business_id=business_id,
                supervisor_id=supervisor_email,
                location=locations
            ))
        
        return associations
