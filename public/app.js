const state = {
  filters: {},
  sort: {},
  page: 1,
  pageSize: 40,
  rows: [],
  hasMore: true,
  overrideIndice: null,
  selected: {
    grupo_articulo: [],
    centro: [],
    almacen: [],
    anio: ["2025", "2026"],
    moneda: ["MXN"]
  },
  catalogos: {
    grupo_articulo: [],
    centro: [],
    almacen: []
  }
};

const columns = [
  ["area", "ÁREA"], ["no_solcon", "NO. SOLCON"], ["no_contrato", "NO. CONTRATO"],
  ["fecha_contrato", "FECHA CONTRATO"], ["pos", "POS."], ["material", "MATERIAL"],
  ["texto_breve", "TEXTO BREVE"], ["ce", "CE."], ["no_proveedor", "NO. PROVEEDOR"],
  ["nombre_proveedor", "NOMBRE PROVEEDOR"], ["grupo_articulos", "GRUPO ARTÍCULOS"],
  ["posicion_reparto", "POSICIÓN REPARTO"], ["cantidad_reparto", "CANTIDAD REPARTO"],
  ["fecha_entrega", "FECHA ENTREGA"], ["almacen", "ALMACÉN"], ["uma", "UMA"],
  ["mon", "MON"], ["precio_unitario", "PRECIO UNITARIO"], ["importe_total", "IMPORTE TOTAL"],
  ["factor_ajuste", "FACTOR DE AJUSTE"], ["precio_unitario_actualizado", "PRECIO UNITARIO ACTUALIZADO"],
  ["importe_total_actualizado", "IMPORTE TOTAL ACTUALIZADO"]
];

const qs = (id) => document.getElementById(id);
const YEARS = ["2019", "2020", "2021", "2022", "2023", "2024", "2025", "2026"];
const MONEDAS = ["MXN", "USD", "EUR"];

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  return response.json();
}

function renderCustomDropdown(key, targetId, placeholder = "Todas") {
  const selected = state.selected[key];
  const list = state.catalogos[key];
  const text = selected.length ? `${selected.length} seleccionados` : placeholder;

  qs(targetId).innerHTML = `
    <button type="button" class="dd-trigger" data-dd-trigger="${key}">${text}<span>▼</span></button>
    <div class="dd-menu" data-dd-menu="${key}">
      <div class="dd-actions">
        <button type="button" data-dd-all="${key}">TODOS</button>
        <button type="button" data-dd-clear="${key}">LIMPIAR</button>
      </div>
      <div class="dd-list">
        ${list
          .map(
            (item) => `<label><input type="checkbox" data-dd-item="${key}" value="${item}" ${selected.includes(item) ? "checked" : ""}/> ${item}</label>`
          )
          .join("")}
      </div>
    </div>`;
}

function renderYears() {
  qs("anio_chips").innerHTML = YEARS.map((year) => `<button type="button" data-year="${year}" class="chip ${state.selected.anio.includes(year) ? "active" : ""}">${year}</button>`).join("");
}

function renderMonedas() {
  qs("moneda_checks").innerHTML = MONEDAS.map((m) => `<label><input type="checkbox" data-moneda="${m}" ${state.selected.moneda.includes(m) ? "checked" : ""}/> ${m === "MXN" ? "MXP" : m}</label>`).join("");
}

