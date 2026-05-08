import { Component } from '@angular/core';

interface PlanStep {
  title: string;
  percentage: number;
  description: string;
  details: string[];
  icon: string;
  estimatedAmount: string;
  variant: 'contract' | 'customs' | 'delivery';
}

@Component({
  standalone: false,
  selector: 'app-purchase-plan',
  templateUrl: './purchase-plan.component.html',
  styleUrls: ['./purchase-plan.component.css'],
})
export class PurchasePlanComponent {
  steps: PlanStep[] = [
    {
      title: 'Contrato',
      percentage: 60,
      description: 'Firma y reserva tu vehículo',
      details: [
        'Certificado de origen incluido',
        'Factura comercial',
        'Reserva de producción'
      ],
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      estimatedAmount: '$15,900 USD',
      variant: 'contract'
    },
    {
      title: 'Aduana',
      percentage: 30,
      description: 'Nacionalización y trámites',
      details: [
        'Gestión aduanal completa',
        'Impuestos y aranceles',
        'Permisos de importación'
      ],
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      estimatedAmount: '$7,950 USD',
      variant: 'customs'
    },
    {
      title: 'Entrega',
      percentage: 10,
      description: 'Recibe tu RELY R8',
      details: [
        'Placas y registro',
        'Título de propiedad',
        'Garantía de fábrica'
      ],
      icon: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4',
      estimatedAmount: '$2,650 USD',
      variant: 'delivery'
    }
  ];

  reserveNow(): void {
    console.log('Iniciando reserva...');
    // Aquí iría la lógica de reserva
  }

  contactSeller(): void {
    console.log('Contactando vendedor...');
    // Aquí iría la lógica de contacto
  }
}