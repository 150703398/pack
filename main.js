let containers = [];
let items = [];

const unitSelect = document.getElementById('unitSelect');
const containersUl = document.getElementById('containersUl');
const itemsUl = document.getElementById('itemsUl');
const dragUl = document.getElementById('dragUl');
const utilizationSpan = document.getElementById('utilization');
const recommendedSpan = document.getElementById('recommendedContainer');

const worker = new Worker('packingWorker.js');

// --- 添加车厢 ---
document.getElementById('addContainer').onclick = ()=>{
    const unit = unitSelect.value;
    const w = parseFloat(prompt(`车厢宽度 (${unit})`,"10"));
    const h = parseFloat(prompt(`车厢高度 (${unit})`,"5"));
    const d = parseFloat(prompt(`车厢深度 (${unit})`,"5"));
    const name = prompt("车厢名称","车厢X");
    if(!isNaN(w)&&!isNaN(h)&&!isNaN(d)){
        containers.push({name, width:w,height:h,depth:d,unit});
        renderContainers();
        recommendContainer();
    }
};

function renderContainers(){
    containersUl.innerHTML='';
    containers.forEach((c,i)=>{
        const li = document.createElement('li');
        li.textContent = `${c.name}: W:${c.width}${c.unit} H:${c.height}${c.unit} D:${c.depth}${c.unit}`;
        containersUl.appendChild(li);
    });
}

// --- 添加货物 ---
document.getElementById('addItem').onclick = ()=>{
    const unit = unitSelect.value;
    const name = prompt("请输入货物/拖挂名称","货物X");
    const w = parseFloat(prompt(`宽度 (${unit})`,"1"));
    const h = parseFloat(prompt(`高度 (${unit})`,"1"));
    const d = parseFloat(prompt(`深度 (${unit})`,"1"));
    const drag = confirm("是否为拖挂货物？");
    if(!isNaN(w)&&!isNaN(h)&&!isNaN(d)){
        items.push({name,width:w,height:h,depth:d,drag,unit});
        renderItems();
        recommendContainer();
    }
};

function renderItems(){
    itemsUl.innerHTML='';
    dragUl.innerHTML='';
    items.forEach(item=>{
        const li = document.createElement('li');
        li.textContent = `${item.name}: W:${item.width}${item.unit} H:${item.height}${item.unit} D:${item.depth}${item.unit} ${item.drag?"(拖)":""}`;
        itemsUl.appendChild(li);
        if(item.drag){
            const liDrag = li.cloneNode(true);
            dragUl.appendChild(liDrag);
        }
    });
}

// --- 推荐车厢 ---
function recommendContainer(){
    let recommendations = items.map(item=>{
        if(item.drag) return null;
        let suitable = containers.filter(c=>c.width*c.height*c.depth >= item.width*item.height*item.depth);
        if(suitable.length==0) return null;
        suitable.sort((a,b)=>a.width*a.height*a.depth - b.width*b.height*b.depth);
        return {item:item.name, container:suitable[0].name};
    }).filter(x=>x!==null);
    recommendedSpan.innerHTML = recommendations.map(r=>`${r.item} → ${r.container}`).join('<br>');
}

// --- 开始装箱 ---
document.getElementById('runPacking').onclick = ()=>{
    if(containers.length===0||items.length===0){
        alert("请先添加车厢和货物！");
        return;
    }
    const mode = document.getElementById('modeSelect').value;
    worker.postMessage({containers, items, mode});
};

// --- 接收结果 ---
worker.onmessage = function(e){
    const {allPlacements, utilization} = e.data;
    utilizationSpan.textContent = `体积利用率: ${(utilization*100).toFixed(2)}%`;
    render3D(allPlacements);
};

// --- Three.js 3D 渲染 ---
let scene, camera, renderer, controls;
function init3D(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/600, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth,600);
    document.getElementById('viewer').appendChild(renderer.domElement);

    camera.position.set(40,25,40);
    controls = new THREE.OrbitControls(camera,renderer.domElement);
    controls.update();

    scene.add(new THREE.AmbientLight(0x404040));
    const light = new THREE.DirectionalLight(0xffffff,1);
    light.position.set(30,40,30);
    scene.add(light);

    const grid = new THREE.GridHelper(200,200);
    scene.add(grid);
}
function render3D(allPlacements){
    scene.children = scene.children.filter(obj=>obj.type!=='Mesh');

    let offsetX=0;
    allPlacements.forEach((containerPlacements, idx)=>{
        const c = containers[idx];
        const geo = new THREE.BoxGeometry(c.width,c.height,c.depth);
        const wire = new THREE.LineSegments(
            new THREE.EdgesGeometry(geo),
            new THREE.LineBasicMaterial({color:0x000000})
        );
        wire.position.set(offsetX + c.width/2, c.height/2, c.depth/2);
        scene.add(wire);

        containerPlacements.forEach(item=>{
            const geometry = new THREE.BoxGeometry(item.width,item.height,item.depth);
            const material = new THREE.MeshPhongMaterial({color:item.drag?0xff5555:Math.random()*0xffffff});
            const cube = new THREE.Mesh(geometry,material);
            cube.position.set(offsetX + item.position.x + item.width/2,
                              item.position.y + item.height/2,
                              item.position.z + item.depth/2);
            scene.add(cube);
        });
        offsetX += c.width + 2;
    });
    renderer.render(scene,camera);
}

init3D();
