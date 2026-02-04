let db = JSON.parse(localStorage.getItem("farmdb")) || {
  invoices: [],
  expenses: [],
  cows: [], sheep: [], broilers: [], worms: []
};

function save(){ localStorage.setItem("farmdb", JSON.stringify(db)); }
function today(){ return new Date().toISOString().split("T")[0]; }

/* ===== NAV ===== */
function show(screen){
  if(screen==="dashboard"){
    document.getElementById("screen").innerHTML = `
      <div class="card">Welcome</div>
    `;
  }

  if(screen==="finance"){
    document.getElementById("screen").innerHTML = `
      <button onclick="newInvoice()">New Invoice</button>
      ${db.invoices.map((i,n)=>`
        <div class="card" onclick="viewInvoice(${n})">
          ${i.number} – ${i.status}
        </div>`).join("")}
    `;
  }
}

/* ===== INVOICES ===== */
function newInvoice(){
  db.invoices.push({
    number: "INV-" + (db.invoices.length+1),
    total: 0,
    paid: 0,
    balance: 0,
    payments: [],
    status: "UNPAID"
  });
  save();
  show("finance");
}

function viewInvoice(i){
  let inv = db.invoices[i];
  let name = localStorage.getItem("companyName") || "";
  let logo = localStorage.getItem("companyLogo") || "";

  document.getElementById("screen").innerHTML = `
    <!-- PRINT VERSION -->
    <div class="invoice-print">
      <div class="invoice-header">
        ${logo ? `<img src="${logo}">` : ""}
        <div>
          <div class="invoice-title">${name}</div>
          <div>Invoice #${inv.number}</div>
        </div>
      </div>

      <div class="invoice-row"><div>Total</div><div>${inv.total}</div></div>
      <div class="invoice-row"><div>Paid</div><div>${inv.paid}</div></div>
      <div class="invoice-row invoice-total">
        <div>Balance Due</div><div>${inv.balance}</div>
      </div>

      <div class="invoice-footer">
        Thank you for your business
      </div>
    </div>

    <!-- EDIT UI -->
    <div class="card">
      <input id="invtotal" type="number" value="${inv.total}">
      <button onclick="saveInvoice(${i})">Save</button>
      <button onclick="Android.printPage()">🖨 Print Invoice</button>
      <button onclick="show('finance')">Back</button>
    </div>
  `;
}

function saveInvoice(i){
  let inv = db.invoices[i];
  inv.total = Number(invtotal.value);
  inv.balance = inv.total - inv.paid;
  save();
  viewInvoice(i);
}

/* START */
show("finance");
