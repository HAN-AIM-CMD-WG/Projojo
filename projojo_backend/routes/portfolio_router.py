from fastapi import APIRouter, HTTPException, Request, status

from auth.permissions import auth
from domain.models.portfolio import PortfolioResponse, PortfolioReviewCreateRequest
from domain.repositories.portfolio_repository import PortfolioRepository


router = APIRouter(tags=["Portfolio Endpoints"])
portfolio_repo = PortfolioRepository()


@router.post("/portfolio-items/{item_id}/reviews", status_code=status.HTTP_201_CREATED)
@auth(role="supervisor")
async def create_portfolio_review(item_id: str, review: PortfolioReviewCreateRequest, request: Request):
    review_text = review.review_text.strip()
    if not review_text:
        raise HTTPException(status_code=400, detail="Reviewtekst is verplicht.")
    if review.public_review_notice_accepted is not True:
        raise HTTPException(
            status_code=400, detail="Je moet de publieke reviewmelding accepteren voordat je reviewtekst indient."
        )

    try:
        review_id = portfolio_repo.create_review(
            item_id=item_id,
            author_id=request.state.user_id,
            author_role=request.state.user_role,
            business_id=request.state.business_id,
            review_text=review_text,
            public_review_notice_accepted=review.public_review_notice_accepted,
            rating=review.rating,
        )
        return {"id": review_id}
    except PermissionError as error:
        raise HTTPException(status_code=403, detail=str(error))
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error))


@router.get("/portfolios/students/{student_id}", response_model=PortfolioResponse)
@auth(role="authenticated")
async def get_authenticated_student_portfolio(student_id: str, request: Request):
    student = portfolio_repo.get_student_identity(student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Portfolio niet gevonden")

    viewer_role = request.state.user_role
    if viewer_role == "student" and request.state.user_id != student_id:
        raise HTTPException(status_code=403, detail="Je hebt hier geen rechten voor.")

    if viewer_role == "supervisor":
        business_id = request.state.business_id
        if not business_id or not portfolio_repo.has_supervisor_relationship(student_id, business_id):
            raise HTTPException(status_code=403, detail="Je hebt hier geen rechten voor.")

    items = portfolio_repo.get_visible_items(student_id, viewer_role)
    reviews = portfolio_repo.get_reviews_for_items([item["id"] for item in items])
    items, reviews = portfolio_repo.filter_items_for_viewer(items, reviews, viewer_role)
    items = portfolio_repo.attach_reviews(items, reviews)

    return {
        "viewer_role": viewer_role,
        "student": student,
        "items": items,
        "reviews": reviews,
    }


@router.get("/portfolio/{slug}")
async def get_public_portfolio(slug: str):
    raise HTTPException(status_code=404, detail="Portfolio niet publiek")
