from domain.repositories.portfolio_repository import PortfolioRepository


def can_read_authenticated_student_portfolio(
    student_id: str,
    viewer_id: str,
    viewer_role: str,
    viewer_business_id: str | None,
    portfolio_repo: PortfolioRepository,
) -> bool:
    if viewer_role == "student":
        return viewer_id == student_id
    if viewer_role == "teacher":
        return True
    if viewer_role == "supervisor":
        if not viewer_business_id:
            return False
        return portfolio_repo.has_supervisor_relationship(student_id, viewer_business_id)
    return False
