def sort_cargos(cargos):
    """
    工业装箱排序规则：
    1. 重量降序
    2. 非易碎优先
    3. 可堆叠优先
    """
    return sorted(
        cargos,
        key=lambda c: (
            -c.weight,
            c.fragile,
            not c.stackable
        )
    )
