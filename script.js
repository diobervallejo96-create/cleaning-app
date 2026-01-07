// script.js: lógicas de la aplicación de limpieza usando localStorage

// Definición de servicios disponibles
const services = [
  { id: 1, name: 'Limpieza de casa', price: 50 },
  { id: 2, name: 'Limpieza de oficina', price: 80 },
  { id: 3, name: 'Limpieza comercial', price: 120 }
];

// Estado de la aplicación
let currentUser = null;

// Utilidades para localStorage
function getUsers() {
  return JSON.parse(localStorage.getItem('users') || '[]');
}
function setUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}
function getBookings() {
  return JSON.parse(localStorage.getItem('bookings') || '[]');
}
function setBookings(bookings) {
  localStorage.setItem('bookings', JSON.stringify(bookings));
}

// Crear usuario administrador por defecto si no existe
function ensureAdmin() {
  const users = getUsers();
  const adminExists = users.some((u) => u.username === 'admin');
  if (!adminExists) {
    users.push({
      username: 'admin',
      password: 'admin',
      role: 'admin',
      referralCode: 'admin',
      discountCredits: 0,
    });
    setUsers(users);
  }
}

// Mostrar formularios de login/registro
function showRegister() {
  document.getElementById('loginForm').classList.add('hidden');
  document.getElementById('registerForm').classList.remove('hidden');
}
function showLogin() {
  document.getElementById('registerForm').classList.add('hidden');
  document.getElementById('loginForm').classList.remove('hidden');
}

// Manejar registro de usuario
function registerUser() {
  const username = document.getElementById('regUsername').value.trim();
  const password = document.getElementById('regPassword').value;
  const role = document.getElementById('regRole').value;
  if (!username || !password) {
    alert('Por favor ingresa usuario y contraseña');
    return;
  }
  const users = getUsers();
  if (users.some((u) => u.username === username)) {
    alert('El usuario ya existe');
    return;
  }
  // Asignar un código de referido único utilizando el nombre de usuario
  const referralCode = username;
  users.push({ username, password, role, referralCode, discountCredits: 0 });
  setUsers(users);
  alert('Registro exitoso. Ahora inicia sesión.');
  showLogin();
}

// Manejar inicio de sesión
function loginUser() {
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const users = getUsers();
  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) {
    alert('Usuario o contraseña incorrectos');
    return;
  }
  currentUser = user;
  document.getElementById('authSection').classList.add('hidden');
  if (user.role === 'customer') {
    showCustomerSection();
  } else if (user.role === 'cleaner') {
    showCleanerSection();
  } else if (user.role === 'admin') {
    showAdminSection();
  }
}

// Población de lista de servicios en sección cliente
function populateServiceSelect() {
  const select = document.getElementById('serviceSelect');
  select.innerHTML = '';
  services.forEach((service) => {
    const option = document.createElement('option');
    option.value = service.id;
    option.textContent = `${service.name} ($${service.price})`;
    select.appendChild(option);
  });
}

// Mostrar sección de cliente
function showCustomerSection() {
  document.getElementById('customerSection').classList.remove('hidden');
  document.getElementById('customerName').textContent = currentUser.username;
  // Mostrar código de referido del usuario
  const referralInfo = document.getElementById('customerReferralInfo');
  if (referralInfo) {
    referralInfo.textContent = `Tu código de referido: ${currentUser.referralCode}`;
  }
  // Mostrar descuentos disponibles
  const discountInfo = document.getElementById('customerDiscountInfo');
  if (discountInfo) {
    const credits = currentUser.discountCredits || 0;
    if (credits > 0) {
      discountInfo.textContent = `Tienes ${credits} descuento(s) del 10% para tu próxima cita.`;
      discountInfo.classList.remove('hidden');
    } else {
      discountInfo.classList.add('hidden');
    }
  }
  populateServiceSelect();
  loadCustomerBookings();
}

