/**
 * app.js
 * Lógica de la aplicación: navegación, formularios, renderizado y CRUD.
 */

let editId = null;
let tipoActual = 'Domicilio';

// ─────────────────────────────────────────────
// Navegación
// ─────────────────────────────────────────────

function showSection(s) {
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('nav button').forEach(el => el.classList.remove('active'));
  document.getElementById('sec-' + s).classList.add('active');
  const idx = ['pedidos', 'nuevo', 'menu', 'inventario'].indexOf(s);
  document.querySelectorAll('nav button')[idx].classList.add('active');
  if (s === 'nuevo') resetForm();
}

// ─────────────────────────────────────────────
// Formulario de nuevo pedido
// ─────────────────────────────────────────────

function setTipo(t, btn) {
  tipoActual = t;
  document.querySelectorAll('.type-tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('bloque-domicilio').style.display = t === 'Domicilio' ? '' : 'none';
  document.getElementById('bloque-local').style.display     = t === 'Local'     ? '' : 'none';
}

function resetForm() {
  editId = null;
  document.getElementById('form-titulo').textContent = 'Nuevo Pedido';

  ['f-nombre', 'f-telefono', 'f-notas', 'f-direccion', 'f-dest-nombre',
   'f-dest-tel', 'f-clave', 'f-rec-nombre', 'f-rec-tel'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  ['f-ramo', 'f-pago', 'f-horario-entrega', 'f-horario-local'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  document.getElementById('f-fecha-entrega').value = '';
  document.getElementById('alert-form').innerHTML   = '';
  setTipo('Domicilio', document.querySelectorAll('.type-tab')[0]);
}

function guardarPedido() {
  const nombre   = v('f-nombre');
  const telefono = v('f-telefono');
  const ramo     = v('f-ramo');

  if (!nombre || !telefono || !ramo) {
    alerta('alert-form', 'Por favor completa los campos obligatorios (*)', 'error');
    return;
  }

  if (tipoActual === 'Domicilio') {
    if (!v('f-direccion') || !v('f-dest-nombre') || !v('f-dest-tel') || !v('f-fecha-entrega')) {
      alerta('alert-form', 'Completa todos los datos de envío a domicilio', 'error');
      return;
    }
  } else {
    if (!v('f-rec-nombre') || !v('f-rec-tel')) {
      alerta('alert-form', 'Completa los datos de recolección en local', 'error');
      return;
    }
  }

  const hoy = new Date().toISOString().split('T')[0];

  db.run(`
    INSERT INTO pedidos(
      cliente_nombre, cliente_tel, ramo, tipo, estado, pago, notas, fecha_pedido,
      dir_direccion, dir_dest_nombre, dir_dest_tel, dir_fecha_entrega, dir_horario, dir_clave,
      loc_rec_nombre, loc_rec_tel, loc_horario
    ) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `, [
    nombre, telefono, ramo, tipoActual, 'Pendiente',
    v('f-pago'), v('f-notas'), hoy,
    v('f-direccion'), v('f-dest-nombre'), v('f-dest-tel'),
    v('f-fecha-entrega'), v('f-horario-entrega'), v('f-clave'),
    v('f-rec-nombre'), v('f-rec-tel'), v('f-horario-local')
  ]);

  saveDB();
  renderAll();
  alerta('alert-form', '✅ Pedido guardado exitosamente', 'success');
  setTimeout(() => showSection('pedidos'), 800);
}

// ─────────────────────────────────────────────
// Renderizado de pedidos y estadísticas
// ─────────────────────────────────────────────

function renderAll() {
  renderPedidos();
  renderRamos();
  renderStats();
  fillSelectRamos();
}

function renderPedidos() {
  const buscar = document.getElementById('buscar').value.toLowerCase();
  const est    = document.getElementById('filtro-estado').value;
  const tipo   = document.getElementById('filtro-tipo').value;

  let sql = "SELECT * FROM pedidos WHERE 1=1";
  const args = [];
  if (est)  { sql += " AND estado=?"; args.push(est); }
  if (tipo) { sql += " AND tipo=?";   args.push(tipo); }
  sql += " ORDER BY id DESC";

  const rows     = execSQL(sql, args);
  const filtered = buscar
    ? rows.filter(r =>
        r.cliente_nombre.toLowerCase().includes(buscar) ||
        r.cliente_tel.includes(buscar)
      )
    : rows;

  const tbody = document.getElementById('tabla-pedidos');

  if (!filtered.length) {
    tbody.innerHTML = `<tr><td colspan="9" class="empty">No hay pedidos registrados</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(r => `
    <tr>
      <td style="color:var(--text-l);font-size:.8rem;">#${r.id}</td>
      <td><strong>${r.cliente_nombre}</strong></td>
      <td>${r.cliente_tel}</td>
      <td>${r.ramo}</td>
      <td><span class="badge badge-${r.tipo.toLowerCase()}">${r.tipo}</span></td>
      <td style="font-size:.82rem;color:var(--text-m);">${r.fecha_pedido}</td>
      <td>
        <select name="estado"
          class="badge badge-${r.estado.toLowerCase()}"
          onchange="cambiarEstado(${r.id}, this.value)"
          style="border:none;cursor:pointer;font-size:.72rem;padding:.2rem .5rem;border-radius:20px;font-weight:500;">
          <option ${r.estado === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
          <option ${r.estado === 'Entregado' ? 'selected' : ''}>Entregado</option>
          <option ${r.estado === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
        </select>
      </td>
      <td style="font-size:.82rem;">${r.pago || '—'}</td>
      <td>
        <div class="actions">
          <button class="btn btn-edit btn-sm"   onclick="editarPedido(${r.id})">✏️</button>
          <button class="btn btn-danger btn-sm" onclick="eliminarPedido(${r.id})">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

function renderStats() {
  const all        = execSQL("SELECT estado FROM pedidos");
  const total      = all.length;
  const pendientes = all.filter(r => r.estado === 'Pendiente').length;
  const entregados = all.filter(r => r.estado === 'Entregado').length;
  const cancelados = all.filter(r => r.estado === 'Cancelado').length;

  document.getElementById('stats-bar').innerHTML = `
    <div class="stat-card">
      <div class="stat-label">Total pedidos</div>
      <div class="stat-val">${total}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Pendientes</div>
      <div class="stat-val" style="color:var(--amber)">${pendientes}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Entregados</div>
      <div class="stat-val" style="color:var(--verde)">${entregados}</div>
    </div>
    <div class="stat-card">
      <div class="stat-label">Cancelados</div>
      <div class="stat-val" style="color:var(--rojo)">${cancelados}</div>
    </div>
  `;
}

function cambiarEstado(id, val) {
  db.run("UPDATE pedidos SET estado=? WHERE id=?", [val, id]);
  saveDB();
  renderStats();
  renderPedidos();
}

// ─────────────────────────────────────────────
// Modal de edición
// ─────────────────────────────────────────────

function editarPedido(id) {
  const r    = execSQL("SELECT * FROM pedidos WHERE id=?", [id])[0];
  editId     = id;
  const esDom = r.tipo === 'Domicilio';

  document.getElementById('modal-body').innerHTML = `
    <div class="form-grid">
      <div class="form-group"><label>Cliente</label>
        <input id="e-nombre" value="${r.cliente_nombre}">
      </div>
      <div class="form-group"><label>Teléfono cliente</label>
        <input id="e-tel" value="${r.cliente_tel}">
      </div>
      <div class="form-group"><label>Ramo</label>
        <input id="e-ramo" value="${r.ramo}">
      </div>
      <div class="form-group"><label>Estado</label>
        <select id="e-estado">
          <option ${r.estado === 'Pendiente'  ? 'selected' : ''}>Pendiente</option>
          <option ${r.estado === 'Entregado'  ? 'selected' : ''}>Entregado</option>
          <option ${r.estado === 'Cancelado'  ? 'selected' : ''}>Cancelado</option>
        </select>
      </div>
      <div class="form-group"><label>Pago</label>
        <select id="e-pago">
          <option value="" ${!r.pago ? 'selected' : ''}>Sin especificar</option>
          <option ${r.pago === 'Efectivo'      ? 'selected' : ''}>Efectivo</option>
          <option ${r.pago === 'Tarjeta'       ? 'selected' : ''}>Tarjeta</option>
          <option ${r.pago === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
        </select>
      </div>
      <div class="form-group"><label>Tipo</label>
        <input id="e-tipo" value="${r.tipo}" readonly style="opacity:.6">
      </div>
      ${esDom ? `
        <div class="form-group full"><label>Dirección</label>
          <input id="e-dir" value="${r.dir_direccion || ''}">
        </div>
        <div class="form-group"><label>Destinatario</label>
          <input id="e-dest-n" value="${r.dir_dest_nombre || ''}">
        </div>
        <div class="form-group"><label>Tel. destinatario</label>
          <input id="e-dest-t" value="${r.dir_dest_tel || ''}">
        </div>
        <div class="form-group"><label>Fecha entrega</label>
          <input type="date" id="e-fecha" value="${r.dir_fecha_entrega || ''}">
        </div>
        <div class="form-group"><label>Clave acceso</label>
          <input id="e-clave" value="${r.dir_clave || ''}">
        </div>
      ` : `
        <div class="form-group"><label>Quien recoge</label>
          <input id="e-rec-n" value="${r.loc_rec_nombre || ''}">
        </div>
        <div class="form-group"><label>Tel. quien recoge</label>
          <input id="e-rec-t" value="${r.loc_rec_tel || ''}">
        </div>
      `}
      <div class="form-group full"><label>Notas</label>
        <textarea id="e-notas">${r.notas || ''}</textarea>
      </div>
    </div>
  `;

  document.getElementById('modal-overlay').classList.add('open');
}

function guardarEdicion() {
  const r     = execSQL("SELECT * FROM pedidos WHERE id=?", [editId])[0];
  const esDom = r.tipo === 'Domicilio';

  db.run(`
    UPDATE pedidos SET
      cliente_nombre=?, cliente_tel=?, ramo=?, estado=?, pago=?, notas=?,
      dir_direccion=?, dir_dest_nombre=?, dir_dest_tel=?, dir_fecha_entrega=?, dir_clave=?,
      loc_rec_nombre=?, loc_rec_tel=?
    WHERE id=?
  `, [
    gv('e-nombre'), gv('e-tel'), gv('e-ramo'), gv('e-estado'), gv('e-pago'), gv('e-notas'),
    esDom ? gv('e-dir')    : r.dir_direccion,
    esDom ? gv('e-dest-n') : r.dir_dest_nombre,
    esDom ? gv('e-dest-t') : r.dir_dest_tel,
    esDom ? gv('e-fecha')  : r.dir_fecha_entrega,
    esDom ? gv('e-clave')  : r.dir_clave,
    !esDom ? gv('e-rec-n') : r.loc_rec_nombre,
    !esDom ? gv('e-rec-t') : r.loc_rec_tel,
    editId
  ]);

  saveDB();
  cerrarModal();
  renderAll();
}

function cerrarModal() {
  document.getElementById('modal-overlay').classList.remove('open');
}

// Cerrar modal al hacer clic fuera
document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target === this) cerrarModal();
});

function eliminarPedido(id) {
  if (!confirm('¿Eliminar este pedido? Esta acción no se puede deshacer.')) return;
  db.run("DELETE FROM pedidos WHERE id=?", [id]);
  saveDB();
  renderAll();
}

// ─────────────────────────────────────────────
// Ramos / Menú
// ─────────────────────────────────────────────

function renderRamos() {
  const rows = execSQL("SELECT * FROM ramos ORDER BY nombre");
  const el   = document.getElementById('lista-ramos');

  if (!rows.length) {
    el.innerHTML = '<p style="color:var(--text-l);font-size:.9rem;">No hay ramos en el menú.</p>';
    return;
  }

  el.innerHTML = rows.map(r => `
    <div style="display:flex;align-items:center;justify-content:space-between;
                padding:.5rem 0;border-bottom:1px solid var(--border);">
      <span style="font-size:.9rem;">🌹 ${r.nombre}</span>
      <button class="btn btn-danger btn-sm" onclick="eliminarRamo(${r.id})">🗑️</button>
    </div>
  `).join('');
}

function agregarRamo() {
  const nombre = document.getElementById('m-nombre').value.trim();
  if (!nombre) return;
  db.run("INSERT INTO ramos(nombre) VALUES(?)", [nombre]);
  document.getElementById('m-nombre').value = '';
  saveDB();
  renderRamos();
  fillSelectRamos();
}

function eliminarRamo(id) {
  if (!confirm('¿Eliminar este ramo del menú?')) return;
  db.run("DELETE FROM ramos WHERE id=?", [id]);
  saveDB();
  renderRamos();
  fillSelectRamos();
}

function fillSelectRamos() {
  const rows = execSQL("SELECT * FROM ramos ORDER BY nombre");
  const sel  = document.getElementById('f-ramo');
  const cur  = sel.value;
  sel.innerHTML =
    '<option value="">Seleccionar ramo...</option>' +
    rows.map(r => `<option ${r.nombre === cur ? 'selected' : ''}>${r.nombre}</option>`).join('');
}

// ─────────────────────────────────────────────
// Utilidades
// ─────────────────────────────────────────────

/** Lee el valor de un campo del formulario principal. */
function v(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/** Lee el valor de un campo del modal de edición. */
function gv(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

/** Muestra un mensaje de alerta temporal. */
function alerta(containerId, msg, tipo) {
  document.getElementById(containerId).innerHTML =
    `<div class="alert alert-${tipo}">${msg}</div>`;
  setTimeout(() => {
    const el = document.getElementById(containerId);
    if (el) el.innerHTML = '';
  }, 3500);
}
