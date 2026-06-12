import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
  title?: string;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private toastSubject = new Subject<ToastMessage>();
  toastState$ = this.toastSubject.asObservable();
  private counter = 0;

  showSuccess(message: string, title: string = 'Operación Exitosa') {
    this.show(message, 'success', title);
  }

  showError(message: string, title: string = 'Ha ocurrido un error') {
    this.show(message, 'error', title);
  }

  showInfo(message: string, title: string = 'Aviso del Sistema') {
    this.show(message, 'info', title);
  }

  private show(message: string, type: 'success' | 'error' | 'info', title: string) {
    this.toastSubject.next({
      id: this.counter++,
      message,
      type,
      title
    });
  }
}
