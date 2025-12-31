// 简单行列装箱算法，保证可视化
function packContainer(container,items){
    let placements = [];
    let x=0, y=0, z=0;
    let maxRowDepth=0;
    items.forEach(item=>{
        if(x+item.width>container.width){
            x=0;
            z += maxRowDepth;
            maxRowDepth=0;
        }
        if(z+item.depth>container.depth){
            return; // 超出容器，放不下
        }
        placements.push({...item, position:{x,y,z}});
        x += item.width;
        if(item.depth>maxRowDepth) maxRowDepth=item.depth;
    });
    const volumeUsed = placements.reduce((s,i)=>s+i.width*i.height*i.depth,0);
    return {placements, volumeUsed};
}

self.onmessage = function(e){
    const {packingData} = e.data;
    const {container, items, drags} = packingData;
    let allPlacements=[];

    // 装拖挂
    drags.forEach(d=>{
        d.items.forEach(item=>item.isDrag=true);
        const {placements} = packContainer(d,d.items);
        allPlacements.push({container:d, items:placements});
    });

    // 装货物到车厢
    items.forEach(item=>item.isDrag=false);
    const {placements} = packContainer(container, items);
    allPlacements.push({container:container, items:placements});

    const totalVolumeUsed = allPlacements.reduce((sum,pl)=>sum + pl.items.reduce((s,i)=>s+i.width*i.height*i.depth,0),0);
    const totalContainerVolume = allPlacements.reduce((sum,pl)=>sum + pl.container.width*pl.container.height*pl.container.depth,0);
    const utilization = totalVolumeUsed / totalContainerVolume;

    self.postMessage({placements:allPlacements, utilization});
}
