const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyznruZNbVCp9ZD3V5FmGjFIG5Czmz4D9RBnOjMZvEf-oXNcwPHw1VGx1wrA2dT2QjcMA/exec'; // <--- No olvides poner tu URL real aquí

let productosGlobal = [];
let clientesGlobal = [];
let carrito = [];
let indiceCotizacionActiva = null; 

window.onload = async () => {
    document.getElementById('productos-grid').innerHTML = "<p style='text-align:center; margin-top:50px;'>Cargando inventario...</p>";
    try {
        const respuesta = await fetch(SCRIPT_URL);
        const data = await respuesta.json();
        productosGlobal = data.productos;
        clientesGlobal = data.clientes.reverse(); // Muestra los clientes más recientes primero
        cargarCategorias();
        renderProductos(productosGlobal);
        renderClientes(clientesGlobal);
    } catch (error) {
        document.getElementById('productos-grid').innerHTML = "<p>Error de conexión.</p>";
    }
};

function switchTab(tab) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${tab}`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// Contraseña modificada a 199311
function toggleAdmin() {
    const pass = prompt("Ingrese clave de administrador:");
    if (pass === "199311") document.body.classList.toggle("show-admin");
    else if (pass !== null) alert("Clave incorrecta.");
}

function abrirCarrito() { document.getElementById('modal-carrito').style.display = 'flex'; }
function cerrarCarrito() { document.getElementById('modal-carrito').style.display = 'none'; }
function cerrarDetalle() { document.getElementById('modal-detalle').style.display = 'none'; }

// ---- FORMATO DE FECHA ----
function formatearFecha(fechaStr) {
    if(!fechaStr) return "Sin fecha";
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    let fecha = new Date(fechaStr);
    // Para evitar problemas de zona horaria, ajustamos
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString('es-HN', opciones);
}

function renderProductos(productos) {
    const grid = document.getElementById('productos-grid');
    grid.innerHTML = "";
    
    productos.forEach((prod, index) => {
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

        grid.innerHTML += `
            <div class="card">
                <div class="cat-tag">${prod.categoria || 'Genérico'}</div>
                <img src="${prod.foto || 'https://via.placeholder.com/150'}" onerror="this.src='https://via.placeholder.com/150'">
                <h3>${prod.nombre}</h3>
                <div class="oferta">Lps. ${precioBase.toFixed(2)}</div>
                ${tablaDescuentos}
                <button class="btn-add" onclick="agregarAlCarrito('${prod.codigo}')">
                    <i class="fa-solid fa-cart-plus"></i> Agregar
                </button>
                <div class="admin-panel">
                    <strong>Ganancia: Lps. ${prod.ganancia || 0}</strong>
                    Mejor Costo: Lps. ${prod.costoBajo || 0}<br>
                    ${proveedoresHTML}
                </div>
            </div>
        `;
    });
}

function cargarCategorias() {
    const categorias = [...new Set(productosGlobal.map(p => p.categoria).filter(Boolean))];
    const select = document.getElementById('cat-filter');
    categorias.forEach(cat => { select.innerHTML += `<option value="${cat}">${cat}</option>`; });
}

function filtrarProductos() {
    const texto = document.getElementById('search-prod').value.toLowerCase();
    const cat = document.getElementById('cat-filter').value;
    const filtrados = productosGlobal.filter(p => (p.nombre || "").toLowerCase().includes(texto) && (cat === "Todas" || p.categoria === cat));
    renderProductos(filtrados);
}

function agregarAlCarrito(codigoProd) {
    const prod = productosGlobal.find(p => p.codigo === codigoProd);
    const item = carrito.find(i => i.codigo === codigoProd);
    if (item) item.cantidad++;
    else carrito.push({ codigo: prod.codigo, nombre: prod.nombre, prodCompleto: prod, cantidad: 1 });
    actualizarCarrito();
    
    const fab = document.getElementById('btn-flotante-carrito');
    fab.style.transform = 'scale(1.15)';
    setTimeout(() => fab.style.transform = 'scale(1)', 200);
}

function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

function actualizarCarrito() {
    const contenedor = document.getElementById('carrito-items');
    contenedor.innerHTML = "";
    let subtotalAcumulado = 0, cantidadTotal = 0;
    
    if (carrito.length === 0) {
        contenedor.innerHTML = `<div style="text-align:center; color:#9ca3af; padding: 20px;"><i class="fa-solid fa-basket-shopping" style="font-size:40px; margin-bottom:10px;"></i><p>Carrito vacío</p></div>`;
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
                    <span>Cant: ${item.cantidad} | Subtotal: Lps. ${subtotalItem.toFixed(2)}</span>
                </div>
                <button class="btn-remove" onclick="quitarDelCarrito(${index})"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
    });
    
    let granTotal = subtotalAcumulado > 0 ? Math.ceil(subtotalAcumulado) + 1 : 0;
    document.getElementById('contador-carrito').innerText = cantidadTotal;
    document.getElementById('subtotal-display').innerText = subtotalAcumulado.toFixed(2);
    document.getElementById('gran-total').innerText = granTotal.toFixed(2);
}

async function guardarCotizacion(e) {
    e.preventDefault();
    if (carrito.length === 0) return alert("Agrega productos primero.");
    const btn = document.getElementById('btn-guardar');
    btn.innerHTML = "Guardando..."; btn.disabled = true;

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
        alert("¡Guardado!");
        location.reload(); // Recarga limpia
    } catch (error) {
        alert("Error de conexión.");
    }
}

// ---- TABLA CLIENTES ----
function renderClientes(clientes) {
    const tbody = document.getElementById('lista-clientes');
    tbody.innerHTML = "";
    clientes.forEach((c, index) => {
        let fecha = formatearFecha(c.fechaEntrega);
        // data-label sirve para el diseño de celular
        tbody.innerHTML += `
            <tr onclick="abrirDetalle(${index})">
                <td data-label="Tienda / Cliente"><strong>${c.tienda}</strong><br><span style="font-size:0.8rem; color:#6b7280;">${c.cliente}</span></td>
                <td data-label="Contacto"><a href="tel:${c.telefono}" style="color:var(--accent);">${c.telefono}</a><br><span style="font-size:0.8rem;">${c.lugar}</span></td>
                <td data-label="Entrega">${fecha}</td>
                <td data-label="Total" style="color:var(--success); font-weight:800;">Lps. ${c.total}</td>
                <td data-label="Acción"><button class="btn-secundario" style="padding: 8px; width:auto; border-radius:10px;"><i class="fa-solid fa-eye"></i></button></td>
            </tr>
        `;
    });
}

function filtrarClientes() {
    const texto = document.getElementById('search-client').value.toLowerCase();
    const filtrados = clientesGlobal.filter(c => (c.cliente || "").toLowerCase().includes(texto) || (c.tienda || "").toLowerCase().includes(texto));
    renderClientes(filtrados);
}

// ---- DETALLE DE CLIENTE / EDITAR / FACTURA ----
function abrirDetalle(index) {
    indiceCotizacionActiva = index;
    const c = clientesGlobal[index];
    const modal = document.getElementById('modal-detalle');
    
    document.getElementById('detalle-info').innerHTML = `
        <strong>Cliente:</strong> ${c.cliente} <br>
        <strong>Tienda:</strong> ${c.tienda} <br>
        <strong>Teléfono:</strong> ${c.telefono} <br>
        <strong>Dirección:</strong> ${c.lugar} <br>
        <strong>Entrega:</strong> ${formatearFecha(c.fechaEntrega)} <br>
        <strong style="font-size:1.2rem; color:var(--success); display:block; margin-top:10px;">Total Cotizado: Lps. ${c.total}</strong>
    `;

    let htmlItems = "";
    if (c.carrito) {
        try {
            const arrCarrito = JSON.parse(c.carrito);
            arrCarrito.forEach(item => {
                htmlItems += `<div style="border-bottom: 1px solid #e5e7eb; padding: 8px 0; display:flex; justify-content:space-between;">
                    <span><b>${item.cantidad}x</b> ${item.nombre}</span>
                </div>`;
            });
        } catch(e) { htmlItems = "Error leyendo productos."; }
    }
    
    document.getElementById('detalle-items').innerHTML = htmlItems || "<p>Sin detalles guardados.</p>";
    modal.style.display = 'flex';
}

function editarCotizacion() {
    const c = clientesGlobal[indiceCotizacionActiva];
    if (c.carrito) {
        carrito = JSON.parse(c.carrito);
        document.getElementById('c-nombre').value = c.cliente;
        document.getElementById('c-tienda').value = c.tienda;
        document.getElementById('c-tel').value = c.telefono;
        document.getElementById('c-lugar').value = c.lugar;
        // Solo para setear la fecha en el input
        let dateObj = new Date(c.fechaEntrega);
        document.getElementById('c-fecha-entrega').value = dateObj.toISOString().split('T')[0];
        
        cerrarDetalle();
        actualizarCarrito();
        abrirCarrito();
    }
}

function generarFactura() {
    const c = clientesGlobal[indiceCotizacionActiva];
    const nOrden = Math.floor(Math.random() * 90000) + 10000;
    
    let htmlItems = "";
    let arrCarrito = JSON.parse(c.carrito || "[]");
    arrCarrito.forEach(item => {
        htmlItems += `<tr><td style="padding:10px; border-bottom:1px solid #eee;">${item.cantidad}</td>
        <td style="padding:10px; border-bottom:1px solid #eee;">${item.nombre}</td></tr>`;
    });

    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <html><head><title>Factura - E&G</title>
        <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; max-width: 800px; margin: 0 auto;}
            .header { text-align: center; border-bottom: 2px solid #1e1b4b; padding-bottom: 20px; margin-bottom: 30px;}
            .header h1 { margin: 0; color: #1e1b4b; font-size: 28px;}
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;}
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px;}
            th { background: #f3f4f6; padding: 12px; text-align: left; color: #1f2937;}
            .total { text-align: right; font-size: 24px; font-weight: bold; color: #10b981;}
            .footer { text-align: center; font-size: 12px; color: #6b7280; margin-top: 50px;}
        </style>
        </head><body>
            <div class="header">
                <h1>DISTRIBUCIONES E&G</h1>
                <p>Comayagua, Honduras</p>
            </div>
            <div class="info-grid">
                <div>
                    <b>Cliente:</b> ${c.cliente}<br>
                    <b>Tienda:</b> ${c.tienda}<br>
                    <b>Teléfono:</b> ${c.telefono}
                </div>
                <div style="text-align: right;">
                    <b>Factura N°:</b> EG-${nOrden}<br>
                    <b>Fecha de Entrega:</b> ${formatearFecha(c.fechaEntrega)}<br>
                    <b>Lugar:</b> ${c.lugar}
                </div>
            </div>
            <table>
                <thead><tr><th>Cant.</th><th>Descripción del Producto</th></tr></thead>
                <tbody>${htmlItems}</tbody>
            </table>
            <div class="total">Total a Pagar: Lps. ${c.total}</div>
            <div class="footer">¡Gracias por su compra!<br>Este documento sirve como comprobante de cotización / orden de entrega.</div>
            <script>window.print();</script>
        </body></html>
    `);
    ventana.document.close();
}