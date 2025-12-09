from typing import Any
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import Business, BusinessAssociation
from service.uuid_service import generate_uuid


class BusinessRepository(BaseRepository[Business]):
    def __init__(self):
        super().__init__(Business, "business")

    def get_by_id(self, id: str) -> Business | None:
        query = """
            match
                $business isa business,
                has id ~id,
                has id $id,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has location $location;
            fetch {
                'id': $id,
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'location': $location,
                'sector': [ $business.sector ],
                'companySize': [ $business.companySize ],
                'website': [ $business.website ]
            };
        """
        results = Db.read_transact(query, {"id": id})
        if not results:
            raise ItemRetrievalException(Business, f"Business with ID {id} not found.")
        return self._map_to_model(results[0])

    def get_all(self) -> list[Business]:
        query = """
            match
                $business isa business,
                has id $id,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has location $location;
            fetch {
                'id': $id,
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'location': $location,
                'sector': [ $business.sector ],
                'companySize': [ $business.companySize ],
                'website': [ $business.website ]
            };
        """
        results = Db.read_transact(query)
        return [self._map_to_model(result) for result in results]

    def _map_to_model(self, result: dict[str, Any]) -> Business:
        # Extract relevant information from the query result
        id = result.get("id", "")
        name = result.get("name", "")
        description = result.get("description", "")
        image_path = result.get("imagePath", "")
        location = result.get("location", "")
        
        # Handle optional fields that come as lists from TypeDB
        sector_list = result.get("sector", [])
        sector = sector_list[0] if sector_list else None
        
        company_size_list = result.get("companySize", [])
        company_size = company_size_list[0] if company_size_list else None
        
        website_list = result.get("website", [])
        website = website_list[0] if website_list else None

        return Business(
            id=id,
            name=name,
            description=description,
            image_path=image_path,
            location=location,
            sector=sector,
            company_size=company_size,
            website=website,
        )

    def get_business_associations(self, business_id: str) -> list[BusinessAssociation]:
        query = """
            match
                $business isa business, has id ~business_id;
                $manages isa manages,
                    has location $location,
                    (supervisor: $supervisor, business: $business);
                $supervisor isa supervisor, has id $supervisor_id;
            fetch {
                'id': $supervisor_id,
                'location': $location
            };
        """
        results = Db.read_transact(query, {"business_id": business_id})

        associations = []
        for result in results:
            supervisor_id = result.get("id", "")

            # Handle locations as a list
            # locations = result.get("location", [])
            # if not isinstance(locations, list):
            #     locations = [locations]
            location = result.get("location", "")

            associations.append(
                BusinessAssociation(
                    business_id=business_id,
                    supervisor_id=supervisor_id,
                    location=location,
                )
            )

        return associations

    def get_all_with_full_nesting(self):
        query = """
        match
            $business isa business;
        fetch {
            "id": $business.id,
            "name": $business.name,
            "description": $business.description,
            "image_path": $business.imagePath,
            "location": [$business.location],
            "sector": [$business.sector],
            "company_size": [$business.companySize],
            "website": [$business.website],
            "projects": [
                match
                    ($business, $project) isa hasProjects;
                    $project isa project;
                fetch {
                    "id": $project.id,
                    "name": $project.name,
                    "description": $project.description,
                    "image_path": $project.imagePath,
                    "created_at": $project.createdAt,
                    "tasks": [
                        match
                            ($project, $task) isa containsTask;
                            $task isa task;
                        fetch {
                            "id": $task.id,
                            "name": $task.name,
                            "description": $task.description,
                            "total_needed": $task.totalNeeded,
                            "created_at": $task.createdAt,
                            "project_id": $project.id,
                            "total_registered": (
                                match
                                    $registration isa registersForTask (task: $task, student: $student);
                                not { $registration has isAccepted $any_value; };
                                return count;
                            ),
                            "total_accepted": (
                                match
                                    $registration isa registersForTask (task: $task, student: $student),
                                    has isAccepted true;
                                return count;
                            ),
                            "skills": [
                                match
                                    ($task, $skill) isa requiresSkill;
                                    $skill isa skill;
                                fetch {
                                    "id": $skill.id,
                                    "name": $skill.name,
                                    "is_pending": $skill.isPending,
                                    "created_at": $skill.createdAt
                                };
                            ]
                        };
                    ]
                };
            ]
        };
        """
        return Db.read_transact(query)

    def create(self, name: str) -> Business:
        id = generate_uuid()

        query = """
            insert
                $business isa business,
                has id ~id,
                has name ~name,
                has description "",
                has imagePath "default.png",
                has location "";
        """
        Db.write_transact(query, {"id": id, "name": name})
        return Business(
            id=id, name=name, description="", image_path="default.png", location=""
        )

    def update(self, business_id: str, name: str, description: str, location: str, image_filename: str = None, sector: str = None, company_size: str = None, website: str = None) -> Business:
        # Build the update query dynamically based on what needs to be updated
        update_clauses = [
            '$business has name ~name;',
            '$business has description ~description;',
            '$business has location ~location;',
        ]
        update_params = {
            "business_id": business_id,
            "name": name,
            "description": description,
            "location": location,
        }

        # Only update imagePath if a new image filename is provided
        if image_filename is not None:
            update_clauses.append('$business has imagePath ~image_filename;')
            update_params["image_filename"] = image_filename
        
        # Optional fields - sector, company_size, website
        if sector is not None:
            update_clauses.append('$business has sector ~sector;')
            update_params["sector"] = sector
        
        if company_size is not None:
            update_clauses.append('$business has companySize ~company_size;')
            update_params["company_size"] = company_size
        
        if website is not None:
            update_clauses.append('$business has website ~website;')
            update_params["website"] = website

        query = f"""
            match
                $business isa business, has id ~business_id;
            update
                {' '.join(update_clauses)}
        """

        Db.write_transact(query, update_params)