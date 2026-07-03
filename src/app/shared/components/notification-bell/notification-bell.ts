import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrl: './notification-bell.css'
})
export class NotificationBellComponent implements OnInit, OnDestroy, OnChanges {
  @Input() user: any;
  
  notifications: any[] = [];
  isOpen = false;
  private intervalId: any;
  private readonly API_URL = 'http://localhost:8081/api/notifications';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.checkAndFetch();
    this.intervalId = setInterval(() => this.fetchNotifications(), 30000);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['user'] && changes['user'].currentValue) {
      this.checkAndFetch();
    }
  }

  ngOnDestroy() {
    if (this.intervalId) clearInterval(this.intervalId);
  }

  private checkAndFetch() {
    if (!this.user || !this.user.id) {
      this.user = JSON.parse(localStorage.getItem('user') || '{}');
    }

    if (this.user && this.user.id) {
      this.fetchNotifications();
    }
  }

  fetchNotifications() {
    if (!this.user || !this.user.id) return;

    this.http.get<any[]>(`${this.API_URL}/student/${this.user.id}`)
      .subscribe({
        next: (data) => {
          this.notifications = data.filter(n => !n.read).reverse();
          this.cdr.detectChanges();
        },
        error: (err) => console.error("Error EduBridge Notifs:", err)
      });
  }

  toggleDropdown() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.fetchNotifications();
  }

  confirmarLectura(id: number) {
    this.http.patch(`${this.API_URL}/${id}/read`, {})
      .subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n.id !== id);
          this.cdr.detectChanges();
        },
        error: (err) => console.error("Error al confirmar lectura:", err)
      });
  }
}