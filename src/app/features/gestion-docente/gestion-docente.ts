import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell';
import { NotificationService } from '../../core/services/notification';
import { RoleService, UserRole } from '../../core/services/role';
import { LucideAngularModule, Search, BarChart3, Users, Calendar, Clock, Star, User, UserPlus, Edit, Bell, Download, Check, Plus, X, Shield } from 'lucide-angular';
import { firstValueFrom } from 'rxjs'; 
import { TotpService } from '../../core/services/totp';

@Component({
  selector: 'app-gestion-docente',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent, LucideAngularModule],
  templateUrl: './gestion-docente.html',
  styleUrl: './gestion-docente.css'
})
export class GestionDocenteComponent implements OnInit {
  readonly Search = Search;
  readonly BarChart3 = BarChart3;
  readonly Users = Users;
  readonly Calendar = Calendar;
  readonly Clock = Clock;
  readonly Star = Star;
  readonly User = User;
  readonly UserPlus = UserPlus;
  readonly Edit = Edit;
  readonly Bell = Bell;
  readonly Download = Download;
  readonly Check = Check;
  readonly Plus = Plus;
  readonly X = X;
  readonly Shield = Shield;

  user: any = {
    id: localStorage.getItem('user_id'),
    name: localStorage.getItem('user_name'),
    role: localStorage.getItem('user_role')
  };

  // 2FA TOTP state
  twoFactorAuth: boolean = false;
  show2faSetupModal: boolean = false;
  totpVerificationCode = '';
  totpSecretKey = 'JBSWY3DPEHPK3PXP';
  scanned2faQRCodeUrl = '';

