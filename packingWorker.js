function generateRotations(item){
    const {width,height,depth} = item;
    return [
        {width,height,depth},
        {width,depth,height},
        {height,width,depth},
        {height,depth,width},
        {depth,width,height},
        {depth,height,width}
    ];
}

function canFit(item, space){
    return item.width <= space.width && item.height <= space.height && item.depth <= space.depth;
}

function packContainer(container, items){
    let bestPlacements = [];
    let bestVolume = 0;

    function recursivePlace(index, spaces, placements, volumeUsed){
        if(index >= items.length){
            if(volumeUsed > bestVolume){
                bestVolume = volumeUsed;
                bestPlacements = [...placements];
            }
            return;
        }

        const item = items[index];
        const rotations = generateRotations(item);

        for(let rot of rotations){
            for(let i=0;i<spaces.length;i++){
                const space = spaces[i];
                if(canFit(rot,space)){
                    const newPlacement = {...rot, position:{x:space.x,y:space.y,z:space.z}, drag:item.drag, unit:item.unit};
                    const newPlacements = [...placements,newPlacement];

                    const newSpaces = spaces.slice();
                    newSpaces.splice(i,1);
                    newSpaces.push({x:space.x+rot.width,y:space.y,z:space.z,width:space.width-rot.width,height:rot.height,depth:rot.depth});
                    newSpaces.push({x:space.x,y:space.y+rot.height,z:space.z,width:rot.width,height:space.height-rot.height,depth:rot.depth});
                    newSpaces.push({x:space.x,y:space.y,z:space.z+rot.depth,width:rot.width,height:rot.height,depth:space.depth-rot.depth});

                    const remainingVolume = newSpaces.reduce((sum,s)=>sum+s.width*s.height*s.depth,0);
                    if(volumeUsed+rot.width*rot.height*rot.depth+remainingVolume < bestVolume) continue;

                    recursivePlace(index+1,newSpaces,newPlacements,volumeUsed+rot.width*rot.height*rot.depth);
                }
            }
        }
    }

    recursivePlace(0,[{x:0,y:0,z:0,width:container.width,height:container.height,depth:container.depth}],[],0);
    return {placements:bestPlacements, volumeUsed:bestVolume};
}

self.onmessage = function(e){
    const {containers, items, mode} = e.data;
    let allPlacements = [];
    let totalVolumeUsed=0;
    let totalContainerVolume=0;

    containers.forEach(container=>{
        let normalItems = items.filter(it=>!it.drag);
        let dragItems = items.filter(it=>it.drag);
        let orderedItems=[];
        if(mode==='direct') orderedItems = [...items];
        else if(mode==='drag_only') orderedItems = [...dragItems];
        else if(mode==='drag_first') orderedItems = [...dragItems,...normalItems];
        else if(mode==='custom') orderedItems = [...items]; // 自由搭配，可后续增加分配界面

        orderedItems.sort((a,b)=>(b.width*b.height*b.depth)-(a.width*a.height*b.depth));

        const {placements, volumeUsed} = packContainer(container,orderedItems);
        allPlacements.push(placements);
        totalVolumeUsed+=volumeUsed;
        totalContainerVolume+=container.width*container.height*container.depth;
    });

    const utilization = totalVolumeUsed/totalContainerVolume;
    self.postMessage({allPlacements, utilization});
}
