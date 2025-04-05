// This file contains the JavaScript that executes in the renderer process

// Price board functionality
let prices = [];

document.addEventListener('DOMContentLoaded', () => {
  const productNameInput = document.getElementById('product-name');
  const buyPriceInput = document.getElementById('buy-price');
  const sellPriceInput = document.getElementById('sell-price');
  const addPriceButton = document.getElementById('add-price');
  const priceItemsContainer = document.getElementById('price-items');
  const updateDisplayButton = document.getElementById('update-display');
  const clearAllButton = document.getElementById('clear-all');
  const lastUpdateTime = document.getElementById('last-update-time');

  // Load saved prices from localStorage
  const savedPrices = localStorage.getItem('prices');
  if (savedPrices) {
    prices = JSON.parse(savedPrices);
    updatePriceList();
  }

  // Add new price
  addPriceButton.addEventListener('click', () => {
    const name = productNameInput.value.trim();
    const buyPrice = parseFloat(buyPriceInput.value);
    const sellPrice = parseFloat(sellPriceInput.value);

    if (name && !isNaN(buyPrice) && !isNaN(sellPrice)) {
      if (sellPrice < buyPrice) {
        alert('Satış fiyatı alış fiyatından düşük olamaz!');
        return;
      }

      prices.push({ name, buyPrice, sellPrice });
      savePrices();
      updatePriceList();
      
      // Clear inputs
      productNameInput.value = '';
      buyPriceInput.value = '';
      sellPriceInput.value = '';
      productNameInput.focus();
    } else {
      alert('Lütfen geçerli bir ürün adı ve fiyat girin.');
    }
  });

  // Update display button
  updateDisplayButton.addEventListener('click', () => {
    console.log('Sending prices to display:', prices);
    window.electron.send('update-display', prices);
    updateLastUpdateTime();
  });

  // Clear all button
  clearAllButton.addEventListener('click', () => {
    if (confirm('Tüm fiyatları silmek istediğinizden emin misiniz?')) {
      prices = [];
      savePrices();
      updatePriceList();
    }
  });

  // Handle enter key in inputs
  productNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      buyPriceInput.focus();
    }
  });

  buyPriceInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      sellPriceInput.focus();
    }
  });

  sellPriceInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      addPriceButton.click();
    }
  });

  // Update last update time on load
  updateLastUpdateTime();
});

function updatePriceList() {
  const priceItemsContainer = document.getElementById('price-items');
  priceItemsContainer.innerHTML = '';

  prices.forEach((item, index) => {
    const priceItem = document.createElement('div');
    priceItem.className = 'price-item';
    priceItem.innerHTML = `
      <button class="delete-btn" data-index="${index}">×</button>
      <div class="product-name">${item.name}</div>
      <div class="price-row">
        <div class="buy-price">Alış: ${Math.floor(item.buyPrice).toLocaleString('tr-TR')} ₺</div>
        <div class="sell-price">Satış: ${Math.floor(item.sellPrice).toLocaleString('tr-TR')} ₺</div>
      </div>
    `;

    // Add delete functionality
    const deleteBtn = priceItem.querySelector('.delete-btn');
    deleteBtn.addEventListener('click', () => {
      prices.splice(index, 1);
      savePrices();
      updatePriceList();
    });

    priceItemsContainer.appendChild(priceItem);
  });
}

function updateLastUpdateTime() {
  const lastUpdateTime = document.getElementById('last-update-time');
  const now = new Date();
  lastUpdateTime.textContent = now.toLocaleTimeString('tr-TR');
}

function savePrices() {
  localStorage.setItem('prices', JSON.stringify(prices));
  updateLastUpdateTime();
} 