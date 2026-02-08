/* =========================
   FARM ERP – CORE + GRAPH + GROWTH RATE
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [],
  sheep: [],
  broilers: [],
  worms: [],
  invoices: [],
  expenses: []
};

/* ===== AUTO-MIGRATE OLD ANIMALS ===== */
["cows","sheep","broilers","worms"].forEach(t=>{
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
   NAVIGATION (UNCHANGED)
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
      <button onclick="animalList('cows')">🐄 Cows</button>
      <button onclick="animalList('sheep')">🐑 Sheep</button>
      <button onclick="animalList('broilers')">🐔 Broilers</button>
      <button onclick="animalList('worms')">🪱 Worms</button>
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
   ANIMALS + GROWTH RATE
========================= */

function animalList(type){
  screenEl().innerHTML=`
    <h2>${type.toUpperCase()}</h2>

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
   GRAPH + GRID
========================= */

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

  let grid="";
  for(let i=0;i<5;i++){
    let y=pad+(i*(h-pad*2)/4);
    grid+=`<line x1="${pad}" x2="${w-pad}" y1="${y}" y2="${y}" stroke="#e5e7eb"/>`;
  }

  return `
    <svg width="100%" height="${h}" viewBox="0 0 ${w} ${h}">
      ${grid}
      <polyline points="${pts}" fill="none" stroke="#2563eb" stroke-width="3"/>
    </svg>
  `;
}

/* =========================
   GROWTH RATE INFO
========================= */

function growthInfo(weights){
  if(weights.length<2) return "";

  let first=weights[0];
  let last=weights[weights.length-1];

  let d1=new Date(first.date);
  let d2=new Date(last.date);
  let days=Math.max(1,(d2-d1)/(1000*60*60*24));

  let gain=last.weight-first.weight;
  let daily=(gain/days).toFixed(2);
  let percent=((gain/first.weight)*100).toFixed(1);

  return `
    <div class="card">
      <b>Growth Summary</b><br>
      Gain: ${gain.toFixed(1)} kg<br>
      Avg Daily Gain: ${daily} kg/day<br>
      Growth Rate: ${percent} %
    </div>
  `;
}

/* =========================
   INVOICES & EXPENSES (UNCHANGED)
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
