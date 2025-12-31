let items = [];
const itemsUl = document.getElementById('itemsUl');
const worker = new Worker('packingWorker.js');
const utilizationSpan = document.getElementById('utilization');

// 渲染货物列表
function renderItems(){
    itemsUl.innerHTML = '';
    items.forEach((item, idx)=>{
        const li = document.createElement('li');
        li.textContent = `W:${item.width} H:${item.height} D:${item.depth} ${item.drag?"(拖)":""}`;
        const delBtn = document.createElement('button');
        delBtn.textContent = '删除';
        delBtn.onclick = ()=>{ items.splice(idx,1); renderItems(); }
        li.appendChild(delBtn);
        itemsUl.appendChild(li);
    });
}

// 添加货物
document.getElementById('addItem').onclick = ()=>{
    const w = parseFloat(prompt("货物宽度", "1"));
    const h = parseFloat(prompt("货物高度", "1"));
    const d = parseFloat(prompt("货物深度", "1"));
    const drag = confirm("是否为拖挂货物？");
    if(!isNaN(w)&&!isNaN(h)&&!isNaN(d)){
        items.push({width:w,height:h,depth:d,drag:drag});
        renderItems();
    }
};

// 开始装箱
document.getElementById('runPacking').onclick = ()=>{
    const container = {
        width: parseFloat(document.getElementById('containerWidth').value),
        height: parseFloat(document.getElementById('containerHeight').value),
        depth: parseFloat(document.getElementById('containerDepth').value)
    };
    const mode = document.getElementById('modeSelect').value;
    worker.postMessage({container, items, mode});
};

// 接收装箱结果
worker.onmessage = function(e){
    const {placements, utilization} = e.data;
    utilizationSpan.textContent = `体积利用率: ${(utilization*100).toFixed(2)}%`;
    render3D(placements);
};

// --- Three.js 3D 渲染 ---
let scene, camera, renderer, controls;
function init3D(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/500, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({antialias:true});
    renderer.setSize(window.innerWidth, 500);
    document.getElementById('viewer').appendChild(renderer.domElement);

    camera.position.set(15,15,15);
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.update();

    const light = new THREE.DirectionalLight(0xffffff,1);
    light.position.set(10,20,10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    const grid = new THREE.GridHelper(20,20);
    scene.add(grid);
}

function render3D(placements){
    scene.children = scene.children.filter(obj=>obj.type!=='Mesh');

    // 车厢线框
    const container = new THREE.BoxGeometry(
        parseFloat(document.getElementById('containerWidth').value),
        parseFloat(document.getElementById('containerHeight').value),
        parseFloat(document.getElementById('containerDepth').value)
    );
    const wire = new THREE.LineSegments(
        new THREE.EdgesGeometry(container),
        new THREE.LineBasicMaterial({color:0x000000})
    );
    wire.position.set(container.parameters.width/2, container.parameters.height/2, container.parameters.depth/2);
    scene.add(wire);

    placements.forEach(item=>{
        const geometry = new THREE.BoxGeometry(item.width,item.height,item.depth);
        const material = new THREE.MeshPhongMaterial({color: item.drag?0xff5555:Math.random()*0xffffff});
        const cube = new THREE.Mesh(geometry,material);
        cube.position.set(item.position.x+item.width/2, item.position.y+item.height/2, item.position.z+item.depth/2);
        scene.add(cube);
    });

    renderer.render(scene,camera);
}

init3D();
