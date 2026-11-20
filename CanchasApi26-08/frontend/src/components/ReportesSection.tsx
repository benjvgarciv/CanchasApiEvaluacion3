import React, { useState, useEffect } from 'react';
import { canchasService } from '../api/canchasService';
import {
  FileSpreadsheet,
  Download,
  Printer,
  CheckCircle,
  RefreshCw,
} from 'lucide-react';

export const ReportesSection: React.FC = () => {
  const [tipoReporte, setTipoReporte] = useState<'operativo' | 'gerencial' | 'parametrizable'>('operativo');
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [itemsOperativos, setItemsOperativos] = useState<any[]>([]);
  const [datosGerenciales, setDatosGerenciales] = useState<any | null>(null);
  const [mensajeAuditoria, setMensajeAuditoria] = useState<string | null>(null);

  const cargarDatos = async () => {
    setLoading(true);
    setMensajeAuditoria(null);
    try {
      if (tipoReporte === 'operativo' || tipoReporte === 'parametrizable') {
        const res = await canchasService.getReporteOperativo({
          fechaInicio: fechaInicio ? `${fechaInicio}T00:00:00` : undefined,
          fechaFin: fechaFin ? `${fechaFin}T23:59:59` : undefined,
          estado: estadoFiltro || undefined,
          page: 1,
          pageSize: 100,
        });
        setItemsOperativos(res.items || []);
      } else {
        const res = await canchasService.getReporteGerencial();
        setDatosGerenciales(res);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [tipoReporte, estadoFiltro]);

  // Exportar a CSV (UTF-8 con BOM)
  const exportarCsv = async () => {
    try {
      await canchasService.registrarLogExportacion(`Reporte ${tipoReporte}`, 'CSV');
      setMensajeAuditoria('Exportación a CSV registrada en auditoría del sistema.');
    } catch {}

    let csvContent = '\uFEFF'; // BOM para compatibilidad con Excel y UTF-8
    if (tipoReporte === 'gerencial' && datosGerenciales) {
      csvContent += 'Sede;Total Reservas;Completadas;Canceladas;Ingresos Totales\n';
      datosGerenciales.sedes?.forEach((s: any) => {
        csvContent += `"${s.sede}";${s.totalReservas};${s.completadas};${s.canceladas};${s.ingresosTotales}\n`;
      });
      csvContent += `\n"TOTAL CONSOLIDADO";${datosGerenciales.totalesGenerales?.totalReservas};;;${datosGerenciales.totalesGenerales?.totalIngresos}\n`;
    } else {
      csvContent += 'ID;Cliente;Email;Cancha;Sede;Fecha Inicio;Fecha Fin;Estado;Monto;Metodo Pago\n';
      itemsOperativos.forEach((r: any) => {
        csvContent += `${r.id};"${r.cliente}";"${r.clienteEmail}";"${r.cancha}";"${r.sede}";"${r.fechaInicio}";"${r.fechaFin}";"${r.estado}";${r.montoTotal};"${r.metodoPago}"\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_${tipoReporte}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar a Excel (Formato XML Spreadsheet nativo soportado por MS Excel)
  const exportarExcel = async () => {
    try {
      await canchasService.registrarLogExportacion(`Reporte ${tipoReporte}`, 'Excel (XLSX)');
      setMensajeAuditoria('Exportación a Excel registrada en auditoría del sistema.');
    } catch {}

    let rowsHtml = '';
    if (tipoReporte === 'gerencial' && datosGerenciales) {
      rowsHtml += `
        <tr style="background-color: #1e3a8a; color: #ffffff; font-weight: bold;">
          <th>Sede</th><th>Total Reservas</th><th>Completadas</th><th>Canceladas</th><th>Ingresos Totales ($)</th>
        </tr>`;
      datosGerenciales.sedes?.forEach((s: any) => {
        rowsHtml += `<tr><td>${s.sede}</td><td>${s.totalReservas}</td><td>${s.completadas}</td><td>${s.canceladas}</td><td>${s.ingresosTotales}</td></tr>`;
      });
      rowsHtml += `<tr style="background-color: #f1f5f9; font-weight: bold;"><td>TOTAL GENERAL</td><td>${datosGerenciales.totalesGenerales?.totalReservas}</td><td>-</td><td>-</td><td>$${datosGerenciales.totalesGenerales?.totalIngresos}</td></tr>`;
    } else {
      rowsHtml += `
        <tr style="background-color: #1e3a8a; color: #ffffff; font-weight: bold;">
          <th>ID</th><th>Cliente</th><th>Email</th><th>Cancha</th><th>Sede</th><th>Fecha Inicio</th><th>Fecha Fin</th><th>Estado</th><th>Monto</th><th>Método Pago</th>
        </tr>`;
      itemsOperativos.forEach((r: any) => {
        rowsHtml += `<tr><td>${r.id}</td><td>${r.cliente}</td><td>${r.clienteEmail}</td><td>${r.cancha}</td><td>${r.sede}</td><td>${r.fechaInicio}</td><td>${r.fechaFin}</td><td>${r.estado}</td><td>${r.montoTotal}</td><td>${r.metodoPago}</td></tr>`;
      });
    }

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8"/><title>Reporte Canchas</title></head>
      <body>
        <h2>Reporte ${tipoReporte.toUpperCase()} - Complejos Deportivos</h2>
        <p>Fecha de Emisión: ${new Date().toLocaleString('es-CL')}</p>
        <table border="1">${rowsHtml}</table>
      </body>
      </html>`;

    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `reporte_${tipoReporte}_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Exportar / Imprimir PDF
  const imprimirReporte = async () => {
    try {
      await canchasService.registrarLogExportacion(`Reporte ${tipoReporte}`, 'Impresión / PDF');
      setMensajeAuditoria('Exportación a PDF / Impresión registrada en auditoría.');
    } catch {}
    window.print();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Encabezado y Selector de Reporte */}
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
            Centro de Reportes y Exportación
          </h2>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
            Generación de informes operativos, financieros y gerenciales con descarga en Excel, PDF, CSV e impresión limpia.
          </p>
        </div>

        {/* Acciones de exportación */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={exportarExcel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              backgroundColor: '#15803d',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Excel (.xlsx)</span>
          </button>

          <button
            onClick={exportarCsv}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Download size={16} />
            <span>CSV (UTF-8)</span>
          </button>

          <button
            onClick={imprimirReporte}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.6rem 1rem',
              backgroundColor: '#475569',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <Printer size={16} />
            <span>PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {mensajeAuditoria && (
        <div className="no-print" style={{ padding: '0.75rem 1rem', backgroundColor: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', color: '#065f46', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <CheckCircle size={16} />
          <span>{mensajeAuditoria}</span>
        </div>
      )}

      {/* Pestañas de Selección de Reporte */}
      <div className="no-print" style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setTipoReporte('operativo')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: tipoReporte === 'operativo' ? '#1e40af' : 'transparent',
            color: tipoReporte === 'operativo' ? '#ffffff' : '#475569',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          1. Reporte Operativo (Detalle)
        </button>

        <button
          onClick={() => setTipoReporte('gerencial')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: tipoReporte === 'gerencial' ? '#1e40af' : 'transparent',
            color: tipoReporte === 'gerencial' ? '#ffffff' : '#475569',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          2. Reporte Gerencial (Consolidado)
        </button>

        <button
          onClick={() => setTipoReporte('parametrizable')}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: tipoReporte === 'parametrizable' ? '#1e40af' : 'transparent',
            color: tipoReporte === 'parametrizable' ? '#ffffff' : '#475569',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          3. Reporte Parametrizable (Fechas)
        </button>
      </div>

      {/* Filtros Parametrizables */}
      {(tipoReporte === 'operativo' || tipoReporte === 'parametrizable') && (
        <div className="no-print" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Fecha Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Fecha Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '0.25rem' }}>Estado:</label>
            <select
              value={estadoFiltro}
              onChange={(e) => setEstadoFiltro(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.85rem' }}
            >
              <option value="">Todos los estados</option>
              <option value="Completada">Completada</option>
              <option value="Confirmada">Confirmada</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Cancelada">Cancelada</option>
            </select>
          </div>

          <button
            onClick={cargarDatos}
            style={{
              padding: '0.55rem 1rem',
              backgroundColor: '#1e40af',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Aplicar Filtros
          </button>
        </div>
      )}

      {/* Contenedor Imprimible del Reporte */}
      <div
        className="printable-area"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-md)',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Cabecera formal para la versión impresa */}
        <div style={{ borderBottom: '2px solid #0f172a', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.25rem' }}>
              COMPLEJOS DEPORTIVOS S.A.
            </h1>
            <h3 style={{ fontSize: '1.1rem', color: '#475569', margin: '0 0 0.25rem' }}>
              {tipoReporte === 'gerencial' ? 'INFORME GERENCIAL CONSOLIDADO' : `REPORTE ${tipoReporte.toUpperCase()} DE ARRIENDOS`}
            </h3>
            <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b' }}>
              Filtros: {fechaInicio ? `Desde: ${fechaInicio}` : 'Histórico completo'} {fechaFin ? `Hasta: ${fechaFin}` : ''} | Estado: {estadoFiltro || 'Todos'}
            </p>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
            <div><strong>Emisión:</strong> {new Date().toLocaleDateString('es-CL')}</div>
            <div><strong>Hora:</strong> {new Date().toLocaleTimeString('es-CL')}</div>
            <div><strong>Seguridad:</strong> Confidencial / Auditoría Activa</div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem', color: '#2563eb' }} />
            <p>Generando reporte...</p>
          </div>
        ) : tipoReporte === 'gerencial' && datosGerenciales ? (
          <div>
            {/* Resumen Totales Gerenciales */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Total Reservas Procesadas</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a' }}>{datosGerenciales.totalesGenerales?.totalReservas}</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Facturación Consolidada</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#16a34a' }}>${datosGerenciales.totalesGenerales?.totalIngresos?.toLocaleString('es-CL')}</div>
              </div>
              <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Ticket Medio por Arriendo</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#2563eb' }}>${Math.round(datosGerenciales.totalesGenerales?.ticketPromedio || 0).toLocaleString('es-CL')}</div>
              </div>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Sede Operativa</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Reservas</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Completadas</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Canceladas</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Facturación ($)</th>
                </tr>
              </thead>
              <tbody>
                {datosGerenciales.sedes?.map((s: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{s.sede}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{s.totalReservas}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#16a34a' }}>{s.completadas}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#dc2626' }}>{s.canceladas}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>${s.ingresosTotales?.toLocaleString('es-CL')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e3a8a', color: '#ffffff' }}>
                  <th style={{ padding: '0.65rem', textAlign: 'left' }}>ID</th>
                  <th style={{ padding: '0.65rem', textAlign: 'left' }}>Cliente</th>
                  <th style={{ padding: '0.65rem', textAlign: 'left' }}>Cancha / Sede</th>
                  <th style={{ padding: '0.65rem', textAlign: 'left' }}>Fecha y Hora</th>
                  <th style={{ padding: '0.65rem', textAlign: 'center' }}>Estado</th>
                  <th style={{ padding: '0.65rem', textAlign: 'right' }}>Monto</th>
                  <th style={{ padding: '0.65rem', textAlign: 'center' }}>Método Pago</th>
                </tr>
              </thead>
              <tbody>
                {itemsOperativos.map((r: any, idx: number) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                    <td style={{ padding: '0.6rem' }}>#{r.id}</td>
                    <td style={{ padding: '0.6rem' }}>
                      <div style={{ fontWeight: 600 }}>{r.cliente}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.clienteEmail}</div>
                    </td>
                    <td style={{ padding: '0.6rem' }}>
                      <div>{r.cancha}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.sede}</div>
                    </td>
                    <td style={{ padding: '0.6rem' }}>
                      {new Date(r.fechaInicio).toLocaleDateString('es-CL')} {new Date(r.fechaInicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: r.estado === 'Completada' ? '#ecfdf5' : r.estado === 'Cancelada' ? '#fef2f2' : '#eff6ff', color: r.estado === 'Completada' ? '#059669' : r.estado === 'Cancelada' ? '#dc2626' : '#2563eb' }}>
                        {r.estado}
                      </span>
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'right', fontWeight: 700 }}>
                      ${r.montoTotal?.toLocaleString('es-CL')}
                    </td>
                    <td style={{ padding: '0.6rem', textAlign: 'center' }}>{r.metodoPago}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pie de página oficial para versión impresa */}
        <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #cbd5e1', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
          <span>Documento Oficial de Reportería - Plataforma de Gestión de Canchas</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
};
