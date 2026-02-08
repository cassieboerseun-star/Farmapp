/* =========================
   FARM ERP – STABLE BASELINE (NO REPORTS)
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {};

/* ===== CORE STRUCTURE ===== */
if(!db.invoices) db.invoices=[];
if(!db.expenses) db.expenses=[];
if(!Array.isArray(db.animalTypes)) db.animalTypes=[];

/* ===== AUTO-REGISTER LEGACY TYPES ===== */
["cows","sheep","broilers","worms"].forEach(t=>{
  if(Array.isArray(db[t]) && !db.animalTypes.includes(t)){
    db.animalTypes.push(t);
  }
});

/* ===== ENSURE ARRAYS ===== */
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
        <div style="display:flex;gap:8px">
          <button onclick="animalList('${t}')">${cap(t)}</button>
          <button class="danger" onclick="deleteAnimalType('${t}')">🗑</button>
        </div>
      `).join("")}

      <button onclick="addAnimalType()">➕ Add Animal Type</button>
    `;
  }

  if(screen==="finance"){
    screenEl().innerHTML=`
      <button onclick="newInvoice()">➕ New Invoice</button>
      <button onclick="newExpense()">➕ New Expense</button>

      <h3>Invoices</h3>
      ${db.invoices.map((i,idx)=>`
        <div class="card" onclick="editInvoice(${idx})">
          ${i.number} | Paid: ${i.paid || 0}
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
   ANIMAL TYPES
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

function deleteAnimalType(type){
  if(!confirm(`Delete ${type} and all its animals?`)) return;
  db.animalTypes=db.animalTypes.filter(t=>t!==type);
  delete db[type];
  save();
  show("animals");
}

/* =========================
   ANIMALS
========================= */

function animalList(type){
  screenEl().innerHTML=`
    <h2>${cap(type)}</h2>

    <input id="aname" placeholder="Name">
    <input id="aweight" type="number" placeholder="Weight">
    <button onclick="addAnimal('${type}')">➕ Add</button>

    ${db[type].map((a,i)=>`
      <div class="card" onclick="viewAnimal('${type}',${i})">
        ${a.name} – ${a.weights.at(-1).weight} kg
      </div>
    `).join("")}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type){
  if(!aname.value||!aweight.value) return;
  db[type].push({name:aname.value,weights:[{date:today(),weight:Number(aweight.value)}]});
  save(); animalList(type);
}

function viewAnimal(type,i){
  let a=db[type][i];
  screenEl().innerHTML=`
    <h2>${a.name}</h2>

    <input id="ename" value="${a.name}">
    <button onclick="saveAnimalName('${type}',${i})">Save</button>

    <input id="w" type="number" placeholder="Weight">
    <button onclick="addWeight('${type}',${i})">Add Weight</button>

    ${a.weights.map((x,wi)=>`
      <div class="card">
        ${x.date}: ${x.weight}
        ${a.weights.length>1?`<button onclick="deleteWeight('${type}',${i},${wi})">🗑</button>`:""}
      </div>
    `).join("")}

    <button class="danger" onclick="deleteAnimal('${type}',${i})">Delete Animal</button>
    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function saveAnimalName(type,i){
  db[type][i].name=ename.value;
  save(); viewAnimal(type,i);
}

function addWeight(type,i){
  if(!w.value) return;
  db[type][i].weights.push({date:today(),weight:Number(w.value)});
  save(); viewAnimal(type,i);
}

function deleteWeight(type,i,wi){
  if(!confirm("Delete weight?")) return;
  db[type][i].weights.splice(wi,1);
  save(); viewAnimal(type,i);
}

function deleteAnimal(type,i){
  if(!confirm("Delete animal?")) return;
  db[type].splice(i,1);
  save(); animalList(type);
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

function editInvoice(i){
  let inv=db.invoices[i];
  screenEl().innerHTML=`
    <h2>${inv.number}</h2>
    <input id="paid" type="number" value="${inv.paid}">
    <button onclick="saveInvoice(${i})">Save</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoice(i){
  db.invoices[i].paid=Number(paid.value);
  save();
  show("finance");
}

function newExpense(){
  let c=prompt("Category");
  let a=Number(prompt("Amount"));
  if(!c||!a) return;
  db.expenses.push({date:today(),category:c,amount:a});
  save();
  show("finance");
}

/* =========================
   HELPERS
========================= */

function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}

/* =========================
   START
========================= */

show("dashboard");