  get userEmail(): string {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && u.email) return u.email.toLowerCase().trim();
      } catch (e) {}
    }
    return 'teacher@edubridge.com';
  }

  updateQRCodeUrl() {
    const email = this.userEmail;
    this.scanned2faQRCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=otpauth://totp/EduBridge:${email}?secret=${this.totpSecretKey}%26issuer=EduBridge`;
  }

  loading: boolean = true;
  estudiantes: any[] = [];         
  estudiantesCurso: any[] = [];    
  courses: any[] = [];             
  matriculasCurso: any[] = [];
  tasks: any[] = [];

  cursoSeleccionadoId: number | null = null;

  
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

  nuevaNota = { studentId: null, courseId: null, score: null, type: null };
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
    phone: '', program: '', semester: '2026-I',
    status: 'Activo', role: 'STUDENT', riskLevel: 'Bajo',
    averageGrade: 0.0, totalClasses: 0, attendedClasses: 0,
    attendancePercentage: 0, absences: 0
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private roleService: RoleService,
    private totpService: TotpService
  ) { }

  ngOnInit(): void {
    this.firstName = this.user.name ? this.user.name.split(' ')[0] : 'Docente';
    
    setTimeout(() => {
      this.inicializarPanel();
    }, 100);
    const email = this.userEmail;
    if (email) {
      const authUrl = window.location.hostname === 'localhost' ? 'http://localhost:8081/api/auth' : 'https://edubridge-backend-v2.onrender.com/api/auth';
      this.http.get<any>(`${authUrl}/2fa/status?email=${encodeURIComponent(email)}`).subscribe({
        next: (res) => {
          this.twoFactorAuth = res.enabled;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn("No se pudo obtener el estado 2FA del backend para el docente", err);
          this.twoFactorAuth = localStorage.getItem('twoFactorAuth_enabled_' + email) === 'true';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.twoFactorAuth = false;
    }
    this.updateQRCodeUrl();
  }

  



  async inicializarPanel() {
    this.loading = true;
    try {
      if (this.roleService.isDocente(this.user.role)) {

        
        await this.cargarEstudiantesGlobales();

        
        await this.cargarTareasServidor();

        
        await this.cargarCursosDelProfesor();

        this.calcularMetricas();
      } else if (this.roleService.isEstudiante(this.user.role)) {
        await this.cargarNotasPersonales();
      }
    } catch (error) {
      console.error("Error al sincronizar datos protegidos por JWT con el panel:", error);
    } finally {
      
      setTimeout(() => {
        this.loading = false;
        this.cdr.detectChanges();
      });
    }
  }

  
  cargarNotasPersonales(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>(`https://edubridge-backend-v2.onrender.com/api/grades/student/${this.user.id}`).subscribe({
        next: (data) => {
          this.notasEstudiante = data.map(n => ({
            valor: n.value,
            nombreCurso: n.course?.name?.substring(0, 3).toUpperCase() || 'CUR',
            porcentaje: (n.value / 20) * 100
          }));
          resolve();
        },
        error: (err) => reject(err)
      });
    });
  }

  


  async cargarCursosDelProfesor(): Promise<void> {
    try {
      const profesores = await firstValueFrom(this.http.get<any[]>('https://edubridge-backend-v2.onrender.com/api/teachers'));
      const allCourses = await firstValueFrom(this.http.get<any[]>('https://edubridge-backend-v2.onrender.com/api/courses'));
      
      const profReal = profesores.find(p => Number(p.id) === Number(this.user.id));

      
      const nuevosCursos = allCourses.filter(c => c.teacher && Number(c.teacher.id) === Number(this.user.id));

      
      const viejosCursos = profesores.filter(p => Number(p.id) === Number(this.user.id) && p.course).map(p => p.course);

      
      const combinados = [...nuevosCursos];
      viejosCursos.forEach(vc => {
        if (!combinados.some(c => c.id === vc.id)) {
          combinados.push(vc);
        }
      });

      this.courses = combinados;

      if (this.courses.length > 0) {
        this.cursoSeleccionadoId = Number(this.courses[0].id);
        this.nuevaNota.courseId = this.courses[0].id;
      }

      
      if (this.cursoSeleccionadoId) {
        this.onCursoSeleccionadoChange(this.cursoSeleccionadoId);
      }
    } catch (err) {
      console.error("Error al recuperar cursos del docente:", err);
    }
  }

  onCursoSeleccionadoChange(courseId: any) {
    if (!courseId) {
      this.estudiantesCurso = [];
      this.matriculasCurso = [];
      this.cursoSeleccionadoId = null;
      return;
    }

    this.loading = true;
    this.cursoSeleccionadoId = Number(courseId);

    this.http.get<any[]>(`https://edubridge-backend-v2.onrender.com/api/enrollments/course/${this.cursoSeleccionadoId}`).subscribe({
      next: (matriculas) => {
        const activeMatriculas = matriculas.filter(m => {
          const status = (m.status || '').toUpperCase();
          return status === 'APROBADO' || status === 'ACTIVA' || status === 'ACTIVO';
        });
        this.matriculasCurso = activeMatriculas;

        
        this.estudiantesCurso = this.estudiantes.filter(alumno => {
          return activeMatriculas.some(m => {
            const idMatriculaAlumno = m.studentId ? Number(m.studentId) : (m.student ? Number(m.student.id) : null);
            return idMatriculaAlumno === Number(alumno.id);
          });
        });

        
        this.estudiantesCurso.forEach(s => {
          if (!(s.id in this.asistencia)) {
            this.asistencia[s.id] = true;
          }
        });

        this.calcularMetricas();

        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        console.error("Error al conectar con el nuevo endpoint del backend:", err);
        this.estudiantesCurso = [];
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  



  async cargarEstudiantesGlobales(): Promise<void> {
    try {
      this.estudiantes = await firstValueFrom(this.http.get<any[]>('https://edubridge-backend-v2.onrender.com/api/students'));
    } catch (err) {
      console.error("Error al recuperar estudiantes globales:", err);
    }
  }

  


  async cargarTareasServidor(): Promise<void> {
    try {
      this.tasks = await firstValueFrom(this.http.get<any[]>('https://edubridge-backend-v2.onrender.com/api/teacher-tasks'));
    } catch (err) {
      console.error("Error al recuperar tareas administrativas:", err);
    }
  }

  calcularMetricas() {
    const objetivos = this.estudiantesCurso.length > 0 ? this.estudiantesCurso : this.estudiantes;
    if (!objetivos || objetivos.length === 0) {
      this.promedioAula = '0.0';
      this.statsAprobados = 0;
      return;
    }
    const notas = objetivos.map(s => s.averageGrade || 0);
    const suma = notas.reduce((a, b) => a + b, 0);
    this.promedioAula = (suma / objetivos.length).toFixed(1);

    const aprobadosCount = objetivos.filter(s => (s.averageGrade || 0) >= 10.5).length;
    this.statsAprobados = Math.round((aprobadosCount / objetivos.length) * 100);
  }

  manejarSubirNota() {
    if (!this.nuevaNota.studentId || !this.nuevaNota.courseId || this.nuevaNota.score === null || !this.nuevaNota.type) {
      this.notificationService.showInfo("Por favor, completa todos los campos, incluyendo el tipo de evaluación.", "Campos incompletos");
      return;
    }

    const payload = {
      studentId: Number(this.nuevaNota.studentId),
      courseId: Number(this.nuevaNota.courseId),
      value: this.nuevaNota.score,
      type: this.nuevaNota.type
    };

    this.http.post('https://edubridge-backend-v2.onrender.com/api/grades', payload).subscribe({
      next: () => {
        const tempCourseId = this.nuevaNota.courseId;
        this.nuevaNota = { studentId: null, courseId: tempCourseId, score: null, type: null };

        this.cargarEstudiantesGlobales().then(() => {
          setTimeout(() => {
            this.showNotasModal = false;
            this.cdr.detectChanges();
          });
        });
        this.notificationService.showSuccess("La calificación ha sido registrada/actualizada exitosamente.");
      },
      error: (err) => this.notificationService.showError("Hubo un problema al intentar guardar la nota.")
    });
  }

  



  manejarRegistroParticipacion() {
    const hoy = new Date();
    const fechaSeleccionada = new Date(this.nuevaParticipacion.date + "T23:59:59");

    if (fechaSeleccionada > hoy) {
      this.notificationService.showError("No se puede registrar actividad en fechas posteriores.", "Fecha Inválida");
      return;
    }

    const cursoIdActual = this.cursoSeleccionadoId;

    if (!this.nuevaParticipacion.studentId || !cursoIdActual) {
      this.notificationService.showInfo("Por favor, selecciona un alumno y asegúrate de tener un curso activo.", "Información faltante");
      return;
    }

    this.loading = true;

    
    const payload = [{
      studentId: Number(this.nuevaParticipacion.studentId),
      courseId: Number(cursoIdActual),
      points: Number(this.nuevaParticipacion.points || 1)
    }];

    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('access_token');
    const options = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

    
    this.http.post('https://edubridge-backend-v2.onrender.com/api/enrollments/participations/bulk', payload, options).subscribe({
      next: () => {
        setTimeout(() => {
          this.showParticipacionModal = false;
          this.loading = false;
          this.cdr.detectChanges();
        });
        this.notificationService.showSuccess("¡Puntos sumados con éxito en la tarjeta del estudiante!");
        this.nuevaParticipacion = { studentId: null, points: 1, observation: '', date: new Date().toISOString().split('T')[0] };
      },
      error: (err) => {
        console.error("Error al sincronizar puntos:", err);
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
        this.notificationService.showError("No se pudo actualizar la tarjeta. Revisa la consola del backend.");
      }
    });
  }

  manejarRegistroEstudiante() {
    if (!this.nuevoEstudiante.name || !this.nuevoEstudiante.code || !this.nuevoEstudiante.email) {
      this.notificationService.showInfo("Nombre, Código y Email son obligatorios para el registro.", "Campos obligatorios");
      return;
    }

    this.http.post('https://edubridge-backend-v2.onrender.com/api/students', this.nuevoEstudiante).subscribe({
      next: () => {
        this.cargarEstudiantesGlobales().then(() => {
          setTimeout(() => {
            this.showStudentModal = false;
            this.cdr.detectChanges();
          });
        });
        this.notificationService.showSuccess("Alumno registrado correctamente en la base de datos.");
      },
      error: (err) => this.notificationService.showError("Error al guardar: " + err.message)
    });
  }

  toggleCheck(id: number) {
    this.asistencia[id] = !this.asistencia[id];
  }

  getStudentAttendanceText(studentId: number): string {
    const m = this.matriculasCurso.find(x => {
      const sId = x.studentId ? Number(x.studentId) : (x.student ? Number(x.student.id) : null);
      return sId === Number(studentId);
    });
    if (!m) return '0 / 40 (0%)';
    const attended = m.attendedClasses || 0;
    const pct = Math.round((attended / 40) * 100);
    return `${attended} / 40 (${pct}%)`;
  }

  guardarAsistencia() {
    if (!this.cursoSeleccionadoId) {
      this.notificationService.showInfo("Por favor, selecciona un curso válido antes de proceder.", "Aviso");
      return;
    }

    this.loading = true;

    const payload = this.estudiantesCurso.map(alumno => ({
      studentId: Number(alumno.id),
      courseId: this.cursoSeleccionadoId,
      present: this.asistencia[alumno.id] === true
    }));

    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('access_token');
    const options = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

    this.http.post('https://edubridge-backend-v2.onrender.com/api/enrollments/attendance/bulk', payload, options).subscribe({
      next: () => {
        if (this.cursoSeleccionadoId) {
          this.onCursoSeleccionadoChange(this.cursoSeleccionadoId);
        }
        setTimeout(() => {
          this.showAsistenciaModal = false;
          this.loading = false;
          this.cdr.detectChanges();
        });
        this.notificationService.showSuccess("La asistencia ha sido procesada y acumulada con éxito.");
      },
      error: (err) => {
        console.error("Error crítico al guardar asistencia masiva:", err);
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
        this.notificationService.showError("No se pudo guardar la lista. Revisa la consola.");
      }
    });
  }

  manejarEnvioNotificacion() {
    if (!this.nuevaNotif.studentId || !this.nuevaNotif.message || !this.nuevaNotif.type) {
      this.notificationService.showInfo("Selecciona un alumno, el tipo de alerta y escribe el mensaje.", "Información faltante");
      return;
    }

    const payload = {
      studentId: Number(this.nuevaNotif.studentId),
      message: this.nuevaNotif.message,
      content: this.nuevaNotif.message,
      type: this.nuevaNotif.type
    };

    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('access_token');
    const options = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

    this.http.post('https://edubridge-backend-v2.onrender.com/api/notifications', payload, options).subscribe({
      next: () => {
        setTimeout(() => {
          this.showNotifyModal = false;
          this.cdr.detectChanges();
        });
        this.nuevaNotif = { studentId: '', message: '', type: 'GENERAL' };
        this.notificationService.showSuccess("Notificación enviada exitosamente al estudiante.");
      },
      error: (err) => {
        console.error("Error al enviar notificación:", err);
        this.notificationService.showError("No se pudo enviar la notificación.");
      }
    });
  }

  toggleTwoFactorSwitch() {
    if (!this.twoFactorAuth) {
      this.totpVerificationCode = '';
      this.totpSecretKey = this.totpService.generateRandomSecret();
      this.updateQRCodeUrl();
      this.show2faSetupModal = true;
    } else {
      if (confirm("¿Estás seguro de que deseas desactivar la Autenticación de Dos Factores? Esto reducirá drásticamente la seguridad de tu cuenta.")) {
        const email = this.userEmail;
        const authUrl = window.location.hostname === 'localhost' ? 'http://localhost:8081/api/auth' : 'https://edubridge-backend-v2.onrender.com/api/auth';
        this.http.post(`${authUrl}/2fa/disable`, { email }).subscribe({
          next: () => {
            this.twoFactorAuth = false;
            localStorage.removeItem('twoFactorAuth_enabled_' + email);
            localStorage.removeItem('twoFactorAuth_secret_' + email);
            this.notificationService.showSuccess("Autenticación de Dos Factores desactivada con éxito.");
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error("Error al desactivar 2FA del docente en el servidor", err);
            this.notificationService.showError("No se pudo desactivar la Autenticación de Dos Factores en el servidor.");
          }
        });
      }
    }
    this.cdr.detectChanges();
  }

  confirmarActivacion2fa() {
    if (!this.totpVerificationCode || this.totpVerificationCode.length !== 6 || isNaN(Number(this.totpVerificationCode))) {
      this.notificationService.showError("Por favor, ingresa el código de 6 dígitos que se muestra en tu aplicación autenticadora.", "Código Inválido");
      return;
    }

    const email = this.userEmail;
    const authUrl = window.location.hostname === 'localhost' ? 'http://localhost:8081/api/auth' : 'https://edubridge-backend-v2.onrender.com/api/auth';

    this.http.post(`${authUrl}/2fa/enable`, {
      email: email,
      secret: this.totpSecretKey,
      code: this.totpVerificationCode
    }).subscribe({
      next: () => {
        this.twoFactorAuth = true;
        localStorage.setItem('twoFactorAuth_enabled_' + email, 'true');
        localStorage.setItem('twoFactorAuth_secret_' + email, this.totpSecretKey);
        this.show2faSetupModal = false;
        this.notificationService.showSuccess("¡Autenticación de Dos Factores (TOTP) configurada y activada con éxito!");
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error("Error al activar 2FA del docente en el servidor", err);
        this.notificationService.showError(err.error?.message || "El código ingresado es incorrecto o ha expirado.", "Código Inválido");
      }
    });
  }

  cancelarActivacion2fa() {
    this.show2faSetupModal = false;
    this.twoFactorAuth = false;
    this.cdr.detectChanges();
  }
}
