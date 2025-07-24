// === Tooltip Initialization ===
document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => new bootstrap.Tooltip(el));

// === Update Cart and Wishlist Counts ===
function updateCartCount() {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  $('#cart-count').text(count);
}

function updateWishlistCount() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  $('#wishlist-count').text(wishlist.length);
  $('#wishlist-total').text(wishlist.length);
}

// === Mark Wishlist Icons ===
function markWishlistIcons() {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  $('.wishlistoption').each(function () {
    const id = $(this).data('id');
    const isInWishlist = wishlist.some(item => item.id == id);
    $(this).toggleClass('added', isInWishlist);
  });
}

// === Header/Footer + Initial Load ===
$(document).ready(function () {
  $('#header').load('header.html', function () {
    let page = window.location.pathname.split('/').pop() || "index.html";
    $('#header nav a').removeClass('active').each(function () {
      if ($(this).attr('href') === page) $(this).addClass('active');
    });
    
    // ✅ Moved here: DOM elements now exist
    updateCartCount();
    updateWishlistCount();
  });


  $('#footer').load('footer.html');

  // === Load Products ===
  $.getJSON('js/products.json', function (products) {
    const page = window.location.pathname.split("/").pop();
    const isIndex = !page || page === "index.html" || page === "about.html";;
    const displayProducts = isIndex ? products.slice(0, 3) : products;
    const $target = $('#product-list');

    displayProducts.forEach(product => {
      $target.append(`
        <div class="col-sm-4 mb-4">
          <div class="product_box">
            <a href="#" class="wishlistoption" 
              data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" 
              data-image="${product.image}" data-desc="${product.desc}" data-bs-toggle="tooltip" title="Add to wishlist">
              <img src="images/heart.png" class="not-selected" alt="">
              <img src="images/heart_red.png" class="selected" alt="">
            </a>
            <img src="${product.image}" alt="${product.name}" class="img-fluid product_img">
            <div class="product_content">
              <h4>${product.name}</h4>
              <span>${product.price}</span>
              <p class="desc_color">${product.desc}</p>
              <div class="text-center">
                <a href="product_details.html?id=${product.id}" class="btn-primary btn">
                  Buy Now <img src="images/arrow_light.png" alt="">
                </a>
                <button class="btn-default btn add-to-cart"
                  data-id="${product.id}" data-name="${product.name}" data-price="${product.price}"
                  data-image="${product.image}" data-desc="${product.desc}">
                  <img src="images/cart.png" alt=""> Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      `);
    });

    markWishlistIcons();
    $('[data-bs-toggle="tooltip"]').tooltip();
  });
});

// === Add to Cart Button (All Pages) ===
$(document).on('click', '.add-to-cart', function (e) {
  e.preventDefault();
  const $btn = $(this);
  const product = {
    id: $btn.data('id'),
    name: $btn.data('name'),
    price: $btn.data('price'),
    image: $btn.data('image'),
    desc: $btn.data('desc'),
    quantity: 1
  };

  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existing = cart.find(item => item.id == product.id);

  if (existing) existing.quantity += 1;
  else cart.push(product);

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();

  $btn.text("Added to Cart ✔").attr('disabled', true);
  setTimeout(() => {
    $btn.html('<img src="images/cart.png" alt=""> Add to Cart').attr('disabled', false);
  }, 1500);
});

// === Wishlist Toggle ===
$(document).on('click', '.wishlistoption', function (e) {
  e.preventDefault();
  const $btn = $(this);
  const id = $btn.data('id');
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const index = wishlist.findIndex(item => item.id == id);

  if (index === -1) {
    wishlist.push({
      id,
      name: $btn.data('name'),
      price: $btn.data('price'),
      image: $btn.data('image'),
      desc: $btn.data('desc'),
      quantity: 1
    });
    $btn.addClass('added');
  } else {
    wishlist.splice(index, 1);
    $btn.removeClass('added');
  }

  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
});

// === Product Detail Page ===
function changeImage(event, src) {
  $('#mainImage').attr('src', src);
  $('.thumbnail').removeClass('active');
  $(event.target).addClass('active');
}

