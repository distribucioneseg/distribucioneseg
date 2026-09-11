const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzmfCtdIY5F-2zD4obMVxE26FZLT7yENQTBW0Oek1doWH3oqD0CG-qU6qoRob9z-kgu-g/exec'; // <--- No olvides poner tu URL real aquí

let productosGlobal = [];
let clientesGlobal = [];
let carrito = [];
let indiceCotizacionActiva = null; 

let imgBase64Data = "", imgMimeType = "", imgName = "";
let imgBase64DataEdit = "", imgMimeTypeEdit = "", imgNameEdit = "";

function formatoMoneda(valor) {
    let num = parseFloat(valor);
    if (isNaN(num)) return "0.00";
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

window.onload = async () => {
    document.getElementById('productos-grid').innerHTML = "<p style='text-align:center; width:100%; margin-top:30px; color:#64748b;'>Cargando inventario...</p>";
    
    const vistaGuardada = localStorage.getItem('vistaPreferida') || 'grid';
    cambiarVista(vistaGuardada);

    try {
        const respuesta = await fetch(SCRIPT_URL);
        const data = await respuesta.json();
        productosGlobal = data.productos;
        clientesGlobal = data.clientes.reverse(); 
        renderProductos(productosGlobal);
        renderClientes(clientesGlobal);
    } catch (error) {
        document.getElementById('productos-grid').innerHTML = "<p style='text-align:center; width:100%; color:#ef4444;'>Error de conexión.</p>";
    }
};

function cambiarVista(vista) {
    const grid = document.getElementById('productos-grid');
    const btnGrid = document.getElementById('btn-grid');
    const btnList = document.getElementById('btn-list');
    if (!btnGrid || !btnList) return;

    if (vista === 'list') {
        grid.classList.add('list-view');
        btnList.classList.add('active');
        btnGrid.classList.remove('active');
        localStorage.setItem('vistaPreferida', 'list');
    } else {
        grid.classList.remove('list-view');
        btnGrid.classList.add('active');
        btnList.classList.remove('active');
        localStorage.setItem('vistaPreferida', 'grid');
    }
}

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
        document.getElementById('btn-add-producto-nuevo').style.display = document.body.classList.contains("show-admin") ? "block" : "none";
    } else if (pass !== null) alert("Clave incorrecta.");
}

function abrirCarrito() { document.getElementById('modal-carrito').style.display = 'flex'; }
function cerrarCarrito() { document.getElementById('modal-carrito').style.display = 'none'; }
function cerrarDetalle() { document.getElementById('modal-detalle').style.display = 'none'; }
function abrirModalProducto() { document.getElementById('modal-producto').style.display = 'flex'; }
function cerrarModalProducto() { 
    document.getElementById('modal-producto').style.display = 'none'; 
    document.getElementById('form-producto').reset();
    document.getElementById('foto-estado').style.display = 'none';
    imgBase64Data = "";
    for(let i=3; i<=6; i++) { let row = document.getElementById('p-prov-row'+i); if(row) row.style.display = 'none'; }
    document.getElementById('p-btn-add-prov').style.display = 'flex';
}

function mostrarSiguienteProveedor(prefix) {
    for (let i = 3; i <= 6; i++) {
        let row = document.getElementById(prefix + '-prov-row' + i);
        if (row && row.style.display === 'none') {
            row.style.display = 'flex';
            if (i === 6) document.getElementById(prefix + '-btn-add-prov').style.display = 'none';
            break;
        }
    }
}