// Crear una nueva reservación por cliente
function createBooking() {
  const serviceId = parseInt(document.getElementById('serviceSelect').value, 10);
  const date = document.getElementById('bookingDate').value;
  const time = document.getElementById('bookingTime').value;
  const referralInput = document.getElementById('referralInput');
  const referralCodeEntered = referralInput ? referralInput.value.trim() : '';
  if (!date || !time) {
    alert('Selecciona fecha y hora');
    return;
  }
  const bookings = getBookings();
  const id = bookings.length > 0 ? Math.max(...bookings.map((b) => b.id)) + 1 : 1;
  // Asignar proveedor automáticamente (primero disponible) o null si ninguno
  const providers = getUsers().filter((u) => u.role === 'cleaner');
  let assigned = null;
  if (providers.length > 0) {
    // buscar proveedor con menos reservas asignadas
    const bookingsByProvider = {};
    providers.forEach((p) => {
      bookingsByProvider[p.username] = bookings.filter((b) => b.cleaner === p.username).length;
    });
    assigned = providers.reduce((prev, curr) => {
      return bookingsByProvider[curr.username] < bookingsByProvider[prev.username] ? curr : prev;
    }, providers[0]).username;
  }
  // Calcular precio base del servicio
  const service = services.find((s) => s.id === serviceId);
  let price = service ? service.price : 0;
  let discountApplied = 0;
  // Aplicar descuento si el usuario tiene créditos
  let users = getUsers();
  const userIndex = users.findIndex((u) => u.username === currentUser.username);
  if (userIndex >= 0) {
    const user = users[userIndex];
    const credits = user.discountCredits || 0;
    if (credits > 0) {
      discountApplied = 0.1; // 10% descuento
      price = price - price * discountApplied;
      // Consumir un crédito
      user.discountCredits = credits - 1;
      users[userIndex] = user;
      setUsers(users);
    }
  }
  // Procesar código de referido ingresado
  let referralUsed = null;
  if (referralCodeEntered && referralCodeEntered !== currentUser.referralCode) {
    const allUsers = getUsers();
    const refIndex = allUsers.findIndex((u) => u.referralCode === referralCodeEntered);
    if (refIndex >= 0) {
      // Otorgar un crédito de descuento al referido
      allUsers[refIndex].discountCredits = (allUsers[refIndex].discountCredits || 0) + 1;
      referralUsed = referralCodeEntered;
      setUsers(allUsers);
      alert(`El usuario con código ${referralCodeEntered} ha ganado un descuento para su próxima cita.`);
    }
  }
  bookings.push({
    id,
    serviceId,
    customer: currentUser.username,
    cleaner: assigned,
    date,
    time,
    status: 'pendiente',
    paymentStatus: 'pendiente',
    price: price,
    discountApplied: discountApplied,
    referralUsed: referralUsed,
  });
  setBookings(bookings);
  alert('Reserva creada');
  loadCustomerBookings();
  // Si hay interfaz de proveedor, actualizarla
  if (currentUser.role === 'cleaner') {
    loadCleanerBookings();
  }
  // Actualizar info de descuentos y código
  showCustomerSection();
}

// Cargar reservas de cliente
function loadCustomerBookings() {
  const tbody = document.getElementById('customerBookings').querySelector('tbody');
  tbody.innerHTML = '';
  const bookings = getBookings().filter((b) => b.customer === currentUser.username);
  bookings.forEach((b) => {
    const service = services.find((s) => s.id === b.serviceId);
    const row = document.createElement('tr');
    const priceDisplay = b.price !== undefined ? `$${b.price.toFixed(2)}` : '';
    row.innerHTML = `\n      <td>${service ? service.name : ''}</td>\n      <td>${b.date}</td>\n      <td>${b.time}</td>\n      <td>${b.status}</td>\n      <td>${b.cleaner ? b.cleaner : 'No asignado'}</td>\n      <td>${priceDisplay}</td>\n      <td>${b.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}</td>\n    `;
    tbody.appendChild(row);
  });
}

// Mostrar sección de proveedor
function showCleanerSection() {
  document.getElementById('cleanerSection').classList.remove('hidden');
  loadCleanerBookings();
}

