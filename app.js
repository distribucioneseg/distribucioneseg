// ====== ¡PEGA AQUÍ TU URL DE GOOGLE APPS SCRIPT! ======
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw4uODpOX0kTxp8G0RvmQLZQjpH9VR63qvSG9oE9jmzL-62dQt-wI0gmp1c785tHb-3/exec';

let productosGlobal = [];
let clientesGlobal = [];
let carrito = [];

// Inicializar la app
window.onload = async () => {
    document.getElementById('productos-grid').innerHTML = "<p>Cargando datos desde Sheets...</p>";
    try {
        const respuesta = await fetch(SCRIPT_URL);
        const data = await respuesta.json();
        productosGlobal = data.productos;
        clientesGlobal = data.clientes;
        
        cargarCategorias();
        renderProductos(productosGlobal);
        renderClientes(clientesGlobal);
    } catch (error) {
        console.error("Error cargando datos: ", error);
        document.getElementById('productos-grid').innerHTML = "<p>Error al conectar con la base de datos.</p>";
    }
};

// Pestañas
function switchTab(tab) {
    document.querySelectorAll('.view-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tabs button').forEach(el => el.classList.remove('active'));
    document.getElementById(`view-${tab}`).classList.add('active');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// Renderizar Productos
function renderProductos(productos) {
    const grid = document.getElementById('productos-grid');
    grid.innerHTML = "";
    productos.forEach((prod, index) => {
        let precioFinal = prod.oferta && prod.oferta > 0 ? prod.oferta : prod.precio;
        let htmlOferta = prod.oferta ? `<div class="precio">Lps. ${prod.precio}</div><div class="oferta">Lps. ${prod.oferta}</div>` : `<div class="oferta">Lps. ${prod.precio}</div>`;
        
        grid.innerHTML += `
            <div class="card">
                <img src="${prod.foto}" alt="${prod.nombre}">
                <div style="font-size: 0.8rem; color: #7f8c8d; margin-top:5px;">${prod.categoria}</div>
                <h3>${prod.nombre}</h3>
                ${htmlOferta}
                <button class="btn-add" onclick="agregarAlCarrito(${index}, ${precioFinal})">Agregar al Carrito</button>
            </div>
        `;
    });
}

function cargarCategorias() {
    const categorias = [...new Set(productosGlobal.map(p => p.categoria))];
    const select = document.getElementById('cat-filter');
    categorias.forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function filtrarProductos() {
    const texto = document.getElementById('search-prod').value.toLowerCase();
    const cat = document.getElementById('cat-filter').value;
    
    const filtrados = productosGlobal.filter(p => {
        const coincideTexto = p.nombre.toLowerCase().includes(texto);
        const coincideCat = cat === "Todas" || p.categoria === cat;
        return coincideTexto && coincideCat;
    });
    renderProductos(filtrados);
}

// Lógica del Carrito
function agregarAlCarrito(index, precio) {
    const prod = productosGlobal[index];
    const itemExistente = carrito.find(i => i.nombre === prod.nombre);
    if (itemExistente) {
        itemExistente.cantidad++;
    } else {
        carrito.push({ nombre: prod.nombre, precio: precio, cantidad: 1 });
    }
    actualizarCarrito();
}

function quitarDelCarrito(index) {
    carrito.splice(index, 1);
    actualizarCarrito();
}

function actualizarCarrito() {
    const contenedor = document.getElementById('carrito-items');
    contenedor.innerHTML = "";
    let total = 0;
    
    carrito.forEach((item, index) => {
        const subtotal = item.precio * item.cantidad;
        total += subtotal;
        contenedor.innerHTML += `
            <div class="item-carrito">
                <span>${item.cantidad}x ${item.nombre}</span>
                <span>Lps. ${subtotal.toFixed(2)} <button class="btn-remove" onclick="quitarDelCarrito(${index})">X</button></span>
            </div>
        `;
    });
    
    document.getElementById('gran-total').innerText = total.toFixed(2);
}

// Guardar Cotización
async function guardarCotizacion(e) {
    e.preventDefault();
    if (carrito.length === 0) {
        alert("El carrito está vacío");
        return;
    }

    const btnGuardar = document.getElementById('btn-guardar');
    btnGuardar.innerText = "Guardando...";
    btnGuardar.disabled = true;

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
        await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(cotizacion)
        });
        alert("¡Cotización guardada exitosamente en Sheets!");
        
        // Limpiar
        carrito = [];
        actualizarCarrito();
        document.getElementById('form-cotizacion').reset();
    } catch (error) {
        alert("Error al guardar. Intenta de nuevo.");
    } finally {
        btnGuardar.innerText = "Guardar Cotización";
        btnGuardar.disabled = false;
    }
}

// Filtrar Clientes en la Pestaña 2
function renderClientes(clientes) {
    const tbody = document.getElementById('lista-clientes');
    tbody.innerHTML = "";
    clientes.forEach(c => {
        // Formatear fecha para evitar strings larguísimos de JS
        let fecha = new Date(c.fechaEntrega).toLocaleDateString();
        tbody.innerHTML += `
            <tr>
                <td>${c.cliente}</td>
                <td>${c.tienda}</td>
                <td>${c.telefono}</td>
                <td>${c.lugar}</td>
                <td>${fecha}</td>
                <td>Lps. ${c.total}</td>
            </tr>
        `;
    });
}

function filtrarClientes() {
    const texto = document.getElementById('search-client').value.toLowerCase();
    const filtrados = clientesGlobal.filter(c => 
        c.cliente.toLowerCase().includes(texto) || 
        c.tienda.toLowerCase().includes(texto) ||
        c.lugar.toLowerCase().includes(texto)
    );
    renderClientes(filtrados);
}
