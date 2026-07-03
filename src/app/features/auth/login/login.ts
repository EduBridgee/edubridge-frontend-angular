import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth';
import {
  LucideAngularModule,
  Lock, Loader2, Eye, EyeOff, LogIn, Mail, Shield,
  GraduationCap, BarChart3, Users, BookOpen
} from 'lucide-angular';
import { API_BASE_URL } from '../../../core/config/api.config';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  readonly Lock = Lock;
  readonly Loader2 = Loader2;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;
  readonly LogIn = LogIn;
  readonly Mail = Mail;
  readonly Shield = Shield;
  readonly GraduationCap = GraduationCap;
  readonly BarChart3 = BarChart3;
  readonly Users = Users;
  readonly BookOpen = BookOpen;

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

  show2faVerification = false;
  otpCode = '';
  private pendingUserData: any = null;

  private readonly REMEMBER_KEY_EMAIL = 'eb_user_email';
  private readonly REMEMBER_KEY_ROLE = 'eb_user_role';

  constructor(
    private authService: AuthService,
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const savedEmail = localStorage.getItem(this.REMEMBER_KEY_EMAIL);
    const savedRole = localStorage.getItem(this.REMEMBER_KEY_ROLE);
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
      if (savedRole) this.role = savedRole;
    }
  }

  setRole(selectedRole: string) { this.role = selectedRole; }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleNewPassword() { this.showNewPassword = !this.showNewPassword; }
  toggleConfirmNewPassword() { this.showConfirmNewPassword = !this.showConfirmNewPassword; }

  toggleRecovery() {
    this.isRecovering = !this.isRecovering;
    this.isResetting = false;
    this.recoveryCode = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
  }

  cancelRecovery() {
    this.isRecovering = false;
    this.isResetting = false;
    this.recoveryCode = '';
    this.newPassword = '';
    this.confirmNewPassword = '';
  }

  recoverPassword() {
    if (!this.email) { alert('Ingresa tu correo electrónico.'); return; }
    this.loading = true;
    this.http.post(`${API_BASE_URL}/auth/recover`, { email: this.email }).subscribe({
      next: () => {
        this.loading = false;
        this.isResetting = true;
        this.isRecovering = false;
        this.cdr.detectChanges();
        alert('Código enviado a tu correo. Ingresa el código para continuar.');
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        alert('No se pudo enviar el correo de recuperación. Verifica tu dirección.');
      }
    });
  }

  resetPassword() {
    if (!this.recoveryCode || !this.newPassword || !this.confirmNewPassword) {
      alert('Completa todos los campos.'); return;
    }
    if (this.newPassword !== this.confirmNewPassword) {
      alert('Las contraseñas no coinciden.'); return;
    }
    this.loading = true;
    this.http.post(`${API_BASE_URL}/auth/reset-password`, {
      email: this.email,
      code: this.recoveryCode,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.loading = false;
        this.cancelRecovery();
        this.cdr.detectChanges();
        alert('Contraseña restablecida exitosamente. Ahora puedes iniciar sesión.');
      },
      error: () => {
        this.loading = false;
        this.cdr.detectChanges();
        alert('Código inválido o expirado. Solicita un nuevo código.');
      }
    });
  }

  handleSubmit(event: Event) {
    event.preventDefault();
    this.loading = true;

    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: (userData: any) => {
        if (userData.role !== this.role) {
          this.loading = false;
          this.cdr.detectChanges();
          alert(`Acceso denegado. Eres "${userData.role}" e intentas entrar como "${this.role}".`);
          return;
        }
        if (userData.totpEnabled) {
          this.pendingUserData = userData;
          this.loading = false;
          this.show2faVerification = true;
          this.cdr.detectChanges();
          return;
        }
        this.completeLogin(userData);
      },
      error: (err) => {
        this.loading = false;
        this.cdr.detectChanges();
        console.error('Login error:', err);
        alert('Error de inicio de sesión. Revisa tus credenciales.');
      }
    });
  }

  confirmOtpVerification(event: Event) {
    event.preventDefault();
    if (!this.otpCode || this.otpCode.length !== 6) {
      alert('Ingresa un código de 6 dígitos válido.'); return;
    }
    this.loading = true;
    this.cdr.detectChanges();
    setTimeout(() => { this.completeLogin(this.pendingUserData); }, 500);
  }

  cancelOtpVerification() {
    this.show2faVerification = false;
    this.otpCode = '';
    this.pendingUserData = null;
    this.loading = false;
    this.cdr.detectChanges();
  }

  private completeLogin(userData: any) {
    if (this.rememberMe) {
      localStorage.setItem(this.REMEMBER_KEY_EMAIL, this.email);
      localStorage.setItem(this.REMEMBER_KEY_ROLE, this.role);
    } else {
      localStorage.removeItem(this.REMEMBER_KEY_EMAIL);
      localStorage.removeItem(this.REMEMBER_KEY_ROLE);
    }
    localStorage.setItem('user', JSON.stringify(userData));
    this.router.navigate(['/dashboard']);
  }

  handleSocialLogin(platform: string) {
    this.authService.handleSocialLogin(platform);
  }
}