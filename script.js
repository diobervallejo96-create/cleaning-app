// script.js: lógicas de la aplicación de limpieza usando localStorage

// Definición de servicios disponibles
// Definición de servicios disponibles.
// Se incluye un precio base para cálculos internos (ej. cupones), pero no se muestra al usuario.
const services = [
  { id: 1, name: 'Limpieza básica', price: 50 },
  { id: 2, name: 'Limpieza de oficina', price: 80 },
  { id: 3, name: 'Limpieza comercial', price: 120 },
  { id: 4, name: 'Limpieza profunda', price: 100 }
];

// Estado de la aplicación
let currentUser = null;

// Mostrar u ocultar campos adicionales según rol en el registro
function toggleProviderFields() {
  const role = document.getElementById('regRole').value;
  const providerFields = document.getElementById('providerExtraFields');
  if (providerFields) {
    if (role === 'cleaner') {
      providerFields.classList.remove('hidden');
    } else {
      providerFields.classList.add('hidden');
    }
  }
}

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
  const newUser = {
    username,
    password,
    role,
    referralCode,
    discountCredits: 0,
  };
  // Si el registro es para un proveedor, guardar datos de perfil
  if (role === 'cleaner') {
    const companyName = document.getElementById('regCompanyName').value.trim();
    const phone = document.getElementById('regPhone').value.trim();
    const about = document.getElementById('regAbout').value.trim();
    newUser.companyName = companyName;
    newUser.phone = phone;
    newUser.about = about;
    // Obtener el archivo de imagen cargado
    const fileInput = document.getElementById('regPhotoFile');
    const file = fileInput && fileInput.files ? fileInput.files[0] : null;
    if (file) {
      const reader = new FileReader();
      reader.onload = function () {
        newUser.photoData = reader.result;
        users.push(newUser);
        setUsers(users);
        alert('Registro exitoso. Ahora inicia sesión.');
        showLogin();
      };
      reader.readAsDataURL(file);
      return; // esperar a que se complete la carga de la imagen
    }
  }
  // Registrar usuario cuando no hay imagen o no es proveedor
  users.push(newUser);
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
    // Mostrar solo el nombre del servicio sin precio
    option.textContent = service.name;
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
      discountInfo.textContent = `Tienes ${credits} cupón(es) de descuento del 30% que puedes aplicar en futuras reservas.`;
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
  // Obtener oferta de precio del cliente y detalles de la casa
  const customerPriceVal = parseFloat(document.getElementById('customerPrice').value || '0');
  const rooms = parseInt(document.getElementById('houseRooms').value || '0');
  const baths = parseInt(document.getElementById('houseBathrooms').value || '0');
  const living = parseInt(document.getElementById('houseLivingRooms').value || '0');
  const kitchens = parseInt(document.getElementById('houseKitchens').value || '0');
  const otherDetails = (document.getElementById('houseOther').value || '').trim();

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
  // Calcular precio base del servicio y aplicar descuento por cupón
  const service = services.find((s) => s.id === serviceId);
  let price = service ? service.price : 0;
  let discountApplied = 0;
  let users = getUsers();
  const userIndex = users.findIndex((u) => u.username === currentUser.username);
  if (userIndex >= 0) {
    const user = users[userIndex];
    const credits = user.discountCredits || 0;
    if (credits > 0) {
      discountApplied = 0.3; // 30% descuento
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
      // Otorgar un crédito de descuento al usuario referido
      allUsers[refIndex].discountCredits = (allUsers[refIndex].discountCredits || 0) + 1;
      referralUsed = referralCodeEntered;
      setUsers(allUsers);
      alert(`El usuario con código ${referralCodeEntered} ha ganado un cupón de 30% de descuento para su próxima cita.`);
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
    customerPrice: isNaN(customerPriceVal) ? null : customerPriceVal,
    houseDetails: {
      rooms: rooms,
      bathrooms: baths,
      livingRooms: living,
      kitchens: kitchens,
      other: otherDetails,
    },
    providerOffer: null,
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
    const customerPriceDisplay = b.customerPrice !== undefined && b.customerPrice !== null ? `$${parseFloat(b.customerPrice).toFixed(2)}` : '';
    const providerPriceDisplay = b.providerOffer !== undefined && b.providerOffer !== null ? `$${parseFloat(b.providerOffer).toFixed(2)}` : '';
    row.innerHTML = `\n      <td>${service ? service.name : ''}</td>\n      <td>${b.date}</td>\n      <td>${b.time}</td>\n      <td>${b.status}</td>\n      <td>${b.cleaner ? b.cleaner : 'No asignado'}</td>\n      <td>${priceDisplay}</td>\n      <td>${customerPriceDisplay}</td>\n      <td>${providerPriceDisplay}</td>\n      <td>${b.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}</td>\n    `;
    tbody.appendChild(row);
  });
}

