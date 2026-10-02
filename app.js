const KEY = "tigelinha_final_v1";

const EMPTY_DB = {
  products: [],
  stock: [],
  clients: [],
  sales: [],
  audit: [],
  settings: {
    storeName: "Tigelinha",
    currency: "BRL",
    globalSupport: "",
    accountTemplate: "Obrigado pela compra! 🥣\n\n🎮 Produto: {produto}\n👤 Nick: {nick}\n🔑 Senha: {senha}{emailLine}\n💬 Suporte: {discord}{observacaoLine}",
    keyTemplate: "Obrigado pela compra! 🥣\n\n🎮 Produto: {produto}\n🔑 Key: {key}\n⏳ Plano: {duracao}\n💬 Suporte: {discord}{observacaoLine}"
  }
};

let db = load();
let page = "dashboard";
let saleMode = "stock";

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return structuredClone(EMPTY_DB);
}
function save() { localStorage.setItem(KEY, JSON.stringify(db)); }
function money(n) { return new Intl.NumberFormat("pt-BR", {style:"currency", currency:db.settings?.currency || "BRL"}).format(Number(n)||0); }
function esc(s="") { return String(s).replace(/[&<>"']/g, m => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }
function fmtDate(d) { return new Date(d).toLocaleDateString("pt-BR"); }
function product(id) { return db.products.find(x => x.id === id) || {}; }
function client(id) { return db.clients.find(x => x.id === id) || {}; }
function stockAvailable(pid, variantId="") { return db.stock.filter(s => s.productId===pid && (!variantId || s.variantId===variantId) && s.status==="available"); }
function variants(p) { return Array.isArray(p.variants) ? p.variants : []; }
function variant(p, id) { return variants(p).find(v => v.id===id) || variants(p)[0] || {}; }
function statusBadge(s) {
  const map={available:["Disponível","green"],reserved:["Reservado","yellow"],sold:["Vendido","blue"],unavailable:["Indisponível","red"],delivered:["Entregue","green"],pending:["Pendente","yellow"],cancelled:["Cancelada","red"]};
  const x=map[s]||[s,s]; return `<span class="badge ${x[1]}">${x[0]}</span>`;
}
function log(action, detail) {
  db.audit.unshift({id:crypto.randomUUID(),date:new Date().toISOString(),action,detail,user:"Admin"});
  db.audit=db.audit.slice(0,300); save();
}
function nextSaleId() {
  const nums=db.sales.map(s=>Number(String(s.id).split("-").pop())||0);
  return `TG-${new Date().getFullYear()}-${String(Math.max(0,...nums)+1).padStart(6,"0")}`;
}
function layout(title, sub, buttons="") { return `<div class="page-title"><div><h1>${title}</h1><p>${sub}</p></div><div class="actions">${buttons}</div></div>`; }
function render(){
  document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===page));
  const c=document.getElementById("content");
  ({dashboard,sales,stock,clients,products,finance,automation,audit,settings}[page]||dashboard)(c);
}

function dashboard(c){
  const delivered=db.sales.filter(s=>s.status==="delivered");
  const revenue=delivered.reduce((a,s)=>a+Number(s.price),0);
  const available=db.stock.filter(s=>s.status==="available");
  const low=db.products.filter(p=>p.active && stockAvailable(p.id).length<=Number(p.low||0));
  const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setHours(0,0,0,0);d.setDate(d.getDate()-6+i);const total=delivered.filter(s=>new Date(s.date).toDateString()===d.toDateString()).reduce((a,s)=>a+Number(s.price),0);return {d,total};});
  const max=Math.max(1,...days.map(x=>x.total));
  c.innerHTML=layout("Dashboard","Visão geral da operação da Tigelinha.",`<button class="btn primary" data-action="newSale">＋ Nova venda</button>`) + `
  <div class="grid cards">
    <div class="card"><div class="stat-top">Faturamento total <div class="stat-icon">💰</div></div><div class="stat-value">${money(revenue)}</div><div class="stat-sub">${delivered.length} vendas entregues</div></div>
    <div class="card"><div class="stat-top">Vendas <div class="stat-icon">🧾</div></div><div class="stat-value">${db.sales.length}</div><div class="stat-sub"><span class="green">${delivered.length} entregues</span> · ${db.sales.filter(s=>s.status==="pending").length} pendentes</div></div>
    <div class="card"><div class="stat-top">Estoque disponível <div class="stat-icon">📦</div></div><div class="stat-value">${available.length}</div><div class="stat-sub">${db.stock.filter(s=>s.type==="account"&&s.status==="available").length} contas · ${db.stock.filter(s=>s.type==="key"&&s.status==="available").length} keys</div></div>
    <div class="card"><div class="stat-top">Estoque baixo <div class="stat-icon">⚠️</div></div><div class="stat-value ${low.length?'yellow':''}">${low.length}</div><div class="stat-sub">${low.length?low.map(p=>esc(p.name)).join(", "):"Tudo dentro do limite"}</div></div>
  </div>
  <div class="grid two">
    <section class="section"><div class="section-head"><b>Vendas dos últimos 7 dias</b><span>${money(days.reduce((a,x)=>a+x.total,0))}</span></div><div class="chart">${days.map(x=>`<div class="bar" style="height:${Math.max(5,x.total/max*165)}px" title="${money(x.total)}"><span>${new Date(x.d).toLocaleDateString("pt-BR",{weekday:"short"}).replace(".","")}</span></div>`).join("")}</div></section>
    <section class="section"><div class="section-head"><b>Produtos com estoque baixo</b><span>${low.length} alertas</span></div>${low.length?`<table><tbody>${low.map(p=>`<tr><td><b>${esc(p.name)}</b><br><small class="muted">${p.type==="account"?"Conta":"Key"}</small></td><td>${stockAvailable(p.id).length}/${p.low}</td><td><button class="btn" data-product="${p.id}" data-action="viewStock">Ver</button></td></tr>`).join("")}</tbody></table>`:`<div class="empty">Nenhum alerta de estoque 🎉</div>`}</section>
  </div>
  <section class="section" style="margin-top:14px"><div class="section-head"><b>Últimas vendas</b><button class="btn" data-page="sales">Ver todas</button></div>${salesTable(db.sales.slice(0,6))}</section>`;
}