function loadProductDetails() {
  const productId = new URLSearchParams(window.location.search).get("id");
  if (!productId) return;

  $.getJSON("js/products.json", function (products) {
    const product = products.find(p => p.id == productId);
    if (!product) return;

    const thumbnails = product.images.map((img, i) =>
      `<img src="${img}" class="thumbnail rounded ${i === 0 ? 'active' : ''}" onclick="changeImage(event, '${img}')">`
    ).join('');

    const features = product.features.map(f => `<li>${f}</li>`).join('');

    $('#product-detail').html(`
      <div class="col-md-6 mb-4">
        <img src="${product.images[0]}" class="img-fluid rounded mb-3 product-image" id="mainImage">
        <div class="d-flex justify-content-between">${thumbnails}</div>
      </div>
      <div class="col-md-6">
        <h2>${product.name}</h2>
        <p class="text-muted">SKU: ${product.sku || 'N/A'}</p>
        <div><span class="h4">${product.price}</span> <s>${product.oldPrice || ''}</s></div>
        <p>${product.desc}</p>
        <input type="number" id="quantity" class="form-control mb-3" value="1" min="1" style="width:80px;">
        <button id="addToCartBtn" class="btn-primary btn">Add to Cart</button>
      
         <a href="#" class="wishlistoption btn-default btn" 
              data-id="${product.id}" data-name="${product.name}" data-price="${product.price}" 
              data-image="${product.image}" data-desc="${product.desc}" >
             Add to Wishlist
            </a>
        <h5 class="mt-4">Key Features:</h5>
        <ul>${features}</ul>
      </div>
    `);

    $('#related-products').html(
      products.filter(p => p.id != productId).slice(0, 3).map(p => `
        <div class="col-md-4 mb-4">
          <div class="product_box">
            <img src="${p.image}" class="img-fluid product_img" alt="${p.name}">
            <div class="product_content">
              <h4>${p.name}</h4>
              <span>${p.price}</span>
              <p class="desc_color">${p.desc}</p>
              <a href="product_details.html?id=${p.id}" class="btn-primary btn">Buy Now</a>
            </div>
          </div>
        </div>`).join('')
    );

    $(document).on('click', '#addToCartBtn', function () {
      const qty = parseInt($('#quantity').val()) || 1;
      let cart = JSON.parse(localStorage.getItem('cart')) || [];
      const existing = cart.find(item => item.id == product.id);

      if (existing) existing.quantity = qty;
      else cart.push({
        id: product.id,
        name: product.name,
        image: product.images[0],
        price: product.price,
        quantity: qty,
        desc: product.desc || ''
      });

      localStorage.setItem('cart', JSON.stringify(cart));
      updateCartCount();
      window.location.href = "cart.html";
    });
  });
}

// === Cart Page ===
$(document).ready(function () {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  const $container = $('#cart-container');
  const $countDisplay = $('#cart-count-display');
  $container.empty();

  if (cart.length === 0) {
    $countDisplay.text("Your cart is empty.");
    $container.html('<p>Your cart is empty.</p>');
    return;
  }

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  $countDisplay.text(`You have ${totalItems} item${totalItems !== 1 ? 's' : ''} in your cart`);

  cart.forEach(item => {
    const totalPrice = (parseFloat(item.price.replace('$', '')) * item.quantity).toFixed(2);
    $container.append(`
      <div class="card mb-3" data-id="${item.id}">
        <div class="card-body">
          <div class="d-flex justify-content-between">
            <div class="d-flex align-items-center">
              <img src="${item.image}" class="img-fluid rounded-3" style="width: 100px;">
              <div class="ms-3">
                <h5  data-bs-toggle="tooltip" title="Product Name">${item.name}</h5>
                <p class="small"  data-bs-toggle="tooltip" title="Description">${item.desc}</p>
              </div>
            </div>
            <div class="d-flex align-items-center">
              <h5 class="fw-normal mb-0 me-3" data-bs-toggle="tooltip" title="Quantity">${item.quantity}</h5>
              <h5 class="mb-0 me-3" data-bs-toggle="tooltip" title="Price">$${totalPrice}</h5>
              <a href="#" class="desc_color remove-item" data-id="${item.id}" data-bs-toggle="tooltip" title="Remove"><i class="fa fa-trash"></i></a>
            </div>
          </div>
        </div>
      </div>
    `);
  });

  const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price.replace('$', '')) * item.quantity, 0);
  $('#summary-subtotal').text(`$${subtotal.toFixed(2)}`);
  $('#summary-shipping').text(`$0.00`);
  $('#summary-total').text(`$${subtotal.toFixed(2)}`);

  $container.on('click', '.remove-item', function (e) {
    e.preventDefault();
    const id = $(this).data('id');
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id != id);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    location.reload(); // or call renderCart() if separated
  });
});

