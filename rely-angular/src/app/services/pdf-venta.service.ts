// services/pdf-venta.service.ts
import { Injectable } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Configuración del concesionario
const CONCESIONARIO = {
  nombre: 'RELY C.A.',
  rif: 'J-12345678-9',
  direccion: 'Av. Francisco de Miranda, Centro Lido, Nivel PB, Chacao, Caracas',
  ciudad: 'Caracas',
  estado: 'Distrito Capital',
  pais: 'Venezuela',
  telefono: '+58 (212) 555-0123',
  email: 'ventas@autopremiummotors.com',
  web: 'www.autopremiummotors.com',
};

export interface DatosVentaPDF {
  codigoOrden: string;
  fechaVenta: string;
  cliente: {
    nombres: string;
    apellidos: string;
    nacionalidad: string;
    identificacion: string;
    email: string;
    telefono: string;
    direccion: string;
    estado: string;
  };
  vehiculo: {
    marca: string;
    modelo: string;
    version: string;
    año: string;
    color: string;
    motorizacion: string;
    transmision: string;
    vin: string;
    numeroMotor: string;
    numeroChasis: string;
    ubicacion: string;
  };
  pago: {
    precioLista: number;
    moneda: string;
    montoTotal: number;
    montoInicial: number;
    saldoRestante: number;
    metodoPago: string;
    entidadFinanciera?: string;
    referencia: string;
    fechaPago: string;
    cuotas?: number;
    montoCuota?: number;
    tasaCambio?: number;
    numeroCuenta?: string;
    ultimosDigitosTarjeta?: string;
  };
  notas?: string;
}

@Injectable({ providedIn: 'root' })
export class PdfVentaService {

