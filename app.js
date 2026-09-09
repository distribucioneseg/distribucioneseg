const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzBujsnS0HoJvTnQpf7eUst-eSNFhd4L3fQEbamYIqfaWc_FjT3kJE53dWHMxkr-B84vw/exec'; // <--- No olvides poner tu URL real aquí

let productosGlobal = [];
let clientesGlobal = [];
let carrito = [];
let indiceCotizacionActiva = null; 

// Variables para la cámara
let imgBase64Data = "";
let imgMimeType = "";
let imgName = "";

function formatoMoneda(valor) {
    let num = parseFloat(valor);
    if (isNaN(num)) return "0.00";
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
    if (pass === "199311") {
        document.body.classList.toggle("show-admin");
        // Muestra el botón secreto de Nuevo Producto
        document.getElementById('btn-add-producto-nuevo').style.display = document.body.classList.contains("show-admin") ? "block" : "none";
    } else if (pass !== null) alert("Clave incorrecta.");
}

// ==== APERTURA DE MODALES ====
function abrirCarrito() { document.getElementById('modal-carrito').style.display = 'flex'; }
function cerrarCarrito() { document.getElementById('modal-carrito').style.display = 'none'; }
function cerrarDetalle() { document.getElementById('modal-detalle').style.display = 'none'; }
function abrirModalProducto() { document.getElementById('modal-producto').style.display = 'flex'; }
function cerrarModalProducto() { 
    document.getElementById('modal-producto').style.display = 'none'; 
    document.getElementById('form-producto').reset();
    document.getElementById('foto-estado').style.display = 'none';
    imgBase64Data = "";
}

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

        let proveedoresHTML = "";
        let preciosProveedores = [];
        for (let i = 1; i <= 6; i++) {
            let lugar = prod['l'+i];
            let precio = parseFloat(prod['p'+i]);
            if (lugar && lugar.toString().trim() !== "") {
                proveedoresHTML += `<div class="prov-row"><span class="prov-name">${lugar}</span><span class="prov-price">Lps. ${formatoMoneda(precio)}</span></div>`;
            }
            if (!isNaN(precio) && precio > 0) preciosProveedores.push(precio);
        }

        let costoBajo = preciosProveedores.length > 0 ? Math.min(...preciosProveedores) : (parseFloat(prod.costoBajo) || 0);
        let gananciaAutomatica = (precioBase > 0 && costoBajo > 0) ? (precioBase - costoBajo) : 0;

        let imagenFinal = prod.foto;
        if (!imagenFinal || imagenFinal.trim() === "" || imagenFinal.includes('dummyimage')) {
            let cat = (prod.categoria || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            if (cat.includes("LACTEO") || cat.includes("QUESO") || cat.includes("MANTEQUILLA")) imagenFinal = "https://img.icons8.com/color/150/cheese.png"; 
            else if (cat.includes("EMBUTIDO") || cat.includes("CHORIZO") || cat.includes("SALCHICHA")) imagenFinal = "https://img.icons8.com/color/150/salami.png"; 
            else if (cat.includes("CARNE") || cat.includes("POLLO") || cat.includes("CERDO")) imagenFinal = "https://img.icons8.com/color/150/beef.png"; 
            else if (cat.includes("PAN") || cat.includes("REPOSTERIA") || cat.includes("GALLETA")) imagenFinal = "https://img.icons8.com/color/150/bread.png"; 
            else if (cat.includes("SNACK") || cat.includes("CHURRO") || cat.includes("BOCADILLO")) imagenFinal = "https://img.icons8.com/color/150/potato-chips.png"; 
            else if (cat.includes("DULCE") || cat.includes("CONFITE") || cat.includes("CHOCOLATE")) imagenFinal = "https://img.icons8.com/color/150/candy.png"; 
            else if (cat.includes("FRUTA") || cat.includes("VERDURA") || cat.includes("VEGETAL")) imagenFinal = "https://img.icons8.com/color/150/group-of-fruits.png"; 
            else if (cat.includes("BEBIDA") || cat.includes("REFRESCO") || cat.includes("JUGO")) imagenFinal = "https://img.icons8.com/color/150/soda-can.png"; 
            else if (cat.includes("CERVEZA") || cat.includes("LICOR") || cat.includes("ALCOHOL")) imagenFinal = "https://img.icons8.com/color/150/beer.png"; 
            else if (cat.includes("CAFE") || cat.includes("TE")) imagenFinal = "https://img.icons8.com/color/150/coffee-beans.png"; 
            else if (cat.includes("ENLATADO") || cat.includes("CONSERVA")) imagenFinal = "https://img.icons8.com/color/150/canned-food.png"; 
            else if (cat.includes("SALSA") || cat.includes("CONDIMENTO") || cat.includes("ESPECIA")) imagenFinal = "https://img.icons8.com/color/150/ketchup.png"; 
            else if (cat.includes("LIMPIEZA") || cat.includes("DETERGENTE")) imagenFinal = "https://img.icons8.com/color/150/cleaning-products.png"; 
            else if (cat.includes("HIGIENE") || cat.includes("JABON") || cat.includes("SHAMPOO")) imagenFinal = "https://img.icons8.com/color/150/soap.png"; 
            else if (cat.includes("PAPEL") || cat.includes("SERVILLETA")) imagenFinal = "https://img.icons8.com/color/150/toilet-paper.png"; 
            else if (cat.includes("DESECHABLE") || cat.includes("PLASTICO")) imagenFinal = "https://img.icons8.com/color/150/paper-cup.png"; 
            else if (cat.includes("MEDICINA") || cat.includes("FARMACIA") || cat.includes("PASTILLA")) imagenFinal = "https://img.icons8.com/color/150/pill.png"; 
            else if (cat.includes("MASCOTA") || cat.includes("PERRO") || cat.includes("GATO")) imagenFinal = "https://img.icons8.com/color/150/dog-bowl.png"; 
            else if (cat.includes("ABARROTE") || cat.includes("GRANO") || cat.includes("CEREAL")) imagenFinal = "https://img.icons8.com/color/150/ingredients.png"; 
            else if (cat.includes("GAMER") || cat.includes("JUEGO") || cat.includes("DEDAL") || cat.includes("GATILLO")) imagenFinal = "https://img.icons8.com/color/150/controller.png"; 
            else if (cat.includes("AUDIO") || cat.includes("AUDIFONO") || cat.includes("BOCINA")) imagenFinal = "https://img.icons8.com/color/150/headphones.png"; 
            else if (cat.includes("CELULAR") || cat.includes("SMARTPHONE") || cat.includes("TELEFONO")) imagenFinal = "https://img.icons8.com/color/150/iphone.png"; 
            else if (cat.includes("COMPUTADORA") || cat.includes("LAPTOP") || cat.includes("PC")) imagenFinal = "https://img.icons8.com/color/150/laptop.png"; 
            else if (cat.includes("ALMACENAMIENTO") || cat.includes("USB") || cat.includes("MEMORIA") || cat.includes("MICROSD")) imagenFinal = "https://img.icons8.com/color/150/usb-memory-stick.png"; 
            else if (cat.includes("CABLE") || cat.includes("CARGADOR") || cat.includes("ACCESORIO")) imagenFinal = "https://img.icons8.com/color/150/usb-plug.png"; 
            else imagenFinal = "https://img.icons8.com/color/150/box--v1.png"; 
        }

        grid.innerHTML += `
            <div class="card">
                <div class="cat-tag">${prod.categoria || 'Genérico'}</div>
                <div class="img-container">
                    <img src="${imagenFinal}" onerror="this.src='https://img.icons8.com/color/150/box--v1.png'">
                </div>
                <span class="marca-text">${prod.marca || 'S/M'}</span>
                <h3>${prod.nombre}</h3>
                <div class="oferta">Lps. ${formatoMoneda(precioBase)}</div>
                ${tablaDescuentos}
                <button class="btn-add" onclick="agregarAlCarrito('${prod.codigo}')"><i class="fa-solid fa-cart-plus"></i> Agregar</button>
                
                <div class="admin-panel">
                    <div class="admin-header"><i class="fa-solid fa-user-lock"></i> Info Interna</div>
                    <div class="admin-stats">
                        <div class="stat-box profit"><span>Ganancia</span><b>Lps. ${formatoMoneda(gananciaAutomatica)}</b></div>
                        <div class="stat-box cost"><span>Mejor Costo</span><b>Lps. ${formatoMoneda(costoBajo)}</b></div>
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

function filtrarClientes() {
    const texto = document.getElementById('search-client').value.toLowerCase();
    const mesSeleccionado = document.getElementById('mes-filter').value; 
    
    const filtrados = clientesGlobal.filter(c => {
        const coincideTexto = (c.cliente || "").toLowerCase().includes(texto) || (c.tienda || "").toLowerCase().includes(texto);
        let coincideMes = true;
        if (mesSeleccionado) {
            if (c.fechaEntrega) {
                let fechaObj = new Date(c.fechaEntrega);
                fechaObj.setMinutes(fechaObj.getMinutes() + fechaObj.getTimezoneOffset());
                let yyyy = fechaObj.getFullYear();
                let mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
                coincideMes = (`${yyyy}-${mm}` === mesSeleccionado);
            } else { coincideMes = false; }
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

function sumarCantidad(index) { carrito[index].cantidad++; actualizarCarrito(); }
function restarCantidad(index) { if (carrito[index].cantidad > 1) { carrito[index].cantidad--; actualizarCarrito(); } else { quitarDelCarrito(index); } }
function quitarDelCarrito(index) { carrito.splice(index, 1); actualizarCarrito(); }

function actualizarCarrito() {
    const contenedor = document.getElementById('carrito-items');
    contenedor.innerHTML = "";
    let subtotalAcumulado = 0, cantidadTotal = 0;
    
    if (carrito.length === 0) contenedor.innerHTML = `<div style="text-align:center; color:#cbd5e1; padding: 30px 0;"><i class="fa-solid fa-cart-arrow-down" style="font-size:45px; margin-bottom:10px;"></i><p>Carrito vacío</p></div>`;
    
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
                <div class="item-info-header"><div><h4>${item.nombre}</h4><p>Lps. ${formatoMoneda(precioAplicado)} c/u</p></div><div style="text-align:right; font-weight:bold; color:var(--text-dark);">Lps. ${formatoMoneda(subtotalItem)}</div></div>
                <div class="item-controles">
                    <div class="qty-box"><button type="button" class="btn-qty" onclick="restarCantidad(${index})"><i class="fa-solid fa-minus"></i></button><span style="font-weight:700; width:20px; text-align:center;">${item.cantidad}</span><button type="button" class="btn-qty" onclick="sumarCantidad(${index})"><i class="fa-solid fa-plus"></i></button></div>
                    <button type="button" class="btn-remove" onclick="quitarDelCarrito(${index})"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>`;
    });
    
    let granTotal = subtotalAcumulado > 0 ? Math.ceil(subtotalAcumulado) + 1 : 0;
    document.getElementById('contador-carrito').innerText = cantidadTotal;
    document.getElementById('subtotal-display').innerText = formatoMoneda(subtotalAcumulado);
    document.getElementById('gran-total').innerText = formatoMoneda(granTotal);
}

