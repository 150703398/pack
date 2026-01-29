def pack(container, cargos):
    # 工业排序规则
    cargos = sorted(
        cargos,
        key=lambda c: (
            -c.weight,       # 重的先
            c.fragile,       # 易碎靠后
            -int(c.stackable)
        )
    )

    placements = []
    x = y = z = 0
    layer_height = 0

    for c in cargos:
        if x + c.length > container.length:
            x = 0
            z += c.width
            layer_height = 0

        if z + c.width > container.width:
            z = 0
            y += layer_height
            layer_height = 0

        if y + c.height > container.height:
            continue

        placements.append({
            "id": c.id,
            "x": x,
            "y": y,
            "z": z,
            "length": c.length,
            "width": c.width,
            "height": c.height,
            "weight": c.weight,
            "fragile": c.fragile
        })

        x += c.length
        layer_height = max(layer_height, c.height)

    return placements