function generarCodigoSKU() {
    const select = document.getElementById('p-categoria');
    const catValue = select.value;
    
    if(!catValue) {
        document.getElementById('p-codigo').value = "";
        return;
    }

    const mapPrefijos = {
        "Gamer": "TEC", "Periferico": "TEC", "Audio": "TEC", "Cables": "TEC", "Almacenamiento": "TEC", "Protectores": "TEC", "Celulares": "TEC", "Componentes": "TEC",
        "Pollo": "CAR", "Res": "CAR", "Cerdo": "CAR", "Mariscos": "MAR", "Embutidos": "EMB",
        "Granos": "ABA", "Aceites": "ABA", "Pastas": "ABA", "Enlatados": "ABA", "Salsas": "ABA", "Especias": "ABA", "Panaderia": "ABA",
        "Lacteos": "LAC",
        "Refrescos": "BEB", "Agua": "BEB", "Energizantes": "BEB", "Cervezas": "BEB", "Cafe": "BEB", "Snacks": "SNA", "Dulces": "SNA",
        "Detergentes": "LIM", "Limpieza": "LIM", "Higiene": "HIG", "Capilar": "HIG", "Dental": "HIG", "Papel": "PAP",
        "Medicinas": "MED", "Bebes": "BEB2", "Mascotas": "MAS", "Papeleria": "PAP2", "Ferreteria": "FER", "Plasticos": "PLA", "Cosmeticos": "COS"
    };

    let prefix = mapPrefijos[catValue] || "E&G";
    let maxNum = 0;
    
    productosGlobal.forEach(p => {
        if (p.codigo && p.codigo.startsWith(prefix + "-")) {
            let partes = p.codigo.split("-");
            if (partes.length === 2) {
                let num = parseInt(partes[1], 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            }
        }
    });

    maxNum++;
    document.getElementById('p-codigo').value = prefix + "-" + String(maxNum).padStart(3, '0');
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
            
            // INTELIGENCIA MEJORADA: Lee la Categoría + El Nombre del Producto para encontrar el icono perfecto
            let searchStr = ((prod.categoria || "") + " " + (prod.nombre || "")).toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            // Tecnología
            if (searchStr.includes("GAMER") || searchStr.includes("DEDAL") || searchStr.includes("GATILLO")) imagenFinal = "https://img.icons8.com/color/150/controller.png"; 
            else if (searchStr.includes("PERIFERICO") || searchStr.includes("TECLADO") || searchStr.includes("MOUSE")) imagenFinal = "https://img.icons8.com/color/150/mouse.png"; 
            else if (searchStr.includes("AUDIO") || searchStr.includes("AUDIFONO") || searchStr.includes("BOCINA")) imagenFinal = "https://img.icons8.com/color/150/headphones.png"; 
            else if (searchStr.includes("CABLE") || searchStr.includes("CARGADOR")) imagenFinal = "https://img.icons8.com/color/150/usb-plug.png"; 
            else if (searchStr.includes("ALMACENAMIENTO") || searchStr.includes("USB") || searchStr.includes("MICROSD")) imagenFinal = "https://img.icons8.com/color/150/usb-memory-stick.png"; 
            else if (searchStr.includes("PROTECTOR") || searchStr.includes("FUNDA")) imagenFinal = "https://img.icons8.com/color/150/phone-case.png"; 
            else if (searchStr.includes("CELULAR") || searchStr.includes("TELEFONO")) imagenFinal = "https://img.icons8.com/color/150/iphone.png"; 
            else if (searchStr.includes("COMPONENTE")) imagenFinal = "https://img.icons8.com/color/150/motherboard.png"; 
            
            // Carnes
            else if (searchStr.includes("POLLO") || searchStr.includes("AVE") || searchStr.includes("ALITA")) imagenFinal = "https://img.icons8.com/color/150/poultry-leg.png"; 
            else if (searchStr.includes("RES") || searchStr.includes("VACA") || searchStr.includes("CARNE")) imagenFinal = "https://img.icons8.com/color/150/steak-medium.png"; 
            else if (searchStr.includes("CERDO") || searchStr.includes("CHULETA") || searchStr.includes("COSTILLA")) imagenFinal = "https://img.icons8.com/color/150/pig.png"; 
            else if (searchStr.includes("PESCADO") || searchStr.includes("MARISCO") || searchStr.includes("CAMARON") || searchStr.includes("TILAPIA")) imagenFinal = "https://img.icons8.com/color/150/fish-food.png"; 
            else if (searchStr.includes("EMBUTIDO") || searchStr.includes("CHORIZO") || searchStr.includes("SALCHICHA") || searchStr.includes("MORTADELA")) imagenFinal = "https://img.icons8.com/color/150/salami.png"; 
            
            // Abarrotes
            else if (searchStr.includes("GRANO") || searchStr.includes("FRIJOL") || searchStr.includes("ARROZ") || searchStr.includes("MAIZ")) imagenFinal = "https://img.icons8.com/color/150/ingredients.png"; 
            else if (searchStr.includes("ACEITE") || searchStr.includes("MANTECA")) imagenFinal = "https://img.icons8.com/color/150/olive-oil.png"; 
            else if (searchStr.includes("PASTA") || searchStr.includes("SOPA") || searchStr.includes("MACARRON")) imagenFinal = "https://img.icons8.com/color/150/spaghetti.png"; 
            else if (searchStr.includes("ENLATADO") || searchStr.includes("CONSERVA") || searchStr.includes("SARDINA") || searchStr.includes("ATUN")) imagenFinal = "https://img.icons8.com/color/150/canned-food.png"; 
            else if (searchStr.includes("SALSA") || searchStr.includes("CONDIMENTO") || searchStr.includes("MAYONESA")) imagenFinal = "https://img.icons8.com/color/150/ketchup.png"; 
            else if (searchStr.includes("ESPECIA") || searchStr.includes("AZUCAR") || searchStr.includes("SAL") || searchStr.includes("CONSOME")) imagenFinal = "https://img.icons8.com/color/150/salt-shaker.png"; 
            else if (searchStr.includes("HUEVO") || searchStr.includes("CARTON")) imagenFinal = "https://img.icons8.com/color/150/eggs.png"; 
            else if (searchStr.includes("LACTEO") || searchStr.includes("QUESO") || searchStr.includes("MANTEQUILLA") || searchStr.includes("LECHE")) imagenFinal = "https://img.icons8.com/color/150/cheese.png"; 
            else if (searchStr.includes("PAN") || searchStr.includes("REPOSTERIA") || searchStr.includes("GALLETA")) imagenFinal = "https://img.icons8.com/color/150/bread.png"; 
            
            // Bebidas y Snacks
            else if (searchStr.includes("REFRESCO") || searchStr.includes("JUGO") || searchStr.includes("COCA") || searchStr.includes("PEPSI") || searchStr.includes("BEBIDA")) imagenFinal = "https://img.icons8.com/color/150/soda-can.png"; 
            else if (searchStr.includes("AGUA")) imagenFinal = "https://img.icons8.com/color/150/water-bottle.png"; 
            else if (searchStr.includes("ENERGIZANTE") || searchStr.includes("RAPTOR") || searchStr.includes("MONSTER") || searchStr.includes("AMP")) imagenFinal = "https://img.icons8.com/color/150/energy-drink.png"; 
            else if (searchStr.includes("CERVEZA") || searchStr.includes("LICOR") || searchStr.includes("RON")) imagenFinal = "https://img.icons8.com/color/150/beer.png"; 
            else if (searchStr.includes("SNACK") || searchStr.includes("CHURRO") || searchStr.includes("PAPITA") || searchStr.includes("ZAMBO") || searchStr.includes("YUMMIE")) imagenFinal = "https://img.icons8.com/color/150/potato-chips.png"; 
            else if (searchStr.includes("DULCE") || searchStr.includes("CHOCOLATE") || searchStr.includes("CONFITE") || searchStr.includes("BOMBON")) imagenFinal = "https://img.icons8.com/color/150/candy.png"; 
            else if (searchStr.includes("CAFE") || searchStr.includes("TE ")) imagenFinal = "https://img.icons8.com/color/150/coffee-beans.png"; 
            
            // Higiene y Limpieza
            else if (searchStr.includes("DETERGENTE") || searchStr.includes("SUAVIZANTE") || searchStr.includes("JABON DE LAVAR") || searchStr.includes("RINSO")) imagenFinal = "https://img.icons8.com/color/150/washing-machine.png"; 
            else if (searchStr.includes("LIMPIEZA") || searchStr.includes("CLORO") || searchStr.includes("DESINFECTANTE") || searchStr.includes("MISTOLIN")) imagenFinal = "https://img.icons8.com/color/150/cleaning-products.png"; 
            else if (searchStr.includes("HIGIENE") || searchStr.includes("CORPORAL") || searchStr.includes("JABON DE BAÑO") || searchStr.includes("PROTEX")) imagenFinal = "https://img.icons8.com/color/150/soap.png"; 
            else if (searchStr.includes("CAPILAR") || searchStr.includes("SHAMPOO") || searchStr.includes("ACONDICIONADOR")) imagenFinal = "https://img.icons8.com/color/150/shampoo.png"; 
            else if (searchStr.includes("DENTAL") || searchStr.includes("COLGATE") || searchStr.includes("CEPILLO")) imagenFinal = "https://img.icons8.com/color/150/tooth.png"; 
            else if (searchStr.includes("PAPEL") || searchStr.includes("DESECHABLE") || searchStr.includes("SERVILLETA") || searchStr.includes("VASO")) imagenFinal = "https://img.icons8.com/color/150/toilet-paper.png"; 
            
            // Otros
            else if (searchStr.includes("MEDICINA") || searchStr.includes("OTC") || searchStr.includes("PASTILLA") || searchStr.includes("PANADOL")) imagenFinal = "https://img.icons8.com/color/150/pill.png"; 
            else if (searchStr.includes("BEBE") || searchStr.includes("PAÑAL") || searchStr.includes("TOALLITA")) imagenFinal = "https://img.icons8.com/color/150/pacifier.png"; 
            else if (searchStr.includes("MASCOTA") || searchStr.includes("PERRO") || searchStr.includes("GATO") || searchStr.includes("DOGUI")) imagenFinal = "https://img.icons8.com/color/150/dog-bowl.png"; 
            else if (searchStr.includes("PAPELERIA") || searchStr.includes("LIBRERIA") || searchStr.includes("CUADERNO") || searchStr.includes("LAPIZ")) imagenFinal = "https://img.icons8.com/color/150/school.png"; 
            else if (searchStr.includes("FERRETERIA") || searchStr.includes("CLAVO") || searchStr.includes("HERRAMIENTA")) imagenFinal = "https://img.icons8.com/color/150/hammer.png"; 
            else if (searchStr.includes("PLASTICO") || searchStr.includes("HOGAR") || searchStr.includes("BASURA") || searchStr.includes("ESCOBA")) imagenFinal = "https://img.icons8.com/color/150/bucket.png"; 
            else if (searchStr.includes("COSMETICO") || searchStr.includes("BELLEZA") || searchStr.includes("MAQUILLAJE")) imagenFinal = "https://img.icons8.com/color/150/lipstick.png"; 
            
            else imagenFinal = "https://img.icons8.com/color/150/box--v1.png"; 
        }

        let stockNum = parseInt(prod.stock) || 0;
        let stockClass = "stock-out";
        let stockText = "● Agotado";
        if (stockNum > 5) { stockClass = "stock-ok"; stockText = "● Stock"; }
        else if (stockNum > 0) { stockClass = "stock-low"; stockText = "🔥 Sólo " + stockNum; }

        grid.innerHTML += `
            <div class="card">
                <div class="stock-tag ${stockClass}">${stockText}</div>
                <div class="card-inner">
                    <div class="img-container"><img src="${imagenFinal}" onerror="this.src='https://img.icons8.com/color/150/box--v1.png'"></div>
                    <div class="info-text">
                        <div class="cat-tag">${prod.categoria || 'Genérico'}</div>
                        <span class="marca-text">${prod.marca || 'S/M'}</span>
                        <h3>${prod.nombre}</h3>
                        <div class="oferta">Lps. ${formatoMoneda(precioBase)}</div>
                        ${tablaDescuentos}
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-add" onclick="agregarAlCarrito('${prod.codigo}')">
                        <i class="fa-solid fa-plus icon-list"></i>
                        <i class="fa-solid fa-cart-plus icon-grid"></i>
                        <span class="text-grid"> Agregar</span>
                    </button>
                </div>
                <div class="admin-panel">
                    <div class="admin-header"><i class="fa-solid fa-user-lock"></i> Info Interna y Ganancias</div>
                    <div class="admin-stats">
                        <div class="stat-box cost full-width"><span>Costo Más Bajo</span><b>Lps. ${formatoMoneda(costoBajo)}</b></div>
                        <div class="stat-box profit"><span>Ganancia Normal</span><b>Lps. ${formatoMoneda(gananciaAutomatica)}</b></div>
                        ${prod.precio5 ? `<div class="stat-box profit"><span>Ganancia 5+ Unids</span><b>Lps. ${formatoMoneda(parseFloat(prod.precio5) - costoBajo)}</b></div>` : ''}
                        ${prod.precio6 ? `<div class="stat-box profit"><span>Ganancia Media Doc</span><b>Lps. ${formatoMoneda(parseFloat(prod.precio6) - costoBajo)}</b></div>` : ''}
                        ${prod.precio12 ? `<div class="stat-box profit"><span>Ganancia Docena</span><b>Lps. ${formatoMoneda(parseFloat(prod.precio12) - costoBajo)}</b></div>` : ''}
                    </div>
                    ${proveedoresHTML ? `<div class="admin-providers">${proveedoresHTML}</div>` : ''}
                    <button class="btn-secundario" onclick="abrirModalEditar('${prod.codigo}')" style="margin: 10px; width: calc(100% - 20px); font-size: 0.85rem; padding: 10px; border-radius: 12px; font-weight:700;"><i class="fa-solid fa-pen"></i> Editar Producto</button>
                </div>
            </div>`;
    });
}

