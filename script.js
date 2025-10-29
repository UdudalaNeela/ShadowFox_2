// Simple frontend-only e-commerce demo (no backend).
// Open index.html to run.

// Sample product data:
const PRODUCTS = [
  { id: 'p1', name: 'Canvas Tote Bag', price: 499, category: 'Bags', image: 'https://picsum.photos/id/1025/600/400', desc: 'Durable cotton tote for everyday use.'},
  { id: 'p2', name: 'Wireless Earbuds', price: 1499, category: 'Electronics', image: 'https://picsum.photos/id/180/600/400', desc: 'Bluetooth earbuds with long battery life.'},
  { id: 'p3', name: 'Ceramic Mug', price: 249, category: 'Home', image: 'https://picsum.photos/id/1003/600/400', desc: 'Handmade ceramic coffee mug.'},
  { id: 'p4', name: 'Running Sneakers', price: 3599, category: 'Shoes', image: 'https://picsum.photos/id/21/600/400', desc: 'Lightweight running shoes for daily jogs.'},
  { id: 'p5', name: 'Minimalist Watch', price: 2599, category: 'Accessories', image: 'https://picsum.photos/id/1074/600/400', desc: 'Slim watch with leather strap.'},
  { id: 'p6', name: 'Desk Plant', price: 699, category: 'Home', image: 'https://picsum.photos/id/102/600/400', desc: 'Low maintenance succulent for desks.'},
  { id: 'p7', name: 'Laptop Sleeve', price: 899, category: 'Bags', image: 'https://picsum.photos/id/180/600/400', desc: 'Protective neoprene laptop sleeve.'},
  { id: 'p8', name: 'Sunglasses', price: 1199, category: 'Accessories', image: 'https://picsum.photos/id/1011/600/400', desc: 'UV400 protection shades.'}
];

// DOM refs
const productsEl = document.getElementById('products');
const categoryEl = document.getElementById('category');
const searchEl = document.getElementById('search');
const sortEl = document.getElementById('sort');
const cartBtn = document.getElementById('cartBtn');
const cartCountEl = document.getElementById('cartCount');
const cartDrawer = document.getElementById('cartDrawer');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const closeCartBtn = document.getElementById('closeCart');
const clearCartBtn = document.getElementById('clearCart');
const checkoutBtn = document.getElementById('checkout');
const yearEl = document.getElementById('year');

// modal refs
const modal = document.getElementById('productModal');
const closeModalBtn = document.getElementById('closeModal');
const modalImg = document.getElementById('modalImg');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalPrice = document.getElementById('modalPrice');
const modalCategory = document.getElementById('modalCategory');
const modalQty = document.getElementById('modalQty');
const addModalToCart = document.getElementById('addModalToCart');

let currentModalProduct = null;

// CART (persisted to localStorage)
const CART_KEY = 'shoplite_cart_v1';
let cart = loadCart();

// init
yearEl.textContent = new Date().getFullYear();
renderCategoryOptions();
renderProducts();
updateCartUI();

// Event listeners
searchEl.addEventListener('input', renderProducts);
categoryEl.addEventListener('change', renderProducts);
sortEl.addEventListener('change', renderProducts);
cartBtn.addEventListener('click', () => openCart());
closeCartBtn.addEventListener('click', () => closeCart());
clearCartBtn.addEventListener('click', () => { if(confirm('Clear cart?')) { cart = []; saveCart(); updateCartUI(); }});
checkoutBtn.addEventListener('click', () => handleCheckout());
document.addEventListener('click', (e) => {
  if(e.target.classList.contains('add-to-cart')) {
    const id = e.target.dataset.id;
    addToCart(id, 1);
  } else if(e.target.classList.contains('view-btn')) {
    const id = e.target.dataset.id;
    openModal(id);
  } else if(e.target.classList.contains('remove-item')) {
    const id = e.target.dataset.id;
    removeFromCart(id);
  }
});
cartItemsEl.addEventListener('input', (e) => {
  if(e.target.classList.contains('cart-qty')) {
    const id = e.target.dataset.id;
    const val = parseInt(e.target.value) || 1;
    updateQty(id, Math.max(1, val));
  }
});
closeModalBtn.addEventListener('click', closeModal);
addModalToCart.addEventListener('click', () => {
  if(currentModalProduct) {
    const qty = Math.max(1, parseInt(modalQty.value) || 1);
    addToCart(currentModalProduct.id, qty);
    closeModal();
    openCart();
  }
});

// functions
function renderCategoryOptions(){
  const categories = ['all', ...Array.from(new Set(PRODUCTS.map(p => p.category)))];
  categoryEl.innerHTML = categories.map(c => `<option value="${c === 'all' ? 'all' : c}">${c}</option>`).join('');
}

