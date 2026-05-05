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
}