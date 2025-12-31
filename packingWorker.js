function packContainer(container,items){
    let placements=[], x=0, y=0, z=0, maxRowDepth=0;
    items.forEach(item=>{
        if(x+item.width>container.width){ x=0; z+=maxRowDepth; maxRowDepth=0; }
        if(z+item.depth>container.depth){ return; }
        placements.push({...item, position:{x,y,z}});
        x += item.width;
        if(item.depth>maxRowDepth) maxRowDepth=item.depth;
    });
    const volumeUsed = placements.reduce((s,i)=>s+i.width*i.height*i.depth,0);
    return {placements, volumeUsed};
}

self.onmessage=function(e){
    const {packingData} = e.data;
    const {container, items, drags} = packingData;
    let allPlacements=[];

    // 拖挂先装货物
    drags.forEach(d=>{
        if(!d.items) d.items=[];
        d.items.forEach(item=>item.isDrag=true);
        const {placements} = packContainer(d,d.items);
        allPlacements.push({container:d, items:placements});
    });

    items.forEach(item=>item.isDrag=false);
    const {placements} = packContainer(container, items);
    allPlacements.push({container:container, items:placements});

    const totalVolumeUsed = allPlacements.reduce((sum,pl)=>sum + pl.items.reduce((s,i)=>s+i.width*i.height*i.depth,0),0);
    const totalContainerVolume = allPlacements.reduce((sum,pl)=>sum + pl.container.width*pl.container.height*pl.container.depth,0);
    const utilization = totalVolumeUsed/totalContainerVolume;

    self.postMessage({placements:allPlacements, utilization});
}
