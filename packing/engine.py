from .rules import sort_cargos

def pack(container, cargos):
    cargos = sort_cargos(cargos)

    x = y = z = 0
    row_height = 0
    layer_width = 0

    packed = []
    unplaced = []

    for c in cargos:
        if x + c.length > container.length:
            x = 0
            z += layer_width
            layer_width = 0

        if z + c.width > container.width:
            z = 0
            y += row_height
            row_height = 0

        if y + c.height > container.height:
            unplaced.append(c.id)
            continue

        packed.append({
            **c.dict(),
            "x": x,
            "y": y,
            "z": z
        })

        x += c.length
        row_height = max(row_height, c.height)
        layer_width = max(layer_width, c.width)

    return packed, unplaced
