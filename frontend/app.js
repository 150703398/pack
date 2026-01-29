const API = "https://packing-proxy.xxx.workers.dev"

const table = document.getElementById("table")
table.innerHTML = `
<tr>
<th>L</th><th>W</th><th>H</th>
<th>kg</th><th>碎</th><th>堆</th>
</tr>
`

function add(){
  table.innerHTML += `
  <tr>
  <td><input value="100"></td>
  <td><input value="80"></td>
  <td><input value="60"></td>
  <td><input value="50"></td>
  <td><input type="checkbox"></td>
  <td><input type="checkbox" checked></td>
  </tr>`
}
add()

let scene, camera, renderer, controls

function run(){
  const cargos = [...table.querySelectorAll("tr")]
    .slice(1)
    .map((r,i)=>{
      const c=r.querySelectorAll("input")
      return {
        id:"C"+i,
        length:+c[0].value,
        width:+c[1].value,
        height:+c[2].value,
        weight:+c[3].value,
        fragile:c[4].checked,
        stackable:c[5].checked
      }
    })

  fetch(API,{
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify({
      container:{
        length:+cl.value,
        width:+cw.value,
        height:+ch.value
      },
      cargos
    })
  }).then(r=>r.json()).then(draw)
}

function draw(data){
  scene = new THREE.Scene()
  camera = new THREE.PerspectiveCamera(60,(innerWidth-400)/innerHeight,1,5000)
  camera.position.set(800,500,800)

  renderer = new THREE.WebGLRenderer()
  renderer.setSize(innerWidth-400,innerHeight)
  view.innerHTML=""
  view.appendChild(renderer.domElement)

  controls = new THREE.OrbitControls(camera,renderer.domElement)
  scene.add(new THREE.AmbientLight(0xffffff,.8))

  data.placements.forEach(p=>{
    const g=new THREE.BoxGeometry(p.length,p.height,p.width)
    const m=new THREE.MeshLambertMaterial({color:p.fragile?0xff5555:0x55aaff})
    const b=new THREE.Mesh(g,m)
    b.position.set(p.x,p.y+p.height/2,p.z)
    scene.add(b)
  })

  ;(function anim(){
    requestAnimationFrame(anim)
    controls.update()
    renderer.render(scene,camera)
  })()
}
