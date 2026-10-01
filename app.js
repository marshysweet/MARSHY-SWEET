let products = [];
let managedCategories = [];
let catalogError = "";
let heroBannerUrl = "";
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const picture = (url, fallback) => url ? `<img src="${escapeHTML(url)}" alt="" loading="lazy" style="width:100%;height:100%;max-height:280px;object-fit:contain" />` : escapeHTML(fallback);
async function refreshCatalog() {
  try {
    const response = await fetch("https://www.marshysweets.com/api/catalog", {cache:"no-store"});
    if (!response.ok) throw new Error("Catalog unavailable");
    const data = await response.json();
    if (data.schemaVersion !== 1 || !Array.isArray(data.products) || !Array.isArray(data.categories)) throw new Error("Invalid catalog");
    products = data.products.map(item => ({...item, detail:item.description || "", imageUrl:item.imageUrl || (item.slug === "gift-bags" ? data.settings?.giftSetImageUrl : null)}));
    heroBannerUrl = data.settings?.heroBannerUrl || "";
    managedCategories = data.categories;
    state.selectedProduct = products.find(item => item.id === state.selectedProduct?.id) || products[0];
    catalogError = "";
    render();
  } catch {
    catalogError = "Store updates could not load. Check your connection and reopen the app.";
    render();
  }
}

const state = {
  screen: localStorage.getItem('marshy-signed-in') ? 'home' : 'login',
  previous: 'home',
  drawer: false,
  signup: false,
  cart: JSON.parse(localStorage.getItem('marshy-cart') || '[]'),
  favorites: JSON.parse(localStorage.getItem('marshy-favorites') || '[]'),
  selectedProduct: products[0],
  delivery: 'pickup',
  points: 320,
  query: ''
};

const app = document.querySelector('#app');
const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const save = () => {
  localStorage.setItem('marshy-cart', JSON.stringify(state.cart));
  localStorage.setItem('marshy-favorites', JSON.stringify(state.favorites));
};

function shell(content, active = 'home', withSearch = false) {
  return `<div class="phone">
    <header class="topbar"><div class="mini-logo"><span class="mini-mark">MS</span><span>MARSHY SWEET</span></div><button class="icon-btn" data-action="drawer" aria-label="Open menu">☰</button></header>
    ${withSearch ? `<div class="search"><input aria-label="Search products" placeholder="Search Marshy Sweet" value="${state.query}" data-action="search" /></div>` : ''}
    ${catalogError ? `<p role="alert" style="padding:16px">${catalogError}</p>` : ""}${content}
    ${bottomNav(active)}
    ${state.drawer ? drawer() : ''}
  </div>`;
}

function bottomNav(active) {
  return `<nav class="bottom-nav" aria-label="Main navigation">
    ${[['home','⌂','Home'],['rewards','☆','Rewards'],['cart','🛒','Cart'],['profile','♙','Profile']].map(([id,icon,label]) => `<button class="nav-item ${active===id?'active':''}" data-screen="${escapeHTML(id)}"><span>${icon}</span><span>${escapeHTML(label)}</span></button>`).join('')}
  </nav>`;
}

function drawer() {
  const main = managedCategories.map(item => ['category:' + item.name, item.name, item.imageUrl]);
  const account = [['edit-profile','Edit Profile'],['payment','Payment Methods'],['settings','Settings'],['orders','Order History'],['favorites','Favorites']];
  return `<div class="drawer-backdrop" data-action="close-drawer"><aside class="drawer" onclick="event.stopPropagation()">
    <button class="icon-btn" data-action="close-drawer" aria-label="Close menu">×</button><h2>Menu</h2>
    <div class="menu-group">${main.map(([id,label,image])=>`<button class="menu-item" data-screen="${escapeHTML(id)}">${image ? `<img src="${escapeHTML(image)}" alt="" style="width:40px;height:40px;object-fit:cover;border-radius:8px" />` : ""}<span>${escapeHTML(label)}</span><span>›</span></button>`).join('')}</div>
    <div class="menu-group">${account.map(([id,label])=>`<button class="menu-item" data-screen="${escapeHTML(id)}"><span>${escapeHTML(label)}</span><span>›</span></button>`).join('')}</div>
  </aside></div>`;
}

