from fastapi import FastAPI
from packing.models import PackingRequest, PackingResult
from packing.engine import pack

app = FastAPI(title="3D Packing Engine")

@app.post("/pack", response_model=PackingResult)
def pack_api(req: PackingRequest):
    packed, unplaced = pack(req.container, req.cargos)
    return {
        "packed": packed,
        "unplaced": unplaced
    }