function salesTable(rows){
  if(!rows.length)return `<div class="empty">Nenhuma venda encontrada.</div>`;
  return `<table><thead><tr><th>ID</th><th>Cliente</th><th>Produto</th><th>Plano</th><th>Valor</th><th>Data</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(s=>{const p=product(s.productId),cl=client(s.clientId),v=variant(p,s.variantId);return `<tr><td><b>${esc(s.id)}</b></td><td>${esc(cl.name||"—")}</td><td>${esc(p.name||"—")}</td><td>${esc(v.label||"—")}</td><td>${money(s.price)}</td><td>${fmtDate(s.date)}</td><td>${statusBadge(s.status)}</td><td><button class="btn" data-sale="${s.id}" data-action="saleDetail">Abrir</button></td></tr>`}).join("")}</tbody></table>`;
}
function sales(c){
  const q=(document.getElementById("globalSearch")?.value||"").toLowerCase();
  const rows=db.sales.filter(s=>{const p=product(s.productId),cl=client(s.clientId),v=variant(p,s.variantId);return !q||[s.id,p.name,v.label,cl.name,cl.discord,s.note].join(" ").toLowerCase().includes(q)});
  c.innerHTML=layout("Vendas","Histórico, entrega e status das vendas.",`<button class="btn primary" data-action="newSale">＋ Nova venda</button>`) + `<div class="filters"><select class="select" style="width:170px" id="saleFilter"><option value="">Todos os status</option><option value="delivered">Entregues</option><option value="pending">Pendentes</option><option value="cancelled">Canceladas</option></select><input class="input" style="max-width:260px" id="saleSearch" placeholder="Filtrar vendas..."></div><section class="section" id="saleTable">${salesTable(rows)}</section>`;
}
function stock(c){
  const accounts=db.products.filter(p=>p.type==="account"&&p.active), keys=db.products.filter(p=>p.type==="key"&&p.active);
  const group=(arr)=>arr.length?arr.map(p=>`<div class="card product-card"><span class="badge">${p.type==="account"?"👤 Conta":"🔑 Key"}</span><h3>${esc(p.name)}</h3><p>${esc(p.description||"")}</p><div class="product-meta"><span><b>${stockAvailable(p.id).length}</b> disponíveis</span><span>${p.type==="key"?variants(p).map(v=>`${esc(v.label)}: ${stockAvailable(p.id,v.id).length}`).join(" · "):money(p.price)}</span><button class="btn" data-product="${p.id}" data-action="viewStock">Gerenciar</button></div></div>`).join(""):`<div class="empty">Nenhum produto nesta categoria.</div>`;
  c.innerHTML=layout("Estoque","Gerencie contas e keys por produto e duração.",`<button class="btn" data-action="newProduct">＋ Adicionar produto</button> <button class="btn primary" data-action="newStock">＋ Adicionar item</button>`) + `<div class="grid product-grid">${group(accounts)}</div><div style="height:18px"></div><div class="section"><div class="section-head"><b>Keys por duração</b><span>${keys.reduce((a,p)=>a+stockAvailable(p.id).length,0)} disponíveis</span></div><div class="grid product-grid" style="padding:14px">${group(keys)}</div></div>`;
}
function clients(c){ c.innerHTML=layout("Clientes","Cadastro e histórico dos seus clientes.",`<button class="btn primary" data-action="newClient">＋ Novo cliente</button>`) + `<section class="section">${db.clients.length?salesClientTable():`<div class="empty">Nenhum cliente cadastrado.</div>`}</section>`; }
function salesClientTable(){return `<table><thead><tr><th>Cliente</th><th>Discord</th><th>Compras</th><th>Total gasto</th><th>Última compra</th><th></th></tr></thead><tbody>${db.clients.map(cl=>{const ss=db.sales.filter(s=>s.clientId===cl.id&&s.status!=="cancelled"),total=ss.reduce((a,s)=>a+Number(s.price),0);return `<tr><td><b>${esc(cl.name)}</b><br><small class="muted">${esc(cl.notes||"")}</small></td><td>${esc(cl.discord||"—")}</td><td>${ss.length}</td><td>${money(total)}</td><td>${ss.length?fmtDate(ss.sort((a,b)=>new Date(b.date)-new Date(a.date))[0].date):"—"}</td><td><button class="btn" data-client="${cl.id}" data-action="clientDetail">Abrir</button></td></tr>`}).join("")}</tbody></table>`; }

