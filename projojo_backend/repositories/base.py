from typing import TypeVar, Generic, List, Optional, Dict, Any
from pydantic import BaseModel
from initDatabase import Db

T = TypeVar('T', bound=BaseModel)

class BaseRepository(Generic[T]):
    def __init__(self, model_type: type[T], entity_type: str):
        self.model_type = model_type
        self.entity_type = entity_type
        
    def get_by_id(self, id: str) -> Optional[T]:
        query = f"""
            match
                ${self.entity_type} isa {self.entity_type}, has id "{id}";
            get ${self.entity_type};
        """
        results = Db.read_transact(query)
        if not results:
            return None
        return self._map_to_model(results[0])
    
    def get_all(self) -> List[T]:
        query = f"""
            match
                ${self.entity_type} isa {self.entity_type};
            get ${self.entity_type};
        """
        results = Db.read_transact(query)
        return [self._map_to_model(result) for result in results]
    
    def create(self, entity: T) -> T:
        # To be implemented in child classes due to specific insert requirements
        raise NotImplementedError("Create method must be implemented by child classes")
    
    def update(self, id: str, entity: T) -> Optional[T]:
        # To be implemented in child classes due to specific update requirements
        raise NotImplementedError("Update method must be implemented by child classes")
    
    def delete(self, id: str) -> bool:
        # To be implemented in child classes due to specific delete requirements
        raise NotImplementedError("Delete method must be implemented by child classes")
    
    def _map_to_model(self, result: Dict[str, Any]) -> T:
        # To be implemented in child classes for specific mapping
        raise NotImplementedError("_map_to_model method must be implemented by child classes")
from typing import TypeVar, Generic, List, Optional, Dict, Any
from pydantic import BaseModel
from initDatabase import Db

T = TypeVar('T', bound=BaseModel)

class BaseRepository(Generic[T]):
    def __init__(self, model_type: type[T], entity_type: str):
        self.model_type = model_type
        self.entity_type = entity_type

    def get_by_id(self, id: str) -> Optional[T]:
        query = f"""
            match
                ${self.entity_type} isa {self.entity_type}, has id "{id}";
            get ${self.entity_type};
        """
        results = Db.read_transact(query)
        if not results:
            return None
        return self._map_to_model(results[0])

    def get_all(self) -> List[T]:
        query = f"""
            match
                ${self.entity_type} isa {self.entity_type};
            get ${self.entity_type};
        """
        results = Db.read_transact(query)
        return [self._map_to_model(result) for result in results]

    def create(self, entity: T) -> T:
        # To be implemented in child classes due to specific insert requirements
        raise NotImplementedError("Create method must be implemented by child classes")

    def update(self, id: str, entity: T) -> Optional[T]:
        # To be implemented in child classes due to specific update requirements
        raise NotImplementedError("Update method must be implemented by child classes")

    def delete(self, id: str) -> bool:
        # To be implemented in child classes due to specific delete requirements
        raise NotImplementedError("Delete method must be implemented by child classes")

    def _map_to_model(self, result: Dict[str, Any]) -> T:
        # To be implemented in child classes for specific mapping
        raise NotImplementedError("_map_to_model method must be implemented by child classes")