// Cargar reservas de proveedor
function loadCleanerBookings() {
  const tbody = document.getElementById('cleanerBookings').querySelector('tbody');
  if (!tbody) return;
  tbody.innerHTML = '';
  const bookings = getBookings().filter((b) => b.cleaner === currentUser.username);
  bookings.forEach((b) => {
    const service = services.find((s) => s.id === b.serviceId);
    const row = document.createElement('tr');
    const completeBtn = document.createElement('button');
    completeBtn.textContent = 'Completar';
    completeBtn.onclick = () => {
      markBookingCompleted(b.id);
    };
    row.innerHTML = `\n      <td>${b.customer}</td>\n      <td>${service ? service.name : ''}</td>\n      <td>${b.date}</td>\n      <td>${b.time}</td>\n      <td>${b.status}</td>\n    `;
    const actionCell = document.createElement('td');
    if (b.status === 'pendiente') {
      actionCell.appendChild(completeBtn);
    }
    row.appendChild(actionCell);
    tbody.appendChild(row);
  });
}

// Marcar reserva como completada (proveedor)
function markBookingCompleted(id) {
  const bookings = getBookings();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) return;
  booking.status = 'completado';
  setBookings(bookings);
  loadCleanerBookings();
  if (currentUser.role === 'admin') {
    loadAdminBookings();
  }
}

// Marcar reserva como pagada (admin)
function markBookingPaid(id) {
  const bookings = getBookings();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) return;
  booking.paymentStatus = 'pagado';
  setBookings(bookings);
  loadAdminBookings();
  // Actualizar vista cliente si corresponde
  if (currentUser && currentUser.role === 'customer') {
    loadCustomerBookings();
  }
}

// Mostrar sección de administrador
function showAdminSection() {
  document.getElementById('adminSection').classList.remove('hidden');
  loadAdminBookings();

  // Establecer enlace de reserva para compartir
  const linkInput = document.getElementById('bookingLink');
  if (linkInput) {
    // Construir URL de enlace. Si se aloja en GitHub Pages u otro, se toma la ruta base actual.
    const basePath = window.location.href.replace(/\/[^/]*$/, '/');
    linkInput.value = basePath + 'portal.html';
  }
}

// Cargar reservas para administrador
function loadAdminBookings() {
  const tbody = document.getElementById('adminBookings').querySelector('tbody');
  tbody.innerHTML = '';
  const bookings = getBookings();
  const providers = getUsers().filter((u) => u.role === 'cleaner');
  bookings.forEach((b) => {
    const row = document.createElement('tr');
    const service = services.find((s) => s.id === b.serviceId);
    const priceDisplay = b.price !== undefined ? `$${b.price.toFixed(2)}` : '';
    row.innerHTML = `\n      <td>${b.id}</td>\n      <td>${b.customer}</td>\n      <td>${service ? service.name : ''}</td>\n      <td>${b.date}</td>\n      <td>${b.time}</td>\n      <td>${b.cleaner ? b.cleaner : '---'}</td>\n      <td>${b.status}</td>\n      <td>${priceDisplay}</td>\n      <td>${b.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}</td>\n    `;
    // Selector para asignar proveedor
    const assignCell = document.createElement('td');
    const select = document.createElement('select');
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = 'Sin asignar';
    select.appendChild(emptyOption);
    providers.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.username;
      opt.textContent = p.username;
      if (b.cleaner === p.username) opt.selected = true;
      select.appendChild(opt);
    });
    select.onchange = () => {
      assignProvider(b.id, select.value);
    };
    assignCell.appendChild(select);
    row.appendChild(assignCell);
    // Acción de pago
    const payCell = document.createElement('td');
    if (b.paymentStatus !== 'pagado') {
      const payBtn = document.createElement('button');
      payBtn.textContent = 'Marcar pagado';
      payBtn.onclick = () => {
        markBookingPaid(b.id);
      };
      payCell.appendChild(payBtn);
    }
    row.appendChild(payCell);
    tbody.appendChild(row);
  });
}

// Asignar proveedor a una reserva (admin)
function assignProvider(bookingId, providerName) {
  const bookings = getBookings();
  const booking = bookings.find((b) => b.id === bookingId);
  if (!booking) return;
  booking.cleaner = providerName || null;
  setBookings(bookings);
  loadAdminBookings();
  // Si el proveedor está conectado, actualizar su vista
  if (currentUser && currentUser.role === 'cleaner') {
    loadCleanerBookings();
  }
}

// Configurar listeners después de cargar la página
window.onload = () => {
  ensureAdmin();
  document.getElementById('loginBtn').onclick = loginUser;
  document.getElementById('registerBtn').onclick = registerUser;
  document.getElementById('bookBtn').onclick = createBooking;
};