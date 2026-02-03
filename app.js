/* =========================
   FARM ERP – FINAL + REPORTS FIXED
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
   REPORTS (FIXED)
========================= */

function monthlyReport(){
  let incomeByMonth = {};
  let expenseByMonth = {};

  // income
  db.invoices.forEach(inv=>{
    if(inv.payments && inv.payments.length){
      inv.payments.forEach(p=>{
        let k = month(p.date);
        incomeByMonth[k] = (incomeByMonth[k]||0) + p.amount;
      });
    }
  });

  // expenses
  db.expenses.forEach(e=>{
    let k = month(e.date);
    expenseByMonth[k] = (expenseByMonth[k]||0) + e.amount;
  });

  let months = Object.keys({...incomeByMonth, ...expenseByMonth}).sort();

  document.getElementById("screen").innerHTML=`
    <h3>Monthly Profit Report</h3>
    ${months.map(m=>{
      let inc = incomeByMonth[m]||0;
      let exp = expenseByMonth[m]||0;
      return `<div class="card">
        ${m} | Income: ${inc} | Expenses: ${exp} | Net: ${inc-exp}
      </div>`;
    }).join("") || "<div class='card'>No data yet</div>"}

    <button onclick="window.print()">🖨 Print</button>
    <button onclick="show('reports')">⬅ Back</button>
  `;
}

function annualReport(){
  let incomeByYear = {};
  let expenseByYear = {};

  db.invoices.forEach(inv=>{
    if(inv.payments && inv.payments.length){
      inv.payments.forEach(p=>{
        let k = year(p.date);
        incomeByYear[k] = (incomeByYear[k]||0) + p.amount;
      });
    }
  });

  db.expenses.forEach(e=>{
    let k = year(e.date);
    expenseByYear[k] = (expenseByYear[k]||0) + e.amount;
  });

  let years = Object.keys({...incomeByYear, ...expenseByYear}).sort();

  document.getElementById("screen").innerHTML=`
    <h3>Annual Summary</h3>
    ${years.map(y=>{
      let inc = incomeByYear[y]||0;
      let exp = expenseByYear[y]||0;
      return `<div class="card">
        ${y} | Income: ${inc} | Expenses: ${exp} | Net: ${inc-exp}
      </div>`;
    }).join("") || "<div class='card'>No data yet</div>"}

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
   (Animals, Finance, Backup)
   unchanged from working build
========================= */

show("dashboard");
