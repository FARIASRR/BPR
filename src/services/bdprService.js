const { contratos, factorIndice } = require("../data");

const factorLookup = new Map(
  factorIndice.map((item) => [`${item.indice}|${item.periodo}`, item.factor_hasta_ultimo])
);

function getIndiceSugerido(moneda) {
  if (moneda === "USD") return "CPI-U";
  if (moneda === "EUR") return "CP0000EZ19M086NEST";
  return "INPC";
}

function resolveIndice({ monedaFilter, overrideIndice }) {
  if (overrideIndice) {
    return {
      indice_sugerido_por_moneda: monedaFilter.length === 1 ? getIndiceSugerido(monedaFilter[0]) : "INPC",
      indice_aplicado: overrideIndice,
      indice_origen: "manual",
      advertencia:
        monedaFilter.length > 1
          ? "Se detectaron múltiples monedas; el índice manual se aplicó a toda la consulta."
          : null
    };
  }

  if (monedaFilter.length === 1) {
    return {
      indice_sugerido_por_moneda: getIndiceSugerido(monedaFilter[0]),
      indice_aplicado: getIndiceSugerido(monedaFilter[0]),
      indice_origen: "auto_moneda",
      advertencia: null
    };
  }

  return {
    indice_sugerido_por_moneda: "INPC",
    indice_aplicado: "INPC",
    indice_origen: "default_inpc",
    advertencia:
      monedaFilter.length > 1
        ? "Para sugerencia automática por moneda, selecciona solo una moneda. Se aplicó INPC por defecto."
        : null
  };
}

function applyFilters(rows, filters) {
  return rows.filter((r) => {
    if (filters.no_contrato_solcon) {
      const q = filters.no_contrato_solcon;
      if (!r.no_contrato.includes(q) && !r.no_solcon.includes(q)) return false;
    }
    if (filters.no_contrato && !r.no_contrato.includes(filters.no_contrato)) return false;
    if (filters.no_solcon && !r.no_solcon.includes(filters.no_solcon)) return false;
    if (filters.no_proveedor && Number(filters.no_proveedor) !== r.no_proveedor) return false;
    if (
      filters.nombre_proveedor &&
      !r.nombre_proveedor.toLowerCase().includes(filters.nombre_proveedor.toLowerCase())
    )
      return false;
    if (filters.texto_breve && !r.texto_breve.toLowerCase().includes(filters.texto_breve.toLowerCase()))
      return false;
    if (filters.no_material && Number(filters.no_material) !== r.material) return false;
    if (filters.grupo_articulo?.length && !filters.grupo_articulo.includes(r.grupo_articulos)) return false;
    if (filters.centro?.length && !filters.centro.includes(r.ce)) return false;
    if (filters.almacen?.length && !filters.almacen.includes(r.almacen)) return false;
    if (filters.anio?.length && !filters.anio.includes(String(r.anio))) return false;
    if (filters.moneda?.length && !filters.moneda.includes(r.mon)) return false;
    return true;
  });
}

function computeRow(row, indiceAplicado) {
  const factor = factorLookup.get(`${indiceAplicado}|${row.periodo_inicial_factor}`);
  const precioActualizado = factor == null ? null : Number((row.precio_unitario * (1 + factor)).toFixed(2));
  const importeActualizado = factor == null ? null : Number((row.importe_total * (1 + factor)).toFixed(2));

  return {
    ...row,
    factor_ajuste: factor ?? null,
    precio_unitario_actualizado: precioActualizado,
    importe_total_actualizado: importeActualizado
  };
}

function sortRows(rows, sort) {
  if (!sort?.field) return rows;
  const direction = sort.direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = a[sort.field];
    const bv = b[sort.field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * direction;
    return String(av).localeCompare(String(bv), "es", { numeric: true }) * direction;
  });
}

function monthMinusOne() {
  const now = new Date();
  now.setMonth(now.getMonth() - 1);
  return now.toISOString().slice(0, 7);
}

function consultarBDPR({ filters = {}, sort = {}, page = 1, pageSize = 50, overrideIndice = null }) {
  const monedaFilter = filters.moneda || [];
  const indice = resolveIndice({ monedaFilter, overrideIndice });
  const filtrado = applyFilters(contratos, filters).map((row) => computeRow(row, indice.indice_aplicado));
  const ordenado = sortRows(filtrado, sort);

  const start = (page - 1) * pageSize;
  const rows = ordenado.slice(start, start + pageSize);

  const contratosDistinct = new Set(filtrado.map((r) => r.no_contrato)).size;
  const proveedoresDistinct = new Set(filtrado.map((r) => r.no_proveedor)).size;

  return {
    kpis: {
      total_contratos_distinct: contratosDistinct,
      proveedores_distinct: proveedoresDistinct
    },
    rows,
    pagination: {
      page,
      pageSize,
      totalRows: filtrado.length,
      hasMore: start + pageSize < filtrado.length
    },
    totales: {
      importe_total_sum: Number(filtrado.reduce((acc, r) => acc + r.importe_total, 0).toFixed(2)),
      importe_total_actualizado_sum: Number(
        filtrado.reduce((acc, r) => acc + (r.importe_total_actualizado ?? 0), 0).toFixed(2)
      )
    },
    ...indice,
    fecha_actualizacion_indices: monthMinusOne()
  };
}

module.exports = { consultarBDPR, resolveIndice, getIndiceSugerido };
