let db = JSON.parse(localStorage.getItem("farmdb")) || {
  animals: [], profits: [], expenses: [], inventory: []
};

function save(){ localStorage.setItem("farmdb", JSON.stringify(db)); }

function show(screen){
  if(screen==='dashboard'){
    let profit = db.profits.reduce((a,b)=>a+b,0);
    let expense = db.expenses.reduce((a,b)=>a+b,0);
    document.getElementById("screen").innerHTML =
      `<div class='card'>Profit: ${profit}</div>
       <div class='card'>Expenses: ${expense}</div>
       <div class='card'>Net: ${profit-expense}</div>`;
  }

  if(screen==='animals'){
    document.getElementById("screen").innerHTML =
      `<input id='aname' placeholder='Animal name'>
       <input id='aweight' type='number' placeholder='Weight (kg)'>
       <button onclick='addAnimal()'>Add Animal</button>
       ${db.animals.map(a=>`<div class='card'>${a.name} - ${a.weight}kg</div>`).join("")}`;
  }

  if(screen==='finance'){
    document.getElementById("screen").innerHTML =
      `<input id='p' type='number' placeholder='Profit'>
       <button onclick='addProfit()'>Add Profit</button>
       <input id='e' type='number' placeholder='Expense'>
       <button onclick='addExpense()'>Add Expense</button>`;
  }

  if(screen==='inventory'){
    document.getElementById("screen").innerHTML =
      `<input id='iname' placeholder='Item name'>
       <input id='iqty' type='number' placeholder='Quantity'>
       <button onclick='addItem()'>Add Item</button>
       ${db.inventory.map(i=>`<div class='card'>${i.name}: ${i.qty}</div>`).join("")}`;
  }
}

function addAnimal(){ db.animals.push({name:aname.value, weight:aweight.value}); save(); show('animals'); }
function addProfit(){ db.profits.push(Number(p.value)); save(); show('dashboard'); }
function addExpense(){ db.expenses.push(Number(e.value)); save(); show('dashboard'); }
function addItem(){ db.inventory.push({name:iname.value, qty:iqty.value}); save(); show('inventory'); }

show('dashboard');
