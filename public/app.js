// ── STATE ──
let products = [];
let delivery = [];
let orders = [];
let cart = [];
let pendingImage = null;

const DEFAULT_DELIVERY = [
  { location: 'Lagos Island', fee: 1500 },
  { location: 'Lagos Mainland', fee: 1500 },
  { location: 'Abuja', fee: 3500 },
  { location: 'Port Harcourt', fee: 4000 },
  { location: 'Ibadan', fee: 3000 },
];

// ── STORAGE (localStorage for Vercel deployment) ──
function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('Storage save failed:', e);
  }
}

function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return fallback;
}

function loadAll() {
  products = loadData('scentoria_products', []);
  delivery = loadData('scentoria_delivery', DEFAULT_DELIVERY);
  if (!delivery.length) delivery = [...DEFAULT_DELIVERY];
  orders   = loadData('scentoria_orders', []);
  cart     = loadData('scentoria_cart', []);
  updateCartCount();
  renderShop();
}

// ── NAVIGATION ──
function showPage(p) {
  document.querySelectorAll('.page').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(x => x.classList.remove('active'));
  document.getElementById('page-' + p).classList.add('active');
  const map = { shop: 0, cart: 1, admin: 2 };
  if (map[p] !== undefined) {
    document.querySelectorAll('.nav-btn')[map[p]].classList.add('active');
  }
  if (p === 'cart')     renderCart();
  if (p === 'checkout') renderCheckout();
  if (p === 'admin')    renderAdmin();
  window.scrollTo(0, 0);
}

