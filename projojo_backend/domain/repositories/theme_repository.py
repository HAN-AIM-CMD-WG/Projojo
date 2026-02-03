from typing import Any
from db.initDatabase import Db
from exceptions import ItemRetrievalException
from .base import BaseRepository
from domain.models import Theme, ThemeCreate, ThemeUpdate
from service.uuid_service import generate_uuid


class ThemeRepository(BaseRepository[Theme]):
    def __init__(self):
        super().__init__(Theme, "theme")

    def get_by_id(self, id: str) -> Theme | None:
        query = """
            match
                $theme isa theme,
                has id ~id,
                has id $id,
                has name $name;
            fetch {
                'id': $id,
                'name': $name,
                'sdg_code': [$theme.sdgCode],
                'icon': [$theme.icon],
                'description': [$theme.themeDescription],
                'color': [$theme.color],
                'display_order': [$theme.displayOrder]
            };
        """
        results = Db.read_transact(query, {"id": id})
        if not results:
            raise ItemRetrievalException(Theme, f"Theme with ID {id} not found.")
        return self._map_to_model(results[0])

    def get_all(self) -> list[Theme]:
        query = """
            match
                $theme isa theme,
                has id $id,
                has name $name;
            fetch {
                'id': $id,
                'name': $name,
                'sdg_code': [$theme.sdgCode],
                'icon': [$theme.icon],
                'description': [$theme.themeDescription],
                'color': [$theme.color],
                'display_order': [$theme.displayOrder]
            };
        """
        results = Db.read_transact(query)
        themes = [self._map_to_model(result) for result in results]
        # Sort by display_order, then name
        return sorted(themes, key=lambda t: (t.display_order or 999, t.name))

    def _map_to_model(self, result: dict[str, Any]) -> Theme:
        sdg_code_list = result.get("sdg_code", [])
        icon_list = result.get("icon", [])
        description_list = result.get("description", [])
        color_list = result.get("color", [])
        display_order_list = result.get("display_order", [])

        return Theme(
            id=result.get("id", ""),
            name=result.get("name", ""),
            sdg_code=sdg_code_list[0] if sdg_code_list else None,
            icon=icon_list[0] if icon_list else None,
            description=description_list[0] if description_list else None,
            color=color_list[0] if color_list else None,
            display_order=display_order_list[0] if display_order_list else None
        )

    def create(self, theme: ThemeCreate) -> Theme:
        id = generate_uuid()
        
        query = """
            insert
                $theme isa theme,
                has id ~id,
                has name ~name,
                has sdgCode ~sdg_code,
                has icon ~icon,
                has themeDescription ~description,
                has color ~color,
                has displayOrder ~display_order;
        """
        Db.write_transact(query, {
            "id": id,
            "name": theme.name,
            "sdg_code": theme.sdg_code,
            "icon": theme.icon,
            "description": theme.description,
            "color": theme.color,
            "display_order": theme.display_order
        })

        return Theme(
            id=id,
            name=theme.name,
            sdg_code=theme.sdg_code,
            icon=theme.icon,
            description=theme.description,
            color=theme.color,
            display_order=theme.display_order
        )

    def update(self, theme_id: str, theme: ThemeUpdate) -> Theme:
        update_clauses = []
        params = {"theme_id": theme_id}

        if theme.name is not None:
            update_clauses.append("$theme has name ~name;")
            params["name"] = theme.name
        if theme.sdg_code is not None:
            update_clauses.append("$theme has sdgCode ~sdg_code;")
            params["sdg_code"] = theme.sdg_code
        if theme.icon is not None:
            update_clauses.append("$theme has icon ~icon;")
            params["icon"] = theme.icon
        if theme.description is not None:
            update_clauses.append("$theme has themeDescription ~description;")
            params["description"] = theme.description
        if theme.color is not None:
            update_clauses.append("$theme has color ~color;")
            params["color"] = theme.color
        if theme.display_order is not None:
            update_clauses.append("$theme has displayOrder ~display_order;")
            params["display_order"] = theme.display_order

        if update_clauses:
            query = f"""
                match
                    $theme isa theme, has id ~theme_id;
                update
                    {' '.join(update_clauses)}
            """
            Db.write_transact(query, params)

        return self.get_by_id(theme_id)

    def delete(self, theme_id: str) -> None:
        # First remove all hasTheme relations for this theme
        delete_relations = """
            match
                $theme isa theme, has id ~theme_id;
                $hasTheme isa hasTheme(theme: $theme);
            delete
                $hasTheme isa hasTheme;
        """
        try:
            Db.write_transact(delete_relations, {"theme_id": theme_id})
        except Exception:
            pass

        # Then delete the theme itself
        delete_theme = """
            match
                $theme isa theme, has id ~theme_id;
            delete
                $theme isa theme;
        """
        Db.write_transact(delete_theme, {"theme_id": theme_id})

    def get_themes_by_project(self, project_id: str) -> list[Theme]:
        query = """
            match
                $project isa project, has id ~project_id;
                $hasTheme isa hasTheme(project: $project, theme: $theme);
                $theme has id $id, has name $name;
            fetch {
                'id': $id,
                'name': $name,
                'sdg_code': [$theme.sdgCode],
                'icon': [$theme.icon],
                'description': [$theme.themeDescription],
                'color': [$theme.color],
                'display_order': [$theme.displayOrder]
            };
        """
        results = Db.read_transact(query, {"project_id": project_id})
        return [self._map_to_model(result) for result in results]

    def link_project_to_themes(self, project_id: str, theme_ids: list[str]) -> None:
        """Link a project to multiple themes (replaces existing links)"""
        # First remove existing theme links
        delete_query = """
            match
                $project isa project, has id ~project_id;
                $hasTheme isa hasTheme(project: $project);
            delete
                $hasTheme isa hasTheme;
        """
        try:
            Db.write_transact(delete_query, {"project_id": project_id})
        except Exception:
            pass

        # Then add new theme links
        for theme_id in theme_ids:
            insert_query = """
                match
                    $project isa project, has id ~project_id;
                    $theme isa theme, has id ~theme_id;
                insert
                    $hasTheme isa hasTheme($project, $theme);
            """
            Db.write_transact(insert_query, {
                "project_id": project_id,
                "theme_id": theme_id
            })
