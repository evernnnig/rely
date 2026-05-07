import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BaseCatalogService } from './catalogos.service';
import { Pais, Estado } from './catalogos.model';

@Injectable({ providedIn: 'root' })
export class PaisesService extends BaseCatalogService<Pais> {
  constructor(http: HttpClient) {
    super(http, 'paises'); // Le pasamos el endpoint específico
  }
}