// ── SHOP ──
function renderShop() {
  const grid = document.getElementById('products-grid');
  if (!products.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-spray-can"></i>
        <p>No perfumes yet.<br>Visit the admin panel to add your collection.</p>
      </div>`;
    return;
  }
  grid.innerHTML = products.map((p, i) => `
    <div class="product-card">
      ${p.image
        ? `<div class="product-img"><img src="${p.image}" alt="${escHtml(p.name)}"></div>`
        : `<div class="product-img-placeholder">🌸</div>`}
      <div class="product-info">
        <div class="product-name">${escHtml(p.name)}</div>
        <div class="product-desc">${escHtml(p.desc || '')}</div>
        <div class="product-price">₦${Number(p.price).toLocaleString()}</div>
        <button class="add-to-cart" onclick="addToCart(${i})">ADD TO CART</button>
      </div>
    </div>`).join('');
}

// ── CART ──
function addToCart(pi) {
  const p = products[pi];
  const ex = cart.find(c => c.id === p.id);
  if (ex) ex.qty++;
  else cart.push({ ...p, qty: 1 });
  saveData('scentoria_cart', cart);
  updateCartCount();
  showToast('Added — ' + p.name);
}

function updateCartCount() {
  const total = cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cart-count').textContent = total;
}

function removeFromCart(idx) {
  cart.splice(idx, 1);
  saveData('scentoria_cart', cart);
  updateCartCount();
  renderCart();
}

function changeQty(idx, delta) {
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveData('scentoria_cart', cart);
  updateCartCount();
  renderCart();
}

function renderCart() {
  const list   = document.getElementById('cart-items-list');
  const empty  = document.getElementById('cart-empty');
  const sumEl  = document.getElementById('cart-summary-block');

  if (!cart.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    sumEl.innerHTML = '';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = cart.map((c, i) => `
    <div class="cart-item">
      <div class="cart-item-img">
        ${c.image
          ? `<img src="${c.image}" alt="${escHtml(c.name)}">`
          : '<span style="font-size:2rem">🌸</span>'}
      </div>
      <div>
        <div class="cart-item-name">${escHtml(c.name)}</div>
        <div class="cart-item-price">₦${Number(c.price).toLocaleString()} each</div>
        <div class="qty-control">
          <button class="qty-btn" onclick="changeQty(${i},-1)">−</button>
          <span style="min-width:20px;text-align:center">${c.qty}</span>
          <button class="qty-btn" onclick="changeQty(${i},1)">+</button>
        </div>
      </div>
      <button class="remove-btn" onclick="removeFromCart(${i})">
        <i class="fas fa-trash"></i>
      </button>
    </div>`).join('');

  const sub = cart.reduce((s, c) => s + Number(c.price) * c.qty, 0);
  sumEl.innerHTML = `
    <div class="cart-summary">
      <div class="summary-row"><span>Subtotal</span><span>₦${sub.toLocaleString()}</span></div>
      <div class="summary-row"><span>Delivery</span><span style="color:var(--muted)">Calculated at checkout</span></div>
      <div class="summary-row total"><span>Total</span><span>₦${sub.toLocaleString()}+</span></div>
      <button class="checkout-btn" onclick="showPage('checkout')">Proceed to Checkout →</button>
    </div>`;
}

// ── CHECKOUT ──
function renderCheckout() {
  const sel = document.getElementById('c-location');
  sel.innerHTML = '<option value="">— Select location —</option>' +
    delivery.map(d =>
      `<option value="${escHtml(d.location)}">${escHtml(d.location)} — ₦${Number(d.fee).toLocaleString()}</option>`
    ).join('');
  updateDeliveryFee();
}

function getSelectedDeliveryFee() {
  const sel = document.getElementById('c-location');
  if (!sel || !sel.value) return 0;
  const found = delivery.find(d => d.location === sel.value);
  return found ? Number(found.fee) : 0;
}

function updateDeliveryFee() {
  const fee  = getSelectedDeliveryFee();
  const sub  = cart.reduce((s, c) => s + Number(c.price) * c.qty, 0);
  const loc  = document.getElementById('c-location')?.value || '';
  const total = sub + fee;

  document.getElementById('order-summary-checkout').innerHTML = `
    <div style="font-family:'Cormorant Garamond',serif;font-size:1.1rem;margin-bottom:.75rem;">Order Summary</div>
    ${cart.map(c => `
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:var(--muted)">
        <span>${escHtml(c.name)} × ${c.qty}</span>
        <span>₦${(Number(c.price) * c.qty).toLocaleString()}</span>
      </div>`).join('')}
    <div style="border-top:1px solid var(--border);margin-top:.5rem;padding-top:.5rem">
      <div style="display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:var(--muted)">
        <span>Delivery (${escHtml(loc) || 'not selected'})</span>
        <span>${loc ? '₦' + fee.toLocaleString() : '—'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:1.1rem;font-family:'Cormorant Garamond',serif;margin-top:.5rem">
        <span>Total</span>
        <span style="color:var(--gold-dark)">₦${total.toLocaleString()}</span>
      </div>
    </div>`;
}

function placeOrder() {
  const name  = document.getElementById('c-name').value.trim();
  const email = document.getElementById('c-email').value.trim();
  const phone = document.getElementById('c-phone').value.trim();
  const loc   = document.getElementById('c-location').value;
  const addr  = document.getElementById('c-address').value.trim();

  if (!name || !email || !phone || !loc || !addr) {
    showToast('Please fill in all fields');
    return;
  }
  if (!cart.length) {
    showToast('Your cart is empty');
    return;
  }

  const fee   = getSelectedDeliveryFee();
  const sub   = cart.reduce((s, c) => s + Number(c.price) * c.qty, 0);
  const ref   = 'SCT-' + Date.now().toString(36).toUpperCase();

  const order = {
    ref,
    name,
    email,
    phone,
    location: loc,
    address: addr,
    items: cart.map(c => ({ name: c.name, qty: c.qty, price: c.price })),
    subtotal: sub,
    deliveryFee: fee,
    total: sub + fee,
    status: 'pending',
    date: new Date().toISOString(),
  };

  orders.unshift(order);
  saveData('scentoria_orders', orders);

  cart = [];
  saveData('scentoria_cart', cart);
  updateCartCount();

  document.getElementById('success-ref').textContent = ref;
  showPage('success');
}

// ── ADMIN ──
function switchTab(e, t) {
  document.querySelectorAll('.admin-section').forEach(x => x.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(x => x.classList.remove('active'));
  document.getElementById('tab-' + t).classList.add('active');
  e.target.classList.add('active');
}

function renderAdmin() {
  // Stats
  const rev = orders.reduce((s, o) => s + o.total, 0);
  document.getElementById('admin-stats').innerHTML = `
    <div class="stat-card"><label>Products</label><div class="val">${products.length}</div></div>
    <div class="stat-card"><label>Orders</label><div class="val">${orders.length}</div></div>
    <div class="stat-card"><label>Revenue (₦)</label><div class="val">${rev.toLocaleString()}</div></div>
    <div class="stat-card"><label>Delivery Zones</label><div class="val">${delivery.length}</div></div>`;

  // Products table
  const tbody = document.getElementById('products-admin-tbody');
  tbody.innerHTML = products.length
    ? products.map((p, i) => `
        <tr>
          <td>${p.image
            ? `<img src="${p.image}" style="width:48px;height:48px;object-fit:cover;border-radius:2px">`
            : '<span style="font-size:1.5rem">🌸</span>'}</td>
          <td><strong>${escHtml(p.name)}</strong></td>
          <td>₦${Number(p.price).toLocaleString()}</td>
          <td style="color:var(--muted);font-size:13px">${escHtml(p.desc || '—')}</td>
          <td><button class="del-btn" onclick="deleteProduct(${i})">Delete</button></td>
        </tr>`).join('')
    : '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:2rem">No products yet</td></tr>';

  renderDeliveryAdmin();
  renderOrdersAdmin();
}

function renderDeliveryAdmin() {
  document.getElementById('delivery-tbody').innerHTML = delivery.map((d, i) => `
    <tr>
      <td><input value="${escHtml(d.location)}" onchange="delivery[${i}].location=this.value" placeholder="Location name"></td>
      <td><input type="number" value="${d.fee}" onchange="delivery[${i}].fee=Number(this.value)" placeholder="Fee in ₦" style="max-width:160px"></td>
      <td><button class="del-btn" onclick="deleteZone(${i})">Remove</button></td>
    </tr>`).join('');
}

function addDeliveryZone() {
  delivery.push({ location: 'New Location', fee: 0 });
  renderDeliveryAdmin();
}

function deleteZone(i) {
  delivery.splice(i, 1);
  renderDeliveryAdmin();
}

function saveDelivery() {
  saveData('scentoria_delivery', delivery);
  showToast('Delivery zones saved!');
}

function renderOrdersAdmin() {
  const ol = document.getElementById('orders-list');
  if (!orders.length) {
    ol.innerHTML = '<p style="color:var(--muted);font-size:14px">No orders yet.</p>';
    return;
  }
  ol.innerHTML = orders.map((o, oi) => `
    <div class="order-card">
      <div class="order-card-header">
        <span class="order-ref-small">${escHtml(o.ref)}</span>
        <div style="display:flex;align-items:center;gap:.75rem">
          <select onchange="updateOrderStatus(${oi},this.value)" style="border:1px solid var(--border-dark);padding:4px 8px;border-radius:2px;font-size:12px;background:var(--warm-white);cursor:pointer">
            <option value="pending"   ${o.status==='pending'   ?'selected':''}>⏳ Pending Payment</option>
            <option value="confirmed" ${o.status==='confirmed' ?'selected':''}>✅ Confirmed</option>
            <option value="dispatched"${o.status==='dispatched'?'selected':''}>🚚 Dispatched</option>
          </select>
          <span class="order-total-badge">₦${o.total.toLocaleString()}</span>
        </div>
      </div>
      <div class="order-items">${o.items.map(i => `${escHtml(i.name)} × ${i.qty}`).join(' · ')}</div>
      <div class="order-meta">
        <span><i class="fas fa-user" style="margin-right:4px"></i>${escHtml(o.name)}</span>
        <span><i class="fas fa-envelope" style="margin-right:4px"></i>${escHtml(o.email)}</span>
        <span><i class="fas fa-phone" style="margin-right:4px"></i>${escHtml(o.phone)}</span>
        <span><i class="fas fa-map-marker-alt" style="margin-right:4px"></i>${escHtml(o.location)}</span>
        <span style="color:var(--muted)">${new Date(o.date).toLocaleDateString('en-NG',{day:'numeric',month:'short',year:'numeric'})}</span>
      </div>
      <div style="font-size:12px;color:var(--muted);margin-top:.5rem">Address: ${escHtml(o.address)}</div>
    </div>`).join('');
}

function updateOrderStatus(idx, status) {
  orders[idx].status = status;
  saveData('scentoria_orders', orders);
  showToast('Order status updated');
  renderAdmin();
}

// ── IMAGE UPLOAD ──
function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (ev) {
    pendingImage = ev.target.result;
    const preview = document.getElementById('img-preview');
    preview.src = pendingImage;
    preview.style.display = 'block';
    document.querySelector('#upload-area p').textContent = '✓ Image ready';
  };
  reader.readAsDataURL(file);
}

// ── ADD / DELETE PRODUCT ──
function addProduct() {
  const name  = document.getElementById('a-name').value.trim();
  const price = document.getElementById('a-price').value;
  const desc  = document.getElementById('a-desc').value.trim();

  if (!name || !price) {
    showToast('Name and price are required');
    return;
  }

  products.push({
    id: Date.now(),
    name,
    price: Number(price),
    desc,
    image: pendingImage || null,
  });

  saveData('scentoria_products', products);

  document.getElementById('a-name').value  = '';
  document.getElementById('a-price').value = '';
  document.getElementById('a-desc').value  = '';
  document.getElementById('img-preview').style.display = 'none';
  document.querySelector('#upload-area p').textContent = 'Click to upload product image';
  pendingImage = null;

  renderShop();
  renderAdmin();
  showToast('Perfume added to collection!');
}

function deleteProduct(i) {
  if (!confirm('Delete "' + products[i].name + '"?')) return;
  products.splice(i, 1);
  saveData('scentoria_products', products);
  renderShop();
  renderAdmin();
  showToast('Product removed');
}

// ── TOAST ──
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── UTILS ──
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── INIT ──
loadAll();
