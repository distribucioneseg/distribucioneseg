const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwGF0hxDxh3wthKVvaXwyNz9XzetQ_u5r1gE2vUk8GTJx3OJXpOPX2ytrnY-LDzyQxRqw/exec'; // <-- ¡PEGA LA NUEVA URL!

let productosGlobal = [], clientesGlobal = [], carrito = [];
let indiceCotizacionActiva = null; 

function formatoMoneda(valor) {
    let num = parseFloat(valor);
    if (isNaN(num)) return "0.00";
    return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function obtenerUrlImagen(url) {
    if (!url) return "";
    let finalUrl = url.trim();
    if (finalUrl.includes('drive.google.com')) {
        let fileId = "";
        if (finalUrl.includes('/d/')) fileId = finalUrl.split('/d/')[1].split('/')[0];
        else if (finalUrl.includes('id=')) fileId = finalUrl.split('id=')[1].split('&')[0];
        if (fileId) return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`;
    }
    return finalUrl;
}

window.onload = async () => {
    const activeTab = localStorage.getItem('activeTab') || 'tienda';
    switchTab(activeTab);
    localStorage.removeItem('activeTab'); 
    
    const vistaGuardada = localStorage.getItem('vistaPreferida') || 'grid';
    cambiarVista(vistaGuardada);

    const cache = localStorage.getItem('eg_data_cache');
    if (cache) {
        try {
            const dataCache = JSON.parse(cache);
            productosGlobal = (dataCache.productos || []).map((p, idx) => {
                p.id_unico = (p.codigo && p.codigo.trim() !== "") ? p.codigo : "TEMP_" + idx;
                return p;
            });
            clientesGlobal = [...(dataCache.clientes || [])].reverse();
            renderProductos(productosGlobal);
            renderClientes(clientesGlobal);
            mostrarToast("Actualizando inventario...");
        } catch (e) { console.log("Caché dañado"); }
    } else {
        document.getElementById('productos-grid').innerHTML = "<div style='text-align:center; width:100%; margin-top:60px; color:var(--text-muted);'><i class='fa-solid fa-circle-notch fa-spin' style='font-size:40px; margin-bottom:15px; color:var(--accent);'></i><h3 style='margin:0; font-weight:700;'>Cargando inventario...</h3></div>";
    }

    try {
        const respuesta = await fetch(SCRIPT_URL + "?cacheBust=" + new Date().getTime());
        const data = await respuesta.json();
        localStorage.setItem('eg_data_cache', JSON.stringify(data));
        productosGlobal = (data.productos || []).map((p, idx) => {
            p.id_unico = (p.codigo && p.codigo.trim() !== "") ? p.codigo : "TEMP_" + idx;
            return p;
        });
        clientesGlobal = [...(data.clientes || [])].reverse(); 
        renderProductos(productosGlobal);
        renderClientes(clientesGlobal);
        if (cache) mostrarToast("¡Sincronizado!");
    } catch (error) {
        if (!cache) document.getElementById('productos-grid').innerHTML = "<div style='text-align:center; width:100%; margin-top:60px; color:var(--danger);'><i class='fa-solid fa-triangle-exclamation' style='font-size:40px; margin-bottom:15px;'></i><h3 style='margin:0; font-weight:700;'>Error de conexión</h3></div>";
        else mostrarToast("Trabajando sin conexión.");
    }
};

function mostrarToast(mensaje) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    if (!toast || !toastMsg) return;
    toastMsg.innerText = mensaje;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function cambiarVista(vista) {
    const grid = document.getElementById('productos-grid');
    const btnGrid = document.getElementById('btn-grid');
    const btnList = document.getElementById('btn-list');
    if (!btnGrid || !btnList) return;

    if (vista === 'list') {
        grid.classList.add('list-view');
        btnList.classList.add('active'); btnGrid.classList.remove('active');
        localStorage.setItem('vistaPreferida', 'list');
    } else {
        grid.classList.remove('list-view');
        btnGrid.classList.add('active'); btnList.classList.remove('active');
        localStorage.setItem('vistaPreferida', 'grid');
    }
}

function switchTab(tab) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.desktop-tabs button').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${tab}`).classList.add('active');
    if(document.getElementById(`nav-${tab}`)) document.getElementById(`nav-${tab}`).classList.add('active');
    if(document.getElementById(`tab-${tab}-desk`)) document.getElementById(`tab-${tab}-desk`).classList.add('active');
}

function toggleAdmin() {
    const pass = prompt("Acceso de Administrador. Ingrese PIN:");
    if (pass === "199311") document.body.classList.toggle("show-admin");
    else if (pass !== null) alert("PIN incorrecto.");
}

function abrirCarrito() { document.getElementById('modal-carrito').style.display = 'flex'; }
function cerrarCarrito() { document.getElementById('modal-carrito').style.display = 'none'; }
function cerrarDetalle() { document.getElementById('modal-detalle').style.display = 'none'; }

function abrirModalProducto() { 
    document.getElementById('modal-producto').style.display = 'flex'; 
    document.getElementById('p-codigo').value = "Automático en Excel";
}

function cerrarModalProducto() { 
    document.getElementById('modal-producto').style.display = 'none'; 
    document.getElementById('form-producto').reset();
    for(let i=3; i<=6; i++) { let row = document.getElementById('p-prov-row'+i); if(row) row.style.display = 'none'; }
}

function cerrarModalEditar() { 
    document.getElementById('modal-editar-producto').style.display = 'none'; 
    document.getElementById('form-editar-producto').reset(); 
}

function abrirGaleria(idUnico) {
    const prod = productosGlobal.find(p => p.id_unico === idUnico);
    if (!prod || !prod.foto) return;
    
    const urls = prod.foto.toString().split(',').map(u => u.trim()).filter(u => u !== "");
    let html = '';
    
    urls.forEach(url => {
        html += `<img src="${obtenerUrlImagen(url)}" alt="${prod.nombre}">`;
    });

    document.getElementById('galeria-contenedor').innerHTML = html;
    document.getElementById('galeria-titulo').innerText = prod.nombre;
    document.getElementById('modal-galeria').style.display = 'flex';
}
function cerrarGaleria() { document.getElementById('modal-galeria').style.display = 'none'; }

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

function generarCodigoSKU() {} // Ya no se usa, lo hace el Excel con fórmula

function formatearFecha(fechaStr) {
    if(!fechaStr) return "Sin fecha";
    const opciones = { year: 'numeric', month: 'short', day: 'numeric' };
    let fecha = new Date(fechaStr);
    fecha.setMinutes(fecha.getMinutes() + fecha.getTimezoneOffset());
    return fecha.toLocaleDateString('es-HN', opciones);
}

function renderProductos(productos) {
    const grid = document.getElementById('productos-grid');
    grid.innerHTML = "";
    
    productos.forEach((prod) => {
        let precioBase = parseFloat(prod.precioUnitario) || 0;
        
        let tablaDescuentos = `<div class="tabla-descuentos"></div>`;
        if (prod.precio5 || prod.precio6 || prod.precio12) {
            tablaDescuentos = `<div class="tabla-descuentos">
                ${prod.precio5 ? `<div class="tag-desc">5+: <b>Lps. ${formatoMoneda(prod.precio5)}</b></div>` : ''}
                ${prod.precio6 ? `<div class="tag-desc">½ Doc: <b>Lps. ${formatoMoneda(prod.precio6)}</b></div>` : ''}
                ${prod.precio12 ? `<div class="tag-desc">Docena: <b>Lps. ${formatoMoneda(prod.precio12)}</b></div>` : ''}
            </div>`;
        }

        let proveedoresHTML = "";
        for (let i = 1; i <= 6; i++) {
            let lugar = prod['l'+i], precio = parseFloat(prod['p'+i]);
            if (lugar && lugar.toString().trim() !== "") {
                proveedoresHTML += `<div class="prov-row"><span class="prov-name">${lugar}</span><span class="prov-price">Lps. ${formatoMoneda(precio)}</span></div>`;
            }
        }

        let costoBajo = parseFloat(prod.costoBajo) || 0;
        let gananciaAutomatica = parseFloat(prod.gananciaNormal) || 0;

        let urls = prod.foto ? prod.foto.toString().split(',').map(u => u.trim()).filter(u => u !== "") : [];
        let imagenFinal = "";
        let isRealPhoto = false;

        if (urls.length > 0 && urls[0].startsWith('http')) {
            imagenFinal = obtenerUrlImagen(urls[0]); 
            isRealPhoto = true;
        } else {
            let cat = (prod.categoria || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            let nom = (prod.nombre || "").toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            let searchStr = cat + " " + nom;
            const hasCat = (...words) => words.some(w => new RegExp(`\\b${w}`).test(cat));
            const hasStr = (...words) => words.some(w => new RegExp(`\\b${w}`).test(searchStr));

            if (hasCat("GAMER", "TECNOLOGIA", "PERIFERICO", "CELULAR", "AUDIO", "CABLE", "COMPONENTE", "PROTECTOR", "ALMACENAMIENTO")) {
                if (hasStr("PERIFERICO", "TECLADO", "MOUSE")) imagenFinal = "https://img.icons8.com/color/150/mouse.png"; 
                else if (hasStr("AUDIO", "AUDIFONO", "BOCINA", "AUDIFONOS")) imagenFinal = "https://img.icons8.com/color/150/headphones.png"; 
                else if (hasStr("CABLE", "CARGADOR")) imagenFinal = "https://img.icons8.com/color/150/usb-plug.png"; 
                else if (hasStr("ALMACENAMIENTO", "USB", "MICROSD", "MEMORIA")) imagenFinal = "https://img.icons8.com/color/150/usb-memory-stick.png"; 
                else if (hasStr("PROTECTOR", "FUNDA", "VIDRIO", "TEMPLADO")) imagenFinal = "https://img.icons8.com/color/150/phone-case.png"; 
                else if (hasStr("CELULAR", "TELEFONO", "SMARTPHONE")) imagenFinal = "https://img.icons8.com/color/150/iphone.png"; 
                else imagenFinal = "https://img.icons8.com/color/150/controller.png"; 
            }
            else if (hasCat("CARNE", "EMBUTIDO", "POLLO", "RES", "CERDO", "MARISCO")) {
                if (hasStr("POLLO", "AVE", "ALITA")) imagenFinal = "https://img.icons8.com/color/150/thanksgiving-turkey.png"; 
                else if (hasStr("RES", "VACA", "MOLIDA")) imagenFinal = "https://img.icons8.com/color/150/steak-medium.png"; 
                else if (hasStr("CERDO", "CHULETA")) imagenFinal = "https://img.icons8.com/color/150/pig.png"; 
                else if (hasStr("PESCADO", "MARISCO")) imagenFinal = "https://img.icons8.com/color/150/fish-food.png"; 
                else if (hasStr("CHORIZO", "ZAMBRANO")) imagenFinal = "https://img.icons8.com/color/150/salami.png";
                else imagenFinal = "https://img.icons8.com/color/150/salami.png"; 
            }
            else if (hasCat("LIMPIEZA", "HIGIENE", "DETERGENTE", "CAPILAR", "DENTAL", "PAPEL")) {
                if (hasStr("PAPEL", "DESECHABLE")) imagenFinal = "https://img.icons8.com/color/150/toilet-paper.png"; 
                else if (hasStr("DETERGENTE", "SUAVIZANTE")) imagenFinal = "https://img.icons8.com/color/150/washing-machine.png"; 
                else if (hasStr("LAVAPLATOS", "CLORO")) imagenFinal = "https://img.icons8.com/color/150/spray.png"; 
                else if (hasStr("DENTAL", "COLGATE")) imagenFinal = "https://img.icons8.com/color/150/tooth.png"; 
                else if (hasStr("CAPILAR", "SHAMPOO")) imagenFinal = "https://img.icons8.com/color/150/shampoo.png"; 
                else if (hasStr("JABON", "PROTEX", "CREMA")) imagenFinal = "https://img.icons8.com/color/150/soap.png"; 
                else imagenFinal = "https://img.icons8.com/color/150/broom.png";
            }
            else if (hasCat("BEBIDA", "SNACK", "REFRESCO", "ENERGIZANTE", "CERVEZA", "DULCE", "CAFE")) {
                if (hasStr("AGUA", "BOTELLA")) imagenFinal = "https://img.icons8.com/color/150/water-bottle.png"; 
                else if (hasStr("ENERGIZANTE", "MONSTER", "RAPTOR")) imagenFinal = "https://img.icons8.com/color/150/energy-drink.png"; 
                else if (hasStr("CERVEZA", "LICOR")) imagenFinal = "https://img.icons8.com/color/150/beer.png"; 
                else if (hasStr("SNACK", "CHURRO", "ZAMBO", "TAQUERITO")) imagenFinal = "https://img.icons8.com/color/150/potato-chips.png"; 
                else if (hasStr("DULCE", "CHOCOLATE")) imagenFinal = "https://img.icons8.com/color/150/candy.png"; 
                else if (hasStr("CAFE", "TE")) imagenFinal = "https://img.icons8.com/color/150/coffee-to-go.png"; 
                else imagenFinal = "https://img.icons8.com/color/150/orange-juice.png"; 
            }
            else if (hasCat("ABARROTE", "DESPENSA", "GRANO", "ACEITE", "PASTA", "ENLATADO", "SALSA", "ESPECIA", "LACTEO", "PANADERIA")) {
                if (hasStr("LACTEO", "QUESO", "MANTEQUILLA", "LECHE")) imagenFinal = "https://img.icons8.com/color/150/cheese.png"; 
                else if (hasStr("HUEVO", "CARTON")) imagenFinal = "https://img.icons8.com/color/150/eggs.png"; 
                else if (hasStr("PAN", "GALLETA")) imagenFinal = "https://img.icons8.com/color/150/bread.png"; 
                else if (hasStr("ACEITE", "MANTECA")) imagenFinal = "https://img.icons8.com/color/150/olive-oil.png"; 
                else if (hasStr("PASTA", "SOPA")) imagenFinal = "https://img.icons8.com/color/150/spaghetti.png"; 
                else if (hasStr("ENLATADO", "SARDINA", "ATUN")) imagenFinal = "https://img.icons8.com/color/150/canned-food.png"; 
                else if (hasStr("SALSA", "MAYONESA")) imagenFinal = "https://img.icons8.com/color/150/ketchup.png"; 
                else if (hasStr("ESPECIA", "AZUCAR", "SAL")) imagenFinal = "https://img.icons8.com/color/150/salt-shaker.png"; 
                else imagenFinal = "https://img.icons8.com/color/150/ingredients.png"; 
            }
            else {
                if (hasStr("MEDICINA", "PASTILLA")) imagenFinal = "https://img.icons8.com/color/150/pill.png"; 
                else if (hasStr("BEBE", "PAÑAL")) imagenFinal = "https://img.icons8.com/color/150/pacifier.png"; 
                else if (hasStr("MASCOTA", "PERRO", "GATO")) imagenFinal = "https://img.icons8.com/color/150/dog-bowl.png"; 
                else if (hasStr("PAPELERIA", "CUADERNO")) imagenFinal = "https://img.icons8.com/color/150/school.png"; 
                else if (hasStr("FERRETERIA", "CLAVO")) imagenFinal = "https://img.icons8.com/color/150/hammer.png"; 
                else if (hasStr("COSMETICO", "MAQUILLAJE")) imagenFinal = "https://img.icons8.com/color/150/lipstick.png"; 
                else imagenFinal = "https://img.icons8.com/color/150/box--v1.png"; 
            }
        }

        let valorStock = prod.stock ? prod.stock.toString().toUpperCase().trim() : "";
        let stockClass = "stock-out", stockText = "NO DISPONIBLE";

        if (valorStock === "DISPONIBLE" || parseInt(valorStock) > 0) { 
            stockClass = "stock-ok"; 
            stockText = "DISPONIBLE"; 
        } else if (valorStock === "NO DISPONIBLE" || parseInt(valorStock) === 0) {
            stockClass = "stock-out"; 
            stockText = "NO DISP."; 
        }

        grid.innerHTML += `
            <div class="card">
                <div class="stock-tag ${stockClass}">${stockText}</div>
                <div class="card-inner">
                    <div class="img-container ${isRealPhoto ? 'clickable' : ''}" ${isRealPhoto ? `onclick="abrirGaleria('${prod.id_unico}')"` : ''}>
                        <img src="${imagenFinal}" onerror="this.src='https://img.icons8.com/color/150/box--v1.png'">
                        ${isRealPhoto && urls.length > 1 ? `<span class="badge-fotos"><i class="fa-solid fa-images"></i> ${urls.length}</span>` : ''}
                    </div>
                    <div class="info-text">
                        <span class="cat-tag">${prod.categoria || 'Genérico'}</span>
                        <h3 title="${prod.nombre}">${prod.nombre}</h3>
                        
                        <div class="price-section">
                            <div class="oferta">Lps. ${formatoMoneda(precioBase)}</div>
                            ${tablaDescuentos}
                        </div>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="btn-add" onclick="agregarAlCarrito('${prod.id_unico}')">
                        <i class="fa-solid fa-plus icon-list"></i>
                        <i class="fa-solid fa-cart-plus icon-grid"></i>
                        <span class="text-grid"> Añadir a la orden</span>
                    </button>
                </div>
                <div class="admin-panel">
                    <div class="admin-header"><i class="fa-solid fa-lock"></i> Datos de Rentabilidad</div>
                    <div class="admin-stats">
                        <div class="stat-box cost"><span>Costo Más Bajo</span><b>Lps. ${formatoMoneda(costoBajo)}</b></div>
                        <div class="stat-box profit"><span>Ganancia Normal</span><b>Lps. ${formatoMoneda(gananciaAutomatica)}</b></div>
                    </div>
                    ${proveedoresHTML ? `<div class="prov-list">${proveedoresHTML}</div>` : ''}
                    <button class="btn-secundario" onclick="abrirModalEditar('${prod.id_unico}')"><i class="fa-solid fa-pen-to-square"></i> Editar Producto</button>
                </div>
            </div>`;
    });
}

function filtrarProductos() {
    const texto = document.getElementById('search-prod').value.toLowerCase();
    const cat = document.getElementById('cat-filter').value;
    const filtrados = productosGlobal.filter(p => {
        const matchTexto = (p.nombre || "").toLowerCase().includes(texto) || (p.marca || "").toLowerCase().includes(texto);
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

function agregarAlCarrito(idUnico) {
    const prod = productosGlobal.find(p => p.id_unico === idUnico);
    const item = carrito.find(i => i.prodCompleto.id_unico === idUnico);
    if (item) item.cantidad++; else carrito.push({ codigo: prod.codigo, nombre: prod.nombre, prodCompleto: prod, cantidad: 1 });
    actualizarCarrito();
    
    mostrarToast("Añadido: " + prod.nombre);
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
    if (carrito.length === 0) contenedor.innerHTML = `<div style="text-align:center; color:var(--text-muted); padding: 50px 0;"><i class="fa-solid fa-basket-shopping" style="font-size:50px; margin-bottom:15px; opacity:0.5;"></i><p style="font-size:1.1rem; font-weight:700;">Tu canasta está vacía</p></div>`;
    
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
                <div class="item-info-header"><div><h4>${item.nombre}</h4><p>Lps. ${formatoMoneda(precioAplicado)} c/u</p></div><div style="text-align:right; font-weight:900; color:var(--text-dark); font-size:1.15rem;">Lps. ${formatoMoneda(subtotalItem)}</div></div>
                <div class="item-controles">
                    <div class="qty-box"><button type="button" class="btn-qty" onclick="restarCantidad(${index})"><i class="fa-solid fa-minus"></i></button><span style="font-weight:900; width:28px; text-align:center;">${item.cantidad}</span><button type="button" class="btn-qty" onclick="sumarCantidad(${index})"><i class="fa-solid fa-plus"></i></button></div>
                    <button type="button" class="btn-remove" onclick="quitarDelCarrito(${index})"><i class="fa-solid fa-trash-can"></i></button>
                </div>
            </div>`;
    });
    let granTotal = subtotalAcumulado > 0 ? Math.ceil(subtotalAcumulado) + 1 : 0;
    document.getElementById('contador-carrito').innerText = cantidadTotal;
    document.getElementById('subtotal-display').innerText = formatoMoneda(subtotalAcumulado);
    document.getElementById('gran-total').innerText = formatoMoneda(granTotal);
}

async function guardarProductoNuevo(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar-prod');
    btn.innerHTML = "<i class='fa-solid fa-circle-notch fa-spin'></i> Guardando..."; btn.disabled = true;
    
    let f1 = document.getElementById('p-foto1').value.trim();
    let f2 = document.getElementById('p-foto2').value.trim();
    let f3 = document.getElementById('p-foto3').value.trim();
    let f4 = document.getElementById('p-foto4').value.trim();
    let f5 = document.getElementById('p-foto5').value.trim();
    let arrFotos = [f1, f2, f3, f4, f5].filter(f => f !== "");
    let fotoUrlCombined = arrFotos.join(',');

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
        fotoUrl: fotoUrlCombined 
    };
    try { 
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(nuevoProd) }); 
        const jsonRes = await res.json();
        if (jsonRes.status === "Error") throw new Error(jsonRes.message);
        localStorage.removeItem('eg_data_cache');
        alert("¡Producto registrado!"); location.reload(); 
    } catch (error) { 
        alert("Error: " + error.message); 
        btn.innerHTML = "<i class='fa-solid fa-cloud-arrow-up'></i> Guardar en Inventario"; btn.disabled = false; 
    }
}

function abrirModalEditar(idUnico) {
    const prod = productosGlobal.find(p => p.id_unico === idUnico);
    if(!prod) return;
    
    // Dejar el código en blanco para la vista, pero guardar el real oculto (o pasarlo internamente)
    document.getElementById('e-codigo').value = prod.codigo || ""; 
    document.getElementById('e-marca').value = prod.marca || "";
    document.getElementById('e-nombre').value = prod.nombre; 
    document.getElementById('e-categoria').value = prod.categoria || "";
    
    // Validamos el estado del stock (DISPONIBLE / NO DISPONIBLE)
    let valorStock = prod.stock ? prod.stock.toString().toUpperCase().trim() : "";
    if (valorStock === "DISPONIBLE" || parseInt(valorStock) > 0) {
        document.getElementById('e-stock').value = "DISPONIBLE";
    } else {
        document.getElementById('e-stock').value = "NO DISPONIBLE";
    }
    
    document.getElementById('e-precio5').value = prod.precio5 || "";
    document.getElementById('e-precio6').value = prod.precio6 || "";
    document.getElementById('e-precio12').value = prod.precio12 || "";
    
    document.getElementById('e-lugar1').value = prod.l1 || ""; document.getElementById('e-precio1').value = prod.p1 || "";
    document.getElementById('e-lugar2').value = prod.l2 || ""; document.getElementById('e-precio2').value = prod.p2 || "";
    document.getElementById('e-lugar3').value = prod.l3 || ""; document.getElementById('e-precio3').value = prod.p3 || "";
    document.getElementById('e-lugar4').value = prod.l4 || ""; document.getElementById('e-precio4').value = prod.p4 || "";
    document.getElementById('e-lugar5').value = prod.l5 || ""; document.getElementById('e-precio5_prov').value = prod.p5 || "";
    document.getElementById('e-lugar6').value = prod.l6 || ""; document.getElementById('e-precio6_prov').value = prod.p6 || "";

    for(let i=3; i<=6; i++) { let row = document.getElementById('e-prov-row'+i); if(row) row.style.display = 'none'; }
    for(let i=3; i<=6; i++) { if(prod['l'+i] || prod['p'+i]) { let row = document.getElementById('e-prov-row'+i); if(row) row.style.display = 'flex'; } }

    document.getElementById('e-costo').value = parseFloat(prod.costoBajo) || 0;
    document.getElementById('e-precio').value = parseFloat(prod.precioUnitario) || 0;
    
    for(let i=1; i<=5; i++) document.getElementById('e-foto'+i).value = "";
    let urls = prod.foto ? prod.foto.toString().split(',').map(u => u.trim()).filter(u => u !== "") : [];
    for(let i=0; i<urls.length && i<5; i++) {
        document.getElementById('e-foto'+(i+1)).value = urls[i];
    }

    document.getElementById('modal-editar-producto').style.display = 'flex';
}

async function guardarEdicionProducto(e) {
    e.preventDefault();
    const btn = document.getElementById('btn-guardar-edicion'); btn.innerHTML = "<i class='fa-solid fa-circle-notch fa-spin'></i> Actualizando..."; btn.disabled = true;
    
    let f1 = document.getElementById('e-foto1').value.trim();
    let f2 = document.getElementById('e-foto2').value.trim();
    let f3 = document.getElementById('e-foto3').value.trim();
    let f4 = document.getElementById('e-foto4').value.trim();
    let f5 = document.getElementById('e-foto5').value.trim();
    let arrFotos = [f1, f2, f3, f4, f5].filter(f => f !== "");
    let fotoUrlCombined = arrFotos.join(',');

    const prodEditado = { 
        accion: "editar_producto", 
        codigo: document.getElementById('e-codigo').value, marca: document.getElementById('e-marca').value, nombre: document.getElementById('e-nombre').value, 
        categoria: document.getElementById('e-categoria').value, stock: document.getElementById('e-stock').value, costo: document.getElementById('e-costo').value, 
        precio: document.getElementById('e-precio').value, precio5: document.getElementById('e-precio5').value, precio6: document.getElementById('e-precio6').value, precio12: document.getElementById('e-precio12').value,
        lugar1: document.getElementById('e-lugar1').value, precio1: document.getElementById('e-precio1').value, lugar2: document.getElementById('e-lugar2').value, precio2: document.getElementById('e-precio2').value,
        lugar3: document.getElementById('e-lugar3').value, precio3: document.getElementById('e-precio3').value, lugar4: document.getElementById('e-lugar4').value, precio4: document.getElementById('e-precio4').value,
        lugar5: document.getElementById('e-lugar5').value, precio5: document.getElementById('e-precio5_prov').value, lugar6: document.getElementById('e-lugar6').value, precio6: document.getElementById('e-precio6_prov').value,
        fotoUrl: fotoUrlCombined
    };
    try { 
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(prodEditado) }); 
        const jsonRes = await res.json();
        if (jsonRes.status === "Error") throw new Error(jsonRes.message);
        localStorage.removeItem('eg_data_cache');
        alert("¡Actualizado exitosamente!"); location.reload(); 
    } catch (error) { 
        alert("Error: " + error.message); 
        btn.innerHTML = "<i class='fa-solid fa-cloud-arrow-up'></i> Actualizar Producto"; btn.disabled = false; 
    }
}

async function guardarCotizacion(e) {
    e.preventDefault();
    if (carrito.length === 0) return alert("Añade productos a la canasta primero.");
    const btn = document.getElementById('btn-guardar');
    btn.innerHTML = "<i class='fa-solid fa-circle-notch fa-spin'></i> Guardando Pedido..."; btn.disabled = true;
    const totalCrudo = document.getElementById('gran-total').innerText.replace(/,/g, '');
    const cotizacion = { accion: "guardar_cotizacion", cliente: document.getElementById('c-nombre').value, tienda: document.getElementById('c-tienda').value, telefono: document.getElementById('c-tel').value, lugar: document.getElementById('c-lugar').value, fechaEntrega: document.getElementById('c-fecha-entrega').value, total: totalCrudo, carrito: carrito };
    try { 
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify(cotizacion) }); 
        const jsonRes = await res.json();
        if (jsonRes.status === "Error") throw new Error(jsonRes.message);
        alert("¡Pedido guardado con éxito!"); 
        localStorage.setItem('activeTab', 'clientes'); 
        location.reload(); 
    } catch (error) { 
        alert("Error: " + error.message); 
        btn.innerHTML = "<i class='fa-solid fa-check-double'></i> Confirmar Pedido"; btn.disabled = false; 
    }
}

async function eliminarCotizacion() {
    const pass = prompt("Acceso de Administrador. Ingrese PIN para eliminar:");
    if (pass !== "199311") { if (pass !== null) alert("PIN incorrecto."); return; }
    if (!confirm("¿Seguro que deseas eliminar esta orden de forma permanente?")) return;

    const c = clientesGlobal[indiceCotizacionActiva];
    const btn = document.querySelector('.btn-eliminar');
    btn.innerHTML = "<i class='fa-solid fa-circle-notch fa-spin'></i> Eliminando..."; btn.disabled = true;

    try {
        const res = await fetch(SCRIPT_URL, { method: 'POST', body: JSON.stringify({ accion: "eliminar_cotizacion", fila: c.fila }) });
        const jsonRes = await res.json();
        if (jsonRes.status === "Error") throw new Error(jsonRes.message);
        alert("Orden eliminada de la base de datos.");
        location.reload();
    } catch (error) {
        alert("Error al eliminar: " + error.message);
        btn.innerHTML = "<i class='fa-solid fa-trash-can'></i> Borrar Orden";
        btn.disabled = false;
    }
}

function renderClientes(clientes) {
    const tbody = document.getElementById('lista-clientes');
    tbody.innerHTML = "";
    clientes.forEach((c, index) => {
        tbody.innerHTML += `
            <tr onclick="abrirDetalle(${index})" style="cursor:pointer;">
                <td data-label="Tienda / Cliente"><strong>${c.tienda}</strong><br><span style="font-size:0.9rem; color:var(--text-muted);">${c.cliente}</span></td>
                <td data-label="Contacto"><span style="color:var(--accent); font-weight:700;">${c.telefono}</span><br><span style="font-size:0.9rem; color:var(--text-muted);">${c.lugar}</span></td>
                <td data-label="Entrega" style="font-weight:700; color:var(--text-dark);">${formatearFecha(c.fechaEntrega)}</td>
                <td data-label="Total" style="font-weight:900; color:var(--success); font-size:1.1rem;">Lps. ${formatoMoneda(c.total)}</td>
                <td data-label="Acción"><button class="btn-secundario" style="width:48px; height:48px; border-radius:14px; font-size:1.1rem; border:none; background:#f1f5f9; color:var(--accent);"><i class="fa-solid fa-angle-right"></i></button></td>
            </tr>`;
    });
}

function abrirDetalle(index) {
    indiceCotizacionActiva = index;
    const c = clientesGlobal[index];
    document.getElementById('detalle-info').innerHTML = `
        <div style="background:var(--card-bg); padding:20px; border-radius:20px; border:1px solid var(--border-light); display:flex; flex-direction:column; gap:12px; box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
            <div style="display:flex; align-items:center; gap:12px;"><div style="background:#eff6ff; width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--accent);"><i class="fa-solid fa-user"></i></div> <strong style="font-size:1.15rem; color:var(--primary);">${c.cliente}</strong></div>
            <div style="display:flex; align-items:center; gap:12px;"><div style="background:#f8fafc; width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--text-muted);"><i class="fa-solid fa-store"></i></div> <span style="font-size:1.05rem; font-weight:700;">${c.tienda}</span></div>
            <div style="display:flex; align-items:center; gap:12px;"><div style="background:#f8fafc; width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--text-muted);"><i class="fa-solid fa-phone"></i></div> <span>${c.telefono}</span></div>
            <div style="display:flex; align-items:center; gap:12px;"><div style="background:#f8fafc; width:36px; height:36px; border-radius:10px; display:flex; align-items:center; justify-content:center; color:var(--text-muted);"><i class="fa-solid fa-location-dot"></i></div> <span>${c.lugar}</span></div>
            <div style="background:#eff6ff; padding:15px; border-radius:14px; margin-top:5px; text-align:center; display:flex; flex-direction:column; gap:5px;">
                <span style="font-size:0.85rem; color:var(--accent); font-weight:800; text-transform:uppercase;">Fecha de Entrega</span>
                <span style="font-size:1.2rem; font-weight:900; color:var(--primary);">${formatearFecha(c.fechaEntrega)}</span>
            </div>
        </div>
        <div style="background:var(--primary); padding:24px; border-radius:20px; margin-top:15px; text-align:center; box-shadow:0 10px 25px rgba(15,23,42,0.15);">
            <span style="display:block; font-size:0.9rem; color:#cbd5e1; font-weight:800; text-transform:uppercase; letter-spacing:1px; margin-bottom:8px;">Total del Pedido</span>
            <span style="font-size:2rem; color:white; font-weight:900;">Lps. ${formatoMoneda(c.total)}</span>
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
                htmlItems += `
                <div style="display:flex; align-items:center; justify-content:space-between; padding:16px; border:1px solid var(--border-light); border-radius:16px; margin-bottom:10px; background:white; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="background:#eff6ff; color:var(--accent); font-weight:900; width:44px; height:44px; border-radius:12px; font-size:1rem; display:flex; align-items:center; justify-content:center;">${item.cantidad}</div>
                        <div style="font-size:1.05rem; font-weight:700; line-height:1.3;">${item.nombre}</div>
                    </div>
                    <div style="font-weight:900; color:var(--success); font-size:1.1rem; white-space:nowrap;">Lps. ${formatoMoneda(precioAplicado * item.cantidad)}</div>
                </div>`; 
            });
        } catch(e) {}
    }
    document.getElementById('detalle-items').innerHTML = htmlItems || "<p style='text-align:center; color:var(--text-muted);'>No hay detalle de productos.</p>";
    document.getElementById('modal-detalle').style.display = 'flex';
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
        htmlItems += `<tr>
            <td style="padding:15px; border-bottom:1px solid #e2e8f0; text-align:center; font-weight:bold;">${item.cantidad}</td>
            <td style="padding:15px; border-bottom:1px solid #e2e8f0; font-weight:600;">${item.nombre}</td>
            <td style="padding:15px; border-bottom:1px solid #e2e8f0; text-align:right;">Lps. ${formatoMoneda(precioAplicado)}</td>
            <td style="padding:15px; border-bottom:1px solid #e2e8f0; text-align:right; font-weight:bold;">Lps. ${formatoMoneda(precioAplicado * item.cantidad)}</td>
        </tr>`;
    });

    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <html><head><title>Ticket de Pedido</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #1e293b; max-width: 800px; margin: 0 auto;}
            .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 25px; margin-bottom: 35px;}
            .header h1 { margin: 0; color: #0f172a; font-size: 28px; font-weight:900;}
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 35px; font-size:15px; line-height:1.7;}
            table { width: 100%; border-collapse: collapse; margin-bottom: 35px; font-size:15px;}
            th { background: #f8fafc; padding: 15px; text-align: left; color: #64748b; border-bottom:2px solid #e2e8f0; font-size:13px; text-transform:uppercase;}
            .total-container { text-align: right; padding-top: 25px; border-top: 2px solid #e2e8f0; display: flex; justify-content: flex-end; align-items: center; gap: 20px; }
            .total-amount { font-size: 26px; font-weight: 900; color: #2563eb; background: #eff6ff; padding: 12px 24px; border-radius: 16px; border: 1px solid #bfdbfe; }
            .footer { text-align: center; font-size: 13px; color: #94a3b8; margin-top: 60px;}
        </style>
        </head><body>
            <div class="header"><h1>E&G DISTRIBUCIONES</h1><p style="margin:5px 0 0 0; color:#64748b; font-weight:600;">Comayagua, Honduras</p></div>
            <div class="info-grid">
                <div><b>Cliente:</b> ${c.cliente}<br><b>Tienda:</b> ${c.tienda}<br><b>Teléfono:</b> ${c.telefono}</div>
                <div style="text-align: right;"><b>N° Pedido:</b> EG-${nOrden}<br><b>Fecha Entrega:</b> ${formatearFecha(c.fechaEntrega)}<br><b>Dirección:</b> ${c.lugar}</div>
            </div>
            <table><thead><tr><th style="width: 10%; text-align:center;">Cant.</th><th>Producto</th><th style="width: 25%; text-align:right;">Precio Unit.</th><th style="width: 25%; text-align:right;">Total</th></tr></thead><tbody>${htmlItems}</tbody></table>
            <div class="total-container"><span style="font-size: 16px; color: #64748b; font-weight: 800; text-transform: uppercase;">Total a Cancelar</span><span class="total-amount">Lps. ${formatoMoneda(c.total)}</span></div>
            <div class="footer">¡Gracias por preferir nuestros servicios!<br><br><b style="color:#1e293b;">Generado por: Gabriel Guerrero</b></div>
            <script>window.print();</script>
        </body></html>
    `);
    ventana.document.close();
}

function generarFacturaAdmin() {
    const pass = prompt("Acceso Administrador. Ingrese PIN:");
    if (pass !== "199311") { if (pass !== null) alert("PIN incorrecto."); return; }

    const c = clientesGlobal[indiceCotizacionActiva];
    let htmlItems = "";
    let gananciaTotalVenta = 0;

    JSON.parse(c.carrito || "[]").forEach(item => {
        let prod = item.prodCompleto || {};
        let precioAplicado = prod.precioUnitario ? parseFloat(prod.precioUnitario) : 0;
        
        if (item.cantidad >= 12 && prod.precio12 > 0) precioAplicado = parseFloat(prod.precio12);
        else if (item.cantidad >= 6 && prod.precio6 > 0) precioAplicado = parseFloat(prod.precio6);
        else if (item.cantidad >= 5 && prod.precio5 > 0) precioAplicado = parseFloat(prod.precio5);

        let costoBajo = parseFloat(prod.costoBajo) || 0;
        if (costoBajo === 0) {
            let preciosProv = [];
            for (let i = 1; i <= 6; i++) { let p = parseFloat(prod['p'+i]); if (!isNaN(p) && p > 0) preciosProv.push(p); }
            costoBajo = preciosProv.length > 0 ? Math.min(...preciosProv) : 0;
        }

        let gananciaTotalItem = (precioAplicado - costoBajo) * item.cantidad;
        gananciaTotalVenta += gananciaTotalItem;

        htmlItems += `<tr>
            <td style="padding:15px; border-bottom:1px solid #334155; text-align:center;">${item.cantidad}</td>
            <td style="padding:15px; border-bottom:1px solid #334155;">${item.nombre}</td>
            <td style="padding:15px; border-bottom:1px solid #334155; text-align:right;">Lps. ${formatoMoneda(costoBajo)}</td>
            <td style="padding:15px; border-bottom:1px solid #334155; text-align:right; color:#60a5fa; font-weight:bold;">Lps. ${formatoMoneda(precioAplicado)}</td>
            <td style="padding:15px; border-bottom:1px solid #334155; text-align:right; font-weight:bold; color:#10b981;">Lps. ${formatoMoneda(gananciaTotalItem)}</td>
        </tr>`;
    });

    const ventana = window.open('', '_blank');
    ventana.document.write(`
        <html><head><title>Rentabilidad Pedido</title>
        <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #f8fafc; background: #0f172a; max-width: 900px; margin: 0 auto;}
            .header { text-align: center; border-bottom: 2px solid #334155; padding-bottom: 25px; margin-bottom: 35px;}
            .info-grid { display: flex; justify-content: space-between; margin-bottom: 35px; font-size:15px; line-height:1.7;}
            table { width: 100%; border-collapse: collapse; margin-bottom: 35px; font-size:15px;}
            th { background: #1e293b; padding: 15px; text-align: left; color: #94a3b8; border-bottom:2px solid #334155; font-size:13px; text-transform:uppercase;}
            .total-container { text-align: right; padding-top: 25px; border-top: 2px solid #334155; display: flex; justify-content: flex-end; align-items: center; gap: 20px; }
            .total-amount { font-size: 26px; font-weight: 900; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 12px 24px; border-radius: 16px; border: 1px solid #059669; }
        </style>
        </head><body>
            <div class="header"><h1 style="margin:0; color:#38bdf8; font-weight:900;">INFORME DE RENTABILIDAD</h1><p style="margin:5px 0 0 0; color:#94a3b8;">USO CONFIDENCIAL E&G</p></div>
            <div class="info-grid">
                <div><b>Despacho a:</b> ${c.cliente} (${c.tienda})<br><b>Teléfono:</b> ${c.telefono}</div>
                <div style="text-align: right;"><b>N° Venta:</b> EG-${Math.floor(Math.random() * 90000) + 10000}<br><b>Ingreso Bruto:</b> Lps. ${formatoMoneda(c.total)}</div>
            </div>
            <table><thead><tr><th style="width: 10%; text-align:center;">Cant.</th><th>Producto</th><th style="text-align:right;">Costo Unit.</th><th style="text-align:right;">Vendido Unit.</th><th style="text-align:right; color:#10b981;">Ganancia Neta</th></tr></thead><tbody>${htmlItems}</tbody></table>
            <div class="total-container"><span style="font-size: 16px; color: #94a3b8; font-weight: 800; text-transform:uppercase;">Ganancia Total del Pedido</span><span class="total-amount">Lps. ${formatoMoneda(gananciaTotalVenta)}</span></div>
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
    let mensaje = `*¡Hola ${c.cliente}!* 👋\nAquí tienes el resumen de tu pedido confirmado con *E&G DISTRIBUCIONES*:\n\n🏢 *Tienda:* ${c.tienda}\n📅 *Fecha de Entrega:* ${formatearFecha(c.fechaEntrega)}\n📍 *Ubicación:* ${c.lugar}\n\n*🛒 Detalle del pedido:*\n`;
    if (c.carrito) { try { JSON.parse(c.carrito).forEach(item => { mensaje += `▪️ ${item.cantidad}x ${item.nombre}\n`; }); } catch(e) {} }
    mensaje += `\n💰 *Total a Cancelar:* Lps. ${formatoMoneda(c.total)}\n\n¡Gracias por preferir nuestro servicio!`;
    window.open(`https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(mensaje)}`, '_blank');
}