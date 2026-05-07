import { Component, OnInit } from '@angular/core';
import { AdminService, CreateUserPayload, UpdateUserPayload, UserItem } from '../../services/admin.service';

type AdminSection = 'create' | 'modify';
type ModifyView = 'list' | 'edit';

// Todos los roles guardan perfil de contacto en la tabla vendedor

interface CreateFormData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  telefono_1: string;
  telefono_2: string;
  direccion: string;
}

interface EditFormData {
  first_name: string;
  last_name: string;
  email: string;
  username: string;
  password: string;
  role: string;
  is_active: boolean;
  telefono_1: string;
  telefono_2: string;
  direccion: string;
}

interface Toast {
  id: number;
  type: 'success' | 'error';
  message: string;
}

@Component({
  standalone: false,
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  section: AdminSection = 'create';
  modifyView: ModifyView = 'list';

  // Toast
  toasts: Toast[] = [];
  private toastCounter = 0;

  // Shared
  roles: string[] = [];
  isLoadingRoles = true;

  // Create section
  createForm: CreateFormData = this.emptyCreateForm();
  createSuccess = false;
  createdUsername = '';
  createdRole = '';
  isCreating = false;
  createError = '';

  // Modify section
  users: UserItem[] = [];
  isLoadingUsers = false;
  loadUsersError = '';
  selectedUser: UserItem | null = null;
  editForm: EditFormData = this.emptyEditForm();
  isSaving = false;
  editError = '';

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    Promise.all([
      this.adminService.getRoles(),
      this.adminService.getUsers(),
    ]).then(([roles, users]) => {
      this.roles = roles;
      this.users = users;
      this.isLoadingRoles = false;
    }).catch(() => {
      this.createError = 'Error al cargar los datos del servidor.';
      this.isLoadingRoles = false;
    });
  }

  // ── Helpers ──────────────────────────────────────────────

  /** Todos los roles guardan datos de contacto en la tabla vendedor */
  needsVendedorFields(_role: string): boolean {
    return true;
  }

  // ── Toast ──────────────────────────────────────────────

  showToast(type: 'success' | 'error', message: string): void {
    const id = ++this.toastCounter;
    this.toasts.push({ id, type, message });
    setTimeout(() => {
      this.toasts = this.toasts.filter(t => t.id !== id);
    }, 4000);
  }

  dismissToast(id: number): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  // ── Sección ──────────────────────────────────────────────

  setSection(s: AdminSection): void {
    this.section = s;
  }

  // ── CREATE ──────────────────────────────────────────────

  emptyCreateForm(): CreateFormData {
    return {
      first_name: '', last_name: '', email: '', username: '',
      password: '', role: '', telefono_1: '', telefono_2: '', direccion: '',
    };
  }

  async handleCreate(e: Event): Promise<void> {
    e.preventDefault();
    this.createError = '';
    const { first_name, last_name, email, username, password, role, telefono_1, telefono_2, direccion } = this.createForm;

    if (!first_name || !last_name || !email || !username || !password || !role) {
      this.createError = 'Todos los campos son obligatorios';
      return;
    }
    if (password.length < 6) {
      this.createError = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.isCreating = true;
    try {
      const payload: CreateUserPayload = { first_name, last_name, email, username, password, role };
      if (this.needsVendedorFields(role)) {
        payload.telefono_1 = telefono_1;
        payload.telefono_2 = telefono_2;
        payload.direccion  = direccion;
      }
      await this.adminService.createUser(payload);
      this.createdUsername = username;
      this.createdRole = role;
      this.createSuccess = true;
      this.showToast('success', `Usuario "${username}" creado correctamente`);
      this.adminService.getUsers().then(u => this.users = u);
      setTimeout(() => {
        this.createForm = this.emptyCreateForm();
        this.createSuccess = false;
      }, 3000);
    } catch (err) {
      this.createError = err instanceof Error ? err.message : 'Error al crear el usuario.';
    } finally {
      this.isCreating = false;
    }
  }

  clearCreateForm(): void {
    this.createForm = this.emptyCreateForm();
    this.createError = '';
  }

  // ── MODIFY ──────────────────────────────────────────────

  async loadUsers(): Promise<void> {
    this.isLoadingUsers = true;
    this.loadUsersError = '';
    try {
      this.users = await this.adminService.getUsers();
    } catch {
      this.loadUsersError = 'No se pudieron cargar los usuarios.';
    } finally {
      this.isLoadingUsers = false;
    }
  }

  emptyEditForm(): EditFormData {
    return {
      first_name: '', last_name: '', email: '', username: '',
      password: '', role: '', is_active: true,
      telefono_1: '', telefono_2: '', direccion: '',
    };
  }

  selectUser(user: UserItem): void {
    this.selectedUser = user;
    this.editForm = {
      first_name: user.first_name,
      last_name:  user.last_name,
      email:      user.email,
      username:   user.username,
      password:   '',
      role:       user.role ?? '',
      is_active:  user.is_active,
      telefono_1: user.telefono_1 ?? '',
      telefono_2: user.telefono_2 ?? '',
      direccion:  user.direccion  ?? '',
    };
    this.editError = '';
    this.modifyView = 'edit';
  }

  backToList(): void {
    this.modifyView = 'list';
    this.selectedUser = null;
    this.editError = '';
  }

  async handleEdit(e: Event): Promise<void> {
    e.preventDefault();
    if (!this.selectedUser) return;
    this.editError = '';
    const { first_name, last_name, email, username, password, role, is_active, telefono_1, telefono_2, direccion } = this.editForm;

    if (!first_name || !last_name || !email || !username || !role) {
      this.editError = 'Todos los campos excepto la contraseña son obligatorios';
      return;
    }
    if (password && password.length < 6) {
      this.editError = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    this.isSaving = true;
    try {
      const payload: UpdateUserPayload = { first_name, last_name, email, username, role, is_active };
      if (password) payload.password = password;
      if (this.needsVendedorFields(role)) {
        payload.telefono_1 = telefono_1;
        payload.telefono_2 = telefono_2;
        payload.direccion  = direccion;
      }
      const updated = await this.adminService.updateUser(this.selectedUser.id, payload);
      const idx = this.users.findIndex(u => u.id === updated.id);
      if (idx !== -1) this.users[idx] = updated;
      this.showToast('success', `"${updated.first_name} ${updated.last_name}" actualizado correctamente`);
      setTimeout(() => this.backToList(), 800);
    } catch (err) {
      this.editError = err instanceof Error ? err.message : 'Error al actualizar el usuario.';
    } finally {
      this.isSaving = false;
    }
  }
}