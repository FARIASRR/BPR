const gruposArticulo = ["Transformadores", "Conductores", "Herrajes", "Aisladores", "Medición"];
const centros = ["C100", "C200", "C300", "C400"];
const almacenes = ["ALM-NTE", "ALM-CEN", "ALM-SUR"];
const monedas = ["MXN", "USD", "EUR"];

const centroAreaMap = {
  C100: "Distribución Norte",
  C200: "Transmisión Centro",
  C300: "Generación Sur",
  C400: "Proyectos Estratégicos"
};

const indicesCatalogo = [
  { codigo: "INPC", nombre: "INPC México", tipo: "nacional" },
  { codigo: "CPI-U", nombre: "CPI-U (USA)", tipo: "internacional" },
  { codigo: "CP0000EZ19M086NEST", nombre: "IPCA Eurozona", tipo: "internacional" },
  { codigo: "INPP", nombre: "INPP México", tipo: "nacional" }
];

const factorIndice = [
  ["2023-01", 0.16, 0.08, 0.07, 0.14],
  ["2023-07", 0.12, 0.06, 0.05, 0.11],
  ["2024-01", 0.09, 0.05, 0.045, 0.08],
  ["2024-07", 0.06, 0.04, 0.035, 0.055],
  ["2025-01", 0.035, 0.025, 0.02, 0.03],
  ["2025-07", 0.02, 0.015, 0.01, 0.018]
].flatMap(([periodo, inpc, cpi, ipca, inpp]) => [
  { indice: "INPC", periodo, factor_hasta_ultimo: inpc },
  { indice: "CPI-U", periodo, factor_hasta_ultimo: cpi },
  { indice: "CP0000EZ19M086NEST", periodo, factor_hasta_ultimo: ipca },
  { indice: "INPP", periodo, factor_hasta_ultimo: inpp }
]);

function pick(arr, seed) {
  return arr[seed % arr.length];
}

const contratos = Array.from({ length: 250 }, (_, i) => {
  const year = 2019 + (i % 7);
  const month = ((i % 12) + 1).toString().padStart(2, "0");
  const centro = pick(centros, i * 7);
  const moneda = pick(monedas, i * 11);
  const precio = Number((1200 + (i % 17) * 54.33).toFixed(2));
  const cantidad = 10 + (i % 23);
  const importeTotal = Number((precio * cantidad).toFixed(2));
  const periodoInicial = i % 2 === 0 ? "2024-01" : "2025-01";

  return {
    id: i + 1,
    area: centroAreaMap[centro],
    no_solcon: `SOL-${100000 + i}`,
    no_contrato: `45000${(i % 80).toString().padStart(3, "0")}`,
    fecha_contrato: `${year}-${month}-15`,
    pos: (i % 10) + 1,
    material: 900000 + i,
    texto_breve: `Material estratégico ${i + 1}`,
    ce: centro,
    no_proveedor: 7000 + (i % 42),
    nombre_proveedor: `Proveedor ${(i % 42) + 1}`,
    grupo_articulos: pick(gruposArticulo, i * 5),
    posicion_reparto: (i % 4) + 1,
    cantidad_reparto: cantidad,
    fecha_entrega: `${year}-${month}-28`,
    almacen: pick(almacenes, i * 3),
    uma: "PZA",
    mon: moneda,
    precio_unitario: precio,
    importe_total: importeTotal,
    periodo_inicial_factor: periodoInicial,
    anio: year
  };
});

module.exports = {
  gruposArticulo,
  centros,
  almacenes,
  monedas,
  indicesCatalogo,
  factorIndice,
  contratos,
  centroAreaMap
};
