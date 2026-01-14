from sqlalchemy import create_engine, select, delete
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, Session
from sqlalchemy.exc import IntegrityError
from fastapi import FastAPI, HTTPException

# Personal local host database url
DATABASE_URL = ("postgresql://postgres:"
                "Marcopolo1234!@localhost:5432/Legos")

# Allows for mappings of Python inherint data types to SQL data types
class Base(DeclarativeBase):
    pass

# Lego Set class where each variable maps to SQL data types
# Each variable is mapped to it's correspending field in my database
class LegoSet(Base):
    __tablename__ = "lego_sets"

    id: Mapped[int] = mapped_column(primary_key=True)
    set_number: Mapped[int] = mapped_column(unique=True, index=True)
    name: Mapped[str]

# Exception for when the database cannot remove inputted set
class CannotRemoveError(Exception):
    pass

engine = create_engine(
    DATABASE_URL,
    echo=False
)

app = FastAPI()

@app.delete("/delete_sets")
def delete_all_sets():
    with Session(engine) as session:
        try:
            session.execute(delete(LegoSet))
            session.commit()
            return {"message:" "Deleted all sets"}
        except:
            session.rollback()
            raise HTTPException(status_code=409, detail="Unexpected Error")

@app.get("/sets")
def list_sets():
    with Session(engine) as session:
        try:
            rows = session.execute(select(LegoSet).order_by(LegoSet.set_number)).scalars().all()
            return {"message": "Retrieved", "sets": [{"set_number": r.set_number, "name" : r.name} for r in rows]}
        except:
            session.rollback()
            raise HTTPException(status_code=409, detail="Unexpected Error")

@app.post("/sets")
def add_set(set_number: int, set_name: str):
    with Session(engine) as session:
        try:
            new_set = LegoSet(set_number=set_number, name=set_name)
            session.add(new_set)
            session.commit()
            return { "message": "Added", "set_number": set_number}
        except IntegrityError:
            session.rollback()
            raise HTTPException(status_code=409, detail="Lego set already exists in collection.")
        except:
            session.rollback()
            raise HTTPException(status_code=409, detail="Unexpected Error")
        
@app.delete("/sets")
def remove_set(set_number: int):
    with Session(engine) as session:
        try:
            result = (
                delete(LegoSet).where(LegoSet.set_number == set_number)
                .returning(LegoSet.set_number)
            )

            deleted = session.execute(result).scalar_one_or_none()

            session.commit()

            if deleted is None:
                raise CannotRemoveError

            return {"message": "Deleted", "set_number": set_number}
        except CannotRemoveError:
            session.rollback()
            raise HTTPException(status_code=404, detail="Cannot remove provided set.")
        except:
            session.rollback()
            raise HTTPException(status_code=409, detail="Unexpected Error")
        


'''
with Session(engine) as session:
    # Will try to add the lego set into the inventory if it is not already there
    try:
        new_set = LegoSet(set_number=1234, name="Yes")
        session.add(new_set)
        session.commit()
    except IntegrityError:
        session.rollback()
        print("Lego set already exists")

with engine.connect() as conn:
    result = conn.execute(text("SELECT set_number, name FROM lego_sets"))
    for row in result:
        print(row.set_number, row.name)
'''




'''
If barcode databases not viable, try to use camera to save numbers from box

UPCitemDB or https://www.ean-search.org/ean-database-api.html for barcoede lookup

First PHASE is storing collection database and API on own PC
Second PHASE is using online database for collection storage and online APi
    Consider parrallel queries to API if multiple users
Both PHASES will use an online Barcode Product Mapper API

Barcode scanner on mobile that talks with database via APi
Barcode scanner/ camera module creates number to be used to lookup in database
Create an API that takes in a barcode number and returns the Lego Set
    This will in the future return this information to the front end app

'''