// ==== LÓGICA DE AGREGAR PRODUCTO DESDE CÁMARA ====
function procesarImagen(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    imgName = file.name;
    imgMimeType = file.type;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        imgBase64Data = e.target.result.split(',')[1];
        document.getElementById('foto-estado').style.display = 'block'; // Muestra que la foto se cargó
    };
    reader.readAsDataURL(file);
}

async function guardarProductoNuevo(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar-prod');
    btn.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Subiendo..."; 
    btn.disabled = true;

    const nuevoProd = {
        accion: "agregar_producto",
        codigo: document.getElementById('p-codigo').value,
        marca: document.getElementById('p-marca').value,
        nombre: document.getElementById('p-nombre').value,
        categoria: document.getElementById('p-categoria').value,
        stock: document.getElementById('p-stock').value,
        costo: document.getElementById('p-costo').value,
        precio: document.getElementById('p-precio').value,
        imagenBase64: imgBase64Data,
        mimeType: imgMimeType,
        nombreArchivo: imgName
    };

    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(nuevoProd) });
        alert("¡Producto guardado exitosamente!");
        location.reload(); 
    } catch (error) {
        alert("Error al subir el producto.");
        btn.innerHTML = "<i class='fa-solid fa-cloud-arrow-up'></i> Guardar en Inventario"; 
        btn.disabled = false;
    }
}

