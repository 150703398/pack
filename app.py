from flask import Flask, render_template, request, send_file
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import os

app = Flask(__name__)

# -----------------------------
# 数据结构
# -----------------------------
class Cargo:
    def __init__(self, length, width, height, name="Cargo"):
        self.length = length
        self.width = width
        self.height = height
        self.name = name
        self.position = (0, 0, 0)
        self.orientation = (length, width, height)
    
    def get_orientations(self):
        l, w, h = self.length, self.width, self.height
        return [(l, w, h), (w, l, h)]

class Pallet:
    def __init__(self, length, width, height):
        self.length = length
        self.width = width
        self.height = height
        self.cargos = []
        self.position = (0, 0, 0)

class Vehicle:
    def __init__(self, length, width, height):
        self.length = length
        self.width = width
        self.height = height
        self.cargos = []
        self.pallets = []

# -----------------------------
# 装箱算法（简单示例）
# -----------------------------
def pack_cargo(container, cargo_list):
    x, y, z = 0, 0, 0
    layer_height = 0
    for cargo in cargo_list:
        placed = False
        for ori in cargo.get_orientations():
            l, w, h = ori
            if x + l <= container.length and y + w <= container.width and z + h <= container.height:
                cargo.position = (x, y, z)
                cargo.orientation = ori
                container.cargos.append(cargo)
                x += l
                layer_height = max(layer_height, h)
                placed = True
                break
        if not placed:
            x = 0
            y += w
            if y + w > container.width:
                y = 0
                z += layer_height
                layer_height = 0
            cargo.position = (x, y, z)
            cargo.orientation = cargo.get_orientations()[0]
            container.cargos.append(cargo)
            x += cargo.orientation[0]
    return container

# -----------------------------
# 可视化
# -----------------------------
def plot_container(container, filename="layout.png"):
    fig = plt.figure()
    ax = fig.add_subplot(111, projection='3d')
    ax.set_xlim([0, container.length])
    ax.set_ylim([0, container.width])
    ax.set_zlim([0, container.height])
    
    for cargo in container.cargos:
        x, y, z = cargo.position
        l, w, h = cargo.orientation
        draw_cube(ax, x, y, z, l, w, h, color='cyan', alpha=0.6)
    
    ax.set_xlabel('Length')
    ax.set_ylabel('Width')
    ax.set_zlabel('Height')
    plt.tight_layout()
    plt.savefig(filename)
    plt.close()

def draw_cube(ax, x, y, z, l, w, h, color='cyan', alpha=0.6):
    xx = [x, x+l, x+l, x, x, x+l, x+l, x]
    yy = [y, y, y+w, y+w, y, y, y+w, y+w]
    zz = [z, z, z, z, z+h, z+h, z+h, z+h]
    vertices = [
        [(xx[0],yy[0],zz[0]), (xx[1],yy[1],zz[1]), (xx[2],yy[2],zz[2]), (xx[3],yy[3],zz[3])],
        [(xx[4],yy[4],zz[4]), (xx[5],yy[5],zz[5]), (xx[6],yy[6],zz[6]), (xx[7],yy[7],zz[7])],
        [(xx[0],yy[0],zz[0]), (xx[1],yy[1],zz[1]), (xx[5],yy[5],zz[5]), (xx[4],yy[4],zz[4])],
        [(xx[2],yy[2],zz[2]), (xx[3],yy[3],zz[3]), (xx[7],yy[7],zz[7]), (xx[6],yy[6],zz[6])],
        [(xx[1],yy[1],zz[1]), (xx[2],yy[2],zz[2]), (xx[6],yy[6],zz[6]), (xx[5],yy[5],zz[5])],
        [(xx[4],yy[4],zz[4]), (xx[7],yy[7],zz[7]), (xx[3],yy[3],zz[3]), (xx[0],yy[0],zz[0])],
    ]
    ax.add_collection3d(Poly3DCollection(vertices, facecolors=color, linewidths=1, edgecolors='r', alpha=alpha))

# -----------------------------
# Flask 路由
# -----------------------------
@app.route("/", methods=["GET", "POST"])
def index():
    image_file = None
    utilization = 0
    if request.method == "POST":
        vehicle_length = float(request.form.get("vehicle_length"))
        vehicle_width = float(request.form.get("vehicle_width"))
        vehicle_height = float(request.form.get("vehicle_height"))
        strategy = request.form.get("strategy")
        
        # 构建车辆
        vehicle = Vehicle(vehicle_length, vehicle_width, vehicle_height)
        
        # 示例货物
        cargos = [
            Cargo(50, 50, 50, "Box1"),
            Cargo(80, 40, 40, "Box2"),
            Cargo(60, 50, 30, "Box3"),
            Cargo(40, 40, 60, "Box4"),
        ]
        
        if strategy == "direct":
            packed_vehicle = pack_cargo(vehicle, cargos)
        else:  # pallet first, 简单示例
            pallet = Pallet(100, 100, 50)
            pack_cargo(pallet, cargos)
            vehicle.pallets.append(pallet)
            # 将拖板放入车辆
            for cargo in pallet.cargos:
                cargo.position = (cargo.position[0], cargo.position[1], cargo.position[2])
                vehicle.cargos.append(cargo)
            packed_vehicle = vehicle
        
        # 空间利用率计算
        total_cargo_volume = sum([c.orientation[0]*c.orientation[1]*c.orientation[2] for c in packed_vehicle.cargos])
        vehicle_volume = vehicle.length * vehicle.width * vehicle.height
        utilization = round(total_cargo_volume / vehicle_volume * 100, 2)
        
        # 生成布局图片
        image_file = "static/layout.png"
        os.makedirs("static", exist_ok=True)
        plot_container(packed_vehicle, filename=image_file)
    
    return render_template("index.html", image_file=image_file, utilization=utilization)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