// === Wishlist Page ===
$(document).ready(function () {
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const $container = $('#wishlist-container').empty();
  updateWishlistCount();

  if (wishlist.length === 0) {
    $container.html('<p>Your wishlist is empty.</p>');
    return;
  }

  wishlist.forEach(item => {
    $container.append(`
      <div class="card mb-3" data-id="${item.id}">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div class="d-flex align-items-center">
            <img src="${item.image}" class="img-fluid rounded-3" style="width: 80px;">
            <div class="ms-3">
              <h5>${item.name}</h5>
              <p class="small">${item.desc}</p>
            </div>
          </div>
          <div class="d-flex align-items-center">
            <h5 class="fw-normal mb-0 me-3">${item.quantity}</h5>
            <h5 class="mb-0 me-3">${item.price}</h5>
            <a href="#" class="desc_color add-from-wishlist-to-cart" data-id="${item.id}" title="Add to cart"><i class="fa fa-shopping-cart"></i></a>
            <a href="#" class="text-danger px-2 remove-from-wishlist" data-id="${item.id}" title="Remove from wishlist"><i class="fa fa-heart"></i></a>
          </div>
        </div>
      </div>
    `);
  });
});

$(document).on('click', '.remove-from-wishlist', function (e) {
  e.preventDefault();
  const id = $(this).data('id');
  let wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  wishlist = wishlist.filter(item => item.id != id);
  localStorage.setItem('wishlist', JSON.stringify(wishlist));
  updateWishlistCount();
  $(this).closest('.card').remove();

  if (wishlist.length === 0) {
    $('#wishlist-container').html('<p>Your wishlist is empty.</p>');
  }
});

$(document).on('click', '.add-from-wishlist-to-cart', function (e) {
  e.preventDefault();
  const id = $(this).data('id');
  const wishlist = JSON.parse(localStorage.getItem('wishlist')) || [];
  const item = wishlist.find(i => i.id == id);
  if (!item) return;

  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const index = cart.findIndex(p => p.id == item.id);

  if (index > -1) cart[index].quantity += item.quantity;
  else cart.push(item);

  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
  alert("Item added to cart!");
});


$(document).on('click', '#clear-cart', function (e) {
  e.preventDefault();

  if (confirm('Are you sure you want to clear the entire cart?')) {
    localStorage.removeItem('cart'); // remove cart from localStorage
    updateCartCount(); // update cart icon count
    $('#cart-container').html('<p>Your cart is empty.</p>'); // show empty message
    $('#cart-count-display').text("Your cart is empty.");
    
    // Reset totals
    $('#summary-subtotal').text('$0.00');
    $('#summary-shipping').text('$0.00');
    $('#summary-total').text('$0.00');
  }
});


// --- Utility Functions ---
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isValidPhone(phone) {
  return /^[6-9]\d{9}$/.test(phone);
}

// --- SIGNUP ---
$(document).on("click", "#signup-btn", function () {
  const name = $('#signup-name').val().trim();
  const email = $('#signup-email').val().trim();
  const password = $('#signup-password').val().trim();
  const phone = $('#signup-phone').val().trim();

  if (!name || !email || !password || !phone) {
    alert("All fields are required.");
    return;
  }

  if (!isValidEmail(email)) {
    alert("Please enter a valid email address.");
    return;
  }

  if (password.length < 6) {
    alert("Password must be at least 6 characters.");
    return;
  }

  if (!isValidPhone(phone)) {
    alert("Please enter a valid 10-digit Indian phone number.");
    return;
  }

  const existingUser = JSON.parse(localStorage.getItem("user"));
  if (existingUser && existingUser.email === email) {
    alert("User already exists. Please login.");
    return;
  }

  const firstName = name.split(" ")[0];
  const user = { name, email, password, phone, firstName };
  localStorage.setItem("user", JSON.stringify(user));

  alert("Signup successful! Please login.");
  window.location.href = "login.html";
});

// --- LOGIN ---
$(document).on("click", "#login-btn", function () {
  const email = $('#login-email').val().trim();
  const password = $('#login-password').val().trim();

  if (!email || !password) {
    alert("Both email and password are required.");
    return;
  }

  if (!isValidEmail(email)) {
    alert("Please enter a valid email.");
    return;
  }

  const storedUser = JSON.parse(localStorage.getItem("user"));
  if (!storedUser) {
    alert("No registered user found. Please sign up first.");
    return;
  }

  if (email === storedUser.email && password === storedUser.password) {
    const firstName = storedUser.name.split(" ")[0];
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("firstName", firstName);

    alert("Login successful!");
    window.location.href = "products.html";
  } else {
    alert("Invalid email or password.");
  }
});

// --- Header Name + Logout Toggle ---
$(document).ready(function () {
  $('#header').load('header.html', function () {
    const isLoggedIn = localStorage.getItem("isLoggedIn");
    const firstName = localStorage.getItem("firstName");

    if (isLoggedIn === "true" && firstName) {
      $('#user-greeting').html(`Hi, <strong>${firstName}</strong>`);
      $('#login-btn-header').addClass('d-none');
      $('#logout-btn').removeClass('d-none');
    } else {
      $('#user-greeting').html('');
      $('#login-btn-header').removeClass('d-none');
      $('#logout-btn').addClass('d-none');
    }
  });
});

