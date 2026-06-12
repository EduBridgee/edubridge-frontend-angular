import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RoleService } from '../../../core/services/role';
import { LucideAngularModule, Bell, AlertTriangle, FileText, FolderOpen, Sparkles, Volume2, Check } from 'lucide-angular';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css'
})
export class NotificationBellComponent implements OnInit, OnDestroy, OnChanges {
  readonly Bell = Bell;
  readonly AlertTriangle = AlertTriangle;
  readonly FileText = FileText;
  readonly FolderOpen = FolderOpen;
  readonly Sparkles = Sparkles;
  readonly Volume2 = Volume2;
  readonly Check = Check;

  @Input() user: any;

  notifications: any[] = [];
  isOpen = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly API_URL = 'https://edubridge-backend-prueba-v2.onrender.com/api/notifications';

  
  private isFetching = false;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private roleService: RoleService
  ) { }

  ngOnInit() {
    this.checkAndFetch();
    if (!this.intervalId) {
      
      this.intervalId = setInterval(() => this.fetchNotifications(), 30000);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    
    if (changes['user'] && changes['user'].currentValue) {
      const prevId = changes['user'].previousValue?.id;
      const currId = changes['user'].currentValue?.id;

      if (currId !== prevId) {
        this.checkAndFetch();
      }
    }
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkAndFetch() {
    if (!this.user || !this.user.id) {
      this.user = JSON.parse(localStorage.getItem('user') || '{}');
    }

    if ((this.user && this.user.id) || localStorage.getItem('user_id')) {
      this.fetchNotifications();
    }
  }

  fetchNotifications() {
    
    if (this.isFetching) return;

    const studentId = this.user?.id || localStorage.getItem('user_id');

    if (!studentId) {
      this.notifications = [];
      return;
    }

    this.isFetching = true;

    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('access_token');
    const options = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

    this.http.get<any[]>(`https://edubridge-backend-prueba-v2.onrender.com/api/notifications/student/${studentId}`, options).subscribe({
      next: (data) => {
        this.notifications = data || [];

        console.log("=== ENVIANDO DESDE NEON A LA CAMPANA ===");
        console.log(`Alertas del estudiante ${studentId}:`, this.notifications);

        
        setTimeout(() => {
          this.isFetching = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error("Error al recuperar las alertas del alumno desde el servidor:", err);
        this.notifications = [];
        setTimeout(() => {
          this.isFetching = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.fetchNotifications();
  }

  confirmarLectura(id: number) {
    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('access_token');
    const options = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

    this.http.patch(`${this.API_URL}/${id}/read`, {}, options)
      .subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== id);
          this.cdr.detectChanges();
        },
        error: (err) => console.error("Error al confirmar lectura:", err)
      });
  }
}