async function loadCatalogos() {
  const [grupos, centros, almacenes, indices] = await Promise.all([
    fetchJson("/catalogos/grupo-articulo"),
    fetchJson("/catalogos/centros"),
    fetchJson("/catalogos/almacenes"),
    fetchJson("/catalogos/indices")
  ]);

  state.catalogos.grupo_articulo = grupos;
  state.catalogos.centro = centros;
  state.catalogos.almacen = almacenes;

  renderCustomDropdown("grupo_articulo", "grupo_articulo_dd");
  renderCustomDropdown("centro", "centro_dd");
  renderCustomDropdown("almacen", "almacen_dd");
  renderYears();
  renderMonedas();

  qs("indices-inpc").innerHTML = indices
    .filter((i) => i.tipo === "nacional" && i.familia === "INPC")
    .map((i) => `<button data-indice="${i.codigo}" class="index-button">${i.nombre}</button>`)
    .join("");
  qs("indices-inpp").innerHTML = indices
    .filter((i) => i.tipo === "nacional" && i.familia === "INPP")
    .map((i) => `<button data-indice="${i.codigo}" class="index-button">${i.nombre}</button>`)
    .join("");
  qs("indices-internacional").innerHTML = indices
    .filter((i) => i.tipo === "internacional")
    .map((i) => `<button data-indice="${i.codigo}" class="index-button">${i.nombre}</button>`)
    .join("");
}

function readFilters() {
  return {
    no_contrato: qs("no_contrato").value.trim(),
    no_solcon: qs("no_solcon").value.trim(),
    no_proveedor: qs("no_proveedor").value.trim(),
    nombre_proveedor: qs("nombre_proveedor").value.trim(),
    grupo_articulo: state.selected.grupo_articulo,
    centro: state.selected.centro,
    texto_breve: qs("texto_breve").value.trim(),
    no_material: qs("no_material").value.trim(),
    almacen: state.selected.almacen,
    anio: state.selected.anio,
    moneda: state.selected.moneda
  };
}

function num(v) {
  return v == null ? "-" : Number(v).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function renderHeaders() {
  qs("headers").innerHTML = columns.map(([key, label]) => `<th data-field="${key}">${label}</th>`).join("");
}

function renderRows() {
  qs("rows").innerHTML = state.rows.map((row) => `<tr>${columns.map(([key]) => `<td>${typeof row[key] === "number" ? num(row[key]) : row[key] ?? ""}</td>`).join("")}</tr>`).join("");
}

async function consultar(reset = true) {
  if (reset) {
    state.page = 1;
    state.rows = [];
    state.hasMore = true;
  }

  const response = await fetchJson("/bdpr/consulta", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filters: state.filters, sort: state.sort, page: state.page, pageSize: state.pageSize, overrideIndice: state.overrideIndice })
  });

  state.rows = state.rows.concat(response.rows);
  state.hasMore = response.pagination.hasMore;
  renderRows();

  qs("kpi-contratos").textContent = Number(response.kpis.total_contratos_distinct).toLocaleString("es-MX");
  qs("kpi-proveedores").textContent = Number(response.kpis.proveedores_distinct).toLocaleString("es-MX");
  qs("indice-meta").textContent = response.indice_sugerido_por_moneda;
  qs("indice-aplicado").textContent = response.indice_aplicado;
  qs("indice-origen").textContent = response.indice_origen;
  qs("pill-inpc").textContent = `INPC: ${response.fecha_actualizacion_indices}`;
  qs("fecha-indices").textContent = `Última actualización de índices: ${response.fecha_actualizacion_indices}`;
  qs("advertencia").textContent = response.advertencia || "";
  qs("total-base").textContent = num(response.totales.importe_total_sum);
  qs("total-act").textContent = num(response.totales.importe_total_actualizado_sum);
}

function clearFilters() {
  document.querySelectorAll("input[type='text'], input[type='number']").forEach((input) => (input.value = ""));
  state.selected = { grupo_articulo: [], centro: [], almacen: [], anio: ["2025", "2026"], moneda: ["MXN"] };
  renderCustomDropdown("grupo_articulo", "grupo_articulo_dd");
  renderCustomDropdown("centro", "centro_dd");
  renderCustomDropdown("almacen", "almacen_dd");
  renderYears();
  renderMonedas();
  state.overrideIndice = null;
}