async function guardarCotizacion(e) {
    e.preventDefault();
    if (carrito.length === 0) return alert("Agrega productos primero.");
    const btn = document.getElementById('btn-guardar');
    btn.innerHTML = "Guardando..."; btn.disabled = true;
    const totalCrudo = document.getElementById('gran-total').innerText.replace(/,/g, '');

    const cotizacion = {
        accion: "guardar_cotizacion", // Ahora especificamos qué hace este formulario
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
    } catch (error) { alert("Error de conexión al guardar."); }
}

function renderClientes(clientes) {
    const tbody = document.getElementById('lista-clientes');
    tbody.innerHTML = "";
    clientes.forEach((c, index) => {
        let fecha = formatearFecha(c.fechaEntrega);
        tbody.innerHTML += `
            <tr onclick="abrirDetalle(${index})" style="cursor:pointer; border-bottom: 1px solid #f1f5f9; transition:0.2s;">
                <td data-label="Tienda / Cliente" style="padding:15px;"><strong>${c.tienda}</strong><br><span style="font-size:0.8rem; color:var(--text-muted);">${c.cliente}</span></td>
                <td data-label="Contacto" style="padding:15px;"><span style="color:var(--accent); font-weight:600;">${c.telefono}</span><br><span style="font-size:0.8rem;">${c.lugar}</span></td>
                <td data-label="Entrega" style="padding:15px; font-size:0.9rem;">${fecha}</td>
                <td data-label="Total" style="color:var(--success); font-weight:800; padding:15px;">Lps. ${formatoMoneda(c.total)}</td>
                <td data-label="Acción" style="padding:15px;"><button class="btn-secundario" style="padding: 10px; width:40px; height:40px; border-radius:10px;"><i class="fa-solid fa-eye"></i></button></td>
            </tr>`;
    });
}

