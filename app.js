/* ======================
   FARM ERP – PHASE A
   Core Business Layer
====================== */

let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [], sheep: [], broilers: [], worms: [],
  customers: [],
  invoices: [],
  expenses: []
};

function save() {
  localStorage.setItem("farmdb", JSON.stringify(db));
}

function today() {
  return new Date().toISOString().split("T")[0];
}

/* ---------- NAV ---------- */

function show(screen) {
  if (screen === "dashboard") {
    let income = db.invoices.reduce((s,i)=>s+i.paid,0);
    let expenses = db.expenses.reduce((s,e)=>s+e.amount,0);
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
      ${db.invoices.map((i,idx)=>`
        <div class="card" onclick="viewInvoice(${idx})">
          ${i.number} – ${i.customer} – ${i.status}
        </div>`).join("")}

      <h3>Expenses</h3>
      ${db.expenses.map(e=>`
        <div class="card">${e.date} – ${e.category}: ${e.amount}</div>
      `).join("")}
    `;
  }
}

/* ---------- ANIMALS ---------- */

function animalList(type) {
  document.getElementById("screen").innerHTML = `
    <h2>${type.toUpperCase()}</h2>
    <input id="name" placeholder="ID / Name">
    <input id="weight" type="number" placeholder="Weight (kg)">
    <button onclick="addAnimal('${type}')">Add</button>

    ${db[type].map((a,i)=>`
      <div class="card" onclick="viewAnimal('${type}',${i})">
        ${a.name} – ${a.history[a.history.length-1].weight} kg
      </div>`).join("")}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}
function addAnimal(type) {
  let n = document.getElementById("name").value;
  let w = Number(document.getElementById("weight").value);

  if (!n || !w) {
    alert("Enter name and weight");
    return;
  }

  db[type].push({
    name: n,
    history: [{ date: today(), weight: w }]
  });

  save();
  animalList(type);
}



function viewAnimal(type,i) {
  let a=db[type][i],h=a.history;
  document.getElementById("screen").innerHTML = `
    <h2>${a.name}</h2>
    <div class="card">Latest: ${h[h.length-1].weight} kg</div>
    <input id="nw" type="number" placeholder="New weight">
    <button onclick="addWeight('${type}',${i})">Add Weight</button>
    ${h.map(x=>`<div class="card">${x.date}: ${x.weight}</div>`).join("")}
    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function addWeight(type,i) {
  let w=Number(nw.value);
  if(!w) return;
  db[type][i].history.push({date:today(),weight:w});
  save(); viewAnimal(type,i);
}

/* ---------- INVOICES ---------- */

function newInvoice() {
  document.getElementById("screen").innerHTML = `
    <input id="cust" placeholder="Customer name">
    <input id="amt" type="number" placeholder="Amount">
    <button onclick="saveInvoice()">Save Invoice</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoice() {
  let c=cust.value,a=Number(amt.value);
  if(!c||!a) return alert("Missing");

  let year=new Date().getFullYear();
  let num=`${year}-${db.invoices.length+1}`;

  db.invoices.push({
    number:num,
    customer:c,
    total:a,
    paid:0,
    status:"UNPAID"
  });

  if(!db.customers.includes(c)) db.customers.push(c);
  save(); show("finance");
}

function viewInvoice(i) {
  let inv=db.invoices[i];
  document.getElementById("screen").innerHTML = `
    <h3>Invoice ${inv.number}</h3>
    <div class="card">Customer: ${inv.customer}</div>
    <div class="card">Total: ${inv.total}</div>
    <div class="card">Paid: ${inv.paid}</div>
    <div class="card">Status: ${inv.status}</div>

    <input id="pay" type="number" placeholder="Payment">
    <button onclick="addPayment(${i})">Add Payment</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function addPayment(i) {
  let p=Number(pay.value);
  if(!p) return;
  let inv=db.invoices[i];
  inv.paid+=p;
  inv.status=inv.paid>=inv.total?"PAID":"PARTIAL";
  save(); viewInvoice(i);
}

/* ---------- EXPENSES ---------- */

function newExpense() {
  document.getElementById("screen").innerHTML = `
    <input id="cat" placeholder="Category (feed, vet, fuel)">
    <input id="amt" type="number" placeholder="Amount">
    <button onclick="saveExpense()">Save Expense</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveExpense() {
  let c=cat.value,a=Number(amt.value);
  if(!c||!a) return;
  db.expenses.push({date:today(),category:c,amount:a});
  save(); show("finance");
}

show("dashboard");