function bindEvents() {
  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-dd-trigger]");
    const menu = event.target.closest("[data-dd-menu]");

    if (trigger) {
      const key = trigger.dataset.ddTrigger;
      document.querySelectorAll(".dd-menu.open").forEach((m) => m.classList.remove("open"));
      const target = document.querySelector(`[data-dd-menu='${key}']`);
      if (target) target.classList.toggle("open");
      return;
    }

    if (!menu) {
      document.querySelectorAll(".dd-menu.open").forEach((m) => m.classList.remove("open"));
    }
  });

  document.addEventListener("change", (event) => {
    const item = event.target.dataset.ddItem;
    if (item) {
      const value = event.target.value;
      if (event.target.checked) state.selected[item] = [...state.selected[item], value];
      else state.selected[item] = state.selected[item].filter((v) => v !== value);
      renderCustomDropdown(item, `${item}_dd`);
      return;
    }

    const moneda = event.target.dataset.moneda;
    if (moneda) {
      if (event.target.checked) state.selected.moneda = [...state.selected.moneda, moneda];
      else state.selected.moneda = state.selected.moneda.filter((v) => v !== moneda);
    }
  });

  document.addEventListener("click", (event) => {
    const keyAll = event.target.dataset.ddAll;
    if (keyAll) {
      state.selected[keyAll] = [...state.catalogos[keyAll]];
      renderCustomDropdown(keyAll, `${keyAll}_dd`);
      return;
    }
    const keyClear = event.target.dataset.ddClear;
    if (keyClear) {
      state.selected[keyClear] = [];
      renderCustomDropdown(keyClear, `${keyClear}_dd`);
      return;
    }

    const y = event.target.dataset.year;
    if (y) {
      if (state.selected.anio.includes(y)) state.selected.anio = state.selected.anio.filter((v) => v !== y);
      else state.selected.anio = [...state.selected.anio, y];
      renderYears();
    }
  });

  qs("buscar").onclick = () => {
    state.filters = readFilters();
    consultar(true);
  };

  qs("limpiar").onclick = () => {
    clearFilters();
    state.filters = readFilters();
    consultar(true);
  };

  function closeIndiceDrawer() {
    qs("indice-panel").classList.remove("open");
    qs("drawer-backdrop").classList.add("hidden");
  }

  qs("cambiar-indice").onclick = () => {
    qs("indice-panel").classList.add("open");
    qs("drawer-backdrop").classList.remove("hidden");
  };

  qs("drawer-backdrop").onclick = closeIndiceDrawer;

  qs("indice-panel").onclick = (event) => {
    const indice = event.target.dataset.indice;
    if (!indice) return;
    state.overrideIndice = indice;
    closeIndiceDrawer();
    consultar(true);
  };

  document.addEventListener("click", (event) => {
    const drawer = qs("indice-panel");
    const openButton = qs("cambiar-indice");
    if (!drawer.classList.contains("open")) return;
    if (drawer.contains(event.target) || openButton.contains(event.target)) return;
    closeIndiceDrawer();
  });

  qs("descargar").onclick = () => qs("export-modal").classList.remove("hidden");
  qs("cerrar-modal").onclick = () => qs("export-modal").classList.add("hidden");

  document.querySelector(".modal-content").onclick = async (event) => {
    const mode = event.target.dataset.mode;
    if (!mode) return;
    const out = await fetchJson("/bdpr/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, limit: Number(event.target.dataset.limit || 0) })
    });
    qs("export-status").textContent = JSON.stringify(out, null, 2);
  };

  qs("headers").onclick = (event) => {
    const field = event.target.dataset.field;
    if (!field) return;
    state.sort = { field, direction: state.sort.field === field && state.sort.direction === "asc" ? "desc" : "asc" };
    consultar(true);
  };

  qs("table-wrap").addEventListener("scroll", () => {
    const tableWrap = qs("table-wrap");
    if (tableWrap.scrollTop + tableWrap.clientHeight >= tableWrap.scrollHeight - 20 && state.hasMore) {
      state.page += 1;
      consultar(false);
    }
  });
}

async function init() {
  renderHeaders();
  await loadCatalogos();
  bindEvents();
  state.filters = readFilters();
  await consultar(true);
}

init();
