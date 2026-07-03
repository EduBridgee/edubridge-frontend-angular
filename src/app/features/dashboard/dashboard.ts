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

  // Datos crudos del servidor
  students: any[] = [];
  loading: boolean = true;

  // Variables ANALÍTICA DOCENTE
  data: any = null; 
  statsGrados: any[] = []; // Barras por Sección (A, B, C...)
  distribucionRiesgo = { bajo: 0, medio: 0, alto: 0 };
  globalHealth: number = 0;

  // Variables ANALÍTICA ESTUDIANTE
  studentSummary: any = null;
  studentGrades: any[] = []; 
  averageEvolution: any[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.fetchData();
  }

  fetchData() {
    this.loading = true;
    // Normalizamos el rol para evitar errores de mayúsculas
    const isDocente = this.user.role?.toUpperCase() === 'DOCENTE' || this.user.role?.toUpperCase() === 'TEACHER';
    const userId = this.user.id;

    // Peticiones paralelas para mayor velocidad
    const studentsReq = this.http.get<any[]>('http://localhost:8081/api/students')
      .pipe(catchError(() => of([])));
    
    const gradesReq = isDocente 
      ? of([]) 
      : this.http.get<any[]>(`http://localhost:8081/api/grades/student/${userId}`)
          .pipe(catchError(() => of([])));

    forkJoin({
      allStudents: studentsReq,
      myGrades: gradesReq
    }).subscribe({
      next: (res) => {
        this.students = res.allStudents;

        if (isDocente) {
          this.processDocenteData(res.allStudents);
        } else {
          this.processEstudianteData(res.allStudents, res.myGrades, userId);
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al sincronizar dashboard con EduBridge DB:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Procesa la analítica del Docente basada 100% en las columnas de la BD
   */
  private processDocenteData(allStudents: any[]) {
    const total = allStudents.length;
    if (total === 0) return;

    // 1. KPIs de Cabecera
    const sumaNotas = allStudents.reduce((acc, s) => acc + (s.averageGrade || 0), 0);
    this.data = {
      totalStudents: total,
      averageGrade: sumaNotas / total,
      // Filtro por string exacto de la columna risk_level
      highRiskCount: allStudents.filter(s => s.riskLevel === 'Alto Riesgo').length
    };

    // 2. Gráfico de Barras: Estudiantes por Sección (Columna 'grade')
    // Extrae dinámicamente 'A', 'B', 'C', 'D' etc.
    const secciones = [...new Set(allStudents.map(s => s.grade))].sort();
    const counts = secciones.map(sec => allStudents.filter(s => s.grade === sec).length);
    const maxCount = Math.max(...counts, 1);

    this.statsGrados = secciones.map((sec, i) => ({
      l: 'Sección ' + sec,
      h: (counts[i] / maxCount * 100) + '%'
    }));

    // 3. Distribución de Riesgo (Gráfico Circular)
    // Filtramos según los valores que mostraste en tu tabla de PostgreSQL
    const alto = allStudents.filter(s => s.riskLevel === 'Alto Riesgo').length;
    const medio = allStudents.filter(s => s.riskLevel === 'Riesgo Medio').length;
    const bajo = total - (alto + medio); // Considera 'Estable' y 'Bajo'

    this.distribucionRiesgo = {
      bajo: Math.round((bajo / total) * 100),
      medio: Math.round((medio / total) * 100),
      alto: Math.round((alto / total) * 100)
    };

    // Salud general del aula (Inverso al riesgo alto)
    this.globalHealth = 100 - this.distribucionRiesgo.alto;
  }

  /**
   * Procesa los datos personales para la vista del Estudiante
   */
  private processEstudianteData(allStudents: any[], myGrades: any[], userId: any) {
    this.studentSummary = allStudents.find(s => s.id === userId);
    
    if (myGrades && myGrades.length > 0) {
      this.studentGrades = myGrades.map(g => ({
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

  /**
   * Genera el gráfico lineal de tendencia (Ene - Jun)
   */
  generateEvolutionChart(student: any) {
    if (!student) return;
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    const baseValue = student.averageGrade || 0;
    this.averageEvolution = months.map((m, i) => ({
      month: m,
      value: baseValue > 0 ? baseValue - (1.2 - i * 0.4) : 0
    }));
  }

  // Helper para el nombre del banner
  get firstName() {
    return this.user?.name?.split(' ')[0] || 'Usuario';
  }
}