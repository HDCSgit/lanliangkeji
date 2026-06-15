from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.models import ContactMessage
from app.schemas.schemas import ContactForm, ApiResponse

router = APIRouter()


@router.post("/", response_model=ApiResponse)
def submit_contact(form: ContactForm, db: Session = Depends(get_db)):
    message = ContactMessage(
        name=form.name,
        phone=form.phone,
        email=form.email,
        company=form.company,
        subject=form.subject,
        message=form.message,
    )
    db.add(message)
    db.commit()
    db.refresh(message)

    return ApiResponse(success=True, data={"id": message.id}, message="提交成功，我们会尽快与您联系")
