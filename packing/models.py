from pydantic import BaseModel
from typing import List

class Cargo(BaseModel):
    id: int
    length: float   # cm
    width: float
    height: float
    weight: float   # kg
    fragile: bool
    stackable: bool

class Container(BaseModel):
    length: float
    width: float
    height: float
    max_load: float = 30000  # kg

class PackingRequest(BaseModel):
    container: Container
    cargos: List[Cargo]

class PackedCargo(Cargo):
    x: float
    y: float
    z: float

class PackingResult(BaseModel):
    packed: List[PackedCargo]
    unplaced: List[int]
