/* =========================
   FARM ERP – FINAL COMPLETE
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

function show(screen){
  if(screen==="dashboard"){
    let income=db.invoices.reduce((s,i)=>s+i.paid,0);
    let exp=db.expenses.reduce((s,e)=>s+e.amount,0);

    document.getElementById("screen").innerHTML=`
      <div class="card">Income: ${income}</div>
      <div class="card">Expenses: ${exp}</div>
      <div class="card"><b>Net Profit: ${income-exp}</b></div>

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
}

/* =========================
   ANIMALS
========================= */

function animalList(type){
  document.getElementById("screen").innerHTML=`
    <h2>${type.toUpperCase()}</h2>

    <input id="name" placeholder="Animal ID / Name">
    <input id="weight" type="number" placeholder="Weight (kg)">
    <button onclick="addAnimal('${type}')">Add Animal</button>

    ${db[type].map((a,i)=>`
      <div class="card" onclick="viewAnimal('${type}',${i})">
        ${a.name} – ${a.history[a.history.length-1].weight} kg
      </div>`).join("")}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type){
  let n=document.getElementById("name").value;
  let w=Number(document.getElementById("weight").value);
  if(!n||!w) return alert("Enter name and weight");

  db[type].push({ name:n, history:[{date:today(),weight:w}] });
  save();
  animalList(type);
}

function viewAnimal(type,i){
  let a=db[type][i];
  let h=a.history;

  document.getElementById("screen").innerHTML=`
    <h2>${a.name}</h2>

    <input id="nw" type="number" placeholder="New weight">
    <button onclick="addWeight('${type}',${i})">Add Weight</button>

    <h3>History</h3>
    ${h.map(x=>`<div class="card">${x.date}: ${x.weight} kg</div>`).join("")}

    <h3>Weight Chart</h3>
    ${weightChart(h)}

    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function addWeight(type,i){
  let w=Number(document.getElementById("nw").value);
  if(!w) return alert("Enter weight");
  db[type][i].history.push({date:today(),weight:w});
  save();
  viewAnimal(type,i);
}

function weightChart(history){
  let max=Math.max(...history.map(h=>h.weight),1);
  return `
    <div style="width:100%;background:#e5e7eb;padding:6px;border-radius:6px">
      ${history.map(h=>`
        <div style="
          background:#2563eb;
          color:white;
          padding:6px;
          margin:6px 0;
          border-radius:6px;
          width:${Math.max(15,(h.weight/max)*100)}%">
          ${h.weight} kg
        </div>`).join("")}
    </div>`;
}

/* =========================
   INVOICES
========================= */

function newInvoice(){
  document.getElementById("screen").innerHTML=`
    <input id="amt" type="number" placeholder="Invoice amount">
    <button onclick="saveInvoice()">Save Invoice</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoice(){
  let amt=Number(document.getElementById("amt").value);
  if(!amt) return alert("Enter amount");

  db.invoices.push({
    number:"INV-"+(db.invoices.length+1),
    total:amt,
    paid:0,
    balance:amt,
    payments:[],
    status:"UNPAID"
  });

  save();
  show("finance");
}

function viewInvoice(i){
  let inv=db.invoices[i];

  document.getElementById("screen").innerHTML=`
    <h3>Edit Invoice ${inv.number}</h3>

    <label>Invoice Number</label>
    <input id="invnum" value="${inv.number}">

    <label>Total Amount</label>
    <input id="invtotal" type="number" value="${inv.total}">

    <div class="card">Paid: ${inv.paid}</div>
    <div class="card">Balance: ${inv.balance}</div>
    <div class="card">Status: ${inv.status}</div>

    <button onclick="saveInvoiceEdit(${i})">💾 Save Changes</button>

    <hr>

    <input id="pay" type="number" placeholder="Payment amount">
    <button onclick="addPayment(${i})">➕ Add Payment</button>

    <h4>Payments</h4>
    ${inv.payments.map(p=>`
      <div class="card">${p.date}: ${p.amount}</div>`).join("")}

    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoiceEdit(i){
  let inv=db.invoices[i];
  let n=document.getElementById("invnum").value;
  let t=Number(document.getElementById("invtotal").value);

  if(!n||!t) return alert("Fields required");
  if(t<inv.paid) return alert("Total less than paid");

  inv.number=n;
  inv.total=t;
  inv.balance=inv.total-inv.paid;
  inv.status=inv.paid===0?"UNPAID":inv.paid<inv.total?"PARTIAL":"PAID";

  save();
  viewInvoice(i);
}

function addPayment(i){
  let amt=Number(document.getElementById("pay").value);
  if(!amt||amt<=0) return alert("Invalid payment");

  let inv=db.invoices[i];
  if(amt>inv.balance) return alert("Exceeds balance");

  inv.payments.push({date:today(),amount:amt});
  inv.paid+=amt;
  inv.balance=inv.total-inv.paid;
  inv.status=inv.balance===0?"PAID":"PARTIAL";

  save();
  viewInvoice(i);
}

/* =========================
   EXPENSES (EDITABLE)
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
  let c=cat.value,a=Number(amt.value);
  if(!c||!a) return alert("Fields required");
  db.expenses.push({date:today(),category:c,amount:a});
  save();
  show("finance");
}

function editExpense(i){
  let e=db.expenses[i];
  document.getElementById("screen").innerHTML=`
    <h3>Edit Expense</h3>

    <input id="edate" value="${e.date}">
    <input id="ecat" value="${e.category}">
    <input id="eamt" type="number" value="${e.amount}">

    <button onclick="saveExpenseEdit(${i})">💾 Save</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveExpenseEdit(i){
  let e=db.expenses[i];
  let d=edate.value,c=ecat.value,a=Number(eamt.value);
  if(!d||!c||!a) return alert("Fields required");
  e.date=d; e.category=c; e.amount=a;
  save();
  show("finance");
}

/* =========================
   BACKUP / RESTORE
========================= */

function backupData(){
  let blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});
  let a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
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
  let f=document.getElementById("file").files[0];
  if(!f) return alert("Select backup");
  let r=new FileReader();
  r.onload=e=>{
    db=JSON.parse(e.target.result);
    save();
    alert("Restore successful");
    show("dashboard");
  };
  r.readAsText(f);
}

/* =========================
   START APP
========================= */

show("dashboard");
