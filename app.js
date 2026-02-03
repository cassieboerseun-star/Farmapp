/* =========================
   FARM ERP – DELETE SAFE
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [], sheep: [], broilers: [], worms: [],
  invoices: [], expenses: []
};

function save(){ localStorage.setItem("farmdb", JSON.stringify(db)); }
function today(){ return new Date().toISOString().split("T")[0]; }
function month(d){ return d.slice(0,7); }
function year(d){ return d.slice(0,4); }

/* =========================
   NAVIGATION
========================= */

function show(screen){
  if(screen==="dashboard"){
    let income=db.invoices.reduce((s,i)=>s+i.paid,0);
    let exp=db.expenses.reduce((s,e)=>s+e.amount,0);

    document.getElementById("screen").innerHTML=`
      <div class="card">Income: ${income}</div>
      <div class="card">Expenses: ${exp}</div>
      <div class="card"><b>Net Profit: ${income-exp}</b></div>

      <button onclick="show('reports')">📊 Reports</button>
      <button onclick="backupData()">⬇ Backup</button>
      <button onclick="openRestore()">⬆ Restore</button>
    `;
  }

  if(screen==="animals"){
    document.getElementById("screen").innerHTML=`
      <button onclick="animalList('cows')">🐄 Cows</button>
      <button onclick="animalList('sheep')">🐑 Sheep</button>
      <button onclick="animalList('broilers')">🐔 Broilers</button>
      <button onclick="animalList('worms')">🪱 Worms</button>
    `;
  }

  if(screen==="finance"){
    document.getElementById("screen").innerHTML=`
      <button onclick="newInvoice()">➕ New Invoice</button>
      <button onclick="newExpense()">➕ New Expense</button>

      <h3>Invoices</h3>
      ${db.invoices.map((i,idx)=>`
        <div class="card" onclick="viewInvoice(${idx})">
          ${i.number} | ${i.status} | Balance: ${i.balance}
        </div>`).join("")}

      <h3>Expenses</h3>
      ${db.expenses.map((e,i)=>`
        <div class="card" onclick="editExpense(${i})">
          ${e.date} – ${e.category}: ${e.amount}
        </div>`).join("")}
    `;
  }

  if(screen==="reports"){
    document.getElementById("screen").innerHTML=`
      <h2>Reports</h2>
      <button onclick="monthlyReport()">📅 Monthly Report</button>
      <button onclick="annualReport()">📆 Annual Report</button>
      <button onclick="expenseReport()">💸 Expense Breakdown</button>
      <button onclick="show('dashboard')">⬅ Back</button>
    `;
  }
}

/* =========================
   ANIMALS (DELETE ENABLED)
========================= */

