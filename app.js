let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [], sheep: [], broilers: [], worms: [],
  customers: [], invoices: [], expenses: []
};

function save(){ localStorage.setItem("farmdb", JSON.stringify(db)); }
function today(){ return new Date().toISOString().split("T")[0]; }

function show(screen){
  if(screen==="dashboard"){
    let income=db.invoices.reduce((s,i)=>s+i.paid,0);
    let exp=db.expenses.reduce((s,e)=>s+e.amount,0);
    document.getElementById("screen").innerHTML=`
      <div class="card">Income: ${income}</div>
      <div class="card">Expenses: ${exp}</div>
      <div class="card"><b>Net: ${income-exp}</b></div>
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
      ${db.invoices.map((i,x)=>`
        <div class="card" onclick="viewInvoice(${x})">
          ${i.number} – ${i.status}
        </div>`).join("")}

      <h3>Expenses</h3>
      ${db.expenses.map(e=>`
        <div class="card">${e.category}: ${e.amount}</div>
      `).join("")}
    `;
  }
}

/* ANIMALS */
function animalList(type){
  document.getElementById("screen").innerHTML=`
    <h2>${type.toUpperCase()}</h2>
    <input id="name" placeholder="Name">
    <input id="weight" type="number" placeholder="Weight">
    <button onclick="addAnimal('${type}')">Add</button>
    ${db[type].map(a=>`<div class="card">${a.name}</div>`).join("")}
    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type){
  let n=document.getElementById("name").value;
  let w=Number(document.getElementById("weight").value);
  if(!n||!w) return alert("Missing");
  db[type].push({name:n,history:[{date:today(),weight:w}]});
  save(); animalList(type);
}

/* FINANCE */
function newInvoice(){
  document.getElementById("screen").innerHTML=`
    <input id="amt" type="number" placeholder="Amount">
    <button onclick="saveInvoice()">Save</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoice(){
  let a=Number(document.getElementById("amt").value);
  if(!a) return;
  db.invoices.push({
    number:"INV-"+(db.invoices.length+1),
    total:a, paid:0, status:"UNPAID"
  });
  save(); show("finance");
}

function viewInvoice(i){
  let inv=db.invoices[i];
  document.getElementById("screen").innerHTML=`
    <div class="card">Invoice ${inv.number}</div>
    <div class="card">Total: ${inv.total}</div>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

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
  db.expenses.push({category:c,amount:a});
  save(); show("finance");
}

show("dashboard");
