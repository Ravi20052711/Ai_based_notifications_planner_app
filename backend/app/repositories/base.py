from typing import TypeVar, Generic, Type, List, Optional
from sqlalchemy.orm import Session
from ..database import Base

T = TypeVar("T", bound=Base)

class BaseRepository(Generic[T]):
    def __init__(self, model: Type[T], db: Session):
        self.model = model
        self.db = db

    def get(self, id: any) -> Optional[T]:
        return self.db.query(self.model).filter(self.model.id == id).first()

    def list(self) -> List[T]:
        return self.db.query(self.model).all()

    def create(self, obj_in: dict) -> T:
        db_obj = self.model(**obj_in)
        self.db.add(db_obj)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def update(self, db_obj: T, obj_in: dict) -> T:
        for field, value in obj_in.items():
            setattr(db_obj, field, value)
        self.db.commit()
        self.db.refresh(db_obj)
        return db_obj

    def delete(self, db_obj: T) -> None:
        self.db.delete(db_obj)
        self.db.commit()
