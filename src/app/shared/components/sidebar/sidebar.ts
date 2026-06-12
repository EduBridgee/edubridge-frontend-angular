import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { RoleService, UserRole } from '../../../core/services/role';
import { LucideAngularModule, LayoutDashboard, BookOpen, GraduationCap, Calendar, FolderOpen, User, Settings, LogOut, Menu, X, Home, Users, FileText, Clock } from 'lucide-angular';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, LucideAngularModule],
  templateUrl: './sidebar.html'
})
export class SidebarComponent {
  readonly LayoutDashboard = LayoutDashboard;
  readonly BookOpen = BookOpen;
  readonly GraduationCap = GraduationCap;
  readonly Calendar = Calendar;
  readonly FolderOpen = FolderOpen;
  readonly User = User;
  readonly Settings = Settings;
  readonly LogOut = LogOut;
  readonly Menu = Menu;
  readonly X = X;
  readonly Home = Home;
  readonly Users = Users;
  readonly FileText = FileText;
  readonly Clock = Clock;

  @Input() userName = '';
  @Input() userRole = '';
  @Input() currentPage = 'dashboard';
  @Output() setPage = new EventEmitter<string>();
  @Output() onLogout = new EventEmitter<void>();

  menuItems = [
    { name: 'Dashboard', id: 'admin', icon: LayoutDashboard, roles: [UserRole.ADMIN] },
    { name: 'Dashboard', id: 'dashboard', icon: LayoutDashboard, roles: [UserRole.DOCENTE, UserRole.ESTUDIANTE] },

    { name: 'Mis Cursos', id: 'cursos', icon: BookOpen, roles: [UserRole.ESTUDIANTE] },
    { name: 'Cursos Asignados', id: 'cursos', icon: BookOpen, roles: [UserRole.DOCENTE] },
    { name: 'Estudiantes', id: 'estudiantes', icon: GraduationCap, roles: [UserRole.DOCENTE] },
    { name: 'Tutorías', id: 'tutorias', icon: Calendar, roles: [UserRole.DOCENTE, UserRole.ESTUDIANTE] },
    { name: 'Recursos', id: 'recursos', icon: FolderOpen, roles: [UserRole.DOCENTE, UserRole.ESTUDIANTE] },
    { name: 'Mi Perfil', id: 'perfil', icon: User, roles: [UserRole.ESTUDIANTE] },
    { name: 'Gestión Docente', id: 'gestion', icon: Settings, roles: [UserRole.DOCENTE] },

    { name: 'Gestión Cuentas', id: 'admin/estudiantes', icon: Users, roles: [UserRole.ADMIN] },
    { name: 'Control Cursos', id: 'admin/cursos', icon: BookOpen, roles: [UserRole.ADMIN] },
    { name: 'Matrículas', id: 'admin/matriculas', icon: GraduationCap, roles: [UserRole.ADMIN] },
    { name: 'Reportes', id: 'admin/reportes', icon: FileText, roles: [UserRole.ADMIN] },
    { name: 'Configuración', id: 'admin/configuracion', icon: Settings, roles: [UserRole.ADMIN] }
  ];

  constructor(private router: Router, private roleService: RoleService) { }

  isMenuOpen = false;

  get filteredMenu() {
    const normalizedRole = this.roleService.normalizeRole(this.userRole);
    return this.menuItems.filter(item => item.roles.includes(normalizedRole as UserRole));
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }

  changePage(id: string) {
    this.currentPage = id;
    this.setPage.emit(id);

    if (id.startsWith('admin')) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate([`/${id}`]);
    }
  }

  logout() {
    this.onLogout.emit();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }
}