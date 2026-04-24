import { Component } from '@angular/core';

interface Feature {
  iconPath: string;
  title: string;
  description: string;
}

@Component({
  standalone: false,
  selector: 'app-features',
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.css'],
})
export class FeaturesComponent {
  features: Feature[] = [
    {
      iconPath: 'M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83',
      title: 'Rendimiento Superior',
      description: 'Motor de alta potencia diseñado para cualquier desafío',
    },
    {
      iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      title: 'Todo Terreno',
      description: 'Capacidad extrema para conquistar cualquier camino',
    },
    {
      iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      title: 'Seguridad Avanzada',
      description: 'Tecnología de protección de última generación',
    },
    {
      iconPath: 'M13 10V3L4 14h7v7l9-11h-7z',
      title: 'Eficiencia Energética',
      description: 'Optimización de combustible sin sacrificar potencia',
    },
  ];
}
