from pydantic import BaseModel
from typing import List

class Cargo(BaseModel):
    id: str
    length: float   # cm
    width: float
    height: float
    weight: float   # kg
    fragile: bool = False
    stackable: bool = True
    max_load: float = 1e9

class Container(BaseModel):
    length: float
    width: float
    height: float

class PackRequest(BaseModel):
    container: Container
    cargos: List[Cargo]