// Mostrar sección de proveedor
function showCleanerSection() {
  document.getElementById('cleanerSection').classList.remove('hidden');
  // Cargar información de perfil y enlace
  loadProviderInfo();
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
    const customerPriceDisplay = b.customerPrice !== undefined && b.customerPrice !== null ? `$${parseFloat(b.customerPrice).toFixed(2)}` : '';
    const providerPriceDisplay = b.providerOffer !== undefined && b.providerOffer !== null ? `$${parseFloat(b.providerOffer).toFixed(2)}` : '';
    // Crear celda con detalles de la casa
    let houseSummary = '';
    if (b.houseDetails) {
      const parts = [];
      if (b.houseDetails.rooms > 0) parts.push(b.houseDetails.rooms + ' hab.');
      if (b.houseDetails.bathrooms > 0) parts.push(b.houseDetails.bathrooms + ' baño(s)');
      if (b.houseDetails.livingRooms > 0) parts.push(b.houseDetails.livingRooms + ' sala(s)');
      if (b.houseDetails.kitchens > 0) parts.push(b.houseDetails.kitchens + ' cocina(s)');
      if (b.houseDetails.other && b.houseDetails.other.length > 0) parts.push(b.houseDetails.other);
      houseSummary = parts.join(', ');
    }
    row.innerHTML = `\n      <td>${b.customer}</td>\n      <td>${service ? service.name : ''}</td>\n      <td>${b.date}</td>\n      <td>${b.time}</td>\n      <td>${customerPriceDisplay}</td>\n      <td>${houseSummary}</td>\n      <td>${providerPriceDisplay}</td>\n      <td>${b.status}</td>\n    `;
    // Acciones: proponer precio y completar
    const actionsCell = document.createElement('td');
    if (b.status === 'pendiente') {
      // input para oferta
      const offerInput = document.createElement('input');
      offerInput.type = 'number';
      offerInput.min = '0';
      offerInput.step = '0.01';
      offerInput.placeholder = 'Propuesta $';
      if (b.providerOffer !== undefined && b.providerOffer !== null) {
        offerInput.value = b.providerOffer;
      }
      const proposeBtn = document.createElement('button');
      proposeBtn.textContent = 'Proponer';
      proposeBtn.onclick = () => {
        const val = parseFloat(offerInput.value);
        if (isNaN(val) || val <= 0) {
          alert('Ingresa un precio válido');
          return;
        }
        setProviderOffer(b.id, val);
      };
      const completeBtn = document.createElement('button');
      completeBtn.textContent = 'Completar';
      completeBtn.onclick = () => {
        markBookingCompleted(b.id);
      };
      actionsCell.appendChild(offerInput);
      actionsCell.appendChild(proposeBtn);
      actionsCell.appendChild(completeBtn);
    }
    row.appendChild(actionsCell);
    tbody.appendChild(row);
  });
}

