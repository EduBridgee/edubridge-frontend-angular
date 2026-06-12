import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { NotificationService } from '../../../core/services/notification';
import { RoleService, UserRole } from '../../../core/services/role';
import { LucideAngularModule, GraduationCap, BarChart3, Users, BookOpen, Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from 'lucide-angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  readonly GraduationCap = GraduationCap;
  readonly BarChart3 = BarChart3;
  readonly Users = Users;
  readonly BookOpen = BookOpen;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly ArrowRight = ArrowRight;
  readonly Loader2 = Loader2;

  email = '';
  password = '';
  role = 'estudiante';
  rememberMe = false;
  loading = false;
  showPassword = false;
  isRecovering = false;
  isResetting = false;
  recoveryCode = '';
  newPassword = '';
  confirmNewPassword = '';
  showNewPassword = false;
  showConfirmNewPassword = false;

  private readonly REMEMBER_KEY_EMAIL = 'eb_user_email';
  private readonly REMEMBER_KEY_ROLE = 'eb_user_role';

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private roleService: RoleService
  ) { }

  ngOnInit() {
    const savedEmail = localStorage.getItem(this.REMEMBER_KEY_EMAIL);
    const savedRole = localStorage.getItem(this.REMEMBER_KEY_ROLE);

    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
      if (savedRole) {
        this.role = savedRole;
      }
    }
  }

  setRole(selectedRole: string) {
    this.role = selectedRole;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  handleSubmit(event: Event) {
    event.preventDefault();
    this.loading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (userData: any) => {
        const normalizedUserRole = this.roleService.normalizeRole(userData.role);
        const normalizedSelectedRole = this.roleService.normalizeRole(this.role);

        
        if (normalizedUserRole !== UserRole.ADMIN) {
          if (normalizedUserRole !== normalizedSelectedRole) {
            this.loading = false;
            this.cdr.detectChanges();
            this.notificationService.showError(`Eres "${userData.role}" e intentas entrar como "${this.role}".`, 'Acceso denegado');
            return;
          }
        }

        
        if (this.rememberMe) {
          localStorage.setItem(this.REMEMBER_KEY_EMAIL, this.email);
          localStorage.setItem(this.REMEMBER_KEY_ROLE, this.role);
        } else {
          localStorage.removeItem(this.REMEMBER_KEY_EMAIL);
          localStorage.removeItem(this.REMEMBER_KEY_ROLE);
        }

        
        
        const token = userData.token || userData.accessToken || userData.jwt;

        if (token) {
          localStorage.setItem('token', token);
        } else {
          console.warn("No se recibió un token en la respuesta del login.");
        }

        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('user_id', userData.id.toString());
        localStorage.setItem('user_name', userData.name);
        localStorage.setItem('user_role', userData.role);

        this.loading = false;

        
        if (normalizedUserRole === UserRole.ADMIN) {
          this.router.navigate(['/admin']);
        } else if (normalizedUserRole === UserRole.DOCENTE) {
          this.router.navigate(['/gestion']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Login error:', err);
        this.notificationService.showError("Revisa tus credenciales e intenta nuevamente.", "Error de Inicio de Sesión");
      }
    });
  }

  handleSocialLogin(platform: string) {
    this.authService.handleSocialLogin(platform);
  }

  toggleRecovery() {
    this.isRecovering = !this.isRecovering;
    this.isResetting = false;
    this.cdr.detectChanges();
  }

  cancelRecovery() {
    this.isRecovering = false;
    this.isResetting = false;
    this.recoveryCode = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
    this.cdr.detectChanges();
  }

  toggleNewPassword() {
    this.showNewPassword = !this.showNewPassword;
  }

  toggleConfirmNewPassword() {
    this.showConfirmNewPassword = !this.showConfirmNewPassword;
  }

  recoverPassword() {
    if (!this.email) {
      this.notificationService.showError("Ingresa tu correo.", "Campo requerido");
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.authService.recoverPassword(this.email).subscribe({
      next: () => {
        this.loading = false;
        this.isRecovering = false;
        this.isResetting = true; 
        this.notificationService.showSuccess("Código de verificación enviado a tu correo.", "Correo Enviado");
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.showError("No se pudo enviar el correo de recuperación.", "Error");
        this.cdr.detectChanges();
      }
    });
  }

  resetPassword() {
    if (!this.recoveryCode) {
      this.notificationService.showError("Ingresa el código de verificación.", "Campo requerido");
      return;
    }
    if (!this.newPassword) {
      this.notificationService.showError("Ingresa tu nueva contraseña.", "Campo requerido");
      return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      this.notificationService.showError("Las contraseñas no coinciden.", "Validación");
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.authService.resetPassword(this.recoveryCode, this.newPassword).subscribe({
      next: () => {
        this.loading = false;
        this.isResetting = false;
        this.isRecovering = false;
        this.recoveryCode = '';
        this.newPassword = '';
        this.confirmNewPassword = '';
        this.notificationService.showSuccess("Contraseña restablecida con éxito.", "Contraseña Actualizada");
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.showError(err.error?.message || "Código inválido o expirado.", "Error al cambiar contraseña");
        this.cdr.detectChanges();
      }
    });
  }
}