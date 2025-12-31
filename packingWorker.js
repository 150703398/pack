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

function cloneSpace(space){
    return {...space};
}

function pack3D(container, items){
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

        let item = items[index];
        let rotations = generateRotations(item);
        for(let rot of rotations){
            for(let i=0;i<spaces.length;i++){
                let space = spaces[i];
                if(canFit(rot,space)){
                    // 放置货物
                    let newPlacement = {...rot, position:{x:space.x,y:space.y,z:space.z}, drag:item.drag};
                    let newPlacements = [...placements, newPlacement];

                    // 分割空间
                    let newSpaces = spaces.slice();
                    newSpaces.splice(i,1);
                    newSpaces.push({x:space.x+rot.width,y:space.y,z:space.z,width:space.width-rot.width,height:rot.height,depth:rot.depth});
                    newSpaces.push({x:space.x,y:space.y+rot.height,z:space.z,width:rot.width,height:space.height-rot.height,depth:rot.depth});
                    newSpaces.push({x:space.x,y:space.y,z:space.z+rot.depth,width:rot.width,height:rot.height,depth:space.depth-rot.depth});

                    // 剪枝：估算剩余空间最大可放体积
                    let remainingVolume = newSpaces.reduce((sum,s)=>sum+s.width*s.height*s.depth,0);
                    if(volumeUsed + rot.width*rot.height*rot.depth + remainingVolume < bestVolume) continue;

                    recursivePlace(index+1, newSpaces, newPlacements, volumeUsed+rot.width*rot.height*rot.depth);
                }
            }
        }
    }

    let initialSpaces = [{x:0,y:0,z:0,width:container.width,height:container.height,depth:container.depth}];
    recursivePlace(0, initialSpaces, [], 0);

    let containerVolume = container.width*container.height*container.depth;
    let utilization = bestVolume/containerVolume;

    return {placements: bestPlacements, utilization};
}

self.onmessage = function(e){
    const {container, items, mode} = e.data;

    let normalItems = items.filter(it=>!it.drag);
    let dragItems = items.filter(it=>it.drag);

    let orderedItems = [];
    if(mode==='direct'){
        orderedItems = [...items];
    }else if(mode==='drag_only'){
        orderedItems = [...dragItems];
    }else if(mode==='drag_first'){
        orderedItems = [...dragItems, ...normalItems];
    }

    // 按体积降序
    orderedItems.sort((a,b)=> (b.width*b.height*b.depth) - (a.width*a.height*a.depth));

    const {placements, utilization} = pack3D(container, orderedItems);

    self.postMessage({placements, utilization});
}
