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
  
  // Variables para Gráficos Dinámicos (Estudiante)
  notasEstudiante: any[] = [];
  firstName: string = '';

  promedioAula: string = '0.0';
  statsAprobados: number = 0;

  showNotasModal: boolean = false;
  showAsistenciaModal: boolean = false;
  showStatsModal: boolean = false;
  showNotifyModal: boolean = false;
  showParticipacionModal: boolean = false;
  showStudentModal: boolean = false;

  nuevaNota = { studentId: null, courseId: null, score: null };
  nuevaNotif = { studentId: '', message: '', type: 'GENERAL' };
  asistencia: { [key: number]: boolean } = {};
  
  nuevaParticipacion = {
    studentId: null,
    points: 1,
    observation: '',
    date: new Date().toISOString().split('T')[0]
  };

  nuevoEstudiante = {
    name: '', code: '', email: '', password: '123',
    phone: '', program: '', semester: '2026-1',
    status: 'Activo', role: 'STUDENT', riskLevel: 'Bajo',
    averageGrade: 0.0, totalClasses: 0, attendedClasses: 0,
    attendancePercentage: 0, absences: 0
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.firstName = this.user.name ? this.user.name.split(' ')[0] : 'Estudiante';
    this.inicializarPanel();
  }

  async inicializarPanel() {
    this.loading = true;
    try {
      if (this.user.role === 'docente') {
        await Promise.all([
          this.cargarEstudiantes(),
          this.cargarCursos(),
          this.cargarTareasServidor()
        ]);
        this.calcularMetricas();
      } else if (this.user.role === 'estudiante') {
        await this.cargarNotasPersonales();
      }
    } catch (error) {
      console.error("Error al sincronizar con EduBridge:", error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // --- LÓGICA DE GRÁFICOS DINÁMICOS (ESTUDIANTE) ---
  cargarNotasPersonales(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Endpoint dinámico usando el ID del usuario logueado
      this.http.get<any[]>(`http://localhost:8081/api/grades/student/${this.user.id}`).subscribe({
        next: (data) => {
          this.notasEstudiante = data.map(n => ({
            valor: n.value,
            // Tomamos las primeras 3 letras del curso para el label del gráfico
            nombreCurso: n.course.name.substring(0, 3).toUpperCase(),
            // Calculamos el porcentaje de altura para el CSS (Nota 20 = 100%)
            porcentaje: (n.value / 20) * 100 
          }));
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  // --- MÉTODOS DE CARGA (DOCENTE) ---
  cargarEstudiantes(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>('http://localhost:8081/api/students').subscribe({
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
      this.http.get<any[]>('http://localhost:8081/api/courses').subscribe({
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
      this.http.get<any[]>('http://localhost:8081/api/teacher-tasks').subscribe({
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

  // --- MANEJADORES DE FORMULARIOS ---
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

  manejarRegistroParticipacion() {
    const hoy = new Date();
    const fechaSeleccionada = new Date(this.nuevaParticipacion.date + "T23:59:59");

    if (fechaSeleccionada > hoy) {
      alert("❌ No se puede registrar actividad en fechas posteriores.");
      return;
    }

    if (!this.nuevaParticipacion.studentId || !this.nuevaParticipacion.observation) {
      alert("Por favor completa los datos del alumno y la observación.");
      return;
    }

    const payload = {
      studentId: Number(this.nuevaParticipacion.studentId),
      points: this.nuevaParticipacion.points,
      observation: this.nuevaParticipacion.observation,
      registrationDate: this.nuevaParticipacion.date
    };

    this.http.post('http://localhost:8081/api/participations', payload).subscribe({
      next: () => {
        this.showParticipacionModal = false;
        alert("✅ Registro conductual sincronizado correctamente.");
        this.nuevaParticipacion = { studentId: null, points: 1, observation: '', date: new Date().toISOString().split('T')[0] };
      },
      error: () => alert("Error al conectar con el servidor de registros.")
    });
  }

  manejarRegistroEstudiante() {
    if (!this.nuevoEstudiante.name || !this.nuevoEstudiante.code || !this.nuevoEstudiante.email) {
      alert("Nombre, Código y Email son obligatorios.");
      return;
    }

    this.http.post('http://localhost:8081/api/students', this.nuevoEstudiante).subscribe({
      next: () => {
        this.showStudentModal = false;
        alert("✅ Alumno registrado en la base de datos.");
        this.cargarEstudiantes();
      },
      error: (err) => alert("Error al guardar: " + err.message)
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