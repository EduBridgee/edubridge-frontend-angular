import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { SidebarComponent } from './shared/components/sidebar/sidebar';
import { ChatbotComponent } from './shared/components/chatbot/chatbot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, ChatbotComponent],
  templateUrl: './app.html'
})
export class AppComponent implements OnInit {
  user: any = null;
  currentPage = 'dashboard';
  
  activeComponent: any;

  constructor(private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.refreshUser();
      this.updateCurrentPage();
    });
  }

  ngOnInit() {
    this.refreshUser();
    this.updateCurrentPage();
  }

  onActivate(componentRef: any) {
    this.activeComponent = componentRef;
  }

  handleTutoriaCreada() {
    if (this.activeComponent && typeof this.activeComponent.fetchTutorias === 'function') {
      console.log(">> EduBridge: Refrescando lista de tutorías desde el Chatbot...");
      this.activeComponent.fetchTutorias();
    }
  }

  private refreshUser() {
    const savedUser = localStorage.getItem('user');
    this.user = savedUser ? JSON.parse(savedUser) : null;
    
    if (!this.user && !this.router.url.includes('/login')) {
      this.router.navigate(['/login']);
    }
  }

  private updateCurrentPage() {
    const url = this.router.url.split('/')[1]; 
    this.currentPage = url || 'dashboard';
  }

  handlePageChange(pageId: string) {
    this.currentPage = pageId;
    this.router.navigate([`/${pageId}`]);
  }

  handleLogout() {
    localStorage.removeItem('user');
    this.user = null;
    this.router.navigate(['/login']);
  }
}