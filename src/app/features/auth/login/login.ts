import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  role = 'estudiante';
  rememberMe = false;
  loading = false;
  showPassword = false;

  private readonly REMEMBER_KEY_EMAIL = 'eb_user_email';
  private readonly REMEMBER_KEY_ROLE = 'eb_user_role';

  constructor(private authService: AuthService, private router: Router) {}

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
        if (userData.role !== this.role) {
          alert(`Acceso denegado. Eres "${userData.role}" e intentas entrar como "${this.role}".`);
          this.loading = false;
          return;
        }

        if (this.rememberMe) {
          localStorage.setItem(this.REMEMBER_KEY_EMAIL, this.email);
          localStorage.setItem(this.REMEMBER_KEY_ROLE, this.role);
        } else {
          localStorage.removeItem(this.REMEMBER_KEY_EMAIL);
          localStorage.removeItem(this.REMEMBER_KEY_ROLE);
        }

        localStorage.setItem('user', JSON.stringify(userData));
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        alert("Error de inicio de sesión. Revisa tus credenciales.");
        this.loading = false;
      }
    });
  }

  handleSocialLogin(platform: string) {
    this.authService.handleSocialLogin(platform);
  }
}