const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyznruZNbVCp9ZD3V5FmGjFIG5Czmz4D9RBnOjMZvEf-oXNcwPHw1VGx1wrA2dT2QjcMA/exec'; // <--- No olvides poner tu URL real aquí

let productosGlobal = [];
let clientesGlobal = [];
let carrito = [];
let indiceCotizacionActiva = null; 

// ==== 1. FUNCIÓN INFALIBLE PARA LAS COMAS ====
function formatoMoneda(valor) {
    let num = parseFloat(valor);
    if (isNaN(num)) return "0.00";
    // Forzamos los 2 decimales y agregamos la coma a los miles matemáticamente
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

window.onload = async () => {
    document.getElementById('productos-grid').innerHTML = "<p style='text-align:center; width:100%; margin-top:30px; color:#64748b;'>Cargando inventario...</p>";
    try {
        const respuesta = await fetch(SCRIPT_URL);
        const data = await respuesta.json();
        productosGlobal = data.productos;
        clientesGlobal = data.clientes.reverse(); 
        cargarCategorias();
        renderProductos(productosGlobal);
        renderClientes(clientesGlobal);
    } catch (error) {
        document.getElementById('productos-grid').innerHTML = "<p style='text-align:center; width:100%; color:#ef4444;'>Error de conexión.</p>";
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
    if (pass === "199311") document.body.classList.toggle("show-admin");
    else if (pass !== null) alert("Clave incorrecta.");
}

function abrirCarrito() { document.getElementById('modal-carrito').style.display = 'flex'; }
function cerrarCarrito() { document.getElementById('modal-carrito').style.display = 'none'; }
function cerrarDetalle() { document.getElementById('modal-detalle').style.display = 'none'; }

function formatearFecha(fechaStr) {
    if(!fechaStr) return "Sin fecha";
    const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
    let fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString('es-HN', opciones);
}

function renderProductos(productos) {
    const grid = document.getElementById('productos-grid');
    grid.innerHTML = "";
    
    productos.forEach((prod, index) => {
        let precioBase = parseFloat(prod.precioUnitario) || 0;
        let tablaDescuentos = "";
        
        if (prod.precio5 || prod.precio6 || prod.precio12) {
            tablaDescuentos = `<div class="tabla-descuentos">
                ${prod.precio5 ? `<div class="tag-desc">5+ Unids: <b>Lps. ${formatoMoneda(prod.precio5)}</b></div>` : ''}
                ${prod.precio6 ? `<div class="tag-desc">Media Doc: <b>Lps. ${formatoMoneda(prod.precio6)}</b></div>` : ''}
                ${prod.precio12 ? `<div class="tag-desc">Docena: <b>Lps. ${formatoMoneda(prod.precio12)}</b></div>` : ''}
            </div>`;
        }

        // ==== CÁLCULO DE COSTO Y GANANCIA AUTOMÁTICO ====
        let proveedoresHTML = "";
        let preciosProveedores = [];
        
        for (let i = 1; i <= 6; i++) {
            let lugar = prod['l'+i];
            let precio = parseFloat(prod['p'+i]);
            if (lugar && lugar.toString().trim() !== "") {
                proveedoresHTML += `
                <div class="prov-row">
                    <span class="prov-name">${lugar}</span> 
                    <span class="prov-price">Lps. ${formatoMoneda(precio)}</span>
                </div>`;
            }
            if (!isNaN(precio) && precio > 0) preciosProveedores.push(precio);
        }

        // Si hay precios de proveedor, saca el más bajo. Si no, usa el que escribiste en Excel (o 0)
        let costoBajo = preciosProveedores.length > 0 ? Math.min(...preciosProveedores) : (parseFloat(prod.costoBajo) || 0);
        
        // Calcula Ganancia: Precio al Público - Costo Más Bajo
        let gananciaAutomatica = (precioBase > 0 && costoBajo > 0) ? (precioBase - costoBajo) : 0;

        // ==== ASIGNACIÓN DE IMAGEN AUTOMÁTICA POR CATEGORÍA ====
        let imagenFinal = prod.foto;
        if (!imagenFinal || imagenFinal.trim() === "" || imagenFinal.includes('dummyimage')) {
            let cat = (prod.categoria || "").toUpperCase();
            if (cat.includes("LACTEO") || cat.includes("LÁCTEO")) {
                imagenFinal = "https://cdn-icons-png.flaticon.com/512/3745/3745330.png"; // Queso
            } else if (cat.includes("EMBUTIDO")) {
                imagenFinal = "https://cdn-icons-png.flaticon.com/512/3143/3143644.png"; // Salchicha
            } else if (cat.includes("LIMPIEZA") || cat.includes("JABON") || cat.includes("JABÓN")) {
                imagenFinal = "https://cdn-icons-png.flaticon.com/512/2921/2921822.png"; // Detergente
            } else if (cat.includes("PAPEL") || cat.includes("HIGIENE")) {
                imagenFinal = "https://cdn-icons-png.flaticon.com/512/2594/2594197.png"; // Papel Higienico
            } else if (cat.includes("SNACK") || cat.includes("CHURRO")) {
                imagenFinal = "https://cdn-icons-png.flaticon.com/512/2515/2515234.png"; // Bolsa Chips
            } else if (cat.includes("BEBIDA") || cat.includes("REFRESCO")) {
                imagenFinal = "https://cdn-icons-png.flaticon.com/512/2935/2935293.png"; // Soda
            } else if (cat.includes("ABARROTE") || cat.includes("GRANO")) {
                imagenFinal = "https://cdn-icons-png.flaticon.com/512/861/861055.png"; // Saco Grano
            } else {
                imagenFinal = "https://cdn-icons-png.flaticon.com/512/1174/1174366.png"; // Caja generica
            }
        }

        grid.innerHTML += `
            <div class="card">
                <div class="cat-tag">${prod.categoria || 'Genérico'}</div>
                <div class="img-container">
                    <img src="${imagenFinal}" onerror="this.src='https://cdn-icons-png.flaticon.com/512/1174/1174366.png'">
                </div>
                <span class="marca-text">${prod.marca || 'S/M'}</span>
                <h3>${prod.nombre}</h3>
                <div class="oferta">Lps. ${formatoMoneda(precioBase)}</div>
                ${tablaDescuentos}
                <button class="btn-add" onclick="agregarAlCarrito('${prod.codigo}')">
                    <i class="fa-solid fa-cart-plus"></i> Agregar
                </button>
                
                <div class="admin-panel">
                    <div class="admin-header"><i class="fa-solid fa-user-lock"></i> Info Interna</div>
                    <div class="admin-stats">
                        <div class="stat-box profit">
                            <span>Ganancia</span>
                            <b>Lps. ${formatoMoneda(gananciaAutomatica)}</b>
                        </div>
                        <div class="stat-box cost">
                            <span>Mejor Costo</span>
                            <b>Lps. ${formatoMoneda(costoBajo)}</b>
                        </div>
                    </div>
                    ${proveedoresHTML ? `<div class="admin-providers">${proveedoresHTML}</div>` : ''}
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

// ==== 2. FILTRO DE CLIENTES REPARADO Y EXACTO ====
function filtrarClientes() {
    const texto = document.getElementById('search-client').value.toLowerCase();
    const mesSeleccionado = document.getElementById('mes-filter').value; // Retorna "YYYY-MM"
    
    const filtrados = clientesGlobal.filter(c => {
        const coincideTexto = (c.cliente || "").toLowerCase().includes(texto) || (c.tienda || "").toLowerCase().includes(texto);
        
        let coincideMes = true;
        if (mesSeleccionado) {
            if (c.fechaEntrega) {
                let fechaObj = new Date(c.fechaEntrega);
                fechaObj.setMinutes(fechaObj.getMinutes() + fechaObj.getTimezoneOffset());
                
                let yyyy = fechaObj.getFullYear();
                let mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
                let fechaRegistro = `${yyyy}-${mm}`;
                
                coincideMes = (fechaRegistro === mesSeleccionado);
            } else {
                coincideMes = false; // Si seleccionaste un mes, pero este cliente no tiene fecha, lo ocultamos.
            }
        }
        
        return coincideTexto && coincideMes;
    });
    
    renderClientes(filtrados);
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

function sumarCantidad(index) {
    carrito[index].cantidad++;
    actualizarCarrito();
}

function restarCantidad(index) {
    if (carrito[index].cantidad > 1) {
        carrito[index].cantidad--;
        actualizarCarrito();
    } else {
        quitarDelCarrito(index);
    }
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
        contenedor.innerHTML = `<div style="text-align:center; color:#cbd5e1; padding: 30px 0;"><i class="fa-solid fa-cart-arrow-down" style="font-size:45px; margin-bottom:10px;"></i><p>Carrito vacío</p></div>`;
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
                <div class="item-info-header">
                    <div>
                        <h4>${item.nombre}</h4>
                        <p>Lps. ${formatoMoneda(precioAplicado)} c/u</p>
                    </div>
                    <div style="text-align:right; font-weight:bold; color:var(--text-dark);">
                        Lps. ${formatoMoneda(subtotalItem)}
                    </div>
                </div>
                <div class="item-controles">
                    <div class="qty-box">
                        <button type="button" class="btn-qty" onclick="restarCantidad(${index})"><i class="fa-solid fa-minus"></i></button>
                        <span style="font-weight:700; width:20px; text-align:center;">${item.cantidad}</span>
                        <button type="button" class="btn-qty" onclick="sumarCantidad(${index})"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <button type="button" class="btn-remove" onclick="quitarDelCarrito(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });
    
    let granTotal = subtotalAcumulado > 0 ? Math.ceil(subtotalAcumulado) + 1 : 0;
    
    document.getElementById('contador-carrito').innerText = cantidadTotal;
    document.getElementById('subtotal-display').innerText = formatoMoneda(subtotalAcumulado);
    document.getElementById('gran-total').innerText = formatoMoneda(granTotal);
}

async function guardarCotizacion(e) {
    e.preventDefault();
    if (carrito.length === 0) return alert("Agrega productos primero.");
    const btn = document.getElementById('btn-guardar');
    btn.innerHTML = "Guardando..."; btn.disabled = true;

    // Quitamos las comas para guardarlo limpio en Excel
    const totalCrudo = document.getElementById('gran-total').innerText.replace(/,/g, '');

    const cotizacion = {
        cliente: document.getElementById('c-nombre').value,
        tienda: document.getElementById('c-tienda').value,
        telefono: document.getElementById('c-tel').value,
        lugar: document.getElementById('c-lugar').value,
        fechaEntrega: document.getElementById('c-fecha-entrega').value,
        total: totalCrudo,
        carrito: carrito
    };

    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(cotizacion) });
        alert("¡Guardado exitosamente!");
        location.reload(); 
    } catch (error) {
        alert("Error de conexión al guardar.");
    }
}

function renderClientes(clientes) {
    const tbody = document.getElementById('lista-clientes');
    tbody.innerHTML = "";
    
    clientes.forEach((c, index) => {
        let fecha = formatearFecha(c.fechaEntrega);
        // Aquí insertamos el total formateado con comas
        tbody.innerHTML += `
            <tr onclick="abrirDetalle(${index})" style="cursor:pointer; border-bottom: 1px solid #f1f5f9; transition:0.2s;">
                <td data-label="Tienda / Cliente" style="padding:15px;"><strong>${c.tienda}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${c.cliente}</span></td>
                <td data-label="Contacto" style="padding:15px;"><span style="color:var(--accent); font-weight:600;">${c.telefono}</span><br><span style="font-size:0.8rem;">${c.lugar}</span></td>
                <td data-label="Entrega" style="padding:15px; font-size:0.9rem;">${fecha}</td>
                <td data-label="Total" style="color:var(--success); font-weight:800; padding:15px;">Lps. ${formatoMoneda(c.total)}</td>
                <td data-label="Acción" style="padding:15px;"><button class="btn-secundario" style="padding: 10px; width:40px; height:40px; border-radius:10px;"><i class="fa-solid fa-eye"></i></button></td>
            </tr>
        `;
    });
}

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
        <strong style="font-size:1.2rem; color:var(--success); display:block; margin-top:10px;">Total Orden: Lps. ${formatoMoneda(c.total)}</strong>
    `;

    let htmlItems = "";
    if (c.carrito) {
        try {
            const arrCarrito = JSON.parse(c.carrito);
            arrCarrito.forEach(item => {
                htmlItems += `<div style="border-bottom: 1px solid #f1f5f9; padding: 10px 0; display:flex; justify-content:space-between; font-size:0.9rem;">
                    <span><b>${item.cantidad}x</b> ${item.nombre}</span>
                </div>`;
            });
        } catch(e) { htmlItems = "Error leyendo productos."; }
    }
    
    document.getElementById('detalle-items').innerHTML = htmlItems || "<p style='color:#64748b;'>Sin detalles guardados.</p>";
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
        
        if (c.fechaEntrega) {
            let dateObj = new Date(c.fechaEntrega);
            document.getElementById('c-fecha-entrega').value = dateObj.toISOString().split('T')[0];
        }
        
        cerrarDetalle();
        actualizarCarrito();
        abrirCarrito();
    }
}

function generarFactura() {
    const c = clientesGlobal[indiceCotizacionActiva];
    const nOrden = Math.floor(Math.random() * 90000) + 10000;
    let htmlItems = "";
    
    JSON.parse(c.carrito || "[]").forEach(item => {
        let precioAplicado = item.prodCompleto && item.prodCompleto.precioUnitario ? item.prodCompleto.precioUnitario : 0;
        if (item.prodCompleto) {
            if (item.cantidad >= 12 && item.prodCompleto.precio12 > 0) precioAplicado = item.prodCompleto.precio12;
            else if (item.cantidad >= 6 && item.prodCompleto.precio6 > 0) precioAplicado = item.prodCompleto.precio6;
            else if (item.cantidad >= 5 && item.prodCompleto.precio5 > 0) precioAplicado = item.prodCompleto.precio5;
        }
        
        const subtotalItem = precioAplicado * item.cantidad;

        htmlItems += `<tr>
            <td style="padding:12px; border-bottom:1px solid #e5e7eb; text-align:center;">${item.cantidad}</td>
            <td style="padding:12px; border-bottom:1px solid #e5e7eb;">${item.nombre}</td>
            <td style="padding:12px; border-bottom:1px solid #e5e7eb; text-align:right; white-space:nowrap;">Lps. ${formatoMoneda(precioAplicado)}</td>
            <td style="padding:12px; border-bottom:1px solid #e5e7eb; text-align:right; font-weight:bold; white-space:nowrap;">Lps. ${formatoMoneda(subtotalItem)}</td>
        </tr>`;
    });

    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <html><head><title>Factura - E&G</title>
        <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1f2937; max-width: 800px; margin: 0 auto;}
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px;}
            .header h1 { margin: 0; color: #0f172a; font-size: 26px;}
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size:14px; line-height:1.6;}
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size:14px; page-break-inside: auto;}
            tr { page-break-inside: avoid; page-break-after: auto; }
            thead { display: table-header-group; }
            th { background: #f8fafc; padding: 12px; text-align: left; color: #475569; border-bottom:2px solid #e2e8f0;}
            /* Agregamos white-space:nowrap a las columnas de dinero para que no se partan */
            th.dinero { text-align: right; white-space: nowrap; }
            .total { text-align: right; font-size: 22px; font-weight: bold; color: #10b981; padding-top:20px; border-top:2px solid #e2e8f0; page-break-inside: avoid;}
            .footer { text-align: center; font-size: 12px; color: #64748b; margin-top: 50px; page-break-inside: avoid;}
            @media print { body { -webkit-print-color-adjust: exact; padding: 0;} }
        </style>
        </head><body>
            <div class="header"><h1>DISTRIBUCIONES E&G</h1><p>Comayagua, Honduras</p></div>
            <div class="info-grid">
                <div><b>Cliente:</b> ${c.cliente}<br><b>Tienda:</b> ${c.tienda}<br><b>Teléfono:</b> ${c.telefono}</div>
                <div style="text-align: right;"><b>N° Orden:</b> EG-${nOrden}<br><b>Fecha:</b> ${formatearFecha(c.fechaEntrega)}<br><b>Lugar:</b> ${c.lugar}</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 10%; text-align:center;">Cant.</th>
                        <th>Descripción del Producto</th>
                        <th class="dinero" style="width: 25%;">Precio Unit.</th>
                        <th class="dinero" style="width: 25%;">Total</th>
                    </tr>
                </thead>
                <tbody>${htmlItems}</tbody>
            </table>
            <div class="total">Total a Cobrar: Lps. ${formatoMoneda(c.total)}</div>
            <div class="footer">¡Gracias por su preferencia!<br>Documento generado para control y validación de entrega.<br><br><b>Generado por: Renee Coello</b></div>
            <script>window.print();</script>
        </body></html>
    `);
    ventana.document.close();
}

function enviarWhatsApp() {
    const c = clientesGlobal[indiceCotizacionActiva];
    if (!c) return;

    // 1. Convertimos el teléfono a texto explícitamente para evitar el error de Google Sheets
    let telefono = String(c.telefono).replace(/\D/g, '');
    
    // 2. Validamos el código de Honduras (+504)
    if (telefono.length === 8) telefono = '504' + telefono;
    else if (!telefono.startsWith('504')) telefono = '504' + telefono;

    // 3. Construimos el mensaje
    let mensaje = `*¡Hola ${c.cliente}!* 👋\n`;
    mensaje += `Aquí tienes el resumen de tu pedido de *DISTRIBUCIONES E&G*:\n\n`;
    mensaje += `🏢 *Tienda:* ${c.tienda}\n`;
    mensaje += `📅 *Fecha de Entrega:* ${formatearFecha(c.fechaEntrega)}\n`;
    mensaje += `📍 *Lugar:* ${c.lugar}\n\n`;
    mensaje += `*🛒 Detalle del pedido:*\n`;

    if (c.carrito) {
        try {
            const arrCarrito = JSON.parse(c.carrito);
            arrCarrito.forEach(item => { 
                mensaje += `▪️ ${item.cantidad}x ${item.nombre}\n`; 
            });
        } catch(e) {}
    }

    mensaje += `\n💰 *Total a Pagar:* Lps. ${formatoMoneda(c.total)}\n\n`;
    mensaje += `¡Gracias por tu preferencia!`;

    // 4. Usamos la API universal de WhatsApp que no falla en celulares
    const url = `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}