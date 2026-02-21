# Banco de Precios de Referencia (BDPR) - CFE

Implementación MVP web con:

- Consulta unificada con filtros, KPIs, tabla con scroll infinito y ordenamiento.
- Panel lateral **Cambiar Índice** (nacional/internacional) con override manual.
- Regla automática por moneda (USD→CPI-U, EUR→IPCA Eurozona, default INPC).
- Cálculo de factor de ajuste y precios actualizados vía `Factor_Indice`.
- Modal de exportación (CSV limitado o job de exportación completa).
- API mínima de catálogos, consulta, cambio de índice y export.

## Ejecutar

```bash
npm install
npm start
```

Aplicación: `http://localhost:3000`

## Endpoints

- `GET /catalogos/grupo-articulo`
- `GET /catalogos/centros`
- `GET /catalogos/almacenes`
- `GET /catalogos/monedas`
- `GET /catalogos/indices`
- `POST /bdpr/consulta`
- `POST /bdpr/cambiar-indice`
- `POST /bdpr/export`
- `GET /bdpr/export/status/:jobId`
