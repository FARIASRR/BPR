const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveIndice, consultarBDPR } = require('../src/services/bdprService');

test('resolveIndice prioriza override manual', () => {
  const out = resolveIndice({ monedaFilter: ['USD'], overrideIndice: 'INPP' });
  assert.equal(out.indice_aplicado, 'INPP');
  assert.equal(out.indice_origen, 'manual');
});

test('resolveIndice usa auto_moneda para USD', () => {
  const out = resolveIndice({ monedaFilter: ['USD'], overrideIndice: null });
  assert.equal(out.indice_aplicado, 'CPI-U');
  assert.equal(out.indice_origen, 'auto_moneda');
});

test('consulta calcula columnas actualizadas y kpis', () => {
  const out = consultarBDPR({
    filters: { moneda: ['EUR'] },
    page: 1,
    pageSize: 5
  });
  assert.ok(out.kpis.total_contratos_distinct > 0);
  assert.equal(out.rows.length, 5);
  assert.notEqual(out.rows[0].precio_unitario_actualizado, null);
});
