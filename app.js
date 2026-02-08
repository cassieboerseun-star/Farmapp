/* =========================
   FARM ERP – ANIMALS FINAL (WITH DELETE)
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {};

/* ===== ENSURE CORE STRUCTURE ===== */
if(!db.invoices) db.invoices=[];
if(!db.expenses) db.expenses=[];

/* ===== AUTO-DETECT / INIT ANIMAL TYPES ===== */
const DEFAULT_TYPES = ["cows","sheep","broilers","worms"];

if(!Array.isArray(db.animalTypes)){
  db.animalTypes = DEFAULT_TYPES.filter(t => Array.isArray(db[t]));
  if(db.animalTypes.length === 0) db.animalTypes = [...DEFAULT_TYPES];
}

/* ===== ENSURE ARRAYS FOR TYPES ===== */
db.animalTypes.forEach(t=>{
  if(!Array.isArray(db[t])) db[t] = [];
});

/* ===== AUTO-MIGRATE OLD ANIMALS ===== */
db.animalTypes.forEach(t=>{
  db[t] = db[t].map(a=>{
    if(a.weights) return a;
    return {
      name: a.name,
      weights: [{ date: today(), weight: a.weight }]
    };
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
      ${db.invoices.map(i=>`
        <div class="card">${i.number} | ${i.status}</div>
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
  if(db.animalTypes.includes(t)) return alert("Type exists");

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
        ${a.name} – ${a.weights.at(-1).weight} kg
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
    ${graphInfo(a.weights)}
    ${growthInfo(a.weights)}

    <button class="danger" onclick="deleteAnimal('${type}',${index})">🗑 Delete Animal</button>
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

function deleteAnimal(type,index){
  if(!confirm("Delete this animal and all its data?")) return;
  db[type].splice(index,1);
  save();
  animalList(type);
}

/* =========================
   ALERTS
========================= */

function alerts(type,weights){
  if(weights.length<2) return "";
  let out="";
  let last=weights.at(-1).weight;
  let prev=weights.at(-2).weight;
  if(last<prev) out+=`<div class="card danger">⚠ Weight loss detected</div>`;

  let limits={cows:0.2,sheep:0.2,broilers:0.05,worms:0.01};
  if(limits[type]){
    let g=growthCalc(weights).daily;
    if(g<limits[type]){
      out+=`<div class="card warning">⚠ Low growth (${g.toFixed(2)} kg/day)</div>`;
    }
  }
  return out;
}

/* =========================
   GRAPH + GROWTH
========================= */

function weightGraph(data){
  if(data.length<2) return "<div class='card'>Add more weights to see graph</div>";
  let w=300,h=180,p=25;
  let max=Math.max(...data.map(d=>d.weight));
  let min=Math.min(...data.map(d=>d.weight));

  let grid="";
  for(let i=0;i<5;i++){
    let y=p+(i*(h-p*2)/4);
    grid+=`<line x1="${p}" x2="${w-p}" y1="${y}" y2="${y}" stroke="#e5e7eb"/>`;
  }

  let pts=data.map((d,i)=>{
    let x=p+(i/(data.length-1))*(w-p*2);
    let y=h-p-((d.weight-min)/(max-min||1))*(h-p*2);
    return `${x},${y}`;
  }).join(" ");

  return `
    <svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}">
      ${grid}
      <polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="3"/>
    </svg>
  `;
}

function graphInfo(w){
  return `<div class="card">
    Latest: ${w.at(-1).weight} kg<br>
    Min: ${Math.min(...w.map(x=>x.weight))} kg<br>
    Max: ${Math.max(...w.map(x=>x.weight))} kg<br>
    Entries: ${w.length}
  </div>`;
}

function growthCalc(w){
  let first=w[0], last=w.at(-1);
  let days=Math.max(1,(new Date(last.date)-new Date(first.date))/(1000*60*60*24));
  let gain=last.weight-first.weight;
  return {gain, daily:gain/days, percent:(gain/first.weight)*100};
}

function growthInfo(w){
  if(w.length<2) return "";
  let g=growthCalc(w);
  return `<div class="card">
    Gain: ${g.gain.toFixed(1)} kg<br>
    Avg Daily Gain: ${g.daily.toFixed(2)} kg/day<br>
    Growth Rate: ${g.percent.toFixed(1)} %
  </div>`;
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
  db.invoices.push({number:"INV-"+(db.invoices.length+1),status:"UNPAID"});
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