// Mostrar información del proveedor (foto, nombre de compañía, teléfono, descripción) y enlace personalizado
function loadProviderInfo() {
  const infoDiv = document.getElementById('providerInfo');
  if (!infoDiv || !currentUser || currentUser.role !== 'cleaner') return;
  infoDiv.innerHTML = '';
  const user = currentUser;
  // Crear imagen de perfil. Se prioriza la imagen cargada (photoData) y luego la URL si existe.
  const img = document.createElement('img');
  img.src = user.photoData
    ? user.photoData
    : user.photoURL
    ? user.photoURL
    : 'icon-192.png';
  img.alt = 'Foto de proveedor';
  img.style.width = '80px';
  img.style.height = '80px';
  img.style.objectFit = 'cover';
  img.style.borderRadius = '50%';
  // Crear contenedor de detalles
  const detailsDiv = document.createElement('div');
  const nameP = document.createElement('p');
  nameP.textContent = user.companyName && user.companyName.length > 0 ? user.companyName : user.username;
  nameP.style.fontWeight = 'bold';
  detailsDiv.appendChild(nameP);
  if (user.phone && user.phone.length > 0) {
    const phoneP = document.createElement('p');
    phoneP.textContent = 'Teléfono: ' + user.phone;
    detailsDiv.appendChild(phoneP);
  }
  if (user.about && user.about.length > 0) {
    const aboutP = document.createElement('p');
    aboutP.textContent = user.about;
    detailsDiv.appendChild(aboutP);
  }
  infoDiv.appendChild(img);
  infoDiv.appendChild(detailsDiv);
  // Construir enlace para compartir con clientes
  const linkInput = document.getElementById('providerLink');
  if (linkInput) {
    const baseUrl = window.location.href.replace(/\/[^/]*$/, '/');
    linkInput.value = baseUrl + 'portal.html?provider=' + encodeURIComponent(user.username) + '&ref=' + encodeURIComponent(user.referralCode);
  }
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

// Establecer la propuesta de precio del proveedor para una reserva
function setProviderOffer(id, price) {
  const bookings = getBookings();
  const booking = bookings.find((b) => b.id === id);
  if (!booking) return;
  booking.providerOffer = price;
  setBookings(bookings);
  // Recargar vistas donde se muestre el cambio
  if (currentUser) {
    if (currentUser.role === 'cleaner') {
      loadCleanerBookings();
    } else if (currentUser.role === 'customer') {
      loadCustomerBookings();
    } else if (currentUser.role === 'admin') {
      loadAdminBookings();
    }
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
    const customerPriceDisplay = b.customerPrice !== undefined && b.customerPrice !== null ? `$${parseFloat(b.customerPrice).toFixed(2)}` : '';
    const providerPriceDisplay = b.providerOffer !== undefined && b.providerOffer !== null ? `$${parseFloat(b.providerOffer).toFixed(2)}` : '';
    row.innerHTML = `\n      <td>${b.id}</td>\n      <td>${b.customer}</td>\n      <td>${service ? service.name : ''}</td>\n      <td>${b.date}</td>\n      <td>${b.time}</td>\n      <td>${b.cleaner ? b.cleaner : '---'}</td>\n      <td>${b.status}</td>\n      <td>${priceDisplay}</td>\n      <td>${customerPriceDisplay}</td>\n      <td>${providerPriceDisplay}</td>\n      <td>${b.paymentStatus === 'pagado' ? 'Pagado' : 'Pendiente'}</td>\n    `;
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
  // Mostrar/ocultar campos de proveedor al seleccionar rol
  const roleSelect = document.getElementById('regRole');
  if (roleSelect) {
    roleSelect.onchange = toggleProviderFields;
    // Ejecutar una vez al cargar para establecer estado inicial
    toggleProviderFields();
  }
  // Configurar botones de edición de perfil para proveedores
  const editBtn = document.getElementById('editProfileBtn');
  const editForm = document.getElementById('editProfileForm');
  if (editBtn) {
    editBtn.onclick = () => {
      if (editForm.classList.contains('hidden')) {
        // Prefill con datos actuales
        if (currentUser && currentUser.role === 'cleaner') {
          document.getElementById('providerCompanyName').value = currentUser.companyName || '';
          document.getElementById('providerPhone').value = currentUser.phone || '';
          document.getElementById('providerAbout').value = currentUser.about || '';
        }
        editForm.classList.remove('hidden');
      } else {
        editForm.classList.add('hidden');
      }
    };
  }
  const saveBtn = document.getElementById('saveProfileBtn');
  if (saveBtn) {
    saveBtn.onclick = () => {
      if (!currentUser || currentUser.role !== 'cleaner') return;
      const users = getUsers();
      const idx = users.findIndex((u) => u.username === currentUser.username);
      if (idx >= 0) {
        // Actualizar información textual
        users[idx].companyName = document.getElementById('providerCompanyName').value.trim();
        users[idx].phone = document.getElementById('providerPhone').value.trim();
        users[idx].about = document.getElementById('providerAbout').value.trim();
        // Procesar archivo de imagen si se ha cargado uno nuevo
        const fileInput = document.getElementById('providerPhotoFile');
        const file = fileInput && fileInput.files ? fileInput.files[0] : null;
        if (file) {
          const reader = new FileReader();
          reader.onload = function () {
            users[idx].photoData = reader.result;
            setUsers(users);
            currentUser = users[idx];
            loadProviderInfo();
            editForm.classList.add('hidden');
            alert('Perfil actualizado');
          };
          reader.readAsDataURL(file);
        } else {
          // No se cambió la imagen
          setUsers(users);
          currentUser = users[idx];
          loadProviderInfo();
          editForm.classList.add('hidden');
          alert('Perfil actualizado');
        }
      }
    };
  }
};