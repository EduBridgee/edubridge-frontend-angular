import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NotificationBellComponent, DecimalPipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  @Input() user: any = JSON.parse(localStorage.getItem('user') || '{}');

  students: any[] = [];
  data: any = null;
  studentSummary: any = null;
  studentGrades: any[] = []; 
  averageEvolution: any[] = [];
  loading: boolean = true;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    const isDocente = this.user.role === 'docente' || this.user.role === 'DOCENTE';
    const userId = this.user.id;

    const studentsReq = this.http.get<any[]>('https://edubridge-backend-v2.onrender.com/api/students').pipe(catchError(() => of([])));
    const gradesReq = isDocente ? of([]) : this.http.get<any[]>(`https://edubridge-backend-v2.onrender.com/api/grades/student/${userId}`).pipe(catchError(() => of([])));

    forkJoin({
      allStudents: studentsReq,
      myGrades: gradesReq
    }).subscribe({
      next: (res) => {
        this.students = res.allStudents;

        if (isDocente) {
          const total = res.allStudents.length;
          const avg = res.allStudents.reduce((acc, s) => acc + (s.averageGrade || 0), 0) / (total || 1);
          this.data = {
            totalStudents: total,
            averageGrade: avg,
            highRiskCount: res.allStudents.filter(s => (s.averageGrade || 0) < 13).length
          };
        } else {
          this.studentSummary = res.allStudents.find(s => s.id === userId);
          
          if (res.myGrades && res.myGrades.length > 0) {
            this.studentGrades = res.myGrades.map(g => ({
              label: g.course?.name?.substring(0, 3).toUpperCase() || 'CUR',
              value: g.value,
              percentage: (g.value / 20 * 100) + '%'
            }));
          } else if (this.studentSummary) {
            this.studentGrades = [{ 
              label: 'PROM', 
              value: this.studentSummary.averageGrade, 
              percentage: (this.studentSummary.averageGrade / 20 * 100) + '%' 
            }];
          }
          this.generateEvolutionChart(this.studentSummary);
        }
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () =>  {
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  generateEvolutionChart(student: any) {
    if (!student) return;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const baseValue = student.averageGrade || 0;
    this.averageEvolution = months.map((m, i) => ({
      month: m,
      value: baseValue > 0 ? baseValue - (1.5 - i * 0.3) : 0
    }));
  }

  get firstName() {
    return this.user?.name?.split(' ')[0] || 'Usuario';
  }
}