function auth() {
  const signup = state.signup;
  return `<section class="auth"><div class="brand"><div class="brand-mark">MS</div><h1>MARSHY SWEET</h1><p>SIP. SNACK. CELEBRATE.</p></div>
    <form data-action="auth-submit">
      <input class="field" required type="email" placeholder="Email address" aria-label="Email address" />
      ${signup ? `<input class="field" required type="tel" placeholder="Phone number" aria-label="Phone number" />` : ''}
      <input class="field" required type="password" minlength="8" placeholder="Password" aria-label="Password" />
      <div class="auth-actions"><button class="gold-btn wide" type="submit">${signup ? 'SIGN UP' : 'LOGIN'}</button><button class="primary wide" type="button" data-action="toggle-auth">${signup ? 'BACK TO LOGIN' : 'SIGN UP'}</button></div>
    </form>
    ${signup ? `<div class="social-row"><button class="social" aria-label="Continue with Google">G</button><button class="social" aria-label="Continue with Facebook">f</button><button class="social" aria-label="Continue with Apple">●</button></div>` : ''}
    <p class="tagline">SIP,<br>SNACK,<br>CELEBRATE.</p>
  </section>`;
}

function productCards(list) {
  return `<div class="grid">${list.map(p => `<article class="card"><button class="card-art wide" data-product="${p.id}" aria-label="View ${escapeHTML(p.name)}">${picture(p.imageUrl, p.emoji)}</button><div class="card-body"><h3>${escapeHTML(p.name)}</h3><p>${escapeHTML(p.detail)}</p><div class="price-row"><span>${money(p.price)}</span><button class="round-add" data-add="${p.id}" aria-label="Add ${escapeHTML(p.name)}">+</button></div></div></article>`).join('')}</div>`;
}

function home() {
  const shown = products.filter(p => p.name.toLowerCase().includes(state.query.toLowerCase()) || p.category.toLowerCase().includes(state.query.toLowerCase())).slice(0,4);
  return shell(`<div class="content">${heroBannerUrl ? `<img src="${escapeHTML(heroBannerUrl)}" alt="Marshy Sweet featured banner" style="width:100%;height:180px;object-fit:cover;border-radius:16px" />` : ""}<div class="hero"><h2>WELCOME BACK, SWEET FRIEND</h2><p>Your next favorite treat is waiting.</p></div>
    <p class="eyebrow">Reward points</p><div class="reward-row">${[1,2,3,4,5].map((x,i)=>`<span class="reward-dot ${i<3?'filled':''}">${i<3?'★':x}</span>`).join('')}</div>
    <div class="section-title"><h2>Recently ordered</h2><button class="link" data-screen="orders">View all</button></div>${productCards(shown)}</div>`, 'home', true);
}

function category(name) {
  const list = name === 'all' ? products : products.filter(p => p.category === name || (name==='Tea' && p.category==='Boba Tea'));
  return shell(`<div class="content"><div class="hero"><h2>${escapeHTML(name.toUpperCase())}</h2><p>Made fresh, colorful and full of joy.</p></div><div class="section-title"><h2>${escapeHTML(name)}</h2><span>${list.length} items</span></div>${productCards(list)}</div>`, 'home', true);
}

function detail() {
  const p = state.selectedProduct;
  if (!p) return home();
  const favorite = state.favorites.includes(p.id);
  return shell(`<div class="content"><button class="link" data-action="back">‹ Back</button><div class="detail-art">${picture(p.imageUrl, p.emoji)}</div><div class="section-title"><div><p class="eyebrow">${escapeHTML(p.category)}</p><h2>${escapeHTML(p.name)}</h2></div><button class="icon-btn" data-favorite="${p.id}" aria-label="Favorite">${favorite?'♥':'♡'}</button></div><p>${escapeHTML(p.detail)}</p><div class="panel"><div class="line-item"><strong>Size</strong><span>Regular</span></div><div class="line-item"><strong>Price</strong><span>${money(p.price)}</span></div></div><div class="line-item"><div class="qty"><button data-action="qty-down">−</button><strong id="detailQty">1</strong><button data-action="qty-up">+</button></div><button class="primary" data-add="${p.id}">ADD TO CART</button></div></div>`, 'home');
}

