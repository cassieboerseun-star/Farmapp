/* =========================
   FARM ERP – STABLE BUILD
   Animals + Charts + Finance
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [],
  sheep: [],
  broilers: [],
  worms: [],
  invoices: [],
  expenses: []
};

function save() {
  localStorage.setItem("farmdb", JSON.stringify(db));
}

function today() {
  return new Date().toISOString().split("T")[0];
}

/* =========================
   NAVIGATION
========================= */

function show(screen) {
  if (screen === "dashboard") {
    let income = db.invoices.reduce((s, i) => s + i.paid, 0);
    let expenses = db.expenses.reduce((s, e) => s + e.amount, 0);
    let net = income - expenses;

    document.getElementById("screen").innerHTML = `
      <div class="card">Income: ${income}</div>
      <div class="card">Expenses: ${expenses}</div>
      <div class="card"><b>Net Profit: ${net}</b></div>
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
      <button onclick="newInvoice()">➕ New Invoice</button>
      <button onclick="newExpense()">➕ New Expense</button>

      <h3>Invoices</h3>
      ${db.invoices.map((i, idx) => `
        <div class="card" onclick="viewInvoice(${idx})">
          ${i.number} – ${i.status}
        </div>
      `).join("")}

      <h3>Expenses</h3>
      ${db.expenses.map(e => `
        <div class="card">${e.date} – ${e.category}: ${e.amount}</div>
      `).join("")}
    `;
  }
}

/* =========================
   ANIMALS
========================= */

function animalList(type) {
  document.getElementById("screen").innerHTML = `
    <h2>${type.toUpperCase()}</h2>

    <input id="name" placeholder="Animal ID / Name">
    <input id="weight" type="number" placeholder="Weight (kg)">
    <button onclick="addAnimal('${type}')">Add Animal</button>

    ${db[type].map((a, i) => `
      <div class="card" onclick="viewAnimal('${type}', ${i})">
        ${a.name} – ${a.history[a.history.length - 1].weight} kg
      </div>
    `).join("")}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type) {
  let name = document.getElementById("name").value;
  let weight = Number(document.getElementById("weight").value);

  if (!name || !weight) {
    alert("Enter name and weight");
    return;
  }

  db[type].push({
    name: name,
    history: [{ date: today(), weight: weight }]
  });

  save();
  animalList(type);
}

function viewAnimal(type, index) {
  let a = db[type][index];
  let h = a.history;

  document.getElementById("screen").innerHTML = `
    <h2>${a.name}</h2>

    <div class="card">
      Latest weight: ${h[h.length - 1].weight} kg
    </div>

    <input id="nw" type="number" placeholder="New weight (kg)">
    <button onclick="addWeight('${type}', ${index})">Add Weight</button>

    <h3>Weight History</h3>
    ${h.map(x => `
      <div class="card">${x.date}: ${x.weight} kg</div>
    `).join("")}

    <h3>Weight Chart</h3>
    ${weightChart(h)}

    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function addWeight(type, index) {
  let w = Number(document.getElementById("nw").value);
  if (!w) {
    alert("Enter weight");
    return;
  }

  db[type][index].history.push({
    date: today(),
    weight: w
  });

  save();
  viewAnimal(type, index);
}

function weightChart(history) {
  let max = Math.max(...history.map(h => h.weight));
  return history.map(h => {
    let width = Math.max(10, (h.weight / max) * 100);
    return `
      <div style="
        background:#2563eb;
        color:white;
        padding:4px;
        margin:4px 0;
        border-radius:6px;
        width:${width}%">
        ${h.weight} kg
      </div>
    `;
  }).join("");
}

/* =========================
   FINANCE
========================= */

function newInvoice() {
  document.getElementById("screen").innerHTML = `
    <input id="amt" type="number" placeholder="Invoice amount">
    <button onclick="saveInvoice()">Save Invoice</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoice() {
  let amt = Number(document.getElementById("amt").value);
  if (!amt) return alert("Enter amount");

  db.invoices.push({
    number: "INV-" + (db.invoices.length + 1),
    total: amt,
    paid: 0,
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
    <div class="card">Paid: ${inv.paid}</div>
    <div class="card">Status: ${inv.status}</div>

    <input id="pay" type="number" placeholder="Payment amount">
    <button onclick="addPayment(${i})">Add Payment</button>

    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function addPayment(i) {
  let p = Number(document.getElementById("pay").value);
  if (!p) return;

  let inv = db.invoices[i];
  inv.paid += p;
  inv.status = inv.paid >= inv.total ? "PAID" : "PARTIAL";

  save();
  viewInvoice(i);
}

function newExpense() {
  document.getElementById("screen").innerHTML = `
    <input id="cat" placeholder="Expense category">
    <input id="amt" type="number" placeholder="Amount">
    <button onclick="saveExpense()">Save Expense</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveExpense() {
  let cat = document.getElementById("cat").value;
  let amt = Number(document.getElementById("amt").value);
  if (!cat || !amt) return;

  db.expenses.push({
    date: today(),
    category: cat,
    amount: amt
  });

  save();
  show("finance");
}

/* =========================
   START APP
========================= */

show("dashboard");
