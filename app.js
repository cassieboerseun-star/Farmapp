/* =========================
   FARM ERP – STABLE WORKING BASELINE
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
      ${db.expenses.map(e=>`
        <div class="card">${e.date} – ${e.category}: ${e.amount}</div>
      `).join("") || "<div class='card'>No expenses</div>"}
    `;
  }
}

/* =========================
   ANIMALS (RESTORED)
========================= */

function animalList(type){
  document.getElementById("screen").innerHTML = `
    <h2>${type.toUpperCase()}</h2>

    <input id="aname" placeholder="Animal ID / Name">
    <input id="aweight" type="number" placeholder="Weight (kg)">
    <button onclick="addAnimal('${type}')">Add</button>

    ${db[type].map((a,i)=>`
      <div class="card">
        ${a.name} – ${a.weight} kg
      </div>
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
   INVOICES (STABLE)
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
    <div class="card" style="display:flex;align-items:center;gap:12px">
      ${companyLogo ? `
        <img src="${companyLogo}" style="width:80px;height:80px;object-fit:contain;border-radius:12px">
      ` : ""}
      <div>
        <h2 style="margin:0">${companyName}</h2>
        <div style="color:#6b7280">Invoice</div>
      </div>
    </div>

    <div class="card">
      <b>Invoice Number</b><br>
      <input id="invnum" value="${inv.number}">

      <br><br>
      <b>Total Amount</b><br>
      <input id="invtotal" type="number" value="${inv.total}">

      <div class="card">Paid: ${inv.paid}</div>
      <div class="card">Balance: ${inv.balance}</div>
      <div class="card">Status: ${inv.status}</div>

      <button onclick="saveInvoiceEdit(${i})">💾 Save</button>
    </div>

    <div class="card">
      <h3>Payments</h3>
      <input id="pay" type="number" placeholder="Payment amount">
      <button onclick="addPayment(${i})">➕ Add Payment</button>

      ${inv.payments.map(p=>`
        <div class="card">${p.date}: ${p.amount}</div>
      `).join("") || "<div class='card'>No payments yet</div>"}
    </div>

    <div class="card">
      <button onclick="Android.printPage()">🖨 Print Invoice</button>
      <button onclick="show('finance')">⬅ Back</button>
    </div>
  `;
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
   EXPENSES
========================= */

function newExpense(){
  let cat = prompt("Category");
  let amt = Number(prompt("Amount"));
  if(!cat || !amt) return;
  db.expenses.push({ date: today(), category: cat, amount: amt });
  save();
  show("finance");
}

/* =========================
   START
========================= */

show("dashboard");
