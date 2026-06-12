import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastMessage } from '../../../core/services/notification';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed bottom-8 right-8 z-[99999] flex flex-col gap-4 pointer-events-none">
      <div *ngFor="let toast of toasts" 
           [class]="getToastClass(toast.type)"
           class="pointer-events-auto min-w-[280px] max-w-md p-4 rounded-2xl shadow-lg border flex items-center gap-4 animate-toast-in backdrop-blur-md transition-all duration-500 overflow-hidden relative group">
        
        <!-- Background Tint -->
        <div class="absolute inset-0 transition-colors duration-500" [class]="getBgTintClass(toast.type)"></div>

        <!-- Content -->
        <div class="flex-1 z-10">
          <p class="text-[11px] font-black uppercase tracking-wider mb-0.5 opacity-90" 
             [class]="getTextColorClass(toast.type)">
            {{ toast.title }}
          </p>
          <p class="text-sm font-semibold text-slate-900 leading-snug">
            {{ toast.message }}
          </p>
        </div>

        <!-- Close button -->
        <button (click)="removeToast(toast.id)" class="z-10 text-slate-500 hover:text-slate-900 transition-colors p-1">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    @keyframes toast-in {
      from { transform: translateY(20px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
    .animate-toast-in {
      animation: toast-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
  `]
})
export class ToastContainer implements OnInit, OnDestroy {
  toasts: ToastMessage[] = [];
  private subscription?: Subscription;

  constructor(
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.subscription = this.notificationService.toastState$.subscribe(toast => {
      this.toasts.push(toast);
      this.cdr.detectChanges();
      
      setTimeout(() => {
        this.removeToast(toast.id);
      }, 5000);
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.cdr.detectChanges();
  }

  getToastClass(type: string) {
    switch (type) {
      case 'success': return 'border-emerald-200 shadow-emerald-500/10';
      case 'error': return 'border-rose-200 shadow-rose-500/10';
      default: return 'border-sky-200 shadow-sky-500/10';
    }
  }

  getBgTintClass(type: string) {
    switch (type) {
      case 'success': return 'bg-emerald-50/90';
      case 'error': return 'bg-rose-50/90';
      default: return 'bg-sky-50/90';
    }
  }

  getTextColorClass(type: string) {
    switch (type) {
      case 'success': return 'text-emerald-700';
      case 'error': return 'text-rose-700';
      default: return 'text-sky-700';
    }
  }
}
