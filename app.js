function viewAnimal(type,i){
  let a = db[type][i];
  let h = a.history;

  document.getElementById("screen").innerHTML = `
    <h2>${a.name}</h2>

    <div class="card">
      Latest weight: ${h[h.length-1].weight} kg
    </div>

    <input id="nw" type="number" placeholder="New weight (kg)">
    <button onclick="addWeight('${type}',${i})">Add Weight</button>

    <h3>History</h3>
    ${h.map(x=>`<div class="card">${x.date}: ${x.weight} kg</div>`).join("")}

    <h3>Weight Chart</h3>
    ${weightChart(h)}

    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}
