import { Component } from '@angular/core';

@Component({
  standalone: false,
  selector: 'app-download',
  templateUrl: './app-download.component.html',
  styleUrls: ['./app-download.component.css'],
})
export class AppDownloadComponent {
  
  downloadApk(): void {
    // Ruta del APK dentro de tu proyecto (en la carpeta assets)
    const apkUrl = '/assets/apk/rely-app-v1.0.0.apk';
    
    // Crear un elemento de descarga temporal
    const link = document.createElement('a');
    link.href = apkUrl;
    link.download = 'RELY-App-v1.0.0.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Opcional: Mostrar mensaje de descarga iniciada
    console.log('Descargando RELY App v1.0.0...');
  }
}