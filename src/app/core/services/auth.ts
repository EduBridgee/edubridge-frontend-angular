import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';


export interface LoginResponse {
  token: string;
  id: number;
  name: string;
  email: string;
  role: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'https://edubridge-backend-prueba-v2.onrender.com/api/auth';
  private http = inject(HttpClient);

  constructor() { }

  


  login(credentials: { email: string; password: string }): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.API_URL}/login`, credentials).pipe(
      
      tap((response: LoginResponse) => {
        if (response && response.token) {
          
          localStorage.setItem('auth_token', response.token);

          
          localStorage.setItem('user_role', response.role);
          localStorage.setItem('user_name', response.name);
          localStorage.setItem('user_id', response.id.toString());
        }
      })
    );
  }

  


  logout(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
  }

  


  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  


  getUserRole(): string | null {
    return localStorage.getItem('user_role');
  }
  handleSocialLogin(platform: string) {
    window.location.href = `https://edubridge-backend-prueba-v2.onrender.com/oauth2/authorization/${platform.toLowerCase()}`;
  }

  recoverPassword(email: string) {
    return this.http.post(`${this.API_URL}/forgot-password`, { email });
  }

  resetPassword(token: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.API_URL}/reset-password`, { token, newPassword });
  }

}