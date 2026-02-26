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
            not { $business has archivedAt $archivedAt; };
            fetch {
                'id': $id,
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'location': $location
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
            not { $business has archivedAt $archivedAt; };
            fetch {
                'id': $id,
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'location': $location,
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
        # Handle locations as a list
        # locations = result.get("location", [])
        # if not isinstance(locations, list):
        #     locations = [locations]
        location = result.get("location", "")

        return Business(
            id=id,
            name=name,
            description=description,
            image_path=image_path,
            location=location,
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
        not { $business has archivedAt $bArchived; };
        fetch {
            "id": $business.id,
            "name": $business.name,
            "description": $business.description,
            "image_path": $business.imagePath,
            "location": $business.location,
            "projects": [
                match
                    ($business, $project) isa hasProjects;
                    $project isa project;
                not { $project has archivedAt $pArchived; };
                fetch {
                    "id": $project.id,
                    "name": $project.name,
                    "description": $project.description,
                    "image_path": $project.imagePath,
                    "created_at": $project.createdAt,
                    "location": $project.location,
                    "tasks": [
                        match
                            ($project, $task) isa containsTask;
                            $task isa task;
                        not { $task has archivedAt $tArchived; };
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

    def update(self, business_id: str, name: str, description: str, location: str, image_filename: str = None) -> Business:
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
        query = f"""
            match
                $business isa business, has id ~business_id;
            update
                {' '.join(update_clauses)}
        """

        Db.write_transact(query, update_params)

    def get_archived(self) -> list[Business]:
        query = """
            match
                $business isa business,
                has id $id,
                has name $name,
                has description $description,
                has imagePath $imagePath,
                has location $location;
            $business has archivedAt $archivedAt;
            fetch {
                'id': $id,
                'name': $name,
                'description': $description,
                'imagePath': $imagePath,
                'location': $location
            };
        """
        results = Db.read_transact(query)
        return [self._map_to_model(result) for result in results]

    def archive(self, business_id: str, archived_by: str) -> None:
        """
        Cascade archive: business -> projects -> tasks -> supervisors -> registrations
        Sets archivedAt (now) and archivedBy on each, if not already set.
        """
        from datetime import datetime
        ts = datetime.now()

        # Archive business
        query = """
            match
                $b isa business, has id ~business_id;
            not { $b has archivedAt $x; };
            update
                $b has archivedAt ~ts;
                $b has archivedBy ~by;
        """
        Db.write_transact(query, {"business_id": business_id, "ts": ts, "by": archived_by})

        # Archive projects
        query = """
            match
                $b isa business, has id ~business_id;
                ($b, $p) isa hasProjects;
                $p isa project;
            not { $p has archivedAt $x; };
            update
                $p has archivedAt ~ts;
                $p has archivedBy ~by;
        """
        Db.write_transact(query, {"business_id": business_id, "ts": ts, "by": archived_by})

        # Archive tasks
        query = """
            match
                $b isa business, has id ~business_id;
                ($b, $p) isa hasProjects;
                ($p, $t) isa containsTask;
                $t isa task;
            not { $t has archivedAt $x; };
            update
                $t has archivedAt ~ts;
                $t has archivedBy ~by;
        """
        Db.write_transact(query, {"business_id": business_id, "ts": ts, "by": archived_by})

        # Archive supervisors
        query = """
            match
                $b isa business, has id ~business_id;
                $m isa manages (supervisor: $s, business: $b);
                $s isa supervisor;
            not { $s has archivedAt $x; };
            update
                $s has archivedAt ~ts;
                $s has archivedBy ~by;
        """
        Db.write_transact(query, {"business_id": business_id, "ts": ts, "by": archived_by})

        # Archive registrations
        query = """
            match
                $b isa business, has id ~business_id;
                ($b, $p) isa hasProjects;
                ($p, $t) isa containsTask;
                $r isa registersForTask (task: $t, student: $stu);
            not { $r has archivedAt $x; };
            update
                $r has archivedAt ~ts;
                $r has archivedBy ~by;
        """
        Db.write_transact(query, {"business_id": business_id, "ts": ts, "by": archived_by})

    def unarchive(self, business_id: str) -> None:
        """
        Teacher-only: cascade unarchive by removing archivedAt/archivedBy on
        business -> projects -> tasks -> supervisors -> registrations
        """
        # Business
        query = """
            match
                $b isa business, has id ~business_id, has archivedAt $ts;
            delete
                has $ts of $b;
        """
        Db.write_transact(query, {"business_id": business_id})
        query = """
            match
                $b isa business, has id ~business_id, has archivedBy $by;
            delete
                has $by of $b;
        """
        Db.write_transact(query, {"business_id": business_id})

        # Projects
        query = """
            match
                $b isa business, has id ~business_id;
                ($b, $p) isa hasProjects;
                $p has archivedAt $ts;
            delete
                has $ts of $p;
        """
        Db.write_transact(query, {"business_id": business_id})
        query = """
            match
                $b isa business, has id ~business_id;
                ($b, $p) isa hasProjects;
                $p has archivedBy $by;
            delete
                has $by of $p;
        """
        Db.write_transact(query, {"business_id": business_id})

        # Tasks
        query = """
            match
                $b isa business, has id ~business_id;
                ($b, $p) isa hasProjects;
                ($p, $t) isa containsTask;
                $t has archivedAt $ts;
            delete
                has $ts of $t;
        """
        Db.write_transact(query, {"business_id": business_id})
        query = """
            match
                $b isa business, has id ~business_id;
                ($b, $p) isa hasProjects;
                ($p, $t) isa containsTask;
                $t has archivedBy $by;
            delete
                has $by of $t;
        """
        Db.write_transact(query, {"business_id": business_id})

        # Supervisors
        query = """
            match
                $b isa business, has id ~business_id;
                $m isa manages (supervisor: $s, business: $b);
                $s has archivedAt $ts;
            delete
                has $ts of $s;
        """
        Db.write_transact(query, {"business_id": business_id})
        query = """
            match
                $b isa business, has id ~business_id;
                $m isa manages (supervisor: $s, business: $b);
                $s has archivedBy $by;
            delete
                has $by of $s;
        """
        Db.write_transact(query, {"business_id": business_id})

        # Registrations
        query = """
            match
                $b isa business, has id ~business_id;
                ($b, $p) isa hasProjects;
                ($p, $t) isa containsTask;
                $r isa registersForTask (task: $t, student: $stu), has archivedAt $ts;
            delete
                has $ts of $r;
        """
        Db.write_transact(query, {"business_id": business_id})
        query = """
            match
                $b isa business, has id ~business_id;
                ($b, $p) isa hasProjects;
                ($p, $t) isa containsTask;
                $r isa registersForTask (task: $t, student: $stu), has archivedBy $by;
            delete
                has $by of $r;
        """
        Db.write_transact(query, {"business_id": business_id})
