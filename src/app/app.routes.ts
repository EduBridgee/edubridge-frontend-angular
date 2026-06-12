import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';


import { LoginComponent } from './features/auth/login/login';
import { DashboardComponent } from './features/dashboard/dashboard';
import { CursosComponent } from './features/cursos/cursos';
import { TutoriasComponent } from './features/tutorias/tutorias';
import { RecursosComponent } from './features/recursos/recursos';
import { StudentProfileComponent } from './features/student-profile/student-profile';
import { AccessDeniedComponent } from './shared/components/access-denied/access-denied';
import { GestionDocenteComponent } from './features/gestion-docente/gestion-docente';
import { EstudiantesComponent } from './features/estudiantes/estudiantes';


import { AdminComponent } from './features/admin/admin';

import { AuthService } from './core/services/auth';
import { authGuard } from './core/auth.guard';

const roleGuard = (allowedRoles: string[]) => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const userRole = authService.getUserRole();

    if (userRole && allowedRoles.includes(userRole)) {
      return true;
    }

    router.navigate(['/access-denied']);
    return false;
  };
};

export const routes: Routes = [
  
  { path: 'login', component: LoginComponent },

  
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'cursos', component: CursosComponent, canActivate: [authGuard] },
  { path: 'tutorias', component: TutoriasComponent, canActivate: [authGuard] },
  { path: 'recursos', component: RecursosComponent, canActivate: [authGuard] },
  { path: 'perfil', component: StudentProfileComponent, canActivate: [authGuard] },

  
  {
    path: 'gestion',
    component: GestionDocenteComponent,
    canActivate: [authGuard, roleGuard(['docente'])]
  },
  {
    path: 'estudiantes',
    component: EstudiantesComponent,
    canActivate: [authGuard, roleGuard(['docente'])]
  },

  
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard(['admin'])]
  },

  
  { path: 'admin/estudiantes', redirectTo: 'admin' },
  { path: 'admin/cursos', redirectTo: 'admin' },

  
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' }
];