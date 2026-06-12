import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login';
import { DashboardComponent } from './features/dashboard/dashboard';
import { CursosComponent } from './features/cursos/cursos';
import { TutoriasComponent } from './features/tutorias/tutorias'; // Verifica el nombre de la clase
import { RecursosComponent } from './features/recursos/recursos'; // Verifica el nombre de la clase
import { StudentProfileComponent } from './features/student-profile/student-profile'; // Verifica el nombre de la clase
import { AccessDeniedComponent } from './shared/components/access-denied/access-denied';
import { GestionDocenteComponent } from './features/gestion-docente/gestion-docente';
import { EstudiantesComponent } from './features/estudiantes/estudiantes';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'gestion', component: GestionDocenteComponent },
  { path: 'cursos', component: CursosComponent },
  { path: 'estudiantes', component: EstudiantesComponent },
  { path: 'tutorias', component: TutoriasComponent },
  { path: 'recursos', component: RecursosComponent },
  { path: 'perfil', component: StudentProfileComponent },
  { path: 'access-denied', component: AccessDeniedComponent },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'dashboard' } 
];