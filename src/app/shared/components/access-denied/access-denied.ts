import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LucideAngularModule, ShieldAlert, ArrowLeft } from 'lucide-angular';
import { Router } from '@angular/router';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './access-denied.html',
  styleUrl: './access-denied.css',
})
export class AccessDeniedComponent {
  readonly ShieldAlert = ShieldAlert;
  readonly ArrowLeft = ArrowLeft;

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/dashboard']);
  }
}
