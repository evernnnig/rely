import { Component, HostListener } from '@angular/core';

interface VehicleVersion {
  id: string;
  name: string;
  tag: string;
  year: number;
  engine: string;
  transmission: string;
  traction: string;
  description: string;
  motorDetail: string;
  tractionDetail: string;
  price: number;
  image: string;
}

interface GalleryImage {
  src: string;
  alt: string;
  title: string;
  description: string;
  label: string;
}

@Component({
  standalone: false,
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.css'],
})
export class GalleryComponent {
  images: GalleryImage[] = [
    {
      src: '/photo_2026-03-24_07-09-28_(2).jpg',
      alt: 'RELY R8 Vista Frontal',
      title: 'Diseño Imponente',
      description: 'La parrilla frontal impone respeto en cada camino',
      label: 'Frontal'
    },
    {
      src: '/photo_2026-03-24_07-09-28.jpg',
      alt: 'RELY R8 Vista Lateral',
      title: 'Silueta Aerodinámica',
      description: 'Líneas que cortan el viento con estilo y eficiencia',
      label: 'Lateral'
    },
    {
      src: '/photo_2026-03-24_07-09-28_(2).jpg',
      alt: 'RELY R8 Interior',
      title: 'Habitáculo Premium',
      description: 'Confort y tecnología en perfecta armonía',
      label: 'Interior'
    },
    {
      src: '/photo_2026-03-24_07-09-28.jpg',
      alt: 'RELY R8 Off-Road',
      title: 'Aventura sin Límites',
      description: 'Domina cualquier terreno con tracción 4WD',
      label: 'Off-Road'
    }
  ];

  selectedImage: string | null = null;
  selectedImageTitle: string | null = null;
  selectedIndex: number = 0;
  isLightboxOpen: boolean = false;
  lightboxIndex: number = 0;

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.isLightboxOpen) {
      switch(event.key) {
        case 'ArrowRight':
          this.nextImage();
          break;
        case 'ArrowLeft':
          this.prevImage();
          break;
        case 'Escape':
          this.closeLightbox();
          break;
      }
    }
  }

  selectImage(image: GalleryImage, index: number): void {
    this.selectedImage = image.src;
    this.selectedImageTitle = image.title;
    this.selectedIndex = index;
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;
    this.isLightboxOpen = true;
    document.body.style.overflow = 'hidden';
  }

  closeLightbox(): void {
    this.isLightboxOpen = false;
    document.body.style.overflow = 'auto';
  }

  nextImage(): void {
    if (this.lightboxIndex < this.images.length - 1) {
      this.lightboxIndex++;
    }
  }

  prevImage(): void {
    if (this.lightboxIndex > 0) {
      this.lightboxIndex--;
    }
  }

  versions: VehicleVersion[] = [
    {
      id: 'confort',
      name: 'RELY R8 Confort',
      tag: 'TOP',
      year: 2025,
      engine: '2.4L GASOLINA',
      transmission: '5MT',
      traction: '4WD',
      description: 'La pickup 4WD más accesible con todo lo esencial.',
      motorDetail: '2.4L Gasolina',
      tractionDetail: '4WD',
      price: 32500,
      image: '/photo_2026-03-24_07-09-28_(2).jpg'
    },
    {
      id: 'luxury',
      name: 'RELY R8 Luxury',
      tag: 'TOP',
      year: 2025,
      engine: '2.4L GASOLINA',
      transmission: '5MT',
      traction: '4WD',
      description: 'Equipamiento premium con asientos en cuero, 4 airbags y más.',
      motorDetail: '2.4L Gasolina',
      tractionDetail: '4WD',
      price: 37400,
      image: '/photo_2026-03-24_07-09-28.jpg'
    },
    {
      id: 'limited',
      name: 'RELY R8 Limited',
      tag: 'TOP',
      year: 2025,
      engine: '2.3T DIESEL',
      transmission: 'BAT',
      traction: '4WD',
      description: 'La versión tope de línea con motor diesel turbo 2.3T.',
      motorDetail: '2.3T Diesel',
      tractionDetail: '4WD',
      price: 42240,
      image: '/photo_2026-03-24_07-09-28_(2).jpg'
    }
  ];

  configureVehicle(versionId: string): void {
    console.log(`Configurando versión: ${versionId}`);
  }
}