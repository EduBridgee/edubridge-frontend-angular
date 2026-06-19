import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../core/services/notification';
import { TotpService } from '../../core/services/totp';
import { API_BASE_URL } from '../../core/config/api.config';
import { LucideAngularModule, Settings, Mail, Phone, MapPin, Award, Calendar, X, FileText, Check, Shield } from 'lucide-angular';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css'
})
export class StudentProfileComponent implements OnInit {
  readonly Settings = Settings;
  readonly Mail = Mail;
  readonly Phone = Phone;
  readonly MapPin = MapPin;
  readonly Award = Award;
  readonly Calendar = Calendar;
  readonly X = X;
  readonly FileText = FileText;
  readonly Check = Check;
  readonly Shield = Shield;

  
  get userEmail(): string {
    const email = localStorage.getItem('user_email');
    if (email) return email.toLowerCase().trim();
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && u.email) return u.email.toLowerCase().trim();
      } catch (e) {}
    }
    return '';
  }

  get apiBaseUrl(): string {
    return API_BASE_URL;
  }

  user: any = {
    id: localStorage.getItem('user_id'),
    name: localStorage.getItem('user_name'),
    role: localStorage.getItem('user_role')
  };

  students: any[] = [];
  filteredStudents: any[] = [];
  academicGrades: any[] = [];
  selectedStudent: any = null;
  courses: any[] = [];
  loading: boolean = true;
  loadingCourses: boolean = true;
  searchTerm: string = '';
  saving: boolean = false;

  showEditModal: boolean = false;
  editingStudent: any = {};
  newGrade = { courseId: null, value: null };

  
  promedioGeneralReal: number = 0;
  faltasTotalesReales: number = 0;

  twoFactorAuth: boolean = false;
  show2faSetupModal: boolean = false;
  totpVerificationCode: string = '';
  totpSecretKey: string = '';
  scanned2faQRCodeUrl: string = '';

  academicHistory = [
    {
      period: "2024-I",
      credits: 18,
      average: 17.4,
      courses: [
        { name: "Introducción a la Programación", grade: 18, credits: 4, status: "Aprobado" },
        { name: "Matemática Básica", grade: 17, credits: 4, status: "Aprobado" },
        { name: "Química General", grade: 16, credits: 3, status: "Aprobado" },
        { name: "Comunicación", grade: 17, credits: 3, status: "Aprobado" },
        { name: "Introducción a la Ingeniería", grade: 19, credits: 2, status: "Aprobado" },
      ]
    },
    {
      period: "2024-II (En Curso)",
      credits: 21,
      average: 16.5,
      courses: [
        { name: "Matemáticas Avanzadas", grade: 17, credits: 4, status: "Aprobado" },
        { name: "Física Moderna", grade: 16, credits: 4, status: "Aprobado" },
        { name: "Química Orgánica", grade: 15, credits: 3, status: "Aprobado" },
        { name: "Literatura Contemporánea", grade: 18, credits: 3, status: "Aprobado" },
        { name: "Historia Universal", grade: 16, credits: 3, status: "Aprobado" },
        { name: "Inglés Avanzado", grade: 17, credits: 4, status: "Aprobado" },
      ]
    }
  ];

  achievements = [
    { title: "Cuadro de Honor", desc: "Rendimiento destacado semestre 2024-I", date: "14 de julio de 2024", icon: "🏆" },
    { title: "Mejor Proyecto", desc: "1er lugar en concurso de software", date: "10 de junio de 2024", icon: "💻" },
    { title: "100% Asistencia", desc: "Asistencia perfecta semestre 2023-II", date: "15 de diciembre de 2023", icon: "✅" }
  ];

  documents = [
    { title: "Certificado de Estudios 2024-I", size: "245 KB", date: "19 de julio de 2024" },
    { title: "Constancia de Matrícula 2024-II", size: "180 KB", date: "4 de marzo de 2024" },
    { title: "Certificado de Conducta", size: "120 KB", date: "10 de julio de 2024" }
  ];

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private totpService: TotpService
  ) { }

  ngOnInit() {
    this.cargarEstudiantes();
    this.cargarCursosDesdeBD();
    const email = this.userEmail;
    if (email) {
      const authUrl = `${API_BASE_URL}/auth`;
      this.http.get<any>(`${authUrl}/2fa/status?email=${encodeURIComponent(email)}`).subscribe({
        next: (res) => {
          this.twoFactorAuth = res.enabled;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn("No se pudo obtener el estado 2FA del backend, usando fallback local", err);
          this.twoFactorAuth = localStorage.getItem('twoFactorAuth_enabled_' + email) === 'true';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.twoFactorAuth = false;
    }
    this.updateQRCodeUrl();
  }

  updateQRCodeUrl() {
    const email = this.userEmail || 'student@edubridge.com';
    this.scanned2faQRCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=otpauth://totp/EduBridge:${email}?secret=${this.totpSecretKey}%26issuer=EduBridge`;
  }

  cargarEstudiantes() {
    this.loading = true;
    const currentUser = { ...this.user, email: this.userEmail };
    const currentUserIdNum = currentUser.id ? Number(currentUser.id) : null;

    this.http.get<any[]>(`${this.apiBaseUrl}/students`).subscribe({
      next: (data) => {
        this.students = data;
        this.filteredStudents = data;

        
        this.selectedStudent = data.find(s =>
          (currentUserIdNum && s.id === currentUserIdNum) ||
          (currentUser.email && s.email === currentUser.email)
        );

        if (!this.selectedStudent && currentUser.role === 'estudiante') {
          this.selectedStudent = currentUser;
        }

        if (this.selectedStudent) {
          this.cargarNotasEstudiante(this.selectedStudent.id);
          this.cargarFaltasEstudiante(this.selectedStudent.id);
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar estudiantes", err);
        if (currentUser.role === 'estudiante') {
          this.selectedStudent = currentUser;
          this.cargarNotasEstudiante(Number(currentUser.id));
          this.cargarFaltasEstudiante(Number(currentUser.id));
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarNotasEstudiante(studentId: number) {
    this.http.get<any[]>(`${this.apiBaseUrl}/grades/student/${studentId}`).subscribe({
      next: (notas) => {
        const cursosMap = new Map();

        notas.forEach(n => {
          const courseId = n.course?.id;
          if (!cursosMap.has(courseId)) {
            cursosMap.set(courseId, {
              name: n.course?.name || 'Curso Desconocido',
              credits: n.course?.credits || 0,
              evaluaciones: [],
              suma: 0
            });
          }

          const cursoData = cursosMap.get(courseId);
          cursoData.evaluaciones.push({
            type: n.type,
            value: n.value
          });
          cursoData.suma += n.value;
        });

        this.academicGrades = Array.from(cursosMap.values()).map(c => ({
          ...c,
          promedio: c.evaluaciones.length > 0 ? c.suma / c.evaluaciones.length : 0
        }));

        
        if (this.academicGrades.length > 0) {
          const sumaPromedios = this.academicGrades.reduce((acc, c) => acc + c.promedio, 0);
          this.promedioGeneralReal = sumaPromedios / this.academicGrades.length;
        } else {
          this.promedioGeneralReal = 0;
        }

        this.cdr.detectChanges();
      }
    });
  }

  cargarFaltasEstudiante(studentId: number) {
    this.http.get<any[]>(`${this.apiBaseUrl}/enrollments/student/${studentId}`).subscribe({
      next: (enrollments) => {
        let totalFaltas = 0;
        const activeEnrollments = enrollments.filter(e => {
          const status = (e.status || '').toUpperCase();
          return status === 'APROBADO' || status === 'ACTIVA' || status === 'ACTIVO';
        });
        activeEnrollments.forEach(e => {
          totalFaltas += e.absences !== undefined ? e.absences : ((e.totalClasses || 0) - (e.attendedClasses || 0));
        });
        this.faltasTotalesReales = totalFaltas;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar faltas del estudiante", err);
      }
    });
  }

  cargarCursosDesdeBD() {
    this.loadingCourses = true;
    this.http.get<any[]>(`${this.apiBaseUrl}/courses`).subscribe({
      next: (data) => {
        this.courses = data;
        this.loadingCourses = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar cursos", err);
        this.loadingCourses = false;
        this.cdr.detectChanges();
      }
    });
  }

  filtrarAlumnos() {
    this.filteredStudents = this.students.filter(s =>
      s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (s.code && s.code.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  seleccionarAlumno(alumno: any) {
    this.selectedStudent = alumno;
    if (alumno && alumno.id) {
      this.cargarNotasEstudiante(alumno.id);
      this.cargarFaltasEstudiante(alumno.id);
    }
  }

  getInitials(name: string): string {
    if (!name) return 'CM';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }

  get initials() {
    return this.user?.name ? this.user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'CM';
  }

  abrirEdicion() {
    this.editingStudent = { ...this.selectedStudent };
    this.showEditModal = true;
  }

  guardarCambios() {
    if (!this.editingStudent.id) return;
    this.saving = true;
    this.http.put(`${this.apiBaseUrl}/students/${this.editingStudent.id}`, this.editingStudent).subscribe({
      next: (updated: any) => {
        const index = this.students.findIndex(s => s.id === updated.id);
        if (index !== -1) {
          this.students[index] = updated;
          this.selectedStudent = updated;
        }

        if (updated.email === this.userEmail) {
          localStorage.setItem('user_name', updated.name);
          this.user.name = updated.name;
        }

        this.showEditModal = false;
        this.saving = false;
        this.cdr.detectChanges();
        this.notificationService.showSuccess("El perfil ha sido actualizado correctamente.");
      },
      error: (err) => {
        console.error("Error al guardar cambios", err);
        this.saving = false;
        this.cdr.detectChanges();
        this.notificationService.showError("Hubo un problema al intentar actualizar el perfil.");
      }
    });
  }

  subirNota() {
    if (!this.selectedStudent || !this.newGrade.courseId || !this.newGrade.value) {
      this.notificationService.showInfo("Completa todos los campos del registro de notas.", "Información faltante");
      return;
    }

    const payload = {
      studentId: this.selectedStudent.id,
      courseId: Number(this.newGrade.courseId),
      value: this.newGrade.value
    };

    this.http.post(`${this.apiBaseUrl}/grades`, payload).subscribe({
      next: () => {
        this.notificationService.showSuccess("La nota ha sido sincronizada correctamente.");
        this.newGrade = { courseId: null, value: null };
        this.cargarEstudiantes();
      },
      error: (err) => {
        console.error("Error al registrar nota", err);
        this.notificationService.showError("Hubo un error al intentar registrar la nota.");
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
        const authUrl = `${API_BASE_URL}/auth`;
        this.http.post(`${authUrl}/2fa/disable`, { email }).subscribe({
          next: () => {
            this.twoFactorAuth = false;
            localStorage.removeItem('twoFactorAuth_enabled_' + email);
            localStorage.removeItem('twoFactorAuth_secret_' + email);
            this.notificationService.showSuccess("Autenticación de Dos Factores desactivada con éxito.");
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error("Error al desactivar 2FA en el servidor", err);
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
    const authUrl = `${API_BASE_URL}/auth`;

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
        console.error("Error al activar 2FA en el servidor", err);
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