function cart() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * .06625;
  const delivery = state.delivery === 'delivery' && subtotal ? 15 : 0;
  return shell(`<div class="content"><h1 class="eyebrow">Cart</h1><div class="segmented"><button data-delivery="pickup" class="${state.delivery==='pickup'?'active':''}">🚶 Pickup</button><button data-delivery="delivery" class="${state.delivery==='delivery'?'active':''}">🛵 Delivery</button></div>
    ${state.cart.length ? state.cart.map(i=>`<div class="panel"><div class="line-item"><strong>${i.emoji} ${i.name}</strong><button class="link" data-remove="${i.id}">Remove</button></div><div class="line-item"><span>Qty ${i.qty}</span><strong>${money(i.price*i.qty)}</strong></div></div>`).join('') : `<div class="empty"><div style="font-size:56px">🛒</div><p>Your cart is ready for something sweet.</p><button class="primary" data-screen="home">START SHOPPING</button></div>`}
    ${subtotal ? `<div class="panel"><div class="line-item"><span>Subtotal</span><strong>${money(subtotal)}</strong></div><div class="line-item"><span>NJ tax</span><strong>${money(tax)}</strong></div>${delivery?`<div class="line-item"><span>Delivery</span><strong>${money(delivery)}</strong></div>`:''}<div class="total-row"><span>Total</span><span>${money(subtotal+tax+delivery)}</span></div><button class="gold-btn wide" data-action="checkout">CHECKOUT</button></div>`:''}</div>`, 'cart');
}

function orders() {
  return shell(`<div class="content"><h1 class="eyebrow">Track your order</h1><div class="panel"><div class="line-item"><strong>Order #MS-2048</strong><span class="primary" style="padding:6px 10px">Pickup</span></div><p>ETA: 15–20 minutes</p><div class="progress">${[['done','Order placed','We received your order.'],['done','Preparing','Your treats are being prepared.'],['','Ready for pickup','We will notify you.'],['','Completed','Enjoy your Marshy Sweet!']].map(([cls,title,copy])=>`<div class="step ${cls}"><span class="step-dot"></span><div><h4>${title}</h4><p>${copy}</p></div></div>`).join('')}</div><button class="primary wide" data-screen="rewards">START EARNING</button></div></div>`, 'home');
}

function rewards() {
  return shell(`<div class="content"><h1 class="eyebrow">Rewards</h1><div class="panel"><div class="line-item"><strong>${state.points} points</strong><span>100 pts = $1 off</span></div><div class="reward-row">${[1,2,3,4,5].map((_,i)=>`<span class="reward-dot ${i<3?'filled':''}">${i<3?'★':'○'}</span>`).join('')}</div><p>You can use up to $5 off per order.</p></div><h2 class="eyebrow">Earn points</h2>${[['😍','Rate your order','+5 pts'],['✍️','Write a review','+10 pts'],['📷','Add a photo','+20 pts']].map(([icon,title,pts])=>`<div class="panel"><div class="line-item"><strong>${icon} ${title}</strong><button class="gold-btn" data-action="earn">${pts}</button></div></div>`).join('')}</div>`, 'rewards');
}

function profile() {
  return shell(`<div class="content"><div class="brand" style="color:var(--plum);margin:12px 0 22px"><div class="brand-mark">MS</div><h1>MARSHY FRIEND</h1><p style="color:var(--muted)">marshysweetbogota@gmail.com</p></div><div class="menu-group">${[['edit-profile','Edit profile'],['orders','Order history'],['favorites','Favorites'],['payment','Payment methods'],['settings','Settings']].map(([id,label])=>`<button class="menu-item" data-screen="${escapeHTML(id)}"><span>${escapeHTML(label)}</span><span>›</span></button>`).join('')}</div></div>`, 'profile');
}

function favorites() {
  const list = products.filter(p=>state.favorites.includes(p.id));
  return shell(`<div class="content"><h1 class="eyebrow">Favorites</h1>${list.length?productCards(list):`<div class="empty"><div style="font-size:56px">♡</div><p>Tap the heart on a product to save it here.</p></div>`}</div>`, 'profile');
}

function formScreen(title, fields, button='SAVE CHANGES') {
  return shell(`<div class="content"><h1 class="eyebrow">${title}</h1><div class="panel">${fields.map(f=>`<label>${f}<input class="field light-field" aria-label="${f}" /></label>`).join('')}<button class="gold-btn wide" data-action="save">${button}</button></div></div>`, 'profile');
}

function payment() {
  return shell(`<div class="content"><h1 class="eyebrow">Payment methods</h1><div class="panel" style="background:var(--plum);color:white;text-align:center;padding:35px"><div style="font-size:42px">▣</div><p>Add a credit or debit card</p></div>${['PayPal','Google Pay','Apple Pay'].map(x=>`<button class="menu-item"><span>${x}</span><span>›</span></button>`).join('')}<button class="primary wide" data-action="save" style="margin-top:14px">ADD CARD</button></div>`, 'profile');
}

