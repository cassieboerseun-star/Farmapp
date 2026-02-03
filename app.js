let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [],
  sheep: [],
  broilers: [],
  worms: []
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
  const list = db[type];

  document.getElementById("screen").innerHTML = `
    <h2>${type.toUpperCase()}</h2>

    <input id="name" placeholder="ID / Name">
    <input id="weight" type="number" placeholder="Weight (kg)">
    <button onclick="addAnimal('${type}')">Add</button>

    ${list.map(a =>
      `<div class="card">${a.name} – ${a.weight} kg</div>`
    ).join("")}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type) {
  const name = document.getElementById("name").value;
  const weight = document.getElementById("weight").value;

  if (!name || !weight) {
    alert("Enter name and weight");
    return;
  }

  db[type].push({
    name,
    weight: Number(weight),
    history: [
      {
        date: new Date().toISOString().split("T")[0],
        weight: Number(weight)
      }
    ]
  });

  save();
  animalList(type);
}

show("dashboard");