function filtrarProductos() {
    const texto = document.getElementById('search-prod').value.toLowerCase();
    const cat = document.getElementById('cat-filter').value;
    const filtrados = productosGlobal.filter(p => {
        const matchTexto = (p.nombre || "").toLowerCase().includes(texto);
        const matchCat = (cat === "Todas") || (p.categoria || "").toLowerCase() === cat.toLowerCase();
        return matchTexto && matchCat;
    });
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
    if (item) item.cantidad++; else carrito.push({ codigo: prod.codigo, nombre: prod.nombre, prodCompleto: prod, cantidad: 1 });
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

function procesarImagen(event) {
    const file = event.target.files[0];
    if (!file) return;
    imgName = file.name; imgMimeType = file.type;
    const reader = new FileReader();
    reader.onload = function(e) { imgBase64Data = e.target.result.split(',')[1]; document.getElementById('foto-estado').style.display = 'block'; };
    reader.readAsDataURL(file);
}

async function guardarProductoNuevo(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar-prod');
    btn.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Subiendo..."; btn.disabled = true;
    const nuevoProd = {
        accion: "agregar_producto", codigo: document.getElementById('p-codigo').value, marca: document.getElementById('p-marca').value,
        nombre: document.getElementById('p-nombre').value, categoria: document.getElementById('p-categoria').value, stock: document.getElementById('p-stock').value,
        costo: document.getElementById('p-costo').value, precio: document.getElementById('p-precio').value, 
        precio5: document.getElementById('p-precio5').value, precio6: document.getElementById('p-precio6').value, precio12: document.getElementById('p-precio12').value,
        lugar1: document.getElementById('p-lugar1').value, precio1: document.getElementById('p-precio1').value,
        lugar2: document.getElementById('p-lugar2').value, precio2: document.getElementById('p-precio2').value,
        lugar3: document.getElementById('p-lugar3').value, precio3: document.getElementById('p-precio3').value,
        lugar4: document.getElementById('p-lugar4').value, precio4: document.getElementById('p-precio4').value,
        lugar5: document.getElementById('p-lugar5').value, precio5: document.getElementById('p-precio5_prov').value,
        lugar6: document.getElementById('p-lugar6').value, precio6: document.getElementById('p-precio6_prov').value,
        imagenBase64: imgBase64Data, mimeType: imgMimeType, nombreArchivo: imgName
    };
    try { await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(nuevoProd) }); alert("¡Producto guardado exitosamente!"); location.reload(); } 
    catch (error) { alert("Error al subir el producto."); btn.innerHTML = "<i class='fa-solid fa-cloud-arrow-up'></i> Guardar en Inventario"; btn.disabled = false; }
}

