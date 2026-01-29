from fastapi import FastAPI
from models import PackRequest
from packer import pack

app = FastAPI(title="Container Packing Engine")

@app.post("/pack")
def pack_api(req: PackRequest):
    return {
        "container": req.container,
        "placements": pack(req.container, req.cargos)
    }
