/* =========================
   FARM ERP – STABLE + EDIT/DELETE FIX
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [], sheep: [], broilers: [], worms: [],
  invoices: [], expenses: []
};

function save(){ localStorage.setItem("farmdb", JSON.stringify(db)); }
function today(){ return new Date().toISOString().split("T")[0]; }

/* =========================
   NAVIGATION
========================= */

window.currentScreen = "dashboard";

function show(screen){
  window.currentScreen = screen;

  if(screen==="dashboard"){
    let income = db.invoices.reduce((s,i)=>s+(i.paid||0),0);
    let exp = db.expenses.reduce((s,e)=>s+e.amount,0);

    document.getElementById("screen").innerHTML = `
      <div class="card">💰 Income: ${income}</div>
      <div class="card">💸 Expenses: ${exp}</div>
      <div class="card"><b>📈 Net Profit: ${income-exp}</b></div>
    `;
  }

  if(screen==="animals"){
    document.getElementById("screen").innerHTML = `
      <button onclick="animalList('cows')">🐄 Cows</button>
      <button onclick="animalList('sheep')">🐑 Sheep</button>
      <button onclick="animalList('broilers')">🐔 Broilers</button>
      <button onclick="animalList('worms')">🪱 Worms</button>
    `;
  }

  if(screen==="finance"){
    document.getElementById("screen").innerHTML = `
      <button onclick="newInvoice()">➕ New Invoice</button>
      <button onclick="newExpense()">➕ New Expense</button>

      <h3>Invoices</h3>
      ${db.invoices.map((i,idx)=>`
        <div class="card" onclick="viewInvoice(${idx})">
          ${i.number} | ${i.status} | Balance: ${i.balance}
        </div>
      `).join("") || "<div class='card'>No invoices</div>"}

      <h3>Expenses</h3>
      ${db.expenses.map((e,i)=>`
        <div class="card" onclick="editExpense(${i})">
          ${e.date} – ${e.category}: ${e.amount}
        </div>
      `).join("") || "<div class='card'>No expenses</div>"}
    `;
  }
}

/* =========================
   ANIMALS
========================= */

function animalList(type){
  document.getElementById("screen").innerHTML = `
    <h2>${type.toUpperCase()}</h2>

    <input id="aname" placeholder="Animal ID / Name">
    <input id="aweight" type="number" placeholder="Weight (kg)">
    <button onclick="addAnimal('${type}')">Add</button>

    ${db[type].map(a=>`
      <div class="card">${a.name} – ${a.weight} kg</div>
    `).join("") || "<div class='card'>No animals</div>"}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type){
  let n = aname.value;
  let w = Number(aweight.value);
  if(!n || !w) return alert("Enter name and weight");

  db[type].push({ name: n, weight: w });
  save();
  animalList(type);
}

/* =========================
   INVOICES
========================= */

function newInvoice(){
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

function viewInvoice(i){
  let inv = db.invoices[i];
  let companyName = localStorage.getItem("companyName") || "";
  let companyLogo = localStorage.getItem("companyLogo") || "";

  document.getElementById("screen").innerHTML = `
    <div class="card" style="display:flex;gap:12px;align-items:center">
      ${companyLogo ? `<img src="${companyLogo}" style="width:80px;height:80px;object-fit:contain">` : ""}
      <div>
        <h2 style="margin:0">${companyName}</h2>
        <div>Invoice</div>
      </div>
    </div>

    <div class="card">
      <b>Invoice Number</b>
      <input id="invnum" value="${inv.number}">

      <b>Total</b>
      <input id="invtotal" type="number" value="${inv.total}">

      <div class="card">Paid: ${inv.paid}</div>
      <div class="card">Balance: ${inv.balance}</div>
      <div class="card">Status: ${inv.status}</div>

      <button onclick="saveInvoiceEdit(${i})">💾 Save</button>

      ${
        inv.paid === 0 && inv.payments.length === 0
          ? `<button class="danger" onclick="deleteInvoice(${i})">🗑 Delete Invoice</button>`
          : ""
      }
    </div>

    <div class="card">
      <h3>Payments</h3>
      <input id="pay" type="number" placeholder="Payment amount">
      <button onclick="addPayment(${i})">➕ Add Payment</button>

      ${inv.payments.map(p=>`
        <div class="card">${p.date}: ${p.amount}</div>
      `).join("") || "<div class='card'>No payments</div>"}
    </div>

    <div class="card">
      <button onclick="Android.printPage()">🖨 Print Invoice</button>
      <button onclick="show('finance')">⬅ Back</button>
    </div>
  `;
}

function deleteInvoice(i){
  if(!confirm("Delete this unpaid invoice?")) return;
  db.invoices.splice(i,1);
  save();
  show("finance");
}

function saveInvoiceEdit(i){
  let inv = db.invoices[i];
  let total = Number(invtotal.value);
  if(total < inv.paid) return alert("Total cannot be less than paid");

  inv.number = invnum.value;
  inv.total = total;
  inv.balance = inv.total - inv.paid;
  inv.status = inv.balance === 0 ? "PAID" : inv.paid === 0 ? "UNPAID" : "PARTIAL";

  save();
  viewInvoice(i);
}

function addPayment(i){
  let inv = db.invoices[i];
  let amt = Number(pay.value);
  if(!amt || amt > inv.balance) return alert("Invalid payment");

  inv.payments.push({ date: today(), amount: amt });
  inv.paid += amt;
  inv.balance = inv.total - inv.paid;
  inv.status = inv.balance === 0 ? "PAID" : "PARTIAL";

  save();
  viewInvoice(i);
}

/* =========================
   EXPENSES (EDIT + DELETE)
========================= */

function newExpense(){
  let cat = prompt("Category");
  let amt = Number(prompt("Amount"));
  if(!cat || !amt) return;
  db.expenses.push({ date: today(), category: cat, amount: amt });
  save();
  show("finance");
}

function editExpense(i){
  let e = db.expenses[i];

  document.getElementById("screen").innerHTML = `
    <h2>Edit Expense</h2>

    <input id="edate" value="${e.date}">
    <input id="ecat" value="${e.category}">
    <input id="eamt" type="number" value="${e.amount}">

    <button onclick="saveExpense(${i})">💾 Save</button>
    <button class="danger" onclick="deleteExpense(${i})">🗑 Delete</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveExpense(i){
  let e = db.expenses[i];
  e.date = edate.value;
  e.category = ecat.value;
  e.amount = Number(eamt.value);
  save();
  show("finance");
}

function deleteExpense(i){
  if(!confirm("Delete this expense?")) return;
  db.expenses.splice(i,1);
  save();
  show("finance");
}

/* =========================
   START
========================= */

show("dashboard");
