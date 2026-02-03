/* =========================
   FARM ERP – FINAL STABLE
   Backup & Restore FIXED
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [], sheep: [], broilers: [], worms: [],
  invoices: [], expenses: []
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

      <button onclick="backupData()">⬇ Backup Data</button>
      <button onclick="openRestore()">⬆ Restore Data</button>
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
   BACKUP & RESTORE (FIXED)
========================= */

function backupData() {
  const data = JSON.stringify(db, null, 2);
  const blob = new Blob([data], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "farm_backup_" + today() + ".json";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}

function openRestore() {
  document.getElementById("screen").innerHTML = `
    <h3>Restore Backup</h3>
    <input type="file" id="restoreFile" accept=".json">
    <button onclick="restoreData()">Restore</button>
    <button onclick="show('dashboard')">⬅ Back</button>
  `;
}

function restoreData() {
  const fileInput = document.getElementById("restoreFile");
  if (!fileInput.files.length) {
    alert("Select a backup file");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      db = JSON.parse(e.target.result);
      save();
      alert("Restore successful");
      show("dashboard");
    } catch {
      alert("Invalid backup file");
    }
  };
  reader.readAsText(fileInput.files[0]);
}

/* =========================
   ANIMALS
========================= */

function animalList(type) {
  document.getElementById("screen").innerHTML = `
    <h2>${type.toUpperCase()}</h2>
    <input id="name" placeholder="Animal name">
    <input id="weight" type="number" placeholder="Weight (kg)">
    <button onclick="addAnimal('${type}')">Add</button>

    ${db[type].map((a, i) => `
      <div class="card" onclick="viewAnimal('${type}',${i})">
        ${a.name} – ${a.history[a.history.length - 1].weight} kg
      </div>
    `).join("")}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type) {
  const n = document.getElementById("name").value;
  const w = Number(document.getElementById("weight").value);
  if (!n || !w) return alert("Enter name and weight");

  db[type].push({
    name: n,
    history: [{ date: today(), weight: w }]
  });
  save();
  animalList(type);
}

function viewAnimal(type, i) {
  const a = db[type][i];
  const h = a.history;

  document.getElementById("screen").innerHTML = `
    <h2>${a.name}</h2>
    <input id="nw" type="number" placeholder="New weight">
    <button onclick="addWeight('${type}',${i})">Add Weight</button>

    <h3>History</h3>
    ${h.map(x => `<div class="card">${x.date}: ${x.weight} kg</div>`).join("")}

    <h3>Chart</h3>
    ${weightChart(h)}

    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function addWeight(type, i) {
  const w = Number(document.getElementById("nw").value);
  if (!w) return alert("Enter weight");
  db[type][i].history.push({ date: today(), weight: w });
  save();
  viewAnimal(type, i);
}

function weightChart(history) {
  const max = Math.max(...history.map(h => h.weight));
  return history.map(h => `
    <div style="background:#2563eb;color:#fff;padding:4px;margin:4px 0;width:${(h.weight / max) * 100}%">
      ${h.weight} kg
    </div>
  `).join("");
}

/* =========================
   FINANCE
========================= */

function newInvoice() {
  document.getElementById("screen").innerHTML = `
    <input id="amt" type="number" placeholder="Invoice amount">
    <button onclick="saveInvoice()">Save</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoice() {
  const amt = Number(document.getElementById("amt").value);
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
  const inv = db.invoices[i];
  document.getElementById("screen").innerHTML = `
    <div class="card">${inv.number}</div>
    <div class="card">Total: ${inv.total}</div>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function newExpense() {
  document.getElementById("screen").innerHTML = `
    <input id="cat" placeholder="Category">
    <input id="amt" type="number" placeholder="Amount">
    <button onclick="saveExpense()">Save</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveExpense() {
  const c = cat.value;
  const a = Number(amt.value);
  if (!c || !a) return;
  db.expenses.push({ date: today(), category: c, amount: a });
  save();
  show("finance");
}

/* =========================
   START
========================= */

show("dashboard");
