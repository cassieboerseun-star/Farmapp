let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [], sheep: [], broilers: [], worms: [],
  invoices: []
};

function save() {
  localStorage.setItem("farmdb", JSON.stringify(db));
}

function show(screen) {
  if (screen === "dashboard") {
    document.getElementById("screen").innerHTML = `
      <div class="card">🐄 Cows: ${db.cows.length}</div>
      <div class="card">🧾 Invoices: ${db.invoices.length}</div>
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

  if (screen === "finance") {
    document.getElementById("screen").innerHTML = `
      <h2>Invoices</h2>
      <button onclick="newInvoice()">➕ New Invoice</button>
      ${db.invoices.map((i,idx)=>`
        <div class="card" onclick="viewInvoice(${idx})">
          ${i.number} – ${i.total} – ${i.status}
        </div>`).join("")}
    `;
  }
}

/* ---------- FINANCE ---------- */

function newInvoice() {
  document.getElementById("screen").innerHTML = `
    <input id="amt" type="number" placeholder="Amount">
    <button onclick="saveInvoice()">Save Invoice</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoice() {
  let amt = Number(document.getElementById("amt").value);
  if (!amt) return alert("Enter amount");

  let num = "INV-" + (db.invoices.length + 1);
  db.invoices.push({
    number: num,
    total: amt,
    status: "UNPAID"
  });

  save();
  show("finance");
}

function viewInvoice(i) {
  let inv = db.invoices[i];
  document.getElementById("screen").innerHTML = `
    <h3>${inv.number}</h3>
    <div class="card">Total: ${inv.total}</div>
    <div class="card">Status: ${inv.status}</div>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

/* ---------- ANIMALS ---------- */

function animalList(type) {
  document.getElementById("screen").innerHTML = `
    <h2>${type.toUpperCase()}</h2>
    <input id="name" placeholder="Name / ID">
    <button onclick="addAnimal('${type}')">Add</button>
    ${db[type].map(a => `<div class="card">${a.name}</div>`).join("")}
    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type) {
  let n = document.getElementById("name").value;
  if (!n) return alert("Enter name");
  db[type].push({ name: n });
  save();
  animalList(type);
}

show("dashboard");
