import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../src/environments/environment';

// Usamos <T> para que el servicio sea "Genérico"
export class BaseCatalogService<T> {
  
  // La URL cambiará dependiendo de qué catálogo estemos consultando
  protected url: string;

  constructor(
    protected http: HttpClient, 
    protected endpoint: string // Ejemplo: 'paises', 'estados'
  ) {
    this.url = `${environment.apiBaseUrl}/api/catalogos/pais/`;
  }

  getAll(): Observable<T[]> {
    return this.http.get<T[]>(this.url);
  }

  getById(id: number | string): Observable<T> {
    return this.http.get<T>(`${this.url}${id}/`);
  }

  create(item: T): Observable<T> {
    return this.http.post<T>(this.url, item);
  }

  update(id: number, item: T): Observable<T> {
    return this.http.put<T>(`${this.url}${id}/`, item);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.url}${id}/`);
  }
}