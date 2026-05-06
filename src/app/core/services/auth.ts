import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService { 
  private apiUrl = 'https://edubridge-backend-v2.onrender.com/api/auth';  

  constructor(private http: HttpClient) { }

  login(credentials: any) {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  handleSocialLogin(platform: string) {
    window.location.href = `https://edubridge-backend-v2.onrender.com/oauth2/authorization/${platform.toLowerCase()}`;
  }
}