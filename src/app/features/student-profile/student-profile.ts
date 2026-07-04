import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { NotificationService } from '../../core/services/notification';
import { TotpService } from '../../core/services/totp';
import { API_BASE_URL } from '../../core/config/api.config';
import { LucideAngularModule, Settings, Mail, Phone, MapPin, Award, Calendar, X, FileText, Check, Shield, Download } from 'lucide-angular';

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
  readonly Download = Download;


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

  exportarCSV() {
    if (!this.selectedStudent || !this.academicGrades || this.academicGrades.length === 0) {
      this.notificationService.showInfo("No hay notas disponibles para exportar.", "Reporte Vacío");
      return;
    }

    const headers = ["Curso", "Créditos", "Evaluaciones", "Promedio", "Estado"];
    const rows = this.academicGrades.map(curso => {
      const evs = curso.evaluaciones.map((e: any) => `${e.type}: ${e.value}`).join(' | ');
      const promedio = (Math.round(curso.promedio * 10) / 10).toFixed(1);
      const estado = curso.promedio >= 12.5 ? "Aprobado" : "En Proceso";
      return [
        `"${curso.name}"`,
        curso.credits,
        `"${evs}"`,
        promedio,
        `"${estado}"`
      ];
    });

    const csvContent = "\ufeff" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const studentCode = this.selectedStudent.code || 'Estudiante';
    a.href = url;
    a.download = `Reporte_Notas_${studentCode.replace(/\s+/g, '_')}.csv`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    this.notificationService.showSuccess("El reporte de notas en formato CSV se ha descargado correctamente.");
  }

  exportarPDF() {
    if (!this.selectedStudent || !this.academicGrades || this.academicGrades.length === 0) {
      this.notificationService.showInfo("No hay notas disponibles para exportar.", "Reporte Vacío");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      this.notificationService.showError("El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.");
      return;
    }

    const studentName = this.selectedStudent.name;
    const studentCode = this.selectedStudent.code || 'N/A';
    const program = this.selectedStudent.program || 'Ingeniería de Sistemas';
    const semester = this.selectedStudent.semester || '2026-I';
    const promGeneral = (Math.round(this.promedioGeneralReal * 100) / 100).toFixed(2);
    const absences = this.faltasTotalesReales;
    const today = new Date().toLocaleDateString('es-PE', { year: 'numeric', month: 'long', day: 'numeric' });

    let tableRowsHtml = '';
    this.academicGrades.forEach(curso => {
      const evs = curso.evaluaciones.map((e: any) => `<span class="eval-badge">${e.type}: <strong>${e.value.toFixed(1)}</strong></span>`).join(' ');
      const promedio = curso.promedio.toFixed(1);
      const estado = curso.promedio >= 12.5 ? 'APROBADO' : 'EN PROCESO';
      const statusClass = curso.promedio >= 12.5 ? 'status-approved' : 'status-pending';
      tableRowsHtml += `
        <tr>
          <td>
            <div class="course-name">${curso.name}</div>
            <div class="eval-list">${evs}</div>
          </td>
          <td class="text-center font-semibold">${curso.credits}</td>
          <td class="text-center font-bold text-slate-800">${promedio}</td>
          <td class="text-right"><span class="status-badge ${statusClass}">${estado}</span></td>
        </tr>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Reporte de Notas - ${studentName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

          body {
            font-family: 'Inter', sans-serif;
            margin: 0;
            padding: 40px;
            color: #1e293b;
            background-color: #ffffff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }

          .logo-area h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            color: #4f46e5;
            letter-spacing: -0.02em;
          }

          .logo-area p {
            margin: 2px 0 0 0;
            font-size: 11px;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 600;
          }

          .report-meta {
            text-align: right;
          }

          .report-meta h2 {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
            color: #0f172a;
          }

          .report-meta p {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #64748b;
          }

          .student-info-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 20px;
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 30px;
          }

          .info-block {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px 10px;
          }

          .info-item {
            display: flex;
            flex-direction: column;
          }

          .info-item label {
            font-size: 10px;
            color: #64748b;
            text-transform: uppercase;
            font-weight: 600;
            letter-spacing: 0.05em;
            margin-bottom: 4px;
          }

          .info-item span {
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
          }

          .stats-block {
            display: flex;
            flex-direction: column;
            justify-content: center;
            border-left: 1px solid #cbd5e1;
            padding-left: 25px;
            gap: 15px;
          }

          .stat-item {
            display: flex;
            align-items: baseline;
            gap: 8px;
          }

          .stat-item label {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
          }

          .stat-item span {
            font-size: 20px;
            font-weight: 800;
          }

          .stat-item.promedio span {
            color: #4f46e5;
          }

          .grades-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 40px;
          }

          .grades-table th {
            text-align: left;
            padding: 12px 16px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #64748b;
            border-bottom: 2px solid #cbd5e1;
            background-color: #f1f5f9;
          }

          .grades-table td {
            padding: 16px;
            font-size: 13px;
            border-bottom: 1px solid #e2e8f0;
            vertical-align: middle;
          }

          .course-name {
            font-weight: 600;
            color: #0f172a;
            font-size: 14px;
          }

          .eval-list {
            margin-top: 6px;
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }

          .eval-badge {
            background-color: #f1f5f9;
            border: 1px solid #e2e8f0;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            color: #475569;
          }

          .eval-badge strong {
            color: #0f172a;
          }

          .status-badge {
            display: inline-block;
            font-size: 10px;
            font-weight: 700;
            padding: 3px 8px;
            border-radius: 9999px;
            text-align: center;
          }

          .status-approved {
            background-color: #d1fae5;
            color: #065f46;
          }

          .status-pending {
            background-color: #fee2e2;
            color: #991b1b;
          }

          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: 700; }

          .report-footer {
            margin-top: 80px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }

          .signature-area {
            text-align: center;
            width: 200px;
          }

          .signature-line {
            border-top: 1px solid #94a3b8;
            margin-bottom: 8px;
          }

          .signature-title {
            font-size: 11px;
            color: #64748b;
            font-weight: 500;
          }

          .sys-date {
            font-size: 11px;
            color: #94a3b8;
          }

          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="report-header">
          <div class="logo-area">
            <h1>EduBridge</h1>
            <p>Portal de Gestión Académica</p>
          </div>
          <div class="report-meta">
            <h2>Reporte Oficial de Calificaciones</h2>
            <p>Generado el ${today}</p>
          </div>
        </div>

        <div class="student-info-grid">
          <div class="info-block">
            <div class="info-item">
              <label>Estudiante</label>
              <span>${studentName}</span>
            </div>
            <div class="info-item">
              <label>Código</label>
              <span>${studentCode}</span>
            </div>
            <div class="info-item">
              <label>Programa Académico</label>
              <span>${program}</span>
            </div>
            <div class="info-item">
              <label>Semestre</label>
              <span>${semester}</span>
            </div>
          </div>

          <div class="stats-block">
            <div class="stat-item promedio">
              <label>Promedio General:</label>
              <span>${promGeneral}</span>
            </div>
            <div class="stat-item">
              <label>Inasistencias Totales:</label>
              <span>${absences}</span>
            </div>
          </div>
        </div>

        <table class="grades-table">
          <thead>
            <tr>
              <th style="width: 55%;">Curso y Detalle de Evaluaciones</th>
              <th style="width: 15%; text-align: center;">Créditos</th>
              <th style="width: 15%; text-align: center;">Promedio</th>
              <th style="width: 15%; text-align: right;">Estatus</th>
            </tr>
          </thead>
          <tbody>
            ${tableRowsHtml}
          </tbody>
        </table>

        <div class="report-footer">
          <div class="sys-date">
            * Este reporte es de carácter informativo generado desde el sistema oficial EduBridge.
          </div>
          <div class="signature-area">
            <div class="signature-line"></div>
            <div class="signature-title">Oficina de Registro Académico</div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
}
