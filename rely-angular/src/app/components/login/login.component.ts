import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() loginSuccess = new EventEmitter<string>();

  email = '';
  password = '';
  showPassword = false;
  isLoading = false;
  error = '';

  constructor(private authService: AuthService) {}

  async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();
    this.error = '';

    if (!this.email || !this.password) {
      this.error = 'Por favor completa todos los campos';
      return;
    }

    if (this.password.length < 6) {
      this.error = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.isLoading = true;
    try {
      const user = await this.authService.login(this.email, this.password);
      this.loginSuccess.emit(user.email);
      this.closeModal.emit();
      this.email = '';
      this.password = '';
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Error de conexión. Intenta de nuevo.';
    } finally {
      this.isLoading = false;
    }
  }
}
