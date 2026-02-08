/* =========================
   FARM ERP – CORE + WEIGHT HISTORY
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [],
  sheep: [],
  broilers: [],
  worms: [],
  invoices: [],
  expenses: []
};

/* ===== AUTO-MIGRATE OLD ANIMALS ===== */
["cows","sheep","broilers","worms"].forEach(t=>{
  db[t] = db[t].map(a=>{
    if(a.weights) return a;
    return {
      name: a.name,
      weights: [{ date: today(), weight: a.weight }]
    };
  });
});

function save() {
  localStorage.setItem("farmdb", JSON.stringify(db));
}

function today() {
  return new Date().toISOString().split("T")[0];
}

function screenEl() {
  return document.getElementById("screen");
}

/* =========================
   NAVIGATION
========================= */

function show(screen) {
  if (screen === "dashboard") {
    let income = db.invoices.reduce((s, i) => s + (i.paid || 0), 0);
    let exp = db.expenses.reduce((s, e) => s + e.amount, 0);

    screenEl().innerHTML = `
      <div class="card">💰 Income: ${income}</div>
      <div class="card">💸 Expenses: ${exp}</div>
      <div class="card"><b>📈 Net Profit: ${income - exp}</b></div>
    `;
  }

  if (screen === "animals") {
    screenEl().innerHTML = `
      <button onclick="animalList('cows')">🐄 Cows</button>
      <button onclick="animalList('sheep')">🐑 Sheep</button>
      <button onclick="animalList('broilers')">🐔 Broilers</button>
      <button onclick="animalList('worms')">🪱 Worms</button>
    `;
  }

  if (screen === "finance") {
    screenEl().innerHTML = `
      <button onclick="newInvoice()">➕ New Invoice</button>
      <button onclick="newExpense()">➕ New Expense</button>

      <h3>Invoices</h3>
      ${db.invoices.map((i, idx) => `
        <div class="card" onclick="viewInvoice(${idx})">
          ${i.number} | ${i.status} | Balance: ${i.balance}
        </div>
      `).join("") || "<div class='card'>No invoices</div>"}

      <h3>Expenses</h3>
      ${db.expenses.map(e => `
        <div class="card">${e.date} – ${e.category}: ${e.amount}</div>
      `).join("") || "<div class='card'>No expenses</div>"}
    `;
  }
}

/* =========================
   ANIMALS — WEIGHT HISTORY
========================= */

function animalList(type) {
  screenEl().innerHTML = `
    <h2>${type.toUpperCase()}</h2>

    <input id="aname" placeholder="Animal name / ID">
    <input id="aweight" type="number" placeholder="Starting weight (kg)">
    <button onclick="addAnimal('${type}')">➕ Add</button>

    ${db[type].map((a, i) => `
      <div class="card" onclick="viewAnimal('${type}', ${i})">
        ${a.name} – ${a.weights[a.weights.length - 1].weight} kg
      </div>
    `).join("") || "<div class='card'>No animals</div>"}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type) {
  let n = aname.value;
  let w = Number(aweight.value);
  if (!n || !w) return alert("Enter name and weight");

  db[type].push({
    name: n,
    weights: [{ date: today(), weight: w }]
  });
  save();
  animalList(type);
}

function viewAnimal(type, index) {
  let a = db[type][index];

  screenEl().innerHTML = `
    <h2>${a.name}</h2>

    <label>Name</label>
    <input id="ename" value="${a.name}">
    <button onclick="saveAnimalName('${type}', ${index})">💾 Save Name</button>

    <h3>Add Weight</h3>
    <input id="w" type="number" placeholder="Weight (kg)">
    <button onclick="addWeight('${type}', ${index})">➕ Add Weight</button>

    <h3>Weight History</h3>
    ${a.weights.map(x => `
      <div class="card">${x.date}: ${x.weight} kg</div>
    `).join("")}

    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function saveAnimalName(type, index) {
  db[type][index].name = ename.value;
  save();
  viewAnimal(type, index);
}

function addWeight(type, index) {
  let w = Number(document.getElementById("w").value);
  if (!w) return alert("Enter weight");

  db[type][index].weights.push({
    date: today(),
    weight: w
  });
  save();
  viewAnimal(type, index);
}

/* =========================
   INVOICES (UNCHANGED)
========================= */

function newInvoice() {
  db.invoices.push({
    number: "INV-" + (db.invoices.length + 1),
    total: 0,
    paid: 0,
    balance: 0,
    payments: [],
    status: "UNPAID"
  });
  save();
  show("finance");
}

function viewInvoice(i) {
  let inv = db.invoices[i];
  screenEl().innerHTML = `
    <input id="invtotal" type="number" value="${inv.total}">
    <button onclick="saveInvoice(${i})">💾 Save</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoice(i) {
  let inv = db.invoices[i];
  inv.total = Number(invtotal.value);
  inv.balance = inv.total - inv.paid;
  save();
  show("finance");
}

/* =========================
   EXPENSES (UNCHANGED)
========================= */

function newExpense() {
  let c = prompt("Category");
  let a = Number(prompt("Amount"));
  if (!c || !a) return;

  db.expenses.push({
    date: today(),
    category: c,
    amount: a
  });

  save();
  show("finance");
}

/* =========================
   START
========================= */

show("dashboard");