  generarPDFVenta(datos: DatosVentaPDF): Blob {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    // Colores corporativos
    const COLOR_PRIMARIO: [number, number, number] = [30, 60, 114]; // Azul corporativo
    const COLOR_SECUNDARIO: [number, number, number] = [241, 90, 34]; // Naranja
    const COLOR_GRIS_OSCURO: [number, number, number] = [51, 51, 51];
    const COLOR_GRIS_MEDIO: [number, number, number] = [100, 100, 100];
    const COLOR_GRIS_CLARO: [number, number, number] = [220, 220, 220];
    const COLOR_BLANCO: [number, number, number] = [255, 255, 255];

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 15;
    const marginRight = 15;
    const contentWidth = pageWidth - marginLeft - marginRight;

    let yPos = 15;

    // ============================================
    // HEADER DEL CONCESIONARIO
    // ============================================
    // Fondo del header
    doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Borde decorativo inferior
    doc.setFillColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2]);
    doc.rect(0, 40, pageWidth, 3, 'F');

    // Nombre del concesionario
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text(CONCESIONARIO.nombre, pageWidth / 2, 18, { align: 'center' });

    // RIF
    doc.setFontSize(10);
    doc.text(`RIF: ${CONCESIONARIO.rif}`, pageWidth / 2, 26, { align: 'center' });

    // Datos de contacto
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`${CONCESIONARIO.direccion} | ${CONCESIONARIO.ciudad}, ${CONCESIONARIO.estado}`, pageWidth / 2, 33, { align: 'center' });
    doc.text(`Tel: ${CONCESIONARIO.telefono} | Email: ${CONCESIONARIO.email} | Web: ${CONCESIONARIO.web}`, pageWidth / 2, 38, { align: 'center' });

    yPos = 50;

    // ============================================
    // TÍTULO DEL DOCUMENTO
    // ============================================
    doc.setFillColor(248, 249, 250);
    doc.rect(marginLeft, yPos, contentWidth, 15, 'F');
    doc.setDrawColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
    doc.setLineWidth(0.5);
    doc.rect(marginLeft, yPos, contentWidth, 15);

    doc.setTextColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('COMPROBANTE DE COMPRA', pageWidth / 2, yPos + 10, { align: 'center' });
    yPos += 22;

    // ============================================
    // NÚMERO DE ORDEN Y FECHA
    // ============================================
    // Número de orden
    doc.setFillColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2]);
    doc.roundedRect(marginLeft, yPos, 60, 18, 3, 3, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('N° DE ORDEN', marginLeft + 30, yPos + 7, { align: 'center' });
    doc.setFontSize(14);
    doc.text(datos.codigoOrden, marginLeft + 30, yPos + 15, { align: 'center' });

    // Fecha de emisión
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(marginLeft + 70, yPos, contentWidth - 70, 18, 3, 3, 'F');
    doc.setDrawColor(COLOR_GRIS_CLARO[0], COLOR_GRIS_CLARO[1], COLOR_GRIS_CLARO[2]);
    doc.roundedRect(marginLeft + 70, yPos, contentWidth - 70, 18, 3, 3);
    doc.setTextColor(COLOR_GRIS_OSCURO[0], COLOR_GRIS_OSCURO[1], COLOR_GRIS_OSCURO[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Fecha de Emisión: ${datos.fechaVenta}`, marginLeft + 80, yPos + 9);
    doc.text(`Moneda: ${datos.pago.moneda}`, marginLeft + 80, yPos + 15);
    yPos += 25;

    // ============================================
    // DATOS DEL CLIENTE
    // ============================================
    this.agregarTituloSeccion(doc, 'INFORMACIÓN DEL COMPRADOR', marginLeft, yPos, contentWidth, COLOR_PRIMARIO);
    yPos += 12;

    const datosCliente = [
      ['Nombre Completo:', `${datos.cliente.nombres} ${datos.cliente.apellidos}`],
      ['Identificación:', `${datos.cliente.nacionalidad} - ${datos.cliente.identificacion}`],
      ['Email:', datos.cliente.email],
      ['Teléfono:', datos.cliente.telefono],
      ['Dirección:', datos.cliente.direccion],
      ['Estado:', datos.cliente.estado],
    ];

    autoTable(doc, {
      startY: yPos,
      margin: { left: marginLeft + 5, right: marginRight },
      body: datosCliente,
      theme: 'striped',
      styles: { 
        fontSize: 8.5, 
        cellPadding: 3,
        lineColor: [230, 230, 230],
        lineWidth: 0.1
      },
      headStyles: { fillColor: [248, 249, 250] },
      columnStyles: {
        0: { font: 'helvetica', fontStyle: 'bold', cellWidth: 38, textColor: COLOR_GRIS_OSCURO },
        1: { font: 'helvetica', cellWidth: 'auto', textColor: COLOR_GRIS_OSCURO }
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
      tableLineColor: [230, 230, 230],
      tableLineWidth: 0.1,
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // ============================================
    // DATOS DEL VEHÍCULO
    // ============================================
    this.agregarTituloSeccion(doc, 'DETALLES DEL VEHÍCULO', marginLeft, yPos, contentWidth, COLOR_PRIMARIO);
    yPos += 12;

    const datosVehiculo = [
      ['Marca:', datos.vehiculo.marca],
      ['Modelo:', datos.vehiculo.modelo],
      ['Versión:', datos.vehiculo.version],
      ['Año:', datos.vehiculo.año],
      ['Color:', datos.vehiculo.color],
      ['Motorización:', datos.vehiculo.motorizacion],
      ['Transmisión:', datos.vehiculo.transmision],
      ['VIN:', datos.vehiculo.vin],
      ['N° Motor:', datos.vehiculo.numeroMotor],
      ['N° Chasis:', datos.vehiculo.numeroChasis],
      ['Ubicación:', datos.vehiculo.ubicacion],
    ];

    autoTable(doc, {
      startY: yPos,
      margin: { left: marginLeft + 5, right: marginRight },
      body: datosVehiculo,
      theme: 'striped',
      styles: { 
        fontSize: 8.5, 
        cellPadding: 3,
        lineColor: [230, 230, 230],
        lineWidth: 0.1
      },
      columnStyles: {
        0: { font: 'helvetica', fontStyle: 'bold', cellWidth: 38, textColor: COLOR_GRIS_OSCURO },
        1: { font: 'helvetica', cellWidth: 'auto', textColor: COLOR_GRIS_OSCURO }
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 8;

    // Verificar si necesitamos una nueva página
    if (yPos > pageHeight - 100) {
      doc.addPage();
      yPos = 15;
      // Agregar header en nueva página
      doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
      doc.rect(0, 0, pageWidth, 15, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(`${CONCESIONARIO.nombre} - COMPROBANTE DE COMPRA - ${datos.codigoOrden}`, pageWidth / 2, 10, { align: 'center' });
      yPos = 22;
    }

    // ============================================
    // DETALLES DEL PAGO
    // ============================================
    this.agregarTituloSeccion(doc, 'INFORMACIÓN DE PAGO', marginLeft, yPos, contentWidth, COLOR_SECUNDARIO);
    yPos += 12;

    // Tabla de montos
    const datosMontos = [
      ['Precio de Lista:', `${datos.pago.moneda} ${datos.pago.precioLista.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      ['Monto Total de la Venta:', `${datos.pago.moneda} ${datos.pago.montoTotal.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
    ];

    if (datos.pago.montoInicial > 0) {
      datosMontos.push(
        ['Monto Inicial (Abono):', `${datos.pago.moneda} ${datos.pago.montoInicial.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
        ['Saldo Restante:', `${datos.pago.moneda} ${datos.pago.saldoRestante.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`],
      );
    }

    autoTable(doc, {
      startY: yPos,
      margin: { left: marginLeft + 5, right: marginRight },
      body: datosMontos,
      theme: 'plain',
      styles: { 
        fontSize: 9, 
        cellPadding: 4,
      },
      columnStyles: {
        0: { font: 'helvetica', fontStyle: 'bold', cellWidth: 50, textColor: COLOR_GRIS_OSCURO },
        1: { font: 'helvetica', cellWidth: 'auto', textColor: COLOR_PRIMARIO, fontStyle: 'bold' }
      },
      didDrawCell: (data) => {
        // Resaltar saldo restante
        if (data.row.index === 3 && data.column.index === 1) {
          doc.setTextColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2]);
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 5;

    // Detalles del método de pago
    const datosMetodoPago = [
      ['Método de Pago:', datos.pago.metodoPago],
      ['N° de Referencia:', datos.pago.referencia],
      ['Fecha de Pago:', datos.pago.fechaPago],
    ];

    if (datos.pago.entidadFinanciera) {
      datosMetodoPago.splice(1, 0, ['Entidad Financiera:', datos.pago.entidadFinanciera]);
    }

    if (datos.pago.numeroCuenta) {
      datosMetodoPago.splice(2, 0, ['N° de Cuenta:', datos.pago.numeroCuenta]);
    }

    if (datos.pago.ultimosDigitosTarjeta) {
      datosMetodoPago.splice(2, 0, ['Últ. Dígitos Tarjeta:', `****${datos.pago.ultimosDigitosTarjeta}`]);
    }

    if (datos.pago.cuotas && datos.pago.montoCuota) {
      datosMetodoPago.push([
        'Plan de Cuotas:', 
        `${datos.pago.cuotas} cuotas de ${datos.pago.moneda} ${datos.pago.montoCuota.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} c/u`
      ]);
    }

    if (datos.pago.tasaCambio) {
      datosMetodoPago.push(['Tasa de Cambio:', `${datos.pago.tasaCambio.toFixed(2)}`]);
    }

    autoTable(doc, {
      startY: yPos,
      margin: { left: marginLeft + 5, right: marginRight },
      body: datosMetodoPago,
      theme: 'striped',
      styles: { 
        fontSize: 8.5, 
        cellPadding: 3,
      },
      columnStyles: {
        0: { font: 'helvetica', fontStyle: 'bold', cellWidth: 38, textColor: COLOR_GRIS_OSCURO },
        1: { font: 'helvetica', cellWidth: 'auto', textColor: COLOR_GRIS_OSCURO }
      },
      alternateRowStyles: { fillColor: [248, 249, 250] },
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;

    // ============================================
    // NOTAS ADICIONALES
    // ============================================
    if (datos.notas) {
      // Verificar espacio
      if (yPos > pageHeight - 50) {
        doc.addPage();
        yPos = 15;
        doc.setFillColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(`${CONCESIONARIO.nombre} - COMPROBANTE DE COMPRA - ${datos.codigoOrden}`, pageWidth / 2, 10, { align: 'center' });
        yPos = 22;
      }

      this.agregarTituloSeccion(doc, 'NOTAS Y OBSERVACIONES', marginLeft, yPos, contentWidth, COLOR_GRIS_OSCURO);
      yPos += 12;

      // Cuadro para notas
      const notasSplit = doc.splitTextToSize(datos.notas, contentWidth - 10);
      const notasHeight = Math.max(notasSplit.length * 6 + 10, 20);
      
      doc.setDrawColor(COLOR_GRIS_CLARO[0], COLOR_GRIS_CLARO[1], COLOR_GRIS_CLARO[2]);
      doc.setFillColor(252, 252, 252);
      doc.roundedRect(marginLeft + 5, yPos, contentWidth - 10, notasHeight, 3, 3, 'FD');
      
      doc.setTextColor(COLOR_GRIS_OSCURO[0], COLOR_GRIS_OSCURO[1], COLOR_GRIS_OSCURO[2]);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.text(notasSplit, marginLeft + 10, yPos + 7);
      
      yPos += notasHeight + 10;
    }

    // ============================================
    // FOOTER
    // ============================================
    const footerY = pageHeight - 30;

    // Línea decorativa
    doc.setDrawColor(COLOR_PRIMARIO[0], COLOR_PRIMARIO[1], COLOR_PRIMARIO[2]);
    doc.setLineWidth(0.8);
    doc.line(marginLeft, footerY, pageWidth - marginRight, footerY);
    
    doc.setDrawColor(COLOR_SECUNDARIO[0], COLOR_SECUNDARIO[1], COLOR_SECUNDARIO[2]);
    doc.setLineWidth(0.3);
    doc.line(marginLeft, footerY + 2, pageWidth - marginRight, footerY + 2);

    // Texto legal
    doc.setTextColor(COLOR_GRIS_MEDIO[0], COLOR_GRIS_MEDIO[1], COLOR_GRIS_MEDIO[2]);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    const textoLegal = 'Este documento constituye un comprobante de compra válido. La información contenida es confidencial y propiedad exclusiva de RELY C.A. Este comprobante no tiene validez como factura fiscal definitiva.';
    const legalSplit = doc.splitTextToSize(textoLegal, contentWidth);
    doc.text(legalSplit, marginLeft, footerY + 8);
    
    // Datos del concesionario en footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`${CONCESIONARIO.nombre} | RIF: ${CONCESIONARIO.rif} | ${CONCESIONARIO.direccion}`, pageWidth / 2, footerY + 22, { align: 'center' });
    doc.text(`Tel: ${CONCESIONARIO.telefono} | Email: ${CONCESIONARIO.email} | Web: ${CONCESIONARIO.web}`, pageWidth / 2, footerY + 26, { align: 'center' });

    // Generar Blob
    const pdfBlob = doc.output('blob');
    return pdfBlob;
  }

  private agregarTituloSeccion(
    doc: jsPDF, 
    titulo: string, 
    x: number, 
    y: number, 
    width: number, 
    color: [number, number, number]
  ): void {
    // Barra de color
    doc.setFillColor(color[0], color[1], color[2]);
    doc.roundedRect(x, y, width, 7, 2, 2, 'F');
    
    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(titulo, x + 5, y + 5);
  }

  descargarPDF(blob: Blob, nombreArchivo: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = nombreArchivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
}