function animalList(type){
  document.getElementById("screen").innerHTML=`
    <h2>${type.toUpperCase()}</h2>
    <input id="name" placeholder="Animal ID / Name">
    <input id="weight" type="number" placeholder="Weight (kg)">
    <button onclick="addAnimal('${type}')">Add</button>

    ${db[type].map((a,i)=>`
      <div class="card" onclick="viewAnimal('${type}',${i})">
        ${a.name} – ${a.history[a.history.length-1].weight} kg
      </div>`).join("")}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type){
  let n=name.value,w=Number(weight.value);
  if(!n||!w) return alert("Enter name and weight");
  db[type].push({name:n,history:[{date:today(),weight:w}]});
  save(); animalList(type);
}

function viewAnimal(type,i){
  let a=db[type][i],h=a.history;
  document.getElementById("screen").innerHTML=`
    <h2>${a.name}</h2>

    <input id="nw" type="number" placeholder="New weight">
    <button onclick="addWeight('${type}',${i})">Add Weight</button>

    ${h.map(x=>`<div class="card">${x.date}: ${x.weight} kg</div>`).join("")}
    ${weightChart(h)}

    <button onclick="deleteAnimal('${type}',${i})" style="background:#dc2626;color:white">
      🗑 Delete Animal
    </button>

    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function deleteAnimal(type,i){
  if(!confirm("Delete this animal permanently?")) return;
  db[type].splice(i,1);
  save();
  animalList(type);
}

function addWeight(type,i){
  let w=Number(nw.value);
  if(!w) return;
  db[type][i].history.push({date:today(),weight:w});
  save(); viewAnimal(type,i);
}

function weightChart(h){
  let m=Math.max(...h.map(x=>x.weight),1);
  return `<div>${h.map(x=>`
    <div style="background:#2563eb;color:white;margin:4px;width:${Math.max(15,(x.weight/m)*100)}%">
      ${x.weight} kg
    </div>`).join("")}</div>`;
}

/* =========================
   INVOICES (SAFE DELETE)
========================= */

function newInvoice(){
  document.getElementById("screen").innerHTML=`
    <input id="amt" type="number" placeholder="Invoice amount">
    <button onclick="saveInvoice()">Save</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoice(){
  let a=Number(amt.value);
  if(!a) return alert("Enter amount");
  db.invoices.push({
    number:"INV-"+(db.invoices.length+1),
    total:a,
    paid:0,
    balance:a,
    payments:[],
    status:"UNPAID"
  });
  save(); show("finance");
}

function viewInvoice(i){
  let inv=db.invoices[i];
  document.getElementById("screen").innerHTML=`
    <h3>Edit Invoice</h3>

    <input id="invnum" value="${inv.number}">
    <input id="invtotal" type="number" value="${inv.total}">

    <div class="card">Paid: ${inv.paid}</div>
    <div class="card">Balance: ${inv.balance}</div>
    <div class="card">Status: ${inv.status}</div>

    <button onclick="saveInvoiceEdit(${i})">💾 Save</button>

    ${inv.status==="UNPAID" ? `
      <button onclick="deleteInvoice(${i})" style="background:#dc2626;color:white">
        🗑 Delete Invoice
      </button>` : ""}

    <hr>
    <input id="pay" type="number" placeholder="Payment">
    <button onclick="addPayment(${i})">➕ Add Payment</button>

    ${inv.payments.map(p=>`
      <div class="card">${p.date}: ${p.amount}</div>`).join("")}

    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function deleteInvoice(i){
  if(!confirm("Delete unpaid invoice?")) return;
  db.invoices.splice(i,1);
  save();
  show("finance");
}

function saveInvoiceEdit(i){
  let inv=db.invoices[i];
  let t=Number(invtotal.value);
  if(t<inv.paid) return alert("Total < paid");
  inv.number=invnum.value;
  inv.total=t;
  inv.balance=inv.total-inv.paid;
  inv.status=inv.paid===0?"UNPAID":inv.balance===0?"PAID":"PARTIAL";
  save(); viewInvoice(i);
}

function addPayment(i){
  let a=Number(pay.value);
  let inv=db.invoices[i];
  if(!a||a>inv.balance) return alert("Invalid payment");
  inv.payments.push({date:today(),amount:a});
  inv.paid+=a;
  inv.balance=inv.total-inv.paid;
  inv.status=inv.balance===0?"PAID":"PARTIAL";
  save(); viewInvoice(i);
}

/* =========================
   EXPENSES (DELETE)
========================= */

function newExpense(){
  document.getElementById("screen").innerHTML=`
    <input id="cat" placeholder="Category">
    <input id="amt" type="number" placeholder="Amount">
    <button onclick="saveExpense()">Save</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveExpense(){
  if(!cat.value||!amt.value) return;
  db.expenses.push({date:today(),category:cat.value,amount:Number(amt.value)});
  save(); show("finance");
}

function editExpense(i){
  let e=db.expenses[i];
  document.getElementById("screen").innerHTML=`
    <input id="ed" value="${e.date}">
    <input id="ec" value="${e.category}">
    <input id="ea" type="number" value="${e.amount}">

    <button onclick="saveExpenseEdit(${i})">💾 Save</button>
    <button onclick="deleteExpense(${i})" style="background:#dc2626;color:white">
      🗑 Delete Expense
    </button>

    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function deleteExpense(i){
  if(!confirm("Delete this expense?")) return;
  db.expenses.splice(i,1);
  save();
  show("finance");
}

function saveExpenseEdit(i){
  let e=db.expenses[i];
  e.date=ed.value; e.category=ec.value; e.amount=Number(ea.value);
  save(); show("finance");
}

/* =========================
   REPORTS
========================= */

function monthlyReport(){
  let inc={},exp={};
  db.invoices.forEach(i=>i.payments.forEach(p=>{
    let k=month(p.date); inc[k]=(inc[k]||0)+p.amount;
  }));
  db.expenses.forEach(e=>{
    let k=month(e.date); exp[k]=(exp[k]||0)+e.amount;
  });

  document.getElementById("screen").innerHTML=`
    <h3>Monthly Report</h3>
    ${Object.keys({...inc,...exp}).sort().map(k=>`
      <div class="card">${k} | Income: ${inc[k]||0} | Expenses: ${exp[k]||0} | Net: ${(inc[k]||0)-(exp[k]||0)}</div>
    `).join("") || "<div class='card'>No data</div>"}
    <button onclick="window.print()">🖨 Print</button>
    <button onclick="show('reports')">⬅ Back</button>
  `;
}

function annualReport(){
  let inc={},exp={};
  db.invoices.forEach(i=>i.payments.forEach(p=>{
    let k=year(p.date); inc[k]=(inc[k]||0)+p.amount;
  }));
  db.expenses.forEach(e=>{
    let k=year(e.date); exp[k]=(exp[k]||0)+e.amount;
  });

  document.getElementById("screen").innerHTML=`
    <h3>Annual Report</h3>
    ${Object.keys({...inc,...exp}).sort().map(k=>`
      <div class="card">${k} | Income: ${inc[k]||0} | Expenses: ${exp[k]||0} | Net: ${(inc[k]||0)-(exp[k]||0)}</div>
    `).join("") || "<div class='card'>No data</div>"}
    <button onclick="window.print()">🖨 Print</button>
    <button onclick="show('reports')">⬅ Back</button>
  `;
}

function expenseReport(){
  let c={};
  db.expenses.forEach(e=>c[e.category]=(c[e.category]||0)+e.amount);
  document.getElementById("screen").innerHTML=`
    <h3>Expense Breakdown</h3>
    ${Object.keys(c).map(k=>`<div class="card">${k}: ${c[k]}</div>`).join("")}
    <button onclick="window.print()">🖨 Print</button>
    <button onclick="show('reports')">⬅ Back</button>
  `;
}

/* =========================
   BACKUP / RESTORE
========================= */

function backupData(){
  let b=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});
  let a=document.createElement("a");
  a.href=URL.createObjectURL(b);
  a.download="farm_backup_"+today()+".json";
  a.click();
}

function openRestore(){
  document.getElementById("screen").innerHTML=`
    <input type="file" id="file">
    <button onclick="restoreData()">Restore</button>
    <button onclick="show('dashboard')">⬅ Back</button>
  `;
}

function restoreData(){
  let f=file.files[0];
  if(!f) return;
  let r=new FileReader();
  r.onload=e=>{
    db=JSON.parse(e.target.result);
    save(); alert("Restore successful");
    show("dashboard");
  };
  r.readAsText(f);
}

/* =========================
   START
========================= */

show("dashboard");