function abrirDetalle(index) {
    indiceCotizacionActiva = index;
    const c = clientesGlobal[index];
    const modal = document.getElementById('modal-detalle');
    
    document.getElementById('detalle-info').innerHTML = `
        <strong>Cliente:</strong> ${c.cliente} <br><strong>Tienda:</strong> ${c.tienda} <br><strong>Teléfono:</strong> ${c.telefono} <br>
        <strong>Dirección:</strong> ${c.lugar} <br><strong>Entrega:</strong> ${formatearFecha(c.fechaEntrega)} <br>
        <strong style="font-size:1.2rem; color:var(--success); display:block; margin-top:10px;">Total Orden: Lps. ${formatoMoneda(c.total)}</strong>`;

    let htmlItems = "";
    if (c.carrito) {
        try {
            JSON.parse(c.carrito).forEach(item => { htmlItems += `<div style="border-bottom: 1px solid #f1f5f9; padding: 10px 0; display:flex; justify-content:space-between; font-size:0.9rem;"><span><b>${item.cantidad}x</b> ${item.nombre}</span></div>`; });
        } catch(e) {}
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
        if (c.fechaEntrega) document.getElementById('c-fecha-entrega').value = new Date(c.fechaEntrega).toISOString().split('T')[0];
        
        cerrarDetalle(); actualizarCarrito(); abrirCarrito();
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
            <table><thead><tr><th style="width: 10%; text-align:center;">Cant.</th><th>Descripción del Producto</th><th class="dinero" style="width: 25%;">Precio Unit.</th><th class="dinero" style="width: 25%;">Total</th></tr></thead><tbody>${htmlItems}</tbody></table>
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
    let telefono = String(c.telefono).replace(/\D/g, '');
    if (telefono.length === 8) telefono = '504' + telefono;
    else if (!telefono.startsWith('504')) telefono = '504' + telefono;

    let mensaje = `*¡Hola ${c.cliente}!* 👋\nAquí tienes el resumen de tu pedido de *DISTRIBUCIONES E&G*:\n\n🏢 *Tienda:* ${c.tienda}\n📅 *Fecha de Entrega:* ${formatearFecha(c.fechaEntrega)}\n📍 *Lugar:* ${c.lugar}\n\n*🛒 Detalle del pedido:*\n`;
    if (c.carrito) { try { JSON.parse(c.carrito).forEach(item => { mensaje += `▪️ ${item.cantidad}x ${item.nombre}\n`; }); } catch(e) {} }
    mensaje += `\n💰 *Total a Pagar:* Lps. ${formatoMoneda(c.total)}\n\n¡Gracias por tu preferencia!`;

    window.open(`https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`, '_blank');
}