async function guardarCotizacion(e) {
    e.preventDefault();
    if (carrito.length === 0) return alert("Agrega productos primero.");
    const btn = document.getElementById('btn-guardar');
    btn.innerHTML = "Guardando..."; btn.disabled = true;
    const totalCrudo = document.getElementById('gran-total').innerText.replace(/,/g, '');
    const cotizacion = { accion: "guardar_cotizacion", cliente: document.getElementById('c-nombre').value, tienda: document.getElementById('c-tienda').value, telefono: document.getElementById('c-tel').value, lugar: document.getElementById('c-lugar').value, fechaEntrega: document.getElementById('c-fecha-entrega').value, total: totalCrudo, carrito: carrito };
    try { await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(cotizacion) }); alert("¡Guardado exitosamente!"); location.reload(); } 
    catch (error) { alert("Error de conexión al guardar."); }
}

async function eliminarCotizacion() {
    const pass = prompt("Ingrese PIN de administrador para eliminar:");
    if (pass !== "199311") {
        if (pass !== null) alert("PIN incorrecto. Acceso denegado.");
        return;
    }

    if (!confirm("¿ESTÁS SEGURO? Esta cotización se borrará permanentemente de tu Excel.")) return;

    const c = clientesGlobal[indiceCotizacionActiva];
    const btn = document.querySelector('.btn-eliminar');
    btn.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Eliminando...";
    btn.disabled = true;

    const peticion = { accion: "eliminar_cotizacion", fila: c.fila };
    try {
        await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(peticion) });
        alert("¡Cotización eliminada exitosamente!");
        location.reload();
    } catch (error) {
        alert("Error al eliminar.");
        btn.innerHTML = "<i class='fa-solid fa-trash'></i> Eliminar Cotización";
        btn.disabled = false;
    }
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
                <td data-label="Acción" style="padding:15px; text-align:right;"><button class="btn-secundario" style="padding: 10px; width:40px; height:40px; border-radius:10px;"><i class="fa-solid fa-eye"></i></button></td>
            </tr>`;
    });
}

function abrirDetalle(index) {
    indiceCotizacionActiva = index;
    const c = clientesGlobal[index];
    document.getElementById('detalle-info').innerHTML = `
        <div style="background:#f8fafc; padding:15px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:15px; display:flex; flex-direction:column; gap:8px;">
            <div style="display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-user" style="color:var(--accent); font-size:1.1rem; width:20px; text-align:center;"></i> <strong style="font-size:1.05rem; color:#1e293b;">${c.cliente}</strong></div>
            <div style="display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-store" style="color:#64748b; font-size:0.95rem; width:20px; text-align:center;"></i> <span style="font-size:0.95rem; color:#475569;">${c.tienda}</span></div>
            <div style="display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-phone" style="color:#64748b; font-size:0.95rem; width:20px; text-align:center;"></i> <span style="font-size:0.95rem; color:#475569;">${c.telefono}</span></div>
            <div style="display:flex; align-items:center; gap:10px;"><i class="fa-solid fa-location-dot" style="color:#64748b; font-size:0.95rem; width:20px; text-align:center;"></i> <span style="font-size:0.95rem; color:#475569;">${c.lugar}</span></div>
            <div style="display:flex; align-items:center; gap:10px; margin-top:5px; padding-top:8px; border-top:1px dashed #cbd5e1;"><i class="fa-solid fa-calendar-day" style="color:#64748b; font-size:0.95rem; width:20px; text-align:center;"></i> <span style="font-size:0.95rem; color:#475569;">Entrega: <strong>${formatearFecha(c.fechaEntrega)}</strong></span></div>
        </div>
        <div style="background:#eff6ff; border:1px solid #bfdbfe; padding:15px; border-radius:12px; text-align:center;">
            <span style="display:block; font-size:0.8rem; color:#1d4ed8; font-weight:800; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:4px;">Total de la Orden</span>
            <span style="font-size:1.7rem; color:#1e3a8a; font-weight:900;">Lps. ${formatoMoneda(c.total)}</span>
        </div>`;
    
    let htmlItems = "";
    if (c.carrito) {
        try {
            JSON.parse(c.carrito).forEach(item => { 
                let precioAplicado = item.prodCompleto && item.prodCompleto.precioUnitario ? parseFloat(item.prodCompleto.precioUnitario) : 0;
                if (item.prodCompleto) {
                    if (item.cantidad >= 12 && item.prodCompleto.precio12 > 0) precioAplicado = parseFloat(item.prodCompleto.precio12);
                    else if (item.cantidad >= 6 && item.prodCompleto.precio6 > 0) precioAplicado = parseFloat(item.prodCompleto.precio6);
                    else if (item.cantidad >= 5 && item.prodCompleto.precio5 > 0) precioAplicado = parseFloat(item.prodCompleto.precio5);
                }
                const subtotalItem = precioAplicado * item.cantidad;

                htmlItems += `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:12px 0; border-bottom:1px solid #f1f5f9;">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="background:#eef2ff; color:var(--accent); font-weight:800; padding:6px; border-radius:8px; font-size:0.85rem; min-width:40px; text-align:center;">${item.cantidad}x</div>
                        <div style="font-size:0.95rem; color:var(--text-dark); font-weight:600; line-height:1.3;">${item.nombre}</div>
                    </div>
                    <div style="font-weight:800; color:#10b981; font-size:0.95rem; white-space:nowrap;">Lps. ${formatoMoneda(subtotalItem)}</div>
                </div>`; 
            });
        } catch(e) {}
    }
    document.getElementById('detalle-items').innerHTML = htmlItems || "<p style='color:#64748b;'>Sin detalles guardados.</p>";
    document.getElementById('modal-detalle').style.display = 'flex';
}

function editarCotizacion() {
    const c = clientesGlobal[indiceCotizacionActiva];
    if (c.carrito) {
        carrito = JSON.parse(c.carrito);
        document.getElementById('c-nombre').value = c.cliente; document.getElementById('c-tienda').value = c.tienda;
        document.getElementById('c-tel').value = c.telefono; document.getElementById('c-lugar').value = c.lugar;
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
            .total-container { text-align: right; padding-top: 20px; border-top: 2px solid #e2e8f0; page-break-inside: avoid; display: flex; justify-content: flex-end; align-items: center; gap: 15px; }
            .total-label { font-size: 18px; color: #1e3a8a; font-weight: bold; text-transform: uppercase; }
            .total-amount { font-size: 24px; font-weight: 900; color: #2563eb; background: #dbeafe; padding: 10px 20px; border-radius: 12px; border: 1px solid #bfdbfe; }
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
            <div class="total-container"><span class="total-label">Total a Cobrar:</span><span class="total-amount">Lps. ${formatoMoneda(c.total)}</span></div>
            <div class="footer">¡Gracias por su preferencia!<br>Documento generado para control y validación de entrega.<br><br><b>Generado por: Renee Coello</b></div>
            <script>window.print();</script>
        </body></html>
    `);
    ventana.document.close();
}

