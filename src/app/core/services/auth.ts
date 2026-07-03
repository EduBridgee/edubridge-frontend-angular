import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8081/api/auth';

  constructor(private http: HttpClient) { }

  login(credentials: any) {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  handleSocialLogin(platform: string) {
    window.location.href = `http://localhost:8081/oauth2/authorization/${platform.toLowerCase()}`;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('user');
  }

  getUserRole(): string | null {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    try {
      const user = JSON.parse(userJson);
      return user.role || null;
    } catch {
      return null;
    }
  }

  getUser(): any {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  }

  logout() {
    localStorage.removeItem('user');
  }
}