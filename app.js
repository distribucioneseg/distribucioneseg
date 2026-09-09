// ====== ¡PEGA AQUÍ TU URL DE GOOGLE APPS SCRIPT! ======
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxVa60-ymPDa1iZQVywo93xHya1Ntxg5T1EoV21RQUy-LkfB7hak-1K9TCquzHFd__b/exec';

let productosGlobal = [];
let clientesGlobal = [];
let carrito = [];

window.onload = async () => {
    document.getElementById('productos-grid').innerHTML = "<div class='empty-state'><p>Cargando catálogo...</p></div>";
    try {
        const respuesta = await fetch(SCRIPT_URL);
        const data = await respuesta.json();
        productosGlobal = data.productos;
        clientesGlobal = data.clientes;
        cargarCategorias();
        renderProductos(productosGlobal);
        renderClientes(clientesGlobal);
    } catch (error) {
        document.getElementById('productos-grid').innerHTML = "<div class='empty-state'><p>Error de conexión.</p></div>";
    }
};

function switchTab(tab) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${tab}`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

function toggleAdmin() {
    const pass = prompt("Ingrese clave de administrador:");
    if (pass === "1234") {
        document.body.classList.toggle("show-admin");
    } else if (pass !== null) {
        alert("Clave incorrecta.");
    }
}

// Funciones del Modal
function abrirCarrito() { document.getElementById('modal-carrito').style.display = 'flex'; }
function cerrarCarrito() { document.getElementById('modal-carrito').style.display = 'none'; }

function renderProductos(productos) {
    const grid = document.getElementById('productos-grid');
    grid.innerHTML = "";
    
    productos.forEach((prod, index) => {
        // Aseguramos que el precio sea válido para evitar errores
        let precioBase = prod.precioUnitario || 0;
        
        let tablaDescuentos = "";
        if (prod.precio5 || prod.precio6 || prod.precio12) {
            tablaDescuentos = `<div class="tabla-descuentos">
                ${prod.precio5 ? `<div class="tag-desc">5+ Unids: <b>Lps. ${prod.precio5}</b></div>` : ''}
                ${prod.precio6 ? `<div class="tag-desc">Media Doc: <b>Lps. ${prod.precio6}</b></div>` : ''}
                ${prod.precio12 ? `<div class="tag-desc">Docena: <b>Lps. ${prod.precio12}</b></div>` : ''}
            </div>`;
        }

        let proveedoresHTML = "";
        if(prod.l1) proveedoresHTML += `• ${prod.l1}: Lps. ${prod.p1}<br>`;
        if(prod.l2) proveedoresHTML += `• ${prod.l2}: Lps. ${prod.p2}<br>`;
        if(prod.l3) proveedoresHTML += `• ${prod.l3}: Lps. ${prod.p3}<br>`;

        grid.innerHTML += `
            <div class="card">
                <div class="cat-tag">${prod.categoria || 'Sin cat.'}</div>
                <img src="${prod.foto || 'https://via.placeholder.com/150?text=Sin+Imagen'}" loading="lazy" onerror="this.src='https://via.placeholder.com/150?text=Sin+Imagen'">
                <h3>${prod.nombre || 'Producto'}</h3>
                <div class="oferta">Lps. ${precioBase.toFixed(2)}</div>
                ${tablaDescuentos}
                
                <button class="btn-add" onclick="agregarAlCarrito(${index})">
                    <span class="material-icons" style="font-size: 18px;">add_shopping_cart</span> Agregar
                </button>
                
                <div class="admin-panel">
                    <strong>📊 Panel Privado</strong>
                    Ganancia Unitaria: Lps. ${prod.ganancia || 0}<br>
                    Mejor Costo: Lps. ${prod.costoBajo || 0}<br>
                    <i>Precios proveedores:</i><br>
                    ${proveedoresHTML}
                </div>
            </div>
        `;
    });
}

function cargarCategorias() {
    const categorias = [...new Set(productosGlobal.map(p => p.categoria).filter(Boolean))];
    const select = document.getElementById('cat-filter');
    categorias.forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function filtrarProductos() {
    const texto = document.getElementById('search-prod').value.toLowerCase();
    const cat = document.getElementById('cat-filter').value;
    const filtrados = productosGlobal.filter(p => (p.nombre || "").toLowerCase().includes(texto) && (cat === "Todas" || p.categoria === cat));
    renderProductos(filtrados);
}

function agregarAlCarrito(index) {
    const prod = productosGlobal[index];
    const item = carrito.find(i => i.nombre === prod.nombre);
    if (item) {
        item.cantidad++;
    } else {
        carrito.push({ nombre: prod.nombre, prodCompleto: prod, cantidad: 1 });
    }
    actualizarCarrito();
    
    // Pequeño efecto visual en el botón flotante
    const fab = document.getElementById('btn-flotante-carrito');
    fab.style.transform = 'scale(1.2)';
    setTimeout(() => fab.style.transform = 'scale(1)', 200);
}

function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

function actualizarCarrito() {
    const contenedor = document.getElementById('carrito-items');
    contenedor.innerHTML = "";
    let subtotalAcumulado = 0;
    let cantidadTotal = 0;
    
    if (carrito.length === 0) {
        contenedor.innerHTML = `<div class="empty-state"><span class="material-icons" style="font-size: 48px; color: #ccc;">remove_shopping_cart</span><p>No has agregado productos</p></div>`;
    }
    
    carrito.forEach((item, index) => {
        let precioAplicado = item.prodCompleto.precioUnitario || 0;
        
        if (item.cantidad >= 12 && item.prodCompleto.precio12 > 0) precioAplicado = item.prodCompleto.precio12;
        else if (item.cantidad >= 6 && item.prodCompleto.precio6 > 0) precioAplicado = item.prodCompleto.precio6;
        else if (item.cantidad >= 5 && item.prodCompleto.precio5 > 0) precioAplicado = item.prodCompleto.precio5;

        const subtotalItem = precioAplicado * item.cantidad;
        subtotalAcumulado += subtotalItem;
        cantidadTotal += item.cantidad;
        
        contenedor.innerHTML += `
            <div class="item-carrito">
                <div class="item-info">
                    <h4>${item.nombre}</h4>
                    <p>Lps. ${precioAplicado.toFixed(2)} c/u</p>
                    <span>Cantidad: ${item.cantidad} | Subtotal: Lps. ${subtotalItem.toFixed(2)}</span>
                </div>
                <button class="btn-remove" onclick="quitarDelCarrito(${index})">
                    <span class="material-icons" style="font-size: 18px;">delete</span>
                </button>
            </div>
        `;
    });
    
    let granTotal = 0;
    if (subtotalAcumulado > 0) {
        granTotal = Math.ceil(subtotalAcumulado) + 1;
    }
    
    document.getElementById('contador-carrito').innerText = cantidadTotal;
    document.getElementById('subtotal-display').innerText = subtotalAcumulado.toFixed(2);
    document.getElementById('gran-total').innerText = granTotal.toFixed(2);
}

async function guardarCotizacion(e) {
    e.preventDefault();
    if (carrito.length === 0) return alert("El carrito está vacío. Agrega productos primero.");
    const btn = document.getElementById('btn-guardar');
    btn.innerHTML = "<span class='material-icons'>hourglass_empty</span> Guardando..."; 
    btn.disabled = true;

    const cotizacion = {
        cliente: document.getElementById('c-nombre').value,
        tienda: document.getElementById('c-tienda').value,
        telefono: document.getElementById('c-tel').value,
        lugar: document.getElementById('c-lugar').value,
        fechaEntrega: document.getElementById('c-fecha-entrega').value,
        total: document.getElementById('gran-total').innerText,
        carrito: carrito
    };

    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(cotizacion) });
        alert("¡Cotización guardada exitosamente!");
        carrito = [];
        actualizarCarrito();
        document.getElementById('form-cotizacion').reset();
        cerrarCarrito(); // Cerramos la ventana modal tras guardar
    } catch (error) {
        alert("Error de conexión al guardar. Verifica tu internet.");
    } finally {
        btn.innerHTML = "<span class='material-icons'>save</span> Guardar Cotización"; 
        btn.disabled = false;
    }
}

function renderClientes(clientes) {
    const tbody = document.getElementById('lista-clientes');
    tbody.innerHTML = "";
    clientes.forEach(c => {
        tbody.innerHTML += `
            <tr>
                <td><strong>${c.tienda}</strong></td>
                <td>${c.cliente}</td>
                <td><a href="tel:${c.telefono}" style="color:var(--accent-color); text-decoration:none;">${c.telefono}</a></td>
                <td>${c.lugar}</td>
                <td style="color:var(--success-color); font-weight:bold;">Lps. ${c.total}</td>
            </tr>
        `;
    });
}

function filtrarClientes() {
    const texto = document.getElementById('search-client').value.toLowerCase();
    const filtrados = clientesGlobal.filter(c => 
        (c.cliente || "").toLowerCase().includes(texto) || (c.tienda || "").toLowerCase().includes(texto) || (c.lugar || "").toLowerCase().includes(texto)
    );
    renderClientes(filtrados);
}