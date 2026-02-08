/* =========================
   FARM ERP – STABLE CORE
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
      ${db.expenses.map((e, i) => `
        <div class="card">
          ${e.date} – ${e.category}: ${e.amount}
        </div>
      `).join("") || "<div class='card'>No expenses</div>"}
    `;
  }
}

function screenEl() {
  return document.getElementById("screen");
}

/* =========================
   ANIMALS (SIMPLE & WORKING)
========================= */

function animalList(type) {
  screenEl().innerHTML = `
    <h2>${type.toUpperCase()}</h2>

    <input id="aname" placeholder="Animal name / ID">
    <input id="aweight" type="number" placeholder="Weight (kg)">
    <button onclick="addAnimal('${type}')">➕ Add</button>

    ${db[type].map(a => `
      <div class="card">${a.name} – ${a.weight} kg</div>
    `).join("") || "<div class='card'>No animals</div>"}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type) {
  let n = aname.value;
  let w = Number(aweight.value);
  if (!n || !w) return alert("Enter name and weight");

  db[type].push({ name: n, weight: w });
  save();
  animalList(type);
}

/* =========================
   INVOICES (WORKING)
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
    <div class="card">
      <input id="invtotal" type="number" value="${inv.total}">
      <button onclick="saveInvoice(${i})">💾 Save</button>
    </div>

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
   EXPENSES (WORKING)
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
