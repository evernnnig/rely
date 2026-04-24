import { Component } from '@angular/core';
import { VentasService, CreateOrdenPayload } from '../../services/ventas.service';

interface VehicleFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleColor: string;
  price: string;
  paymentMethod: string;
  referenceNumber: string;
  notes: string;
}

@Component({
  standalone: false,
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css'],
})
export class SalesComponent {
  formData: VehicleFormData = this.emptyForm();
  isSubmitted = false;
  submittedRef = '';
  isLoading = false;
  error = '';

  vehicleModels = [
    'RELY T60 Standard', 'RELY T60 Premium', 'RELY T80 4x4',
    'RELY T80 Luxury', 'RELY X7 SUV', 'RELY X7 Sport',
  ];

  vehicleColors = [
    'Blanco Perla', 'Negro Obsidiana', 'Gris Titanio',
    'Azul Océano', 'Rojo Carmesí', 'Plata Metálico',
  ];

  paymentMethods = [
    'Efectivo', 'Transferencia Bancaria', 'Financiamiento',
    'Tarjeta de Crédito', 'Cheque Certificado',
  ];

  constructor(private ventasService: VentasService) {}

  emptyForm(): VehicleFormData {
    return {
      firstName: '', lastName: '', email: '', phone: '',
      vehicleModel: '', vehicleYear: new Date().getFullYear().toString(),
      vehicleColor: '', price: '', paymentMethod: '', referenceNumber: '', notes: '',
    };
  }

  async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    this.error = '';

    const required: (keyof VehicleFormData)[] = [
      'firstName', 'lastName', 'email', 'phone',
      'vehicleModel', 'vehicleColor', 'price', 'paymentMethod', 'referenceNumber',
    ];

    if (required.some(f => !this.formData[f])) {
      this.error = 'Por favor completa todos los campos obligatorios';
      return;
    }

    if (!/^\d+$/.test(this.formData.referenceNumber)) {
      this.error = 'El número de referencia debe contener solo dígitos';
      return;
    }

    this.isLoading = true;
    try {
      const payload: CreateOrdenPayload = {
        first_name: this.formData.firstName,
        last_name: this.formData.lastName,
        email: this.formData.email,
        phone: this.formData.phone,
        reference_number: this.formData.referenceNumber,
        price: parseFloat(this.formData.price),
        vehicleModel: this.formData.vehicleModel,
        vehicleYear: this.formData.vehicleYear ? parseInt(this.formData.vehicleYear) : undefined,
        vehicleColor: this.formData.vehicleColor,
        paymentMethod: this.formData.paymentMethod,
        notes: this.formData.notes,
      };

      await this.ventasService.createOrder(payload);
      this.isSubmitted = true;
      this.submittedRef = this.formData.referenceNumber;

      setTimeout(() => {
        this.formData = this.emptyForm();
        this.isSubmitted = false;
        this.submittedRef = '';
      }, 3000);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Error al registrar la venta. Intenta de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }

  clearForm(): void {
    this.formData = this.emptyForm();
    this.error = '';
  }
}
