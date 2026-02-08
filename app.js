/* =========================
   FARM ERP – STABLE + DELETE WEIGHT ENTRY
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
   ANIMALS (DELETE WEIGHT ENTRY)
========================= */

function animalList(type){
  document.getElementById("screen").innerHTML = `
    <h2>${type.toUpperCase()}</h2>

    <button onclick="addAnimal('${type}')">➕ Add Animal</button>

    ${db[type].map((a,i)=>`
      <div class="card" onclick="viewAnimal('${type}',${i})">
        ${a.name} – ${a.weights[a.weights.length-1].weight} kg
      </div>
    `).join("") || "<div class='card'>No animals yet</div>"}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type){
  let name = prompt("Animal name / ID");
  let weight = Number(prompt("Starting weight (kg)"));
  if(!name || !weight) return;

  db[type].push({
    name,
    weights: [{ date: today(), weight }]
  });
  save();
  animalList(type);
}

function viewAnimal(type,i){
  let a = db[type][i];

  document.getElementById("screen").innerHTML = `
    <h2>Edit ${a.name}</h2>

    <input id="aname" value="${a.name}">
    <button onclick="saveAnimalName('${type}',${i})">💾 Save Name</button>

    <h3>Add Weight</h3>
    <input id="w" type="number" placeholder="Weight (kg)">
    <button onclick="addWeight('${type}',${i})">➕ Add Weight</button>

    <h3>Weight History</h3>
    ${a.weights.map((x,wi)=>`
      <div class="card" style="display:flex;justify-content:space-between;align-items:center">
        <div>${x.date}: ${x.weight} kg</div>
        ${
          a.weights.length > 1
            ? `<button class="danger" onclick="deleteWeight('${type}',${i},${wi})">🗑</button>`
            : ""
        }
      </div>
    `).join("")}

    <h3>Weight Chart</h3>
    ${weightChart(a.weights)}

    <button class="danger" onclick="deleteAnimal('${type}',${i})">🗑 Delete Animal</button>
    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function saveAnimalName(type,i){
  db[type][i].name = aname.value;
  save();
  viewAnimal(type,i);
}

function addWeight(type,i){
  let w = Number(document.getElementById("w").value);
  if(!w) return alert("Enter weight");

  db[type][i].weights.push({ date: today(), weight: w });
  save();
  viewAnimal(type,i);
}

function deleteWeight(type,ai,wi){
  if(!confirm("Delete this weight entry?")) return;
  db[type][ai].weights.splice(wi,1);
  save();
  viewAnimal(type,ai);
}

function deleteAnimal(type,i){
  if(!confirm("Delete this animal?")) return;
  db[type].splice(i,1);
  save();
  animalList(type);
}

/* ===== SIMPLE BAR CHART ===== */
function weightChart(data){
  let max = Math.max(...data.map(x=>x.weight));
  return data.map(x=>`
    <div style="
      background:#2563eb;
      color:white;
      margin:6px 0;
      padding:6px;
      width:${(x.weight/max)*100}%;
      border-radius:6px">
      ${x.weight} kg
    </div>
  `).join("");
}

/* =========================
   INVOICES (UNCHANGED)
========================= */

function newInvoice(){
  db.invoices.push({
    number:"INV-"+(db.invoices.length+1),
    total:0,paid:0,balance:0,payments:[],status:"UNPAID"
  });
  save(); show("finance");
}

function viewInvoice(i){
  let inv=db.invoices[i];
  let cn=localStorage.getItem("companyName")||"";
  let cl=localStorage.getItem("companyLogo")||"";

  document.getElementById("screen").innerHTML=`
    <div class="card" style="display:flex;gap:12px;align-items:center">
      ${cl?`<img src="${cl}" style="width:80px;height:80px;object-fit:contain">`:""}
      <div><h2 style="margin:0">${cn}</h2><div>Invoice</div></div>
    </div>

    <div class="card">
      <input id="invnum" value="${inv.number}">
      <input id="invtotal" type="number" value="${inv.total}">
      <div class="card">Paid: ${inv.paid}</div>
      <div class="card">Balance: ${inv.balance}</div>
      <div class="card">Status: ${inv.status}</div>
      <button onclick="saveInvoiceEdit(${i})">💾 Save</button>
      ${inv.paid===0&&inv.payments.length===0?`<button class="danger" onclick="deleteInvoice(${i})">🗑 Delete</button>`:""}
    </div>

    <div class="card">
      <input id="pay" type="number">
      <button onclick="addPayment(${i})">➕ Add Payment</button>
      ${inv.payments.map(p=>`<div class="card">${p.date}: ${p.amount}</div>`).join("")}
    </div>

    <div class="card">
      <button onclick="Android.printPage()">🖨 Print</button>
      <button onclick="show('finance')">⬅ Back</button>
    </div>
  `;
}

function saveInvoiceEdit(i){
  let inv=db.invoices[i];
  let t=Number(invtotal.value);
  if(t<inv.paid)return alert("Total < paid");
  inv.number=invnum.value;
  inv.total=t;
  inv.balance=inv.total-inv.paid;
  inv.status=inv.balance===0?"PAID":inv.paid===0?"UNPAID":"PARTIAL";
  save(); viewInvoice(i);
}

function addPayment(i){
  let inv=db.invoices[i];
  let a=Number(pay.value);
  if(!a||a>inv.balance)return alert("Invalid payment");
  inv.payments.push({date:today(),amount:a});
  inv.paid+=a;
  inv.balance=inv.total-inv.paid;
  inv.status=inv.balance===0?"PAID":"PARTIAL";
  save(); viewInvoice(i);
}

function deleteInvoice(i){
  if(!confirm("Delete unpaid invoice?"))return;
  db.invoices.splice(i,1);
  save(); show("finance");
}

/* =========================
   EXPENSES (UNCHANGED)
========================= */

function newExpense(){
  let c=prompt("Category");
  let a=Number(prompt("Amount"));
  if(!c||!a)return;
  db.expenses.push({date:today(),category:c,amount:a});
  save(); show("finance");
}

function editExpense(i){
  let e=db.expenses[i];
  document.getElementById("screen").innerHTML=`
    <input id="ed" value="${e.date}">
    <input id="ec" value="${e.category}">
    <input id="ea" type="number" value="${e.amount}">
    <button onclick="saveExpense(${i})">💾 Save</button>
    <button class="danger" onclick="deleteExpense(${i})">🗑 Delete</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveExpense(i){
  db.expenses[i]={date:ed.value,category:ec.value,amount:Number(ea.value)};
  save(); show("finance");
}

function deleteExpense(i){
  if(!confirm("Delete expense?"))return;
  db.expenses.splice(i,1);
  save(); show("finance");
}

/* =========================
   START
========================= */

show("dashboard");
