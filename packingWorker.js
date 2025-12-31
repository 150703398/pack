function generateRotations(item){
    const {width,height,depth}=item;
    return [
        {width,height,depth},{width,depth,height},
        {height,width,depth},{height,depth,width},
        {depth,width,height},{depth,height,width}
    ];
}
function canFit(item,space){
    return item.width<=space.width && item.height<=space.height && item.depth<=space.depth;
}

function packContainer(container,items){
    let bestPlacements=[], bestVolume=0;
    function recursivePlace(index,spaces,placements,volumeUsed){
        if(index>=items.length){
            if(volumeUsed>bestVolume){ bestVolume=volumeUsed; bestPlacements=[...placements]; }
            return;
        }
        const item = items[index];
        const rotations = generateRotations(item);
        for(let rot of rotations){
            for(let i=0;i<spaces.length;i++){
                const space=spaces[i];
                if(canFit(rot,space)){
                    const newPlacement={...rot, position:{x:space.x,y:space.y,z:space.z}, isDrag:item.isDrag||false};
                    const newPlacements=[...placements,newPlacement];
                    const newSpaces=spaces.slice();
                    newSpaces.splice(i,1);
                    newSpaces.push({x:space.x+rot.width,y:space.y,z:space.z,width:space.width-rot.width,height:rot.height,depth:rot.depth});
                    newSpaces.push({x:space.x,y:space.y+rot.height,z:space.z,width:rot.width,height:space.height-rot.height,depth:rot.depth});
                    newSpaces.push({x:space.x,y:space.y,z:space.z+rot.depth,width:rot.width,height:rot.height,depth:space.depth-rot.depth});
                    recursivePlace(index+1,newSpaces,newPlacements,volumeUsed+rot.width*rot.height*rot.depth);
                }
            }
        }
    }
    recursivePlace(0,[{x:0,y:0,z:0,width:container.width,height:container.height,depth:container.depth}],[],0);
    return {placements:bestPlacements, volumeUsed:bestVolume};
}

self.onmessage=function(e){
    const {packingData}=e.data;
    const {containers, items, drags}=packingData;
    let allPlacements=[];

    // 装拖挂
    drags.forEach(d=>{
        d.items.forEach(item=>item.isDrag=true);
        const {placements}=packContainer(d,d.items);
        allPlacements.push({container:d, items:placements});
    });

    // 分配货物到车厢
    let remainingItems=[...items];
    containers.forEach(c=>{
        const toPack=remainingItems.splice(0, Math.ceil(remainingItems.length/containers.length));
        toPack.forEach(item=>item.isDrag=false);
        const {placements}=packContainer(c,toPack);
        allPlacements.push({container:c, items:placements});
    });

    const totalVolumeUsed=allPlacements.reduce((sum,pl)=>sum+pl.items.reduce((s,i)=>s+i.width*i.height*i.depth,0),0);
    const totalContainerVolume=allPlacements.reduce((sum,pl)=>sum+pl.container.width*pl.container.height*pl.container.depth,0);
    const utilization = totalVolumeUsed/totalContainerVolume;

    self.postMessage({placements:allPlacements, utilization});
}