// --- Logout ---
$(document).on("click", "#logout-btn", function (e) {
  e.preventDefault();
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("firstName");
  alert("Logged out successfully.");
  window.location.href = "login.html";
});


 $(document).ready(function () {
    $('#checkout-form').on('submit', function (e) {
      e.preventDefault();

      let isValid = true;
      let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
      let phonePattern = /^[0-9]{10}$/;
      let cardPattern = /^[0-9]{12,19}$/;
      let cvvPattern = /^[0-9]{3,4}$/;

      $(this).find('input, select').removeClass('is-invalid');

      $(this).find('[required]').each(function () {
        if (!$(this).val().trim()) {
          $(this).addClass('is-invalid');
          isValid = false;
        }
      });

      if (!emailPattern.test($('#email').val())) {
        $('#email').addClass('is-invalid');
        isValid = false;
      }

      if (!phonePattern.test($('#phone').val())) {
        $('#phone').addClass('is-invalid');
        isValid = false;
      }

      if (!cardPattern.test($('#cardNumber').val())) {
        $('#cardNumber').addClass('is-invalid');
        isValid = false;
      }

      if (!cvvPattern.test($('#cvv').val())) {
        $('#cvv').addClass('is-invalid');
        isValid = false;
      }

      if (!$('#terms').is(':checked')) {
        alert("You must agree to the terms and conditions.");
        isValid = false;
      }

      if (isValid) {
        // Generate Unique Order ID
        const orderId = 'ORDER' + Math.floor(10000000 + Math.random() * 90000000);

        // Collect form data
        const orderDetails = {
          orderId: orderId,
          firstName: $('#firstName').val(),
          lastName: $('#lastName').val(),
          address: $('#address').val(),
          city: $('#city').val(),
          country: $('#country').val(),
          state: $('#state').val(),
          zip: $('#zip').val(),
          phone: $('#phone').val(),
          email: $('#email').val(),
          message: $('#message').val(),
          cardType: $('#cardType').val(),
          cardNumber: $('#cardNumber').val(),
          expMonth: $('#expMonth').val(),
          expYear: $('#expYear').val(),
          cvv: $('#cvv').val(),
        };

        // Save order to localStorage
        localStorage.setItem('lastOrder', JSON.stringify(orderDetails));

        // Redirect to thank you page
        window.location.href = 'thankyou.html?order=' + orderId;
      }
    });
  });
  $(document).ready(function () {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('order');
    const orderData = JSON.parse(localStorage.getItem('lastOrder'));

    if (orderId && orderData && orderData.orderId === orderId) {
      $('#order-id').text(orderData.orderId);
      $('#order-name').text(orderData.firstName + ' ' + orderData.lastName);
      $('#order-email').text(orderData.email);
      $('#order-phone').text(orderData.phone);
      $('#order-address').text(orderData.address + ', ' + orderData.city + ', ' + orderData.state + ', ' + orderData.country + ' - ' + orderData.zip);
    } else {
      $('#order-details').html('<p>Order not found or expired.</p>');
    }
  });


  $(document).ready(function () {
    $('#cancel-form').on('submit', function (e) {
      e.preventDefault();

      let isValid = true;
      let emailPattern = /^[^ ]+@[^ ]+\.[a-z]{2,3}$/;
      let phonePattern = /^[0-9]{10}$/;

      const orderId = $('#cancel-order-id').val().trim();
      const email = $('#cancel-email').val().trim();
      const phone = $('#cancel-phone').val().trim();

      // Reset errors
      $('#cancel-form input').removeClass('is-invalid');

      // Basic required check
      if (!orderId) {
        $('#cancel-order-id').addClass('is-invalid');
        isValid = false;
      }

      if (!email || !emailPattern.test(email)) {
        $('#cancel-email').addClass('is-invalid');
        isValid = false;
      }

      if (!phone || !phonePattern.test(phone)) {
        $('#cancel-phone').addClass('is-invalid');
        isValid = false;
      }

      // Now check if it matches with localStorage
      const orderData = JSON.parse(localStorage.getItem('lastOrder'));

      if (isValid) {
        if (
          orderData &&
          orderId === orderData.orderId &&
          email === orderData.email &&
          phone === orderData.phone
        ) {
          alert("Order canceled successfully.");
          // Optionally: clear the order from localStorage
          localStorage.removeItem('lastOrder');
          window.location.href = 'products.html';
        } else {
          alert("Order details not found or incorrect.");
        }
      }
    });
  });