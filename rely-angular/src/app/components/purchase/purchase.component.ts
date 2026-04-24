import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';

interface VehicleData {
  price: number;
  model: string;
  year?: number;
  color: string;
}

interface FormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reference_number: string;
  paymentMethod: string;
  notes: string;
}

const emptyForm: FormData = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  reference_number: '',
  paymentMethod: 'Transferencia',
  notes: '',
};

@Component({
  standalone: false,
  selector: 'app-purchase',
  templateUrl: './purchase.component.html',
  styleUrls: ['./purchase.component.css'],
})
export class PurchaseComponent {
  @Input() isOpen = false;
  @Input() vehicleData?: VehicleData;
  @Output() closeModal = new EventEmitter<void>();

  formData: FormData = { ...emptyForm };
  isSubmitted = false;
  isLoading = false;
  error = '';

  get currentVehicle(): VehicleData {
    return this.vehicleData || { price: 50000.00, model: 'RELY', year: 2024, color: 'Blanco' };
  }

  handleInputChange(field: keyof FormData, value: string): void {
    this.formData = { ...this.formData, [field]: value };
    this.error = '';
  }

  async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    this.error = '';

    const { first_name, last_name, email, phone, reference_number } = this.formData;
    if (!first_name || !last_name || !email || !phone || !reference_number) {
      this.error = 'Por favor completa todos los campos obligatorios';
      return;
    }

    this.isLoading = true;

    const dataToSend = {
      first_name: this.formData.first_name,
      last_name: this.formData.last_name,
      email: this.formData.email,
      phone: this.formData.phone,
      reference_number: this.formData.reference_number,
      price: this.currentVehicle.price,
      vehicleModel: this.currentVehicle.model,
      vehicleYear: this.currentVehicle.year,
      vehicleColor: this.currentVehicle.color,
      paymentMethod: this.formData.paymentMethod,
      notes: this.formData.notes,
    };

    try {
      const response = await fetch('http://localhost:8000/api/ordenes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('rely_access')}`,
        },
        body: JSON.stringify(dataToSend),
      });

      const result = await response.json();

      if (response.ok) {
        this.isSubmitted = true;
        setTimeout(() => {
          this.closeModal.emit();
          this.formData = { ...emptyForm };
          this.isSubmitted = false;
        }, 4000);
      } else {
        if (result.reference_number) {
          this.error = `Error: ${result.reference_number[0]}`;
        } else if (result.detail) {
          this.error = 'No tienes permiso o tu sesión expiró.';
        } else {
          this.error = 'Hubo un problema al procesar la orden.';
        }
      }
    } catch {
      this.error = 'No se pudo conectar con el servidor de ventas.';
    } finally {
      this.isLoading = false;
    }
  }
}
