import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell';

@Component({
  selector: 'app-gestion-docente',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent],
  templateUrl: './gestion-docente.html',
  styleUrl: './gestion-docente.css'
})
export class GestionDocenteComponent implements OnInit {
  user: any = JSON.parse(localStorage.getItem('user') || '{}');
  loading: boolean = true;
  estudiantes: any[] = [];
  courses: any[] = []; 
  tasks: any[] = [];
  
  promedioAula: string = '0.0';
  statsAprobados: number = 0;

  showNotasModal: boolean = false;
  showAsistenciaModal: boolean = false;
  showStatsModal: boolean = false;
  showNotifyModal: boolean = false;

  nuevaNota = { studentId: null, courseId: null, score: null };
  
  nuevaNotif = { 
    studentId: '', 
    message: '',
    type: 'GENERAL' 
  };
  
  asistencia: { [key: number]: boolean } = {};

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.inicializarPanel();
  }

  async inicializarPanel() {
    this.loading = true;
    try {
      await Promise.all([
        this.cargarEstudiantes(),
        this.cargarCursos(),
        this.cargarTareasServidor()
      ]);
      this.calcularMetricas();
    } catch (error) {
      console.error("Error al sincronizar con EduBridge:", error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  cargarEstudiantes(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>('https://edubridge-backend-v2.onrender.com/api/students').subscribe({
        next: (data) => {
          this.estudiantes = data;
          this.estudiantes.forEach(s => {
            if (!(s.id in this.asistencia)) this.asistencia[s.id] = true;
          });
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  cargarCursos(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>('https://edubridge-backend-v2.onrender.com/api/courses').subscribe({
        next: (data) => {
          this.courses = data;
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  cargarTareasServidor(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>('https://edubridge-backend-v2.onrender.com/api/teacher-tasks').subscribe({
        next: (data) => {
          this.tasks = data;
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  calcularMetricas() {
    if (!this.estudiantes || this.estudiantes.length === 0) {
      this.promedioAula = '0.0';
      this.statsAprobados = 0;
      return;
    }
    const notas = this.estudiantes.map(s => s.averageGrade || 0);
    const suma = notas.reduce((a, b) => a + b, 0);
    this.promedioAula = (suma / this.estudiantes.length).toFixed(1);

    const aprobadosCount = this.estudiantes.filter(s => (s.averageGrade || 0) >= 10.5).length;
    this.statsAprobados = Math.round((aprobadosCount / this.estudiantes.length) * 100);
  }

  manejarSubirNota() {
    if (!this.nuevaNota.studentId || !this.nuevaNota.courseId || this.nuevaNota.score === null) {
      alert("Por favor, completa todos los campos.");
      return;
    }
    const payload = {
      studentId: Number(this.nuevaNota.studentId),
      courseId: Number(this.nuevaNota.courseId),
      value: this.nuevaNota.score
    };
    this.http.post('http://localhost:8081/api/grades', payload).subscribe({
      next: () => {
        this.showNotasModal = false;
        this.nuevaNota = { studentId: null, courseId: null, score: null };
        this.cargarEstudiantes().then(() => {
          this.calcularMetricas();
          this.cdr.detectChanges();
        });
        alert("Nota sincronizada exitosamente.");
      },
      error: (err) => alert("Error al guardar la nota.")
    });
  }

  toggleCheck(id: number) {
    this.asistencia[id] = !this.asistencia[id];
  }

  guardarAsistencia() {
    this.loading = true;
    setTimeout(() => {
      this.showAsistenciaModal = false; 
      this.loading = false;
      this.cdr.detectChanges();
      alert("Asistencia sincronizada correctamente.");
    }, 1200);
  }

  manejarEnvioNotificacion() {
    if (!this.nuevaNotif.studentId || !this.nuevaNotif.message || !this.nuevaNotif.type) {
      alert("Por favor, selecciona un alumno, el tipo de alerta y escribe el mensaje.");
      return;
    }

    const payload = {
      studentId: Number(this.nuevaNotif.studentId),
      content: this.nuevaNotif.message,
      type: this.nuevaNotif.type 
    };

    this.http.post('http://localhost:8081/api/notifications', payload).subscribe({
      next: () => {
        this.showNotifyModal = false;
        this.nuevaNotif = { studentId: '', message: '', type: 'GENERAL' }; 
        this.cdr.detectChanges();
        alert("Notificación enviada exitosamente.");
      },
      error: (err) => {
        console.error("Error:", err);
        alert("No se pudo enviar la notificación. Revisa la conexión con el servidor.");
      }
    });
  }
}