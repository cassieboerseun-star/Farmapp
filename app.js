/* =========================
   FARM ERP – REPORTS ADDED
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {};

/* ===== CORE STRUCTURE ===== */
if(!db.invoices) db.invoices=[];
if(!db.expenses) db.expenses=[];
if(!Array.isArray(db.animalTypes)) db.animalTypes=[];

db.animalTypes.forEach(t=>{
  if(!Array.isArray(db[t])) db[t]=[];
});

/* ===== MIGRATE OLD ANIMALS ===== */
db.animalTypes.forEach(t=>{
  db[t]=db[t].map(a=>{
    if(a.weights) return a;
    return { name:a.name, weights:[{date:today(),weight:a.weight}] };
  });
});

function save(){ localStorage.setItem("farmdb", JSON.stringify(db)); }
function today(){ return new Date().toISOString().split("T")[0]; }
function screenEl(){ return document.getElementById("screen"); }

/* =========================
   NAVIGATION
========================= */

function show(screen){
  if(screen==="dashboard"){
    let income=db.invoices.reduce((s,i)=>s+(i.paid||0),0);
    let exp=db.expenses.reduce((s,e)=>s+e.amount,0);
    screenEl().innerHTML=`
      <div class="card">💰 Income: ${income}</div>
      <div class="card">💸 Expenses: ${exp}</div>
      <div class="card"><b>📈 Net Profit: ${income-exp}</b></div>
    `;
  }

  if(screen==="animals"){
    screenEl().innerHTML=`
      <h2>Animals</h2>
      ${db.animalTypes.map(t=>`
        <button onclick="animalList('${t}')">${cap(t)}</button>
      `).join("")}
      <button onclick="addAnimalType()">➕ Add Animal Type</button>
    `;
  }

  if(screen==="finance"){
    screenEl().innerHTML=`
      <button onclick="newInvoice()">➕ New Invoice</button>
      <button onclick="newExpense()">➕ New Expense</button>

      <h3>Invoices</h3>
      ${db.invoices.map(i=>`
        <div class="card">${i.number || "INV"} | Paid: ${i.paid||0}</div>
      `).join("") || "<div class='card'>No invoices</div>"}

      <h3>Expenses</h3>
      ${db.expenses.map(e=>`
        <div class="card">${e.date} – ${e.category}: ${e.amount}</div>
      `).join("") || "<div class='card'>No expenses</div>"}
    `;
  }

  if(screen==="reports"){
    showReports();
  }
}

/* =========================
   REPORTS
========================= */

function showReports(){
  let monthly = {};
  let yearly = {};

  db.invoices.forEach(i=>{
    if(!i.date) return;
    let m=i.date.slice(0,7);
    let y=i.date.slice(0,4);
    monthly[m]=(monthly[m]||0)+(i.paid||0);
    yearly[y]=(yearly[y]||0)+(i.paid||0);
  });

  db.expenses.forEach(e=>{
    let m=e.date.slice(0,7);
    let y=e.date.slice(0,4);
    monthly[m]=(monthly[m]||0)-e.amount;
    yearly[y]=(yearly[y]||0)-e.amount;
  });

  screenEl().innerHTML=`
    <h2>Reports</h2>

    <h3>📅 Monthly Report</h3>
    ${Object.keys(monthly).sort().map(k=>`
      <div class="card">
        ${k} → Net Profit: ${monthly[k]}
      </div>
    `).join("") || "<div class='card'>No data</div>"}

    <h3>📆 Annual Report</h3>
    ${Object.keys(yearly).sort().map(k=>`
      <div class="card">
        ${k} → Net Profit: ${yearly[k]}
      </div>
    `).join("") || "<div class='card'>No data</div>"}

    <button onclick="show('dashboard')">⬅ Back</button>
  `;
}

/* =========================
   ANIMAL TYPES (BASIC)
========================= */

function addAnimalType(){
  let t=prompt("Animal type");
  if(!t) return;
  t=t.toLowerCase();
  if(db.animalTypes.includes(t)) return;
  db.animalTypes.push(t);
  db[t]=[];
  save();
  show("animals");
}

/* =========================
   FINANCE
========================= */

function newInvoice(){
  db.invoices.push({
    number:"INV-"+(db.invoices.length+1),
    date:today(),
    paid:0
  });
  save();
  show("finance");
}

function newExpense(){
  let c=prompt("Category");
  let a=Number(prompt("Amount"));
  if(!c||!a) return;
  db.expenses.push({
    date:today(),
    category:c,
    amount:a
  });
  save();
  show("finance");
}

/* =========================
   HELPERS
========================= */

function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

/* =========================
   START
========================= */

show("dashboard");