function settings() {
  return shell(`<div class="content"><h1 class="eyebrow">Settings</h1><div class="menu-group">${[['edit-profile','Edit profile'],['change-password','Change password'],['privacy','Privacy policy'],['help','Help center']].map(([id,label])=>`<button class="menu-item" data-screen="${escapeHTML(id)}"><span>${escapeHTML(label)}</span><span>›</span></button>`).join('')}</div><button class="outline-btn wide" style="color:var(--plum)" data-action="logout">LOG OUT</button></div>`, 'profile');
}

function privacy() { return shell(`<div class="content"><h1 class="eyebrow">Privacy policy</h1><div class="panel"><p>Marshy Sweet uses account and order information to prepare purchases, provide pickup or delivery updates, manage rewards, and support customers. Payment details are handled by approved payment providers and are not stored in this experience.</p><p>You can request access, correction, or deletion of account information through Help Center.</p></div></div>`, 'profile'); }
function help() { return shell(`<div class="content"><h1 class="eyebrow">Help center</h1>${['Order question','Payment question','Report a problem','Email support'].map(x=>`<button class="menu-item" data-action="help"><span>${x}</span><span>›</span></button>`).join('')}</div>`, 'profile'); }

function render() {
  let html;
  if (state.screen === 'login') html = auth();
  else if (state.screen === 'home') html = home();
  else if (state.screen.startsWith('category:')) html = category(state.screen.split(':')[1]);
  else if (state.screen === 'detail') html = detail();
  else if (state.screen === 'cart') html = cart();
  else if (state.screen === 'orders') html = orders();
  else if (state.screen === 'rewards') html = rewards();
  else if (state.screen === 'profile') html = profile();
  else if (state.screen === 'favorites') html = favorites();
  else if (state.screen === 'edit-profile') html = formScreen('Edit profile',['Profile photo','Username','Phone number','Email address','Home address']);
  else if (state.screen === 'change-password') html = formScreen('Change password',['Current password','New password','Confirm password'],'UPDATE PASSWORD');
  else if (state.screen === 'payment') html = payment();
  else if (state.screen === 'settings') html = settings();
  else if (state.screen === 'privacy') html = privacy();
  else if (state.screen === 'help') html = help();
  else html = home();
  app.innerHTML = html;
}

function toast(message) {
  document.querySelector('.toast')?.remove();
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = message; document.body.append(el);
  setTimeout(()=>el.remove(), 1800);
}

document.addEventListener('submit', event => {
  if (event.target.matches('[data-action="auth-submit"]')) {
    event.preventDefault(); localStorage.setItem('marshy-signed-in','1'); state.screen='home'; render();
  }
});

document.addEventListener('input', event => {
  if (event.target.matches('[data-action="search"]')) { state.query=event.target.value; const pos=event.target.selectionStart; render(); const input=document.querySelector('[data-action="search"]'); input.focus(); input.setSelectionRange(pos,pos); }
});

document.addEventListener('click', event => {
  const target = event.target.closest('button,[data-action]'); if (!target) return;
  if (target.dataset.screen) { state.previous=state.screen; state.screen=target.dataset.screen; state.drawer=false; render(); return; }
  if (target.dataset.product) { state.previous=state.screen; state.selectedProduct=products.find(p=>p.id===Number(target.dataset.product)); state.screen='detail'; render(); return; }
  if (target.dataset.add) { const p=products.find(x=>x.id===Number(target.dataset.add)); const existing=state.cart.find(x=>x.id===p.id); existing?existing.qty++:state.cart.push({...p,qty:1}); save(); toast(`${escapeHTML(p.name)} added to cart`); return; }
  if (target.dataset.favorite) { const id=Number(target.dataset.favorite); state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id]; save(); render(); return; }
  if (target.dataset.remove) { state.cart=state.cart.filter(x=>x.id!==Number(target.dataset.remove)); save(); render(); return; }
  if (target.dataset.delivery) { state.delivery=target.dataset.delivery; render(); return; }
  const action=target.dataset.action;
  if (action==='drawer') { state.drawer=true; render(); }
  if (action==='close-drawer') { state.drawer=false; render(); }
  if (action==='toggle-auth') { state.signup=!state.signup; render(); }
  if (action==='back') { state.screen=state.previous||'home'; render(); }
  if (action==='logout') { localStorage.removeItem('marshy-signed-in'); state.screen='login'; render(); }
  if (action==='checkout') { state.screen='orders'; render(); toast('Order flow ready for payment connection'); }
  if (action==='save') toast('Saved');
  if (action==='earn') { state.points+=5; render(); toast('Reward points added'); }
  if (action==='help') toast('Support connection is ready to configure');
});

render();
void refreshCatalog();
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') void refreshCatalog(); });
if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
