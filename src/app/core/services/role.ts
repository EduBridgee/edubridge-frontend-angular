import { Injectable } from '@angular/core';

export enum UserRole {
  DOCENTE = 'docente',
  ESTUDIANTE = 'estudiante',
  TEACHER = 'teacher',
  ADMIN = 'admin'
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private readonly ROLE_KEY = 'user_role';

  normalizeRole(role: string | undefined): UserRole | null {
    if (!role) return null;
    const normalized = role.toLowerCase().trim();

    if (normalized === 'admin' || normalized === 'administrator') {
      return UserRole.ADMIN;
    }
    if (normalized === 'docente' || normalized === 'teacher') {
      return UserRole.DOCENTE;
    }
    if (normalized === 'estudiante' || normalized === 'student') {
      return UserRole.ESTUDIANTE;
    }
    return null;
  }

  isAdmin(role: string | undefined): boolean {
    return this.normalizeRole(role) === UserRole.ADMIN;
  }

  isDocente(role: string | undefined): boolean {
    return this.normalizeRole(role) === UserRole.DOCENTE;
  }

  isEstudiante(role: string | undefined): boolean {
    return this.normalizeRole(role) === UserRole.ESTUDIANTE;
  }

  matchesRole(userRole: string | undefined, expectedRole: UserRole): boolean {
    return this.normalizeRole(userRole) === expectedRole;
  }

  setRole(role: UserRole): void {
    localStorage.setItem(this.ROLE_KEY, role);
  }

  getRole(): string | null {
    return localStorage.getItem(this.ROLE_KEY);
  }
}