from typing import Any
from db.initDatabase import Db, build_query
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
        # Sort by display_order, then name. Treat only a missing display_order as
        # last (a real 0 sorts first), matching the frontend's `?? 999` semantics.
        return sorted(themes, key=lambda t: (999 if t.display_order is None else t.display_order, t.name))

    @staticmethod
    def _find_by_name_case_insensitive(themes: list[Theme], name: str) -> Theme | None:
        # Compare in Python instead of a TypeQL `like` regex: names may contain
        # characters (spaces, '&', ...) that TypeDB's regex literal parser rejects
        # when escaped via re.escape, and the theme catalog is small.
        target = name.casefold()
        return next((theme for theme in themes if theme.name.casefold() == target), None)

    def get_by_name_case_insensitive(self, name: str) -> Theme | None:
        return self._find_by_name_case_insensitive(self.get_all(), name)

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

    @staticmethod
    def _next_display_order(themes: list[Theme]) -> int:
        """
        The display_order a new theme gets when the caller does not supply one:
        max(existing display_order) + 1.

        `default=0` keeps an empty catalog valid (max() of an empty sequence
        raises), so the first theme in an empty catalog becomes 1.
        """
        orders = [theme.display_order for theme in themes if theme.display_order is not None]
        return max(orders, default=0) + 1

    def create(self, theme: ThemeCreate) -> Theme:
        # One read of the catalog serves both the duplicate check and the
        # display_order assignment, so they also decide against the same snapshot.
        existing = self.get_all()

        if self._find_by_name_case_insensitive(existing, theme.name):
            raise ValueError("Er bestaat al een thema met deze naam")

        # The teacher never picks a sort order (TS-task-011 AC-3). When the caller
        # omits display_order the server assigns it here, from the authoritative
        # catalog, instead of trusting a client that may hold a stale or empty
        # list. An explicit display_order (including 0) is always honoured.
        display_order = theme.display_order if theme.display_order is not None else self._next_display_order(existing)

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
            "display_order": display_order
        })

        return Theme(
            id=id,
            name=theme.name,
            sdg_code=theme.sdg_code,
            icon=theme.icon,
            description=theme.description,
            color=theme.color,
            display_order=display_order
        )

    def update(self, theme_id: str, theme: ThemeUpdate) -> Theme:
        update_clauses = []
        params = {"theme_id": theme_id}

        if theme.name is not None:
            duplicate = self.get_by_name_case_insensitive(theme.name)
            if duplicate and duplicate.id != theme_id:
                raise ValueError("Er bestaat al een thema met deze naam")

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
                $hasTheme;
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
                $theme;
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

    def link_project_to_themes(self, project_id: str, theme_ids: list[str]) -> int:
        """Atomically replace a project's theme links: all changes succeed or none are applied.

        Duplicate theme ids are ignored. Returns the number of links created.
        """
        theme_ids = list(dict.fromkeys(theme_ids))
        project_query = build_query("""
            match
                $project isa project, has id ~project_id;
        """, {"project_id": project_id})
        delete_query = build_query("""
            match
                $project isa project, has id ~project_id;
                $hasTheme isa hasTheme(project: $project);
            delete
                $hasTheme;
        """, {"project_id": project_id})
        insert_template = """
            match
                $project isa project, has id ~project_id;
                $theme isa theme, has id ~theme_id;
            insert
                $hasTheme isa hasTheme($project, $theme);
        """

        insert_queries = [
            build_query(insert_template, {"project_id": project_id, "theme_id": theme_id})
            for theme_id in theme_ids
        ]

        def validate(results: list[list]) -> None:
            if not results[0]:
                raise ValueError(f"Project met ID '{project_id}' niet gevonden.")
            invalid = [theme_id for theme_id, rows in zip(theme_ids, results[2:]) if not rows]
            if invalid:
                raise ValueError(f"Thema's niet gevonden: {', '.join(invalid)}")

        Db.write_transact_atomic([project_query, delete_query, *insert_queries], validate=validate)
        return len(theme_ids)
