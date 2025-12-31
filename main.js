let containers = [];
let items = [];
const unitSelect = document.getElementById('unitSelect');
const containersUl = document.getElementById('containersUl');
const itemsUl = document.getElementById('itemsUl');
const utilizationSpan = document.getElementById('utilization');

const worker = new Worker('packingWorker.js');

// 添加车厢
document.getElementById('addContainer').onclick = ()=>{
    const unit = unitSelect.value;
    const w = parseFloat(prompt(`车厢宽度 (${unit})`,"10"));
    const h = parseFloat(prompt(`车厢高度 (${unit})`,"5"));
    const d = parseFloat(prompt(`车厢深度 (${unit})`,"5"));
    if(!isNaN(w)&&!isNaN(h)&&!isNaN(d)){
        containers.push({width:w,height:h,depth:d,unit:unit});
        renderContainers();
    }
};

// 添加货物
document.getElementById('addItem').onclick = ()=>{
    const unit = unitSelect.value;
    const w = parseFloat(prompt(`货物宽度 (${unit})`,"1"));
    const h = parseFloat(prompt(`货物高度 (${unit})`,"1"));
    const d = parseFloat(prompt(`货物深度 (${unit})`,"1"));
    const drag = confirm("是否为拖挂货物？");
    if(!isNaN(w)&&!isNaN(h)&&!isNaN(d)){
        items.push({width:w,height:h,depth:d,drag:drag,unit:unit});
        renderItems();
    }
};

function renderContainers(){
    containersUl.innerHTML = '';
    containers.forEach((c,i)=>{
        const li = document.createElement('li');
        li.textContent = `车厢${i+1}: W:${c.width}${c.unit} H:${c.height}${c.unit} D:${c.depth}${c.unit}`;
        containersUl.appendChild(li);
    });
}

function renderItems(){
    itemsUl.innerHTML = '';
    items.forEach((item,i)=>{
        const li = document.createElement('li');
        li.textContent = `货物${i+1}: W:${item.width}${item.unit} H:${item.height}${item.unit} D:${item.depth}${item.unit} ${item.drag?"(拖)":""}`;
        itemsUl.appendChild(li);
    });
}

// 开始装箱
document.getElementById('runPacking').onclick = ()=>{
    if(containers.length===0||items.length===0){
        alert("请先添加车厢和货物！");
        return;
    }
    const mode = document.getElementById('modeSelect').value;
    worker.postMessage({containers, items, mode});
};

// 接收结果
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
    renderer.setSize(window.innerWidth, 600);
    document.getElementById('viewer').appendChild(renderer.domElement);

    camera.position.set(30,20,30);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();

    scene.add(new THREE.AmbientLight(0x404040));
    const light = new THREE.DirectionalLight(0xffffff,1);
    light.position.set(20,40,20);
    scene.add(light);

    const grid = new THREE.GridHelper(100,100);
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
        wire.position.set(offsetX + c.width/2,c.height/2,c.depth/2);
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

        offsetX += c.width + 2; // 每个车厢间隔
    });

    renderer.render(scene,camera);
}

init3D();
