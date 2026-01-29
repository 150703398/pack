const table = document.getElementById("table")
table.innerHTML = "<tr><th>L</th><th>W</th><th>H</th><th>kg</th><th>碎</th><th>堆</th></tr>"

function add(){
  table.innerHTML += `<tr>
  <td><input value="100"></td>
  <td><input value="80"></td>
  <td><input value="60"></td>
  <td><input value="50"></td>
  <td><input type="checkbox"></td>
  <td><input type="checkbox" checked></td>
  </tr>`
}
add()
