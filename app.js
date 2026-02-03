let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [], sheep: [], broilers: [], worms: []
};

function save() {
  localStorage.setItem("farmdb", JSON.stringify(db));
}

function show(screen) {
  if (screen === "dashboard") {
    document.getElementById("screen").innerHTML = `
      <div class="card">🐄 Cows: ${db.cows.length}</div>
      <div class="card">🐑 Sheep: ${db.sheep.length}</div>
      <div class="card">🐔 Broilers: ${db.broilers.length}</div>
      <div class="card">🪱 Worm bins: ${db.worms.length}</div>
    `;
  }

  if (screen === "animals") {
    document.getElementById("screen").innerHTML = `
      <button onclick="animalList('cows')">🐄 Cows</button>
      <button onclick="animalList('sheep')">🐑 Sheep</button>
      <button onclick="animalList('broilers')">🐔 Broilers</button>
      <button onclick="animalList('worms')">🪱 Worms</button>
    `;
  }
}

function animalList(type) {
  document.getElementById("screen").innerHTML = `
    <h2>${type.toUpperCase()}</h2>

    <input id="name" placeholder="ID / Name">
    <input id="weight" type="number" placeholder="Weight (kg)">
    <button onclick="addAnimal('${type}')">Add New</button>

    ${db[type].map((a,i)=>`
      <div class="card" onclick="viewAnimal('${type}',${i})">
        ${a.name} – ${a.history[a.history.length-1].weight} kg
      </div>`).join("")}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type) {
  let name = nameInput();
  let weight = weightInput();
  if(!name || !weight) return alert("Enter name & weight");

  db[type].push({
    name,
    history: [{ date: today(), weight }]
  });
  save();
  animalList(type);
}

function viewAnimal(type, index) {
  let a = db[type][index];
  let h = a.history;
  let gain = h.length > 1
    ? (h[h.length-1].weight - h[h.length-2].weight).toFixed(2)
    : "0";

  let alert = gain < 0.2 && h.length > 1
    ? "<div class='card' style='background:#fee'>⚠ Low gain</div>"
    : "";

  document.getElementById("screen").innerHTML = `
    <h2>${a.name}</h2>
    <div class="card">Latest: ${h[h.length-1].weight} kg</div>
    <div class="card">Last gain: ${gain} kg</div>
    ${alert}

    <input id="newWeight" type="number" placeholder="New weight (kg)">
    <button onclick="addWeight('${type}',${index})">Add Weight</button>

    <h3>History</h3>
    ${h.map(w=>`<div class="card">${w.date}: ${w.weight} kg</div>`).join("")}

    <h3>Chart</h3>
    ${chart(h)}

    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function addWeight(type,index){
  let w = Number(document.getElementById("newWeight").value);
  if(!w) return alert("Enter weight");

  db[type][index].history.push({ date: today(), weight: w });
  save();
  viewAnimal(type,index);
}

/* helpers */
function today(){ return new Date().toISOString().split("T")[0]; }
function nameInput(){ return document.getElementById("name").value; }
function weightInput(){ return Number(document.getElementById("weight").value); }

function chart(history){
  let max = Math.max(...history.map(h=>h.weight));
  return history.map(h=>{
    let width = (h.weight / max * 100).toFixed(0);
    return `<div style="background:#2563eb;color:#fff;margin:4px 0;padding:4px;width:${width}%">
      ${h.weight} kg
    </div>`;
  }).join("");
}

show("dashboard");
