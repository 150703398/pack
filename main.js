let containers=[], items=[], drags=[];

const unitSelect = document.getElementById('unitSelect');
const containersUl = document.getElementById('containersUl');
const itemsUl = document.getElementById('itemsUl');
const dragUl = document.getElementById('dragUl');
const selectContainer = document.getElementById('selectContainer');
const utilizationSpan = document.getElementById('utilization');

const worker = new Worker('packingWorker.js');

// --- 保存 / 加载数据 ---
function saveData(){
    localStorage.setItem('containers', JSON.stringify(containers));
    localStorage.setItem('items', JSON.stringify(items));
    localStorage.setItem('drags', JSON.stringify(drags));
}
function loadData(){
    containers = JSON.parse(localStorage.getItem('containers') || '[]');
    items = JSON.parse(localStorage.getItem('items') || '[]');
    drags = JSON.parse(localStorage.getItem('drags') || '[]');
    renderContainers();
    renderItems();
    renderDrags();
    updateContainerSelect();
}
window.onload = loadData;

// --- 添加车厢 ---
document.getElementById('addContainer').onclick = ()=>{
    const name = prompt("车厢名称","车厢X");
    if(!name) return;
    const unit = unitSelect.value;
    const w = parseFloat(prompt(`车厢宽度 (${unit})`,"10"));
    const h = parseFloat(prompt(`车厢高度 (${unit})`,"5"));
    const d = parseFloat(prompt(`车厢深度 (${unit})`,"5"));
    if(!isNaN(w)&&!isNaN(h)&&!isNaN(d)){
        const id = Date.now();
        containers.push({id,name,width:w,height:h,depth:d,unit});
        saveData();
        renderContainers();
        updateContainerSelect();
    }
};

function renderContainers(){
    containersUl.innerHTML='';
    containers.forEach(c=>{
        const li = document.createElement('li');
        li.textContent = `${c.name}: W:${c.width}${c.unit} H:${c.height}${c.unit} D:${c.depth}${c.unit}`;
        containersUl.appendChild(li);
    });
}

function updateContainerSelect(){
    selectContainer.innerHTML='';
    containers.forEach(c=>{
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.textContent = c.name;
        selectContainer.appendChild(opt);
    });
}

// --- 添加货物 ---
document.getElementById('addItem').onclick = ()=>{
    const unit = unitSelect.value;
    const name = prompt("货物名称","货物X");
    const w = parseFloat(prompt(`宽度 (${unit})`,"1"));
    const h = parseFloat(prompt(`高度 (${unit})`,"1"));
    const d = parseFloat(prompt(`深度 (${unit})`,"1"));
    if(!isNaN(w)&&!isNaN(h)&&!isNaN(d)){
        const id = Date.now();
        items.push({id,name,width:w,height:h,depth:d,unit});
        saveData();
        renderItems();
    }
};

function renderItems(){
    itemsUl.innerHTML='';
    items.forEach(item=>{
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type='checkbox';
        checkbox.dataset.id=item.id;
        const input = document.createElement('input');
        input.type='number'; input.min=1; input.value=1; input.style.width='50px';
        input.dataset.id=item.id;
        li.appendChild(checkbox);
        li.append(` ${item.name} W:${item.width}${item.unit} H:${item.height}${item.unit} D:${item.depth}${item.unit} 数量: `);
        li.appendChild(input);
        itemsUl.appendChild(li);
    });
}

// --- 添加拖挂 ---
document.getElementById('addDrag').onclick = ()=>{
    const unit = unitSelect.value;
    const name = prompt("拖挂名称","拖挂X");
    const w = parseFloat(prompt(`宽度 (${unit})`,"2"));
    const h = parseFloat(prompt(`高度 (${unit})`,"1"));
    const d = parseFloat(prompt(`深度 (${unit})`,"1"));
    if(!isNaN(w)&&!isNaN(h)&&!isNaN(d)){
        const id = Date.now();
        drags.push({id,name,width:w,height:h,depth:d,unit,items:[]});
        saveData();
        renderDrags();
    }
};

function renderDrags(){
    dragUl.innerHTML='';
    drags.forEach(d=>{
        const li = document.createElement('li');
        const checkbox = document.createElement('input');
        checkbox.type='checkbox';
        checkbox.dataset.id=d.id;
        li.appendChild(checkbox);
        li.append(` ${d.name} W:${d.width}${d.unit} H:${d.height}${d.unit} D:${d.depth}${d.unit}`);
        dragUl.appendChild(li);
    });
}

// --- 开始装箱 ---
document.getElementById('runPacking').onclick = ()=>{
    const containerId = parseInt(selectContainer.value);
    const selectedContainer = containers.find(c => c.id === containerId);
    if(!selectedContainer){ alert("请选择车厢"); return; }

    let selectedItems=[];
    document.querySelectorAll('#itemsUl li').forEach(li=>{
        const checkbox = li.querySelector('input[type=checkbox]');
        const input = li.querySelector('input[type=number]');
        if(checkbox.checked){
            const count=parseInt(input.value);
            if(count>0){
                const id=parseInt(checkbox.dataset.id);
                const item = items.find(i => i.id === id);
                for(let i=0;i<count;i++) selectedItems.push({...item});
            }
        }
    });

    let selectedDrags=[];
    document.querySelectorAll('#dragUl li').forEach(li=>{
        const checkbox = li.querySelector('input[type=checkbox]');
        if(checkbox.checked){
            const id=parseInt(checkbox.dataset.id);
            const d = drags.find(dr => dr.id === id);
            selectedDrags.push({...d});
        }
    });

    if(selectedItems.length===0 && selectedDrags.length===0){
        alert("请选择货物或拖挂"); return;
    }

    worker.postMessage({
        packingData:{container:selectedContainer, items:selectedItems, drags:selectedDrags}
    });
};

// --- 接收 Worker 结果 ---
worker.onmessage = function(e){
    const {placements, utilization} = e.data;
    utilizationSpan.textContent = `体积利用率: ${(utilization*100).toFixed(2)}%`;
    render3D(placements);
};

// --- Three.js 3D ---
let scene,camera,renderer,controls;
function init3D(){
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75,window.innerWidth/600,0.1,1000);
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
    allPlacements.forEach(placement=>{
        const c = placement.container;
        const containerGeo = new THREE.BoxGeometry(c.width,c.height,c.depth);
        const wire = new THREE.LineSegments(new THREE.EdgesGeometry(containerGeo),
            new THREE.LineBasicMaterial({color:0x000000}));
        wire.position.set(c.width/2,c.height/2,c.depth/2);
        scene.add(wire);

        placement.items.forEach(item=>{
            const geometry = new THREE.BoxGeometry(item.width,item.height,item.depth);
            const material = new THREE.MeshPhongMaterial({color:item.isDrag?0xff5555:Math.random()*0xffffff});
            const cube = new THREE.Mesh(geometry,material);
            cube.position.set(item.position.x+item.width/2,item.position.y+item.height/2,item.position.z+item.depth/2);
            scene.add(cube);
        });
    });
    renderer.render(scene,camera);
}
init3D();