function renderProducts(){
  const q = searchEl.value.trim().toLowerCase();
  const cat = categoryEl.value;
  const sort = sortEl.value;
  let list = PRODUCTS.filter(p => {
    if(cat !== 'all' && p.category !== cat) return false;
    if(q && !(p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))) return false;
    return true;
  });

  if(sort === 'price-asc') list.sort((a,b)=>a.price-b.price);
  else if(sort === 'price-desc') list.sort((a,b)=>b.price-a.price);
  else if(sort === 'name-asc') list.sort((a,b)=>a.name.localeCompare(b.name));

  productsEl.innerHTML = list.map(p => productCard(p)).join('');
}

function productCard(p){
  return `
  <article class="card" role="article" aria-labelledby="title-${p.id}">
    <img class="product-img" src="${p.image}" alt="${escapeHtml(p.name)}" loading="lazy">
    <h3 id="title-${p.id}">${escapeHtml(p.name)}</h3>
    <div class="meta small">
      <span class="price">₹${formatPrice(p.price)}</span>
      <span class="tag">${escapeHtml(p.category)}</span>
    </div>
    <p class="small" style="min-height:36px">${escapeHtml(p.desc)}</p>
    <div class="card-actions">
      <button class="btn view-btn" data-id="${p.id}">Quick view</button>
      <button class="btn btn-primary add-to-cart" data-id="${p.id}">Add to cart</button>
    </div>
  </article>`;
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])); }

function formatPrice(n){ return n.toLocaleString('en-IN'); }

// CART helpers
function loadCart(){
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){ return []; }
}
function saveCart(){ localStorage.setItem(CART_KEY, JSON.stringify(cart)); }

function addToCart(id, qty=1){
  const prod = PRODUCTS.find(p => p.id === id);
  if(!prod) return alert('Product not found');
  const existing = cart.find(c => c.id === id);
  if(existing) existing.qty += qty;
  else cart.push({ id, qty });
  saveCart();
  updateCartUI();
  // small visual feedback
  cartBtn.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.08)' }, { transform: 'scale(1)'}], { duration: 200 });
}

function removeFromCart(id){
  cart = cart.filter(c => c.id !== id);
  saveCart();
  updateCartUI();
}

function updateQty(id, qty){
  const item = cart.find(c => c.id === id);
  if(item) item.qty = qty;
  saveCart();
  updateCartUI();
}

function cartDetails(){
  return cart.map(ci => {
    const p = PRODUCTS.find(pp => pp.id === ci.id);
    return { ...p, qty: ci.qty, subtotal: p.price * ci.qty };
  });
}

function cartTotal(){
  return cartDetails().reduce((s,i)=>s + i.subtotal, 0);
}

function updateCartUI(){
  const details = cartDetails();
  cartItemsEl.innerHTML = details.length ? details.map(d => `
    <div class="cart-item">
      <img src="${d.image}" alt="${escapeHtml(d.name)}">
      <div class="item-info">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <strong>${escapeHtml(d.name)}</strong>
          <span class="small">₹${formatPrice(d.price)}</span>
        </div>
        <div class="qty-row small">
          <label>Qty</label>
          <input data-id="${d.id}" type="number" min="1" value="${d.qty}" class="cart-qty" />
          <button data-id="${d.id}" class="btn-link remove-item">Remove</button>
        </div>
        <div class="small" style="margin-top:.45rem">Subtotal: ₹${formatPrice(d.subtotal)}</div>
      </div>
    </div>`).join('') : `<p class="small">Your cart is empty.</p>`;

  cartTotalEl.textContent = `₹${formatPrice(cartTotal())}`;
  cartCountEl.textContent = cart.reduce((s,i)=>s+i.qty,0);
}

function openCart(){ cartDrawer.classList.add('open'); cartDrawer.setAttribute('aria-hidden','false'); }
function closeCart(){ cartDrawer.classList.remove('open'); cartDrawer.setAttribute('aria-hidden','true'); }

// modal
function openModal(id){
  const p = PRODUCTS.find(x => x.id === id);
  if(!p) return;
  currentModalProduct = p;
  modalImg.src = p.image;
  modalImg.alt = p.name;
  modalTitle.textContent = p.name;
  modalDesc.textContent = p.desc;
  modalPrice.textContent = `₹${formatPrice(p.price)}`;
  modalCategory.textContent = p.category;
  modalQty.value = 1;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
}

function closeModal(){
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  currentModalProduct = null;
}

function handleCheckout(){
  if(!cart.length) return alert('Cart is empty');
  // Mock checkout: gather items and show simple summary
  const total = cartTotal();
  const items = cartDetails().map(i => `${i.name} x${i.qty}`).join('\n');
  const ok = confirm(`Checkout summary:\n\n${items}\n\nTotal: ₹${formatPrice(total)}\n\nProceed to payment?`);
  if(ok){
    // On a real site you'd redirect to payment gateway and clear cart after success
    alert('Payment simulated. Thank you for your purchase!');
    cart = [];
    saveCart();
    updateCartUI();
    closeCart();
  }
}

// small helper to close modal with esc
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') {
    if(modal.classList.contains('open')) closeModal();
    if(cartDrawer.classList.contains('open')) closeCart();
  }
});
