/* =========================
   FARM ERP – FINAL + REPORTS
========================= */

let db = JSON.parse(localStorage.getItem("farmdb")) || {
  cows: [], sheep: [], broilers: [], worms: [],
  invoices: [], expenses: []
};

function save(){ localStorage.setItem("farmdb", JSON.stringify(db)); }
function today(){ return new Date().toISOString().split("T")[0]; }
function month(d){ return d.slice(0,7); }
function year(d){ return d.slice(0,4); }

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
      <div class="card"><b>Net Profit: ${income-exp}</b></div>

      <button onclick="show('reports')">📊 Reports</button>
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
          ${i.number} | ${i.status} | Bal: ${i.balance}
        </div>`).join("")}

      <h3>Expenses</h3>
      ${db.expenses.map((e,i)=>`
        <div class="card" onclick="editExpense(${i})">
          ${e.date} – ${e.category}: ${e.amount}
        </div>`).join("")}
    `;
  }

  if(screen==="reports"){
    document.getElementById("screen").innerHTML=`
      <h2>Reports</h2>
      <button onclick="monthlyReport()">📅 Monthly Report</button>
      <button onclick="annualReport()">📆 Annual Report</button>
      <button onclick="expenseReport()">💸 Expense Breakdown</button>
      <button onclick="show('dashboard')">⬅ Back</button>
    `;
  }
}

/* =========================
   REPORTS
========================= */

function monthlyReport(){
  let m = {};
  db.invoices.forEach(i=>{
    i.payments.forEach(p=>{
      let k=month(p.date);
      m[k]=(m[k]||0)+p.amount;
    });
  });

  let e = {};
  db.expenses.forEach(x=>{
    let k=month(x.date);
    e[k]=(e[k]||0)+x.amount;
  });

  document.getElementById("screen").innerHTML=`
    <h3>Monthly Profit Report</h3>
    ${Object.keys({...m,...e}).sort().map(k=>{
      let inc=m[k]||0, exp=e[k]||0;
      return `<div class="card">
        ${k} | Income: ${inc} | Expenses: ${exp} | Net: ${inc-exp}
      </div>`;
    }).join("")}
    <button onclick="window.print()">🖨 Print</button>
    <button onclick="show('reports')">⬅ Back</button>
  `;
}

function annualReport(){
  let y={};
  db.invoices.forEach(i=>{
    i.payments.forEach(p=>{
      let k=year(p.date);
      y[k]=(y[k]||0)+p.amount;
    });
  });

  let e={};
  db.expenses.forEach(x=>{
    let k=year(x.date);
    e[k]=(e[k]||0)+x.amount;
  });

  document.getElementById("screen").innerHTML=`
    <h3>Annual Summary</h3>
    ${Object.keys({...y,...e}).sort().map(k=>{
      let inc=y[k]||0, exp=e[k]||0;
      return `<div class="card">
        ${k} | Income: ${inc} | Expenses: ${exp} | Net: ${inc-exp}
      </div>`;
    }).join("")}
    <button onclick="window.print()">🖨 Print</button>
    <button onclick="show('reports')">⬅ Back</button>
  `;
}

function expenseReport(){
  let c={};
  db.expenses.forEach(e=>{
    c[e.category]=(c[e.category]||0)+e.amount;
  });

  document.getElementById("screen").innerHTML=`
    <h3>Expense Breakdown</h3>
    ${Object.keys(c).map(k=>`
      <div class="card">${k}: ${c[k]}</div>
    `).join("")}
    <button onclick="window.print()">🖨 Print</button>
    <button onclick="show('reports')">⬅ Back</button>
  `;
}

/* =========================
   ANIMALS (UNCHANGED)
========================= */

function animalList(type){
  document.getElementById("screen").innerHTML=`
    <h2>${type.toUpperCase()}</h2>
    <input id="name" placeholder="Animal ID / Name">
    <input id="weight" type="number" placeholder="Weight (kg)">
    <button onclick="addAnimal('${type}')">Add</button>
    ${db[type].map((a,i)=>`
      <div class="card" onclick="viewAnimal('${type}',${i})">
        ${a.name} – ${a.history[a.history.length-1].weight} kg
      </div>`).join("")}
    <button onclick="show('animals')">⬅ Back</button>
  `;
}

function addAnimal(type){
  let n=name.value,w=Number(weight.value);
  if(!n||!w) return alert("Enter name and weight");
  db[type].push({name:n,history:[{date:today(),weight:w}]});
  save(); animalList(type);
}

function viewAnimal(type,i){
  let a=db[type][i],h=a.history;
  document.getElementById("screen").innerHTML=`
    <h2>${a.name}</h2>
    <input id="nw" type="number" placeholder="New weight">
    <button onclick="addWeight('${type}',${i})">Add Weight</button>
    ${h.map(x=>`<div class="card">${x.date}: ${x.weight}</div>`).join("")}
    ${weightChart(h)}
    <button onclick="animalList('${type}')">⬅ Back</button>
  `;
}

function addWeight(type,i){
  let w=Number(nw.value);
  if(!w) return;
  db[type][i].history.push({date:today(),weight:w});
  save(); viewAnimal(type,i);
}

function weightChart(h){
  let m=Math.max(...h.map(x=>x.weight),1);
  return `<div>${h.map(x=>`
    <div style="background:#2563eb;color:white;margin:4px;width:${Math.max(15,(x.weight/m)*100)}%">
      ${x.weight} kg
    </div>`).join("")}</div>`;
}

/* =========================
   FINANCE + BACKUP (UNCHANGED)
========================= */
/* (kept same as previous working version) */

show("dashboard");
