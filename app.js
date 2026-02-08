/* =========================
   FARM ERP – FIXED ANIMAL TYPES MIGRATION
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {};

/* ===== ENSURE CORE STRUCTURE ===== */
if(!db.invoices) db.invoices=[];
if(!db.expenses) db.expenses=[];

/* ===== AUTO-DETECT ANIMAL TYPES ===== */
const DEFAULT_TYPES = ["cows","sheep","broilers","worms"];

if(!db.animalTypes){
  db.animalTypes = DEFAULT_TYPES.filter(t => Array.isArray(db[t]));
}

/* ===== ENSURE ARRAYS FOR ALL TYPES ===== */
db.animalTypes.forEach(t=>{
  if(!Array.isArray(db[t])) db[t]=[];
});

/* ===== AUTO-MIGRATE OLD ANIMALS ===== */
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
        <button onclick="animalList('${t}')">${emoji(t)} ${cap(t)}</button>
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
   ANIMAL TYPES
========================= */

function addAnimalType(){
  let t=prompt("New animal type (e.g. goats)");
  if(!t) return;
  t=t.toLowerCase().trim();
  if(db.animalTypes.includes(t)) return alert("Type already exists");

  db.animalTypes.push(t);
  db[t]=[];
  save();
  show("animals");
}

/* =========================
   ANIMALS
========================= */

function animalList(type){
  screenEl().innerHTML=`
    <h2>${cap(type)}</h2>

    <input id="aname" placeholder="Animal name / ID">
    <input id="aweight" type="number" placeholder="Starting weight (kg)">
    <button onclick="addAnimal('${type}')">➕ Add</button>

    ${db[type].map((a,i)=>`
      <div class="card" onclick="viewAnimal('${type}',${i})">
        ${a.name} – ${a.weights[a.weights.length-1].weight} kg
      </div>
    `).join("") || "<div class='card'>No animals</div>"}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type){
  let n=aname.value;
  let w=Number(aweight.value);
  if(!n||!w) return alert("Enter name and weight");
  db[type].push({name:n,weights:[{date:today(),weight:w}]});
  save(); animalList(type);
}

function viewAnimal(type,index){
  let a=db[type][index];

  screenEl().innerHTML=`
    <h2>${a.name}</h2>

    ${alerts(type,a.weights)}

    <input id="ename" value="${a.name}">
    <button onclick="saveAnimalName('${type}',${index})">💾 Save Name</button>

    <input id="w" type="number" placeholder="Weight (kg)">
    <button onclick="addWeight('${type}',${index})">➕ Add Weight</button>

    ${a.weights.map((x,wi)=>`
      <div class="card" style="display:flex;justify-content:space-between">
        ${x.date}: ${x.weight} kg
        ${a.weights.length>1?`<button class="danger" onclick="deleteWeight('${type}',${index},${wi})">🗑</button>`:""}
      </div>
    `).join("")}

    ${weightGraph(a.weights)}
    ${growthInfo(a.weights)}

    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function saveAnimalName(type,index){
  db[type][index].name=ename.value;
  save(); viewAnimal(type,index);
}

function addWeight(type,index){
  let w=Number(document.getElementById("w").value);
  if(!w) return alert("Enter weight");
  db[type][index].weights.push({date:today(),weight:w});
  save(); viewAnimal(type,index);
}

function deleteWeight(type,ai,wi){
  if(!confirm("Delete this weight entry?")) return;
  db[type][ai].weights.splice(wi,1);
  save(); viewAnimal(type,ai);
}

/* =========================
   ALERTS / GRAPH / GROWTH
========================= */

function alerts(type,weights){
  if(weights.length<2) return "";
  let out="";
  let last=weights.at(-1).weight;
  let prev=weights.at(-2).weight;
  if(last<prev) out+=`<div class="card danger">⚠ Weight loss</div>`;
  return out;
}

function weightGraph(data){
  if(data.length<2) return "";
  let max=Math.max(...data.map(d=>d.weight));
  let min=Math.min(...data.map(d=>d.weight));
  let pts=data.map((d,i)=>{
    let x=20+(i/(data.length-1))*260;
    let y=160-((d.weight-min)/(max-min||1))*120;
    return `${x},${y}`;
  }).join(" ");
  return `<svg width="100%" height="180"><polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="3"/></svg>`;
}

function growthInfo(w){
  if(w.length<2) return "";
  let g=w.at(-1).weight-w[0].weight;
  return `<div class="card">Gain: ${g.toFixed(1)} kg</div>`;
}

/* =========================
   HELPERS
========================= */

function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function emoji(t){
  if(t.includes("cow")) return "🐄";
  if(t.includes("sheep")) return "🐑";
  if(t.includes("broiler")||t.includes("chicken")) return "🐔";
  if(t.includes("worm")) return "🪱";
  return "🐾";
}

/* =========================
   FINANCE (UNCHANGED)
========================= */

function newInvoice(){
  db.invoices.push({number:"INV-"+(db.invoices.length+1),total:0,paid:0,balance:0,status:"UNPAID"});
  save(); show("finance");
}

function viewInvoice(i){
  screenEl().innerHTML=`<button onclick="show('finance')">⬅ Back</button>`;
}

function newExpense(){
  let c=prompt("Category");
  let a=Number(prompt("Amount"));
  if(!c||!a) return;
  db.expenses.push({date:today(),category:c,amount:a});
  save(); show("finance");
}

/* =========================
   START
========================= */

show("dashboard");
