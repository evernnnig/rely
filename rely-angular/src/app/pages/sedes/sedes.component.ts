import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { SedesService, Sede, CreateSedePayload } from '../../services/sedes.service';

@Component({
  standalone: false,
  selector: 'app-sedes',
  templateUrl: './sedes.component.html',
  styleUrls: ['./sedes.component.css'],
})
export class SedesComponent implements OnInit {
  sedes: Sede[] = [];
  isLoading = false;
  error = '';

  isFormOpen = false;
  isSubmitting = false;
  formError = '';
  editingId: number | null = null;

  form: CreateSedePayload = this.emptyForm();

  constructor(private sedesService: SedesService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.loadSedes();
  }

  async loadSedes(): Promise<void> {
    this.isLoading = true;
    this.error = '';
    try {
      this.sedes = await this.sedesService.getSedes();
    } catch (e: any) {
      this.error = e.message || 'Error al cargar sedes';
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  get sedesActivas(): number { return this.sedes.filter(s => s.activa).length; }
  get totalVehiculos(): number { return this.sedes.reduce((acc, s) => acc + s.total_vehiculos, 0); }

  openCrear(): void {
    this.editingId = null;
    this.form = this.emptyForm();
    this.formError = '';
    this.isFormOpen = true;
  }

  openEditar(sede: Sede): void {
    this.editingId = sede.id;
    this.form = {
      codigo_sede: sede.codigo_sede,
      nombre: sede.nombre,
      ciudad: sede.ciudad,
      direccion: sede.direccion,
      telefono: sede.telefono || '',
      email: sede.email || '',
      activa: sede.activa,
    };
    this.formError = '';
    this.isFormOpen = true;
  }

  closeForm(): void {
    this.isFormOpen = false;
  }

  async submitForm(): Promise<void> {
    if (!this.form.codigo_sede || !this.form.nombre || !this.form.ciudad || !this.form.direccion) {
      this.formError = 'Código, nombre, ciudad y dirección son obligatorios.';
      return;
    }
    this.isSubmitting = true;
    this.formError = '';
    try {
      if (this.editingId) {
        const updated = await this.sedesService.updateSede(this.editingId, this.form);
        const idx = this.sedes.findIndex(s => s.id === this.editingId);
        if (idx !== -1) this.sedes[idx] = updated;
      } else {
        const nueva = await this.sedesService.createSede(this.form);
        this.sedes.unshift(nueva);
      }
      this.closeForm();
    } catch (e: any) {
      this.formError = e.message || 'Error al guardar la sede';
    } finally {
      this.isSubmitting = false;
      this.cdr.detectChanges();
    }
  }

  async toggleActiva(sede: Sede): Promise<void> {
    try {
      const updated = await this.sedesService.updateSede(sede.id, { activa: !sede.activa });
      const idx = this.sedes.findIndex(s => s.id === sede.id);
      if (idx !== -1) this.sedes[idx] = updated;
      this.cdr.detectChanges();
    } catch (e: any) {
      alert(e.message || 'Error al actualizar la sede');
    }
  }

  formatDate(d: string): string {
    return new Date(d).toLocaleDateString('es-ES');
  }

  private emptyForm(): CreateSedePayload {
    return { codigo_sede: '', nombre: '', ciudad: '', direccion: '', telefono: '', email: '', activa: true };
  }
}