function generarFacturaAdmin() {
    const pass = prompt("Ingrese PIN de administrador para ver el reporte de ganancias:");
    if (pass !== "199311") {
        if (pass !== null) alert("PIN incorrecto. Acceso denegado.");
        return;
    }

    const c = clientesGlobal[indiceCotizacionActiva];
    const nOrden = Math.floor(Math.random() * 90000) + 10000;
    let htmlItems = "";
    let gananciaTotalVenta = 0;

    JSON.parse(c.carrito || "[]").forEach(item => {
        let prod = item.prodCompleto || {};
        let precioAplicado = prod.precioUnitario ? parseFloat(prod.precioUnitario) : 0;
        
        if (item.cantidad >= 12 && prod.precio12 > 0) precioAplicado = parseFloat(prod.precio12);
        else if (item.cantidad >= 6 && prod.precio6 > 0) precioAplicado = parseFloat(prod.precio6);
        else if (item.cantidad >= 5 && prod.precio5 > 0) precioAplicado = parseFloat(prod.precio5);

        let preciosProv = [];
        for (let i = 1; i <= 6; i++) {
            let p = parseFloat(prod['p'+i]);
            if (!isNaN(p) && p > 0) preciosProv.push(p);
        }
        let costoBajo = preciosProv.length > 0 ? Math.min(...preciosProv) : (parseFloat(prod.costoBajo) || 0);

        let gananciaUnitaria = precioAplicado - costoBajo;
        let gananciaTotalItem = gananciaUnitaria * item.cantidad;
        gananciaTotalVenta += gananciaTotalItem;

        htmlItems += `<tr>
            <td style="padding:12px; border-bottom:1px solid #334155; text-align:center;">${item.cantidad}</td>
            <td style="padding:12px; border-bottom:1px solid #334155;">${item.nombre}</td>
            <td style="padding:12px; border-bottom:1px solid #334155; text-align:right;">Lps. ${formatoMoneda(costoBajo)}</td>
            <td style="padding:12px; border-bottom:1px solid #334155; text-align:right;">Lps. ${formatoMoneda(precioAplicado)}</td>
            <td style="padding:12px; border-bottom:1px solid #334155; text-align:right; font-weight:bold; color:#10b981;">Lps. ${formatoMoneda(gananciaTotalItem)}</td>
        </tr>`;
    });

    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <html><head><title>Reporte de Ganancias - Admin</title>
        <style>
            body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #f8fafc; background: #0f172a; max-width: 900px; margin: 0 auto;}
            .header { text-align: center; border-bottom: 2px solid #334155; padding-bottom: 20px; margin-bottom: 30px;}
            .header h1 { margin: 0; color: #fbbf24; font-size: 26px;}
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; font-size:14px; line-height:1.6;}
            table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size:14px;}
            thead { display: table-header-group; }
            th { background: #1e293b; padding: 12px; text-align: left; color: #cbd5e1; border-bottom:2px solid #334155;}
            th.dinero { text-align: right; white-space: nowrap; }
            .total-container { text-align: right; padding-top: 20px; border-top: 2px solid #334155; display: flex; justify-content: flex-end; align-items: center; gap: 15px; }
            .total-label { font-size: 18px; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
            .total-amount { font-size: 24px; font-weight: 900; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 10px 20px; border-radius: 12px; border: 1px solid #10b981; }
            @media print { body { -webkit-print-color-adjust: exact; padding: 0;} }
        </style>
        </head><body>
            <div class="header"><h1>REPORTE DE RENTABILIDAD ADMIN</h1><p>CONFIDENCIAL</p></div>
            <div class="info-grid">
                <div><b>Venta a:</b> ${c.cliente} (${c.tienda})<br><b>Teléfono:</b> ${c.telefono}</div>
                <div style="text-align: right;"><b>N° Venta:</b> EG-${nOrden}<br><b>Cobro a Cliente:</b> Lps. ${formatoMoneda(c.total)}</div>
            </div>
            <table><thead><tr><th style="width: 10%; text-align:center;">Cant.</th><th>Producto</th><th class="dinero">Costo Unit.</th><th class="dinero">Vendido Unit.</th><th class="dinero" style="color:#10b981;">Ganancia Neta</th></tr></thead><tbody>${htmlItems}</tbody></table>
            <div class="total-container"><span class="total-label">Ganancia Total Venta:</span><span class="total-amount">Lps. ${formatoMoneda(gananciaTotalVenta)}</span></div>
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

function abrirModalEditar(codigo) {
    const prod = productosGlobal.find(p => p.codigo === codigo);
    if(!prod) return;
    document.getElementById('e-codigo').value = prod.codigo; 
    document.getElementById('e-marca').value = prod.marca || "";
    document.getElementById('e-nombre').value = prod.nombre; 
    document.getElementById('e-categoria').value = prod.categoria || "";
    document.getElementById('e-stock').value = prod.stock || 0;
    
    document.getElementById('e-precio5').value = prod.precio5 || "";
    document.getElementById('e-precio6').value = prod.precio6 || "";
    document.getElementById('e-precio12').value = prod.precio12 || "";
    
    document.getElementById('e-lugar1').value = prod.l1 || ""; document.getElementById('e-precio1').value = prod.p1 || "";
    document.getElementById('e-lugar2').value = prod.l2 || ""; document.getElementById('e-precio2').value = prod.p2 || "";
    document.getElementById('e-lugar3').value = prod.l3 || ""; document.getElementById('e-precio3').value = prod.p3 || "";
    document.getElementById('e-lugar4').value = prod.l4 || ""; document.getElementById('e-precio4').value = prod.p4 || "";
    document.getElementById('e-lugar5').value = prod.l5 || ""; document.getElementById('e-precio5_prov').value = prod.p5 || "";
    document.getElementById('e-lugar6').value = prod.l6 || ""; document.getElementById('e-precio6_prov').value = prod.p6 || "";

    for(let i=3; i<=6; i++) { let row = document.getElementById('e-prov-row'+i); row.style.display = 'none'; }
    document.getElementById('e-btn-add-prov').style.display = 'flex';

    for(let i=3; i<=6; i++) {
        if(prod['l'+i] || prod['p'+i]) {
            document.getElementById('e-prov-row'+i).style.display = 'flex';
            if(i === 6) document.getElementById('e-btn-add-prov').style.display = 'none';
        }
    }

    let precios = [];
    for(let i=1; i<=6; i++) { let p = parseFloat(prod['p'+i]); if(!isNaN(p) && p>0) precios.push(p); }
    document.getElementById('e-costo').value = precios.length > 0 ? Math.min(...precios) : (parseFloat(prod.costoBajo)||0);
    document.getElementById('e-precio').value = parseFloat(prod.precioUnitario) || 0;
    document.getElementById('modal-editar-producto').style.display = 'flex';
}

function cerrarModalEditar() { 
    document.getElementById('modal-editar-producto').style.display = 'none'; 
    document.getElementById('form-editar-producto').reset(); 
    document.getElementById('e-foto-estado').style.display = 'none'; 
    imgBase64DataEdit = ""; 
}

function procesarImagenEdicion(event) { 
    const file = event.target.files[0]; 
    if (!file) return; 
    imgNameEdit = file.name; imgMimeTypeEdit = file.type; 
    const reader = new FileReader(); 
    reader.onload = function(e) { 
        imgBase64DataEdit = e.target.result.split(',')[1]; 
        document.getElementById('e-foto-estado').style.display = 'block'; 
    }; 
    reader.readAsDataURL(file); 
}

async function guardarEdicionProducto(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar-edicion'); btn.innerHTML = "<i class='fa-solid fa-spinner fa-spin'></i> Actualizando..."; btn.disabled = true;
    const prodEditado = { 
        accion: "editar_producto", 
        codigo: document.getElementById('e-codigo').value, 
        marca: document.getElementById('e-marca').value, 
        nombre: document.getElementById('e-nombre').value, 
        categoria: document.getElementById('e-categoria').value, 
        stock: document.getElementById('e-stock').value, 
        costo: document.getElementById('e-costo').value, 
        precio: document.getElementById('e-precio').value, 
        precio5: document.getElementById('e-precio5').value, 
        precio6: document.getElementById('e-precio6').value, 
        precio12: document.getElementById('e-precio12').value,
        lugar1: document.getElementById('e-lugar1').value, precio1: document.getElementById('e-precio1').value, 
        lugar2: document.getElementById('e-lugar2').value, precio2: document.getElementById('e-precio2').value,
        lugar3: document.getElementById('e-lugar3').value, precio3: document.getElementById('e-precio3').value,
        lugar4: document.getElementById('e-lugar4').value, precio4: document.getElementById('e-precio4').value,
        lugar5: document.getElementById('e-lugar5').value, precio5: document.getElementById('e-precio5_prov').value,
        lugar6: document.getElementById('e-lugar6').value, precio6: document.getElementById('e-precio6_prov').value,
        imagenBase64: imgBase64DataEdit, mimeType: imgMimeTypeEdit, nombreArchivo: imgNameEdit 
    };
    try { await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(prodEditado) }); alert("¡Producto actualizado exitosamente!"); location.reload(); } 
    catch (error) { alert("Error al actualizar el producto."); btn.innerHTML = "<i class='fa-solid fa-cloud-arrow-up'></i> Actualizar Producto"; btn.disabled = false; }
}