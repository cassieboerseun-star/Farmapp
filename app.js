/* =========================
   FARM ERP – STABLE + PAYMENTS
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
      <div class="card"><b>Net: ${income-exp}</b></div>

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
          ${i.number} – ${i.status} – Balance: ${i.balance}
        </div>
      `).join("")}

      <h3>Expenses</h3>
      ${db.expenses.map(e=>`
        <div class="card">${e.date} – ${e.category}: ${e.amount}</div>
      `).join("")}
    `;
  }
}

/* =========================
   INVOICES (FIXED)
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
    <h3>${inv.number}</h3>
    <div class="card">Total: ${inv.total}</div>
    <div class="card">Paid: ${inv.paid}</div>
    <div class="card">Balance: ${inv.balance}</div>
    <div class="card">Status: ${inv.status}</div>

    <input id="pay" type="number" placeholder="Payment amount">
    <button onclick="addPayment(${i})">Add Payment</button>

    <h4>Payment History</h4>
    ${inv.payments.map(p=>`
      <div class="card">${p.date} – ${p.amount}</div>
    `).join("")}

    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function addPayment(i){
  let amt=Number(document.getElementById("pay").value);
  if(!amt) return alert("Enter payment");

  let inv=db.invoices[i];

  inv.payments.push({date:today(),amount:amt});
  inv.paid+=amt;
  inv.balance=inv.total-inv.paid;

  if(inv.balance<=0){
    inv.balance=0;
    inv.status="PAID";
  }else{
    inv.status="PARTIAL";
  }

  save();
  viewInvoice(i);
}

/* =========================
   EXPENSES
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
  if(!c||!a) return;
  db.expenses.push({date:today(),category:c,amount:a});
  save(); show("finance");
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
  if(!f) return;
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
   START
========================= */

show("dashboard");