function products(c){
  c.innerHTML=layout("Produtos","Cadastre contas ou keys. Keys podem ter Diário, Semanal, Mensal e Lifetime, cada um com preço e Discord próprios.",`<button class="btn primary" data-action="newProduct">＋ Adicionar produto</button>`) + `<div class="grid product-grid">${db.products.length?db.products.map(p=>productCard(p)).join(""):`<div class="empty">Nenhum produto cadastrado. Comece adicionando seu primeiro produto.</div>`}</div>`;
}
function productCard(p){
  const vs=variants(p);
  const body=p.type==="key" ? `<div class="mini-list">${vs.length ? vs.map(v=>`<div><span>${esc(v.label)}</span><b>${money(v.price)}</b></div>`).join("") : `<small class="muted">Sem planos configurados</small>`}</div>` : `<div class="product-meta"><span>Estoque: <b>${stockAvailable(p.id).length}</b></span><span>${money(p.price)}</span></div>`;
  return `<div class="card product-card"><span class="badge ${p.active?"green":"red"}">${p.active?"Ativo":"Inativo"} · ${p.type==="account"?"Conta":"Key"}</span><h3>${esc(p.name)}</h3><p>${esc(p.description||"Sem descrição")}</p>${body}<div class="actions" style="margin-top:12px"><button class="btn" data-product="${p.id}" data-action="editProduct">Editar</button><button class="btn" data-product="${p.id}" data-action="newStock">＋ Estoque</button></div></div>`;
}
function finance(c){
  const delivered=db.sales.filter(s=>s.status==="delivered"), revenue=delivered.reduce((a,s)=>a+Number(s.price),0), pending=db.sales.filter(s=>s.status==="pending").reduce((a,s)=>a+Number(s.price),0);
  const byProduct=db.products.map(p=>{const ss=delivered.filter(s=>s.productId===p.id);return {p,n:ss.length,total:ss.reduce((a,s)=>a+Number(s.price),0)}}).filter(x=>x.n);
  c.innerHTML=layout("Financeiro","Acompanhe faturamento e desempenho por produto.",`<button class="btn" data-action="export">⇩ Exportar dados</button>`) + `<div class="grid cards"><div class="card"><div class="stat-top">Faturamento</div><div class="stat-value">${money(revenue)}</div><div class="stat-sub">vendas entregues</div></div><div class="card"><div class="stat-top">Ticket médio</div><div class="stat-value">${money(delivered.length?revenue/delivered.length:0)}</div><div class="stat-sub">por venda</div></div><div class="card"><div class="stat-top">A receber</div><div class="stat-value yellow">${money(pending)}</div><div class="stat-sub">vendas pendentes</div></div><div class="card"><div class="stat-top">Clientes</div><div class="stat-value">${db.clients.length}</div><div class="stat-sub">cadastrados</div></div></div><section class="section" style="margin-top:14px"><div class="section-head"><b>Desempenho por produto</b></div>${byProduct.length?`<table><thead><tr><th>Produto</th><th>Vendas</th><th>Faturamento</th><th>Preço médio</th></tr></thead><tbody>${byProduct.sort((a,b)=>b.total-a.total).map(x=>`<tr><td><b>${esc(x.p.name)}</b></td><td>${x.n}</td><td>${money(x.total)}</td><td>${money(x.total/x.n)}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">Ainda não há vendas entregues.</div>`}</section>`;
}
function automation(c){
  c.innerHTML=layout("Automação","Modelos gerais de entrega. O Discord de cada key pode substituir o padrão global.",`<button class="btn primary" data-action="saveSettings">Salvar modelos</button>`) + `<div class="grid two"><section class="section"><div class="section-head"><b>Modelo para Contas</b><span>variáveis</span></div><div style="padding:16px"><textarea class="textarea" id="autoAccount" style="min-height:300px">${esc(db.settings.accountTemplate)}</textarea><div class="notice" style="margin-top:12px">{produto} {nick} {senha} {emailLine} {discord} {cliente} {observacaoLine}</div></div></section><section class="section"><div class="section-head"><b>Modelo para Keys</b><span>variáveis</span></div><div style="padding:16px"><textarea class="textarea" id="autoKey" style="min-height:300px">${esc(db.settings.keyTemplate)}</textarea><div class="notice" style="margin-top:12px">{produto} {key} {duracao} {validade} {discord} {cliente} {observacaoLine}</div></div></section></div>`;
}
function audit(c){
  c.innerHTML=layout("Auditoria","Registro das principais ações realizadas no painel.",`<button class="btn" data-action="clearAudit">Limpar histórico</button>`) + `<section class="section">${db.audit.length?`<table><thead><tr><th>Data</th><th>Ação</th><th>Detalhe</th><th>Usuário</th></tr></thead><tbody>${db.audit.map(a=>`<tr><td>${new Date(a.date).toLocaleString("pt-BR")}</td><td><b>${esc(a.action)}</b></td><td>${esc(a.detail)}</td><td>${esc(a.user)}</td></tr>`).join("")}</tbody></table>`:`<div class="empty">Nenhuma ação registrada.</div>`}</section>`;
}

function settings(c){
  const keyProducts=db.products.filter(p=>p.type==="key");
  c.innerHTML=layout("Configurações","Configure a loja e os canais de cada produto. Cada plano de key pode ter seu próprio Discord, preço e mensagem.",`<button class="btn primary" data-action="saveSettings">Salvar alterações</button>`) + `
  <div class="grid two">
    <section class="section"><div class="section-head"><b>Loja</b><span>geral</span></div><div style="padding:18px" class="form-grid"><div class="field full"><label>Nome da loja</label><input class="input" id="setName" value="${esc(db.settings.storeName)}"></div><div class="field full"><label>Discord padrão</label><input class="input" id="setSupport" value="${esc(db.settings.globalSupport)}" placeholder="Usado somente quando o produto/plano não tiver Discord próprio"></div><div class="field"><label>Moeda</label><input class="input" value="BRL" disabled></div></div></section>
    <section class="section"><div class="section-head"><b>Produtos e planos</b><span>${keyProducts.length} produtos de key</span></div><div style="padding:14px">${db.products.length?db.products.map(p=>`<div class="setting-product"><div><b>${esc(p.name)}</b><small>${p.type==="key"?`${variants(p).length} planos configurados`:`Produto de conta`}</small></div><button class="btn" data-product="${p.id}" data-action="editProduct">Configurar</button></div>`).join(""):`<div class="empty">Cadastre um produto para configurar os dados.</div>`}</div></section>
  </div>`;
}

function openModal(title,body,foot=`<button class="btn" data-action="closeModal">Fechar</button>`){document.getElementById("modalRoot").innerHTML=`<div class="modal-back"><div class="modal"><div class="modal-head"><h2>${title}</h2><button class="close" data-action="closeModal">×</button></div><div class="modal-body">${body}</div><div class="modal-foot">${foot}</div></div></div>`;}

function newProduct(id=null){
  const p=id?product(id):{type:"key",name:"",description:"",price:0,low:3,active:true,variants:defaultVariants()};
  openModal(id?"Configurar produto":"Adicionar produto",`
    <div class="form-grid">
      <div class="field"><label>Tipo</label><select class="select" id="pType" ${id?"disabled":""}><option value="account" ${p.type==="account"?"selected":""}>👤 Conta</option><option value="key" ${p.type==="key"?"selected":""}>🔑 Key</option></select></div>
      <div class="field"><label>Nome do produto</label><input class="input" id="pName" value="${esc(p.name)}" placeholder="Ex.: FiveM External"></div>
      <div class="field"><label>Preço sugerido</label><input class="input" type="number" step=".01" id="pPrice" value="${p.price||0}"></div><div class="field"><label>Alerta de estoque abaixo de</label><input class="input" type="number" id="pLow" value="${p.low??3}"></div>
      <div class="field"><label>Status</label><select class="select" id="pActive"><option value="true" ${p.active!==false?"selected":""}>Ativo</option><option value="false" ${p.active===false?"selected":""}>Inativo</option></select></div>
      <div class="field full"><label>Descrição</label><textarea class="textarea" id="pDesc">${esc(p.description||"")}</textarea></div>
    </div>
    <div id="keyPlansBox" style="margin-top:16px"></div>
  `,`<button class="btn" data-action="closeModal">Cancelar</button><button class="btn primary" data-product="${id||""}" data-action="saveProduct">Salvar produto</button>`);
  const typeEl=document.getElementById("pType");
  const refresh=()=>renderPlanEditor(document.getElementById("keyPlansBox"), typeEl.value, p);
  typeEl.addEventListener("change",refresh); refresh();
}
function defaultVariants(){return ["Diário","Semanal","Mensal","Lifetime"].map(label=>({id:crypto.randomUUID(),label,price:0,discord:"",template:""}));}
function renderPlanEditor(box,type,p){
  if(type!=="key"){box.innerHTML=`<div class="notice">Produtos de conta usam o preço cadastrado em cada item do estoque e o Discord padrão da loja, salvo configuração específica no item.</div>`;return;}
  const vs=variants(p).length?variants(p):defaultVariants();
  box.innerHTML=`<section class="section"><div class="section-head"><b>Planos da key</b><span>preço + Discord + template</span></div><div style="padding:12px"><div class="plan-editor">${vs.map((v,i)=>`<div class="plan-row" data-plan-index="${i}"><div class="plan-title">${esc(v.label)}</div><input class="input plan-price" type="number" step=".01" value="${Number(v.price)||0}" placeholder="Preço"><input class="input plan-discord" value="${esc(v.discord||"")}" placeholder="Discord deste plano"><input class="input plan-template" value="${esc(v.template||"")}" placeholder="Template opcional; vazio usa o modelo geral"></div>`).join("")}</div></div></section>`;
}
function readPlans(){
  return [...document.querySelectorAll(".plan-row")].map((row,i)=>{const labels=["Diário","Semanal","Mensal","Lifetime"];return {id:crypto.randomUUID(),label:labels[i]||`Plano ${i+1}`,price:Number(row.querySelector(".plan-price")?.value)||0,discord:row.querySelector(".plan-discord")?.value.trim()||"",template:row.querySelector(".plan-template")?.value||""};});
}
function newStock(prefProduct=""){
  const pid=prefProduct||db.products.find(p=>p.active)?.id||"";
  if(!pid){toast("Cadastre um produto primeiro.","error");return;}
  openModal("Adicionar item ao estoque",`<div class="form-grid"><div class="field full"><label>Produto</label><select class="select" id="stProduct">${db.products.filter(p=>p.active).map(p=>`<option value="${p.id}" ${p.id===pid?"selected":""}>${esc(p.name)} · ${p.type==="account"?"Conta":"Key"}</option>`).join("")}</select></div><div id="stockDynamic" class="full"></div></div>`,`<button class="btn" data-action="closeModal">Cancelar</button><button class="btn primary" data-action="saveStock">Adicionar ao estoque</button>`);
  updateStockFields(); document.getElementById("stProduct").addEventListener("change",updateStockFields);
}
function updateStockFields(){
  const p=product(document.getElementById("stProduct").value),box=document.getElementById("stockDynamic"); if(!p)return;
  const vs=variants(p);
  const planOptions=vs.length ? vs.map(v=>`<option value="${v.id}">${esc(v.label)} · ${money(v.price)}</option>`).join("") : `<option value="">Configure os planos primeiro</option>`;
  const specific=p.type==="account"
    ? `<div class="field"><label>Senha</label><input class="input" id="stPass"></div><div class="field"><label>Email (opcional)</label><input class="input" id="stEmail"></div>`
    : `<div class="field"><label>Duração</label><select class="select" id="stVariant">${planOptions}</select></div>`;
  const initialPrice=p.type==="key" ? (vs[0]?.price||0) : (p.price||0);
  const mainLabel=p.type==="account" ? "Nick" : "Key";
  const mainPlaceholder=p.type==="account" ? "Ex.: jogador123" : "XXXX-XXXX-XXXX";
  box.innerHTML=`<div class="form-grid"><div class="field"><label>${mainLabel}</label><input class="input" id="stMain" placeholder="${mainPlaceholder}"></div>${specific}<div class="field"><label>Preço de venda</label><input class="input" type="number" step=".01" id="stPrice" value="${initialPrice}"></div><div class="field"><label>Status</label><select class="select" id="stStatus"><option value="available">Disponível</option><option value="reserved">Reservado</option><option value="unavailable">Indisponível</option></select></div><div class="field full"><label>Observação interna</label><textarea class="textarea" id="stObs" placeholder="Informações internas..."></textarea></div></div>`;
  const vEl=document.getElementById("stVariant"); if(vEl)vEl.addEventListener("change",()=>{const v=variant(p,vEl.value);document.getElementById("stPrice").value=v.price||0;});
}
function viewStock(pid){
  const p=product(pid),rows=db.stock.filter(s=>s.productId===pid);
  openModal(`Estoque • ${esc(p.name)}`,`<div class="detail"><div class="mini"><span>Disponíveis</span><b>${rows.filter(s=>s.status==="available").length}</b></div><div class="mini"><span>Reservados</span><b>${rows.filter(s=>s.status==="reserved").length}</b></div><div class="mini"><span>Total</span><b>${rows.length}</b></div></div><div class="section" style="margin-top:15px">${rows.length?`<table><thead><tr><th>Item</th><th>Plano</th><th>Preço</th><th>Status</th><th></th></tr></thead><tbody>${rows.map(s=>`<tr><td>${esc(s.type==="account"?s.username:s.key)}</td><td>${esc(variant(p,s.variantId).label||"—")}</td><td>${money(s.price)}</td><td>${statusBadge(s.status)}</td><td><button class="btn" data-stock="${s.id}" data-action="stockDetail">Abrir</button></td></tr>`).join("")}</tbody></table>`:`<div class="empty">Sem itens cadastrados.</div>`}</div>`,`<button class="btn" data-action="closeModal">Fechar</button><button class="btn primary" data-product="${pid}" data-action="newStock">＋ Adicionar item</button>`);
}
function stockDetail(id){
  const s=db.stock.find(x=>x.id===id),p=product(s.productId),vs=variants(p);
  openModal(`Item de estoque • ${esc(p.name)}`,`<div class="notice">Dados internos usados na entrega.</div><div class="form-grid">${s.type==="account"?`<div class="field"><label>Nick</label><input class="input" id="edMain" value="${esc(s.username||"")}"></div><div class="field"><label>Senha</label><input class="input" id="edPass" value="${esc(s.password||"")}"></div><div class="field full"><label>Email</label><input class="input" id="edEmail" value="${esc(s.email||"")}"></div>`:`<div class="field full"><label>Key</label><input class="input" id="edMain" value="${esc(s.key||"")}"></div><div class="field"><label>Duração</label><select class="select" id="edVariant">${vs.map(v=>`<option value="${v.id}" ${v.id===s.variantId?"selected":""}>${esc(v.label)}</option>`).join("")}</select></div>`}<div class="field"><label>Preço</label><input class="input" type="number" step=".01" id="edPrice" value="${s.price||0}"></div><div class="field"><label>Status</label><select class="select" id="edStatus"><option value="available" ${s.status==="available"?"selected":""}>Disponível</option><option value="reserved" ${s.status==="reserved"?"selected":""}>Reservado</option><option value="sold" ${s.status==="sold"?"selected":""}>Vendido</option><option value="unavailable" ${s.status==="unavailable"?"selected":""}>Indisponível</option></select></div><div class="field full"><label>Observação</label><textarea class="textarea" id="edObs">${esc(s.observation||"")}</textarea></div></div>`,`<button class="btn danger" data-stock="${id}" data-action="deleteStock">Excluir</button><button class="btn" data-action="closeModal">Cancelar</button><button class="btn primary" data-stock="${id}" data-action="updateStock">Salvar</button>`);
}
function newClient(){openModal("Novo cliente",`<div class="form-grid"><div class="field full"><label>Nome interno</label><input class="input" id="clName" placeholder="Nome do cliente"></div><div class="field full"><label>Discord</label><input class="input" id="clDiscord" placeholder="@usuario ou perfil"></div><div class="field full"><label>Observações internas</label><textarea class="textarea" id="clNotes"></textarea></div></div>`,`<button class="btn" data-action="closeModal">Cancelar</button><button class="btn primary" data-action="saveClient">Cadastrar cliente</button>`);}
function clientDetail(id){const cl=client(id),ss=db.sales.filter(s=>s.clientId===id);openModal(`Cliente • ${esc(cl.name)}`,`<div class="detail"><div class="mini"><span>Compras</span><b>${ss.length}</b></div><div class="mini"><span>Total</span><b>${money(ss.reduce((a,s)=>a+Number(s.price),0))}</b></div><div class="mini"><span>Discord</span><b style="font-size:10px">${esc(cl.discord||"—")}</b></div></div><div class="notice" style="margin-top:14px">${esc(cl.notes||"Sem observações internas.")}</div><h3 style="font-size:12px">Histórico</h3>${salesTable(ss)}`,`<button class="btn" data-action="closeModal">Fechar</button>`);}

function newSale(){
  const available=db.stock.filter(s=>s.status==="available");
  if(!available.length){toast("Não há itens disponíveis no estoque.","error");return;}
  openModal("Nova venda",`<div class="notice">O produto, plano, Discord e mensagem são definidos automaticamente pela configuração do item.</div><div class="form-grid"><div class="field full"><label>Item do estoque</label><select class="select" id="saleStock">${available.map(s=>{const p=product(s.productId),v=variant(p,s.variantId);return `<option value="${s.id}">${esc(p.name)} · ${esc(v.label||"Conta")} · ${esc(s.type==="account"?s.username:s.key)} · ${money(s.price)}</option>`}).join("")}</select></div><div class="field"><label>Cliente</label><select class="select" id="saleClient"><option value="">＋ Cadastrar depois</option>${db.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join("")}</select></div><div class="field"><label>Valor da venda</label><input class="input" id="salePrice" type="number" step=".01"></div><div class="field"><label>Pagamento</label><select class="select" id="salePayment"><option>Pix</option><option>Cartão</option><option>Saldo</option><option>Outro</option></select></div><div class="field"><label>Status</label><select class="select" id="saleStatus"><option value="delivered">Entregue</option><option value="pending">Pendente</option></select></div><div class="field full"><label>Observação</label><textarea class="textarea" id="saleNote"></textarea></div></div>`,`<button class="btn" data-action="closeModal">Cancelar</button><button class="btn primary" data-action="confirmSale">Confirmar venda e gerar entrega</button>`);
  const ss=document.getElementById("saleStock");ss.addEventListener("change",()=>{const s=db.stock.find(x=>x.id===ss.value);document.getElementById("salePrice").value=s?.price||0;});ss.dispatchEvent(new Event("change"));
}
function generateDelivery(s){
  const st=db.stock.find(x=>x.id===s.stockId),p=product(s.productId),cl=client(s.clientId),v=variant(p,s.variantId);
  const cfg=p.type==="key"?v:{};
  const tpl=(cfg.template||"") || (p.type==="account"?db.settings.accountTemplate:db.settings.keyTemplate);
  const discord=cfg.discord || p.discord || db.settings.globalSupport || "";
  const vars={produto:p.name,nick:st?.username||"",senha:st?.password||"",key:st?.key||"",validade:st?.validity||v.label||"",duracao:v.label||st?.validity||"",discord,cliente:cl.name||"",emailLine:st?.email?`\n📧 Email: ${st.email}`:"",observacaoLine:st?.observation?`\n📝 ${st.observation}`:""};
  return tpl.replace(/\{(\w+)\}/g,(_,k)=>vars[k]??"").replace(/\\n/g,"\n").replace(/\n{3,}/g,"\n\n").trim();
}
function saleDetail(id){const s=db.sales.find(x=>x.id===id),p=product(s.productId),cl=client(s.clientId),st=db.stock.find(x=>x.id===s.stockId),v=variant(p,s.variantId);openModal(`Venda • ${esc(s.id)}`,`<div class="detail"><div class="mini"><span>Cliente</span><b>${esc(cl.name||"—")}</b></div><div class="mini"><span>Produto</span><b>${esc(p.name||"—")}</b></div><div class="mini"><span>Plano</span><b>${esc(v.label||"—")}</b></div><div class="mini"><span>Valor</span><b>${money(s.price)}</b></div><div class="mini"><span>Pagamento</span><b>${esc(s.payment||"—")}</b></div><div class="mini"><span>Status</span><b>${statusBadge(s.status)}</b></div></div><div class="notice" style="margin-top:15px">Observação interna: ${esc(s.note||"Nenhuma")}</div><h3 style="font-size:12px">Mensagem de entrega</h3><div class="delivery">${esc(s.delivery||generateDelivery(s))}</div>`,`<button class="btn danger" data-sale="${id}" data-action="deleteSale">Excluir venda</button><button class="btn" data-action="closeModal">Fechar</button><button class="btn primary" data-sale="${id}" data-action="copyDelivery">Copiar entrega</button>`);}

function saveProduct(id){
  const name=document.getElementById("pName").value.trim(); if(!name)return toast("Informe o nome do produto.","error");
  const type=document.getElementById("pType").value, price=Number(document.getElementById("pPrice").value)||0, low=Number(document.getElementById("pLow").value)||0, active=document.getElementById("pActive").value==="true";
  if(id){const p=product(id);Object.assign(p,{name,description:document.getElementById("pDesc").value.trim(),price,low,active});if(type==="key")p.variants=readPlans();log("Produto atualizado",name);}
  else {const p={id:crypto.randomUUID(),type,name,description:document.getElementById("pDesc").value.trim(),price,low,active};if(type==="key")p.variants=readPlans();db.products.push(p);log("Produto criado",`${name} • ${type==="key"?"Key":"Conta"}`);}
  save();closeModal();render();toast("Produto salvo!");
}
function saveStock(){
  const p=product(document.getElementById("stProduct").value),main=document.getElementById("stMain").value.trim(); if(!main)return toast("Preencha o item.","error");
  const s={id:crypto.randomUUID(),productId:p.id,type:p.type,variantId:p.type==="key"?document.getElementById("stVariant")?.value||"":null,price:Number(document.getElementById("stPrice").value)||0,status:document.getElementById("stStatus").value,observation:document.getElementById("stObs").value.trim(),created:new Date().toISOString()};
  if(p.type==="account")Object.assign(s,{username:main,password:document.getElementById("stPass").value,email:document.getElementById("stEmail").value.trim()});else Object.assign(s,{key:main,validity:variant(p,s.variantId).label||""});
  if(p.type==="key"&&!s.variantId)return toast("Configure uma duração para este produto.","error");
  db.stock.unshift(s);save();log("Estoque adicionado",`${p.name} • ${main}`);closeModal();render();toast("Item adicionado ao estoque!");
}
function updateStock(id){
  const s=db.stock.find(x=>x.id===id); if(!s)return;
  if(s.type==="account")Object.assign(s,{username:document.getElementById("edMain").value,password:document.getElementById("edPass").value,email:document.getElementById("edEmail").value});else Object.assign(s,{key:document.getElementById("edMain").value,variantId:document.getElementById("edVariant")?.value||s.variantId,validity:variant(product(s.productId),document.getElementById("edVariant")?.value||s.variantId).label||s.validity});
  Object.assign(s,{price:Number(document.getElementById("edPrice").value)||0,status:document.getElementById("edStatus").value,observation:document.getElementById("edObs").value});save();log("Estoque atualizado",product(s.productId).name);closeModal();render();toast("Item atualizado!");
}
function saveClient(){const name=document.getElementById("clName").value.trim();if(!name)return toast("Informe o nome.","error");const cl={id:crypto.randomUUID(),name,discord:document.getElementById("clDiscord").value.trim(),notes:document.getElementById("clNotes").value.trim(),created:new Date().toISOString()};db.clients.unshift(cl);save();log("Cliente criado",name);closeModal();render();toast("Cliente cadastrado!");}
function confirmSale(){
  const st=db.stock.find(x=>x.id===document.getElementById("saleStock").value),price=Number(document.getElementById("salePrice").value)||0,clientId=document.getElementById("saleClient").value;
  if(!st||!price)return toast("Selecione um item e informe o valor.","error");
  let cid=clientId;
  if(!cid){const name=prompt("Nome interno do cliente:");if(!name)return;const discord=prompt("Discord do cliente (opcional):")||"";const cl={id:crypto.randomUUID(),name,discord,notes:"",created:new Date().toISOString()};db.clients.unshift(cl);cid=cl.id;}
  const s={id:nextSaleId(),date:new Date().toISOString(),productId:st.productId,variantId:st.variantId||null,stockId:st.id,clientId:cid,price,payment:document.getElementById("salePayment").value,status:document.getElementById("saleStatus").value,note:document.getElementById("saleNote").value.trim(),delivery:"",createdBy:"Admin"};
  s.delivery=generateDelivery(s);db.sales.unshift(s);if(s.status!=="cancelled")st.status="sold";save();log("Venda criada",`${s.id} • ${product(s.productId).name} • ${money(s.price)}`);closeModal();render();openModal(`Venda criada • ${s.id}`,`<div class="notice">Venda registrada e item baixado do estoque.</div><div class="delivery">${esc(s.delivery)}</div>`,`<button class="btn" data-action="closeModal">Fechar</button><button class="btn primary" data-sale="${s.id}" data-action="copyDelivery">Copiar mensagem</button>`);toast("Venda registrada!");
}
function saveSettings(){
  if(document.getElementById("setName")){db.settings.storeName=document.getElementById("setName").value.trim()||"Tigelinha";db.settings.globalSupport=document.getElementById("setSupport").value.trim();}
  if(document.getElementById("autoAccount"))db.settings.accountTemplate=document.getElementById("autoAccount").value;
  if(document.getElementById("autoKey"))db.settings.keyTemplate=document.getElementById("autoKey").value;
  save();log("Configurações atualizadas","Preferências da loja");render();toast("Configurações salvas!");
}
function deleteSale(id){
  const sale=db.sales.find(x=>x.id===id);if(!sale)return;const p=product(sale.productId),st=db.stock.find(x=>x.id===sale.stockId);
  if(!confirm(`Excluir a venda ${sale.id} de ${p.name||"produto"}?\n\nA venda será removida. Se o item ainda estiver como vendido, ele volta para disponível.`))return;
  db.sales=db.sales.filter(x=>x.id!==id);if(st&&st.status==="sold")st.status="available";save();log("Venda excluída",`${sale.id} • ${p.name||"Produto"} • ${money(sale.price)}`);closeModal();render();toast("Venda excluída e item devolvido ao estoque.");
}
function copyDelivery(id){const s=db.sales.find(x=>x.id===id);if(!s)return;navigator.clipboard?.writeText(s.delivery||generateDelivery(s)).then(()=>toast("Mensagem copiada!")).catch(()=>toast("Não foi possível copiar automaticamente.","error"));}
function closeModal(){document.getElementById("modalRoot").innerHTML="";}
function toast(msg,type="ok"){const t=document.getElementById("toast");t.textContent=msg;t.className="show "+type;clearTimeout(window.__toast);window.__toast=setTimeout(()=>t.className="",2500);}
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`tigelinha-backup-${new Date().toISOString().slice(0,10)}.json`;a.click();URL.revokeObjectURL(a.href);}

document.addEventListener("click",e=>{
  const n=e.target.closest("[data-page]");if(n){page=n.dataset.page;render();return;}
  const a=e.target.closest("[data-action]");if(!a)return;const act=a.dataset.action;
  if(act==="closeModal")closeModal();
  if(act==="newProduct")newProduct();
  if(act==="editProduct")newProduct(a.dataset.product);
  if(act==="saveProduct")saveProduct(a.dataset.product||null);
  if(act==="newStock")newStock(a.dataset.product||"");
  if(act==="viewStock")viewStock(a.dataset.product);
  if(act==="stockDetail")stockDetail(a.dataset.stock);
  if(act==="saveStock")saveStock();
  if(act==="updateStock")updateStock(a.dataset.stock);
  if(act==="deleteStock"){if(confirm("Excluir este item do estoque?")){db.stock=db.stock.filter(s=>s.id!==a.dataset.stock);save();log("Item excluído","Estoque");closeModal();render();toast("Item excluído.");}}
  if(act==="newClient")newClient();
  if(act==="saveClient")saveClient();
  if(act==="clientDetail")clientDetail(a.dataset.client);
  if(act==="newSale")newSale();
  if(act==="confirmSale")confirmSale();
  if(act==="saleDetail")saleDetail(a.dataset.sale);
  if(act==="deleteSale")deleteSale(a.dataset.sale);
  if(act==="copyDelivery")copyDelivery(a.dataset.sale);
  if(act==="saveSettings")saveSettings();
  if(act==="export")exportData();
  if(act==="clearAudit"){if(confirm("Limpar o histórico?")){db.audit=[];save();render();}}
});
document.addEventListener("click",e=>{const t=e.target.closest("[data-sale-mode]");if(t){document.querySelectorAll("[data-sale-mode]").forEach(x=>x.classList.remove("active"));t.classList.add("active");saleMode=t.dataset.saleMode;}});
document.addEventListener("input",e=>{if(e.target.id==="globalSearch"&&page==="sales")render();});
document.addEventListener("keydown",e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="k"){e.preventDefault();document.getElementById("globalSearch").focus();}});
render();
