import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html'
})
export class SidebarComponent {
  @Input() userName = '';
  @Input() userRole = '';
  @Input() currentPage = 'dashboard';
  @Output() setPage = new EventEmitter<string>();
  @Output() onLogout = new EventEmitter<void>();

  menuItems = [
    { name: 'Dashboard', id: 'dashboard', icon: '📊', roles: ['docente', 'estudiante'] },
    { name: 'Mis Cursos', id: 'cursos', icon: '📘', roles: ['estudiante'] },
    { name: 'Estudiantes', id: 'estudiantes', icon: '🎓', roles: ['docente'] },
    { name: 'Tutorías', id: 'tutorias', icon: '📅', roles: ['docente', 'estudiante'] },
    { name: 'Recursos', id: 'recursos', icon: '📖', roles: ['docente', 'estudiante'] },
    { name: 'Mi Perfil', id: 'perfil', icon: '⚙️', roles: ['estudiante'] },
    { name: 'Gestión Docente', id: 'gestion', icon: '⚙️', roles: ['docente'] },
  ];

  constructor(private router: Router) { }
  
  isMenuOpen = false;

  get filteredMenu() {
    return this.menuItems.filter(item => item.roles.includes(this.userRole));
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
    this.router.navigate([`/${id}`]); 
  }

  logout() {
    this.onLogout.emit();
  }

  toggleMenu() {
    this.isMenuOpen = !this.isMenuOpen;
  }

}