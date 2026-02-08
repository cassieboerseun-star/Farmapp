/* =========================
   FARM ERP – CORE + ALERTS + CUSTOM ANIMAL TYPES
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {
  animalTypes: ["cows","sheep","broilers","worms"],
  cows: [],
  sheep: [],
  broilers: [],
  worms: [],
  invoices: [],
  expenses: []
};

/* ===== ENSURE TYPES EXIST ===== */
db.animalTypes.forEach(t=>{
  if(!db[t]) db[t]=[];
});

/* ===== AUTO-MIGRATE OLD ANIMALS ===== */
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
   ADD ANIMAL TYPE
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
   ANIMALS (UNCHANGED LOGIC)
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

    <label>Name</label>
    <input id="ename" value="${a.name}">
    <button onclick="saveAnimalName('${type}',${index})">💾 Save Name</button>

    <h3>Add Weight</h3>
    <input id="w" type="number" placeholder="Weight (kg)">
    <button onclick="addWeight('${type}',${index})">➕ Add Weight</button>

    <h3>Weight History</h3>
    ${a.weights.map((x,wi)=>`
      <div class="card" style="display:flex;justify-content:space-between">
        ${x.date}: ${x.weight} kg
        ${a.weights.length>1?`<button class="danger" onclick="deleteWeight('${type}',${index},${wi})">🗑</button>`:""}
      </div>
    `).join("")}

    <h3>Weight Graph</h3>
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
   ALERTS + GRAPH + GROWTH
========================= */

function alerts(type,weights){
  if(weights.length<2) return "";

  let out="";
  let last=weights[weights.length-1].weight;
  let prev=weights[weights.length-2].weight;

  if(last<prev){
    out+=`<div class="card danger">⚠ Weight loss detected</div>`;
  }

  let first=weights[0];
  let lastRec=weights[weights.length-1];
  let days=Math.max(1,(new Date(lastRec.date)-new Date(first.date))/(1000*60*60*24));
  let gain=lastRec.weight-first.weight;
  let daily=gain/days;

  let limits={cows:0.2,sheep:0.2,broilers:0.05,worms:0.01};

  if(limits[type]!==undefined && daily<limits[type]){
    out+=`<div class="card warning">⚠ Low growth (${daily.toFixed(2)} kg/day)</div>`;
  }

  return out;
}

function weightGraph(data){
  if(data.length<2) return "<div class='card'>Add more weights to see graph</div>";
  let w=300,h=180,pad=25;
  let max=Math.max(...data.map(d=>d.weight));
  let min=Math.min(...data.map(d=>d.weight));
  let pts=data.map((d,i)=>{
    let x=pad+(i/(data.length-1))*(w-pad*2);
    let y=h-pad-((d.weight-min)/(max-min||1))*(h-pad*2);
    return `${x},${y}`;
  }).join(" ");
  return `<svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}">
    <polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="3"/>
  </svg>`;
}

function growthInfo(weights){
  if(weights.length<2) return "";
  let first=weights[0];
  let last=weights[weights.length-1];
  let days=Math.max(1,(new Date(last.date)-new Date(first.date))/(1000*60*60*24));
  let gain=last.weight-first.weight;
  return `<div class="card">
    Gain: ${gain.toFixed(1)} kg<br>
    Avg Daily Gain: ${(gain/days).toFixed(2)} kg/day<br>
    Growth Rate: ${((gain/first.weight)*100).toFixed(1)} %
  </div>`;
}

/* =========================
   HELPERS
========================= */

function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function emoji(t){
  if(t.includes("cow")) return "🐄";
  if(t.includes("sheep")) return "🐑";
  if(t.includes("chicken")||t.includes("broiler")) return "🐔";
  if(t.includes("worm")) return "🪱";
  return "🐾";
}

/* =========================
   FINANCE (UNCHANGED)
========================= */

function newInvoice(){
  db.invoices.push({number:"INV-"+(db.invoices.length+1),total:0,paid:0,balance:0,payments:[],status:"UNPAID"});
  save(); show("finance");
}

function viewInvoice(i){
  let inv=db.invoices[i];
  screenEl().innerHTML=`
    <input id="invtotal" type="number" value="${inv.total}">
    <button onclick="saveInvoice(${i})">💾 Save</button>
    <button onclick="show('finance')">⬅ Back</button>
  `;
}

function saveInvoice(i){
  let inv=db.invoices[i];
  inv.total=Number(invtotal.value);
  inv.balance=inv.total-inv.paid;
  save(); show("finance");
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
