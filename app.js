/* =========================
   FARM ERP – STABLE BASELINE v2
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {};

/* ===== CORE STRUCTURE ===== */
if(!db.invoices) db.invoices=[];
if(!db.expenses) db.expenses=[];
if(!Array.isArray(db.animalTypes)) db.animalTypes=[];

/* ===== REGISTER LEGACY TYPES ===== */
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
    return {name:a.name,weights:[{date:today(),weight:a.weight}]};
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
      <button onclick="show('animals')">🐄 Animals</button>
      <button onclick="show('finance')">💰 Finance</button>
      <button onclick="show('reports')">📊 Reports</button>
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
      <button onclick="show('dashboard')">⬅ Back</button>
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
      ${db.expenses.map((e,idx)=>`
        <div class="card" onclick="editExpense(${idx})">
          ${e.date} – ${e.category}: ${e.amount}
        </div>
      `).join("") || "<div class='card'>No expenses</div>"}

      <button onclick="show('dashboard')">⬅ Back</button>
    `;
  }

  if(screen==="reports"){
    showReports();
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
  save(); show("animals");
}

function deleteAnimalType(type){
  if(!confirm(`Delete ${type} and all its animals?`)) return;
  db.animalTypes=db.animalTypes.filter(t=>t!==type);
  delete db[type];
  save(); show("animals");
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

    ${alerts(type,a.weights)}

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

    ${weightGraph(a.weights)}
    ${graphInfo(a.weights)}
    ${growthRate(a.weights)}
    ${lowGainAlert(type,a.weights)}

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
   GROWTH + ALERTS
========================= */

function growthRate(w){
  if(w.length<2) return "";
  let d1=new Date(w[0].date), d2=new Date(w.at(-1).date);
  let days=Math.max(1,(d2-d1)/(1000*60*60*24));
  let gain=w.at(-1).weight-w[0].weight;
  return `<div class="card">
    Gain: ${gain.toFixed(1)} kg<br>
    Avg Daily Gain: ${(gain/days).toFixed(2)} kg/day<br>
    Growth: ${((gain/w[0].weight)*100).toFixed(1)} %
  </div>`;
}

function lowGainAlert(type,w){
  if(w.length<2) return "";
  let limits={cows:0.2,sheep:0.2,broilers:0.05,worms:0.01};
  let limit=limits[type]??0.1;
  let d1=new Date(w[0].date), d2=new Date(w.at(-1).date);
  let days=Math.max(1,(d2-d1)/(1000*60*60*24));
  let daily=(w.at(-1).weight-w[0].weight)/days;
  if(daily<limit)
    return `<div class="card warning">⚠ Low growth (${daily.toFixed(2)} kg/day)</div>`;
  return "";
}

function alerts(type,w){
  if(w.length>1 && w.at(-1).weight<w.at(-2).weight)
    return `<div class="card danger">⚠ Weight loss detected</div>`;
  return "";
}

/* =========================
   GRAPH
========================= */

function weightGraph(w){
  if(w.length<2) return "";
  let max=Math.max(...w.map(x=>x.weight));
  let min=Math.min(...w.map(x=>x.weight));
  let pts=w.map((d,i)=>{
    let x=20+(i/(w.length-1))*260;
    let y=160-((d.weight-min)/(max-min||1))*120;
    return `${x},${y}`;
  }).join(" ");
  return `<svg width="100%" height="180"><polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="3"/></svg>`;
}

function graphInfo(w){
  return `<div class="card">
    Latest: ${w.at(-1).weight} |
    Min: ${Math.min(...w.map(x=>x.weight))} |
    Max: ${Math.max(...w.map(x=>x.weight))}
  </div>`;
}

/* =========================
   FINANCE EDITING
========================= */

function newInvoice(){
  db.invoices.push({number:"INV-"+(db.invoices.length+1),date:today(),paid:0});
  save(); show("finance");
}

function editInvoice(i){
  let inv=db.invoices[i];
  screenEl().innerHTML=`
    <h2>${inv.number}</h2>
    <input id="invpaid" type="number" value="${inv.paid}">
    <button onclick="saveInvoice(${i})">Save</button>
    <button onclick="deleteInvoice(${i})">Delete</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoice(i){
  db.invoices[i].paid=Number(invpaid.value);
  save(); show("finance");
}

function deleteInvoice(i){
  if(!confirm("Delete invoice?")) return;
  db.invoices.splice(i,1);
  save(); show("finance");
}

function newExpense(){
  let c=prompt("Category");
  let a=Number(prompt("Amount"));
  if(!c||!a) return;
  db.expenses.push({date:today(),category:c,amount:a});
  save(); show("finance");
}

function editExpense(i){
  let e=db.expenses[i];
  screenEl().innerHTML=`
    <input id="ecat" value="${e.category}">
    <input id="eamt" type="number" value="${e.amount}">
    <button onclick="saveExpense(${i})">Save</button>
    <button onclick="deleteExpense(${i})">Delete</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveExpense(i){
  db.expenses[i].category=ecat.value;
  db.expenses[i].amount=Number(eamt.value);
  save(); show("finance");
}

function deleteExpense(i){
  if(!confirm("Delete expense?")) return;
  db.expenses.splice(i,1);
  save(); show("finance");
}

/* =========================
   REPORTS (SAFE)
========================= */

function showReports(){
  let monthly={}, yearly={};

  db.invoices.forEach(i=>{
    if(!i.date) return;
    let m=i.date.slice(0,7), y=i.date.slice(0,4);
    monthly[m]=(monthly[m]||{i:0,e:0});
    yearly[y]=(yearly[y]||{i:0,e:0});
    monthly[m].i+=i.paid||0;
    yearly[y].i+=i.paid||0;
  });

  db.expenses.forEach(e=>{
    let m=e.date.slice(0,7), y=e.date.slice(0,4);
    monthly[m]=(monthly[m]||{i:0,e:0});
    yearly[y]=(yearly[y]||{i:0,e:0});
    monthly[m].e+=e.amount;
    yearly[y].e+=e.amount;
  });

  screenEl().innerHTML=`
    <h2>Reports</h2>
    ${Object.keys(monthly).map(k=>`
      <div class="card">
        ${k} → Net: ${monthly[k].i-monthly[k].e}
      </div>
    `).join("")}
    ${Object.keys(yearly).map(k=>`
      <div class="card">
        ${k} → Net: ${yearly[k].i-yearly[k].e}
      </div>
    `).join("")}
    <button onclick="show('dashboard')">⬅ Back</button>
  `;
}

/* =========================
   HELPERS
========================= */

function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}

/* =========================
   START
========================= */

show("dashboard");
