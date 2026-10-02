const products = {
  account: ["Roblox"],
  key: ["Valorant", "CS2", "FiveM"]
};

let type = "account";
let sales = JSON.parse(localStorage.getItem("tigelinha_sales") || "[]");

const $ = id => document.getElementById(id);
const money = v => Number(v || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

function setType(next){
  type = next;
  document.querySelectorAll(".type").forEach(b=>b.classList.toggle("active",b.dataset.type===type));
  $("accountFields").classList.toggle("hidden",type!=="account");
  $("keyFields").classList.toggle("hidden",type!=="key");
  $("product").innerHTML = products[type].map(p=>`<option>${p}</option>`).join("");
}
function save(){localStorage.setItem("tigelinha_sales",JSON.stringify(sales)); renderAll();}
function generateMessage(s){
  if(s.type==="account") return `Muito obrigado por comprar na Tigelinha! 🥣❤️

Sua conta foi verificada antes da entrega.

🎮 Produto: ${s.product}
👤 Nick: ${s.username || "Não informado"}
🔑 Senha: ${s.password || "Não informado"}${s.email ? `\n📧 Email: ${s.email}` : ""}

⚠️ Guarde seus dados com segurança e não compartilhe sua senha.
${s.note ? `\n📝 Observação: ${s.note}` : ""}

Obrigado pela confiança!`;
  return `Muito obrigado por comprar na Tigelinha! 🥣❤️

🔑 Sua key foi preparada para entrega.

🎮 Produto: ${s.product}
🔐 Key: ${s.key || "Não informada"}
💬 Discord: ${s.client}
⏱️ Validade: ${s.validity || "Não informada"}${s.note ? `\n📝 Observação: ${s.note}` : ""}

Obrigado pela confiança!`;
}
$("saleForm").addEventListener("submit",e=>{
  e.preventDefault();
  const s={id:crypto.randomUUID(),date:new Date().toISOString(),type,product:$("product").value,client:$("client").value.trim(),price:Number($("price").value),status:$("status").value,note:$("note").value.trim()};
  if(type==="account") Object.assign(s,{username:$("username").value.trim(),password:$("password").value,email:$("email").value.trim()});
  else Object.assign(s,{key:$("key").value.trim(),validity:$("validity").value.trim()});
  sales.unshift(s); save(); $("messagePreview").textContent=generateMessage(s); alert("Venda registrada e mensagem gerada!");
});
$("copyMsg").onclick=async()=>{await navigator.clipboard.writeText($("messagePreview").textContent); $("copyMsg").textContent="✓ Copiado";setTimeout(()=>$("copyMsg").textContent="📋 Copiar",1200)};
$("clearForm").onclick=()=>{$("saleForm").reset();setType(type);$("messagePreview").textContent="Preencha a venda e clique em “Gerar entrega”."};
document.querySelectorAll(".type").forEach(b=>b.onclick=()=>setType(b.dataset.type));

const titles={dashboard:["Dashboard","Visão geral das suas vendas."],new:["Nova venda","Cadastre a entrega e gere a mensagem automaticamente."],sales:["Vendas","Histórico completo das vendas registradas."],clients:["Clientes","Clientes que já possuem vendas registradas."],products:["Produtos","Catálogo atual da Tigelinha."]};
function nav(view){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active-view"));$(view).classList.add("active-view");document.querySelectorAll(".nav").forEach(b=>b.classList.toggle("active",b.dataset.view===view));$("pageTitle").textContent=titles[view][0];$("pageSub").textContent=titles[view][1]}
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>nav(b.dataset.view));$("quickNew").onclick=()=>nav("new");$("goSales").onclick=()=>nav("sales");

function table(items){
 if(!items.length)return `<div style="padding:25px;color:#777;text-align:center">Nenhuma venda encontrada.</div>`;
 return `<table><thead><tr><th>Data</th><th>Cliente</th><th>Produto</th><th>Tipo</th><th>Valor</th><th>Status</th></tr></thead><tbody>${items.map(s=>`<tr><td>${new Date(s.date).toLocaleString("pt-BR")}</td><td>${esc(s.client)}</td><td>${esc(s.product)}</td><td>${s.type==="account"?"Conta":"Key"}</td><td>${money(s.price)}</td><td><span class="badge ${s.status==="Entregue"?"ok":"pending"}">${s.status}</span></td></tr>`).join("")}</tbody></table>`;
}
function esc(x){return String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function renderAll(){
 const revenue=sales.reduce((a,s)=>a+Number(s.price||0),0);
 $("statRevenue").textContent=money(revenue);$("statSales").textContent=sales.length;
 $("statAccounts").textContent=sales.filter(s=>s.type==="account").length;$("statKeys").textContent=sales.filter(s=>s.type==="key").length;
 $("recentSales").innerHTML=table(sales.slice(0,6)); $("allSales").innerHTML=table(sales);
 const clients={};sales.forEach(s=>{clients[s.client]=(clients[s.client]||0)+1});
 $("clientsList").innerHTML=Object.keys(clients).length?`<table><thead><tr><th>Cliente</th><th>Compras</th></tr></thead><tbody>${Object.entries(clients).map(([c,n])=>`<tr><td>${esc(c)}</td><td>${n}</td></tr>`).join("")}</tbody></table>`:"<div style='padding:25px;color:#777'>Nenhum cliente ainda.</div>";
 $("productsList").innerHTML=[...products.account.map(x=>[x,"Conta"]),...products.key.map(x=>[x,"Key"])].map(([n,t])=>`<div class="product"><h3>${n}</h3><p>${t}</p></div>`).join("");
}
$("searchSales").addEventListener("input",e=>{const q=e.target.value.toLowerCase();$("allSales").innerHTML=table(sales.filter(s=>`${s.client} ${s.product} ${s.type} ${s.status}`.toLowerCase().includes(q)))});
setType("account");renderAll();
