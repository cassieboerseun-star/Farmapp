/* =========================
   FARM ERP – ANIMALS FIXED + GRAPH
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {
  animalTypes: ["cows","sheep","broilers","worms"],
  animals: {},   // dynamic types
  invoices: [],
  expenses: []
};

/* --- migrate old data safely --- */
db.animalTypes.forEach(t=>{
  if(!db.animals[t]) db.animals[t] = [];
  db.animals[t] = db.animals[t].map(a=>{
    if(a.weights) return a;
    return { name: a.name, weights:[{date:today(),weight:a.weight||0}] };
  });
});

function save(){ localStorage.setItem("farmdb", JSON.stringify(db)); }
function today(){ return new Date().toISOString().split("T")[0]; }

/* =========================
   NAVIGATION
========================= */

function show(screen){
  if(screen==="dashboard"){
    let income = db.invoices.reduce((s,i)=>s+(i.paid||0),0);
    let exp = db.expenses.reduce((s,e)=>s+e.amount,0);

    screenEl().innerHTML = `
      <div class="card">💰 Income: ${income}</div>
      <div class="card">💸 Expenses: ${exp}</div>
      <div class="card"><b>📈 Net Profit: ${income-exp}</b></div>
    `;
  }

  if(screen==="animals"){
    screenEl().innerHTML = `
      <h2>Animals</h2>

      ${db.animalTypes.map(t=>`
        <button onclick="animalList('${t}')">${emoji(t)} ${cap(t)}</button>
      `).join("")}

      <button onclick="addAnimalType()">➕ Add Animal Type</button>
    `;
  }

  if(screen==="finance"){
    screenEl().innerHTML = `
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

function screenEl(){ return document.getElementById("screen"); }

/* =========================
   ANIMAL TYPES
========================= */

function addAnimalType(){
  let t = prompt("New animal type (e.g. goats)");
  if(!t) return;
  t = t.toLowerCase();
  if(db.animalTypes.includes(t)) return alert("Already exists");
  db.animalTypes.push(t);
  db.animals[t] = [];
  save();
  show("animals");
}

/* =========================
   ANIMALS
========================= */

function animalList(type){
  screenEl().innerHTML = `
    <h2>${cap(type)}</h2>

    <button onclick="addAnimal('${type}')">➕ Add ${cap(type)}</button>

    ${db.animals[type].map((a,i)=>`
      <div class="card" onclick="viewAnimal('${type}',${i})">
        ${a.name} – ${lastWeight(a)} kg
      </div>
    `).join("") || "<div class='card'>No animals</div>"}

    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type){
  let n = prompt("Animal name / ID");
  let w = Number(prompt("Starting weight (kg)"));
  if(!n || !w) return;

  db.animals[type].push({
    name:n,
    weights:[{date:today(),weight:w}]
  });
  save();
  animalList(type);
}

function viewAnimal(type,i){
  let a = db.animals[type][i];

  screenEl().innerHTML = `
    <h2>${a.name}</h2>

    <input id="aname" value="${a.name}">
    <button onclick="saveAnimalName('${type}',${i})">💾 Save Name</button>

    <h3>Add Weight</h3>
    <input id="w" type="number" placeholder="Weight (kg)">
    <button onclick="addWeight('${type}',${i})">➕ Add Weight</button>

    <h3>Weight History</h3>
    ${a.weights.map((x,wi)=>`
      <div class="card" style="display:flex;justify-content:space-between">
        ${x.date}: ${x.weight} kg
        ${a.weights.length>1?`<button class="danger" onclick="deleteWeight('${type}',${i},${wi})">🗑</button>`:""}
      </div>
    `).join("")}

    <h3>Weight Graph</h3>
    ${weightGraph(a.weights)}

    <button class="danger" onclick="deleteAnimal('${type}',${i})">🗑 Delete Animal</button>
    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function saveAnimalName(t,i){
  db.animals[t][i].name = aname.value;
  save();
  viewAnimal(t,i);
}

function addWeight(t,i){
  let w = Number(document.getElementById("w").value);
  if(!w) return alert("Enter weight");
  db.animals[t][i].weights.push({date:today(),weight:w});
  save();
  viewAnimal(t,i);
}

function deleteWeight(t,ai,wi){
  if(!confirm("Delete this weight entry?")) return;
  db.animals[t][ai].weights.splice(wi,1);
  save();
  viewAnimal(t,ai);
}

function deleteAnimal(t,i){
  if(!confirm("Delete this animal?")) return;
  db.animals[t].splice(i,1);
  save();
  animalList(t);
}

/* =========================
   WEIGHT LINE GRAPH (SVG)
========================= */

function weightGraph(data){
  if(data.length<2) return "<div class='card'>Add more weights to see graph</div>";

  let max = Math.max(...data.map(x=>x.weight));
  let min = Math.min(...data.map(x=>x.weight));
  let h = 160, w = 280, pad = 20;

  let pts = data.map((d,i)=>{
    let x = pad + (i/(data.length-1))*(w-pad*2);
    let y = h - pad - ((d.weight-min)/(max-min||1))*(h-pad*2);
    return `${x},${y}`;
  }).join(" ");

  return `
    <svg width="100%" height="${h}">
      <polyline points="${pts}"
        fill="none"
        stroke="#2563eb"
        stroke-width="3"/>
    </svg>
  `;
}

/* =========================
   HELPERS
========================= */

function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
function lastWeight(a){ return a.weights[a.weights.length-1].weight; }
function emoji(t){
  if(t.includes("cow")) return "🐄";
  if(t.includes("sheep")) return "🐑";
  if(t.includes("chicken")||t.includes("broiler")) return "🐔";
  if(t.includes("worm")) return "🪱";
  return "🐾";
}

/* =========================
   INVOICES & EXPENSES
   (UNCHANGED – OMITTED FOR BREVITY)
========================= */

show("dashboard");
