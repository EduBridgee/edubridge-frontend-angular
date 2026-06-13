import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { forkJoin } from 'rxjs';
import { TotpService } from '../../core/services/totp';
import {
  LucideAngularModule, Search, Bell, UserPlus, SlidersHorizontal, Download, Edit, UserCheck,
  Trash2, MoreVertical, Plus, BookOpen, User, Users, Clock, Calendar, BarChart3, AlertTriangle,
  TrendingUp, GraduationCap, CheckCircle2, Check, X, Printer, Send, FileDown,
  Activity, RotateCcw, Save, Lock, Globe, Database,
  MessageSquare, Shield, Settings, Mail
} from 'lucide-angular';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, DecimalPipe, LucideAngularModule, SidebarComponent, FormsModule],
  templateUrl: './admin.html'
})
export class AdminComponent implements OnInit {
  private readonly API_URL = 'https://edubridge-backend-v2.onrender.com/api';

  activeTab = 'dashboard';
  configTab = 'general';
  loading = true;

  reporteActivo = 'Rendimiento Académico';
  categoriaSeleccionada = 'Todas';

  selectedReportPeriod: string = 'Todos';
  selectedReportCourseId: number | null = null;
  periodos: string[] = [];
  gradesList: any[] = [];
  reportStats: any = {
    avgGrade: 0,
    approvalRate: 0,
    topStudentsCount: 0,
    topStudentsPct: 0,
    riskStudentsCount: 0,

    avgAttendance: 0,
    perfectAttendanceCount: 0,
    perfectAttendancePct: 0,
    totalClasses: 0,
    riskAttendanceCount: 0,

    totalEnrollments: 0,
    activeEnrollmentsCount: 0,
    activeEnrollmentsPct: 0,
    pendingEnrollmentsCount: 0,
    cancelledEnrollmentsCount: 0
  };
  reporteBarras: any[] = [];
  pieChartSlices: any[] = [];
  pieChartCenterLabel: string = 'Calific.';
  radarPoints: string = '50,50 50,50 50,50 50,50 50,50 50,50';
  showSendReportModal = false;
  selectedTeacherForReport: any = null;
  emailNotifications = true;
  smsNotifications = false;
  twoFactorAuth = false;
  show2faSetupModal = false;
  totpVerificationCode = '';
  totpSecretKey = 'JBSWY3DPEHPK3PXP';
  scanned2faQRCodeUrl = '';

  get currentUserEmail(): string {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && u.email) return u.email.toLowerCase().trim();
      } catch (e) {}
    }
    return 'admin@edubridge.com';
  }

  updateQRCodeUrl() {
    const email = this.currentUserEmail;
    this.scanned2faQRCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=otpauth://totp/EduBridge:${email}?secret=${this.totpSecretKey}%26issuer=EduBridge`;
  }

  notifNewEnrollments = true;
  notifNewGrades = true;
  notifAttendanceAlerts = false;

  institucionName = 'EduBridge Academy';
  institucionEmail = 'admin@edubridge.com';
  institucionPhone = '+51 987 654 321';
  institucionTimeZone = 'Lima (UTC-5)';
  institucionLanguage = 'Español';
  institucionYear = '2026-2027';

  inactiveTimeout = '30 minutos';
  passwordExpiration = '90 días';
  newPasswordConfig = '';
  confirmPasswordConfig = '';

  showConfirmModal = false;
  selectedEnrollment: any = null;
  confirmActionType: 'APROBADO' | 'CANCELADO' = 'APROBADO';
  confirmModalMessage = '';
  showNewEnrollmentModal = false;
  searchEnrollmentTerm = '';
  selectedEnrollmentStatus = 'Todos';


  showNewStudentModal = false;
  showNewTeacherModal = false;
  showEditStudentModal = false;
  showEditTeacherModal = false;
  selectedStudentId: number | null = null;
  selectedTeacherId: number | null = null;
  searchAccountTerm = '';
  selectedAccountRole = 'Todos';

  teacherRequest = {
    name: '',
    email: '',
    password: '',
    specialization: '',
    courseId: null as number | null
  };


  showNewCourseModal = false;
  courseRequest = {
    name: '',
    code: '',
    credits: 4,
    category: 'Matemáticas',
    icon: 'book-open',
    teacherId: null as number | null
  };
  profesores: any[] = [];


  showEditCourseModal = false;
  selectedCourseId: number | null = null;
  editCourseRequest = {
    name: '',
    code: '',
    credits: 4,
    category: 'Matemáticas',
    icon: 'book-open',
    teacherId: null as number | null
  };
  studentRequest = {
    name: '',
    email: '',
    password: 'student123',
    role: 'STUDENT',
    code: '',
    program: 'Ciencias de la Computación',
    semester: '2026-I',
    status: 'Activo',
    phone: '',
    address: '',
    averageGrade: 0.0,
    riskLevel: 'Bajo',
    grade: 'N/A',
    absences: 0,
    totalClasses: 0,
    attendedClasses: 0,
    attendancePercentage: 100
  };

  user = { name: localStorage.getItem('user_name') || 'Admin', role: localStorage.getItem('user_role') || 'admin' };

  estudiantes: any[] = [];
  cursos: any[] = [];
  matriculas: any[] = [];
  cursosFiltrados: any[] = [];
  stats: any = { totalStudents: 0, activeCourses: 0, monthlyEnrollments: 0, approvalRate: 0 };
  reporteMaterias: any[] = [];
  enrollmentRequest = { studentId: null, courseId: null, semester: '2026-I' };


  readonly Search = Search; readonly Bell = Bell; readonly UserPlus = UserPlus;
  readonly SlidersHorizontal = SlidersHorizontal; readonly Download = Download; readonly Edit = Edit;
  readonly UserCheck = UserCheck; readonly Trash2 = Trash2; readonly MoreVertical = MoreVertical;
  readonly Plus = Plus; readonly BookOpen = BookOpen; readonly User = User; readonly Users = Users;
  readonly Clock = Clock; readonly Calendar = Calendar; readonly BarChart3 = BarChart3;
  readonly AlertTriangle = AlertTriangle; readonly TrendingUp = TrendingUp; readonly GraduationCap = GraduationCap;
  readonly CheckCircle2 = CheckCircle2; readonly Check = Check; readonly X = X;
  readonly Printer = Printer; readonly Send = Send; readonly FileDown = FileDown;
  readonly Activity = Activity; readonly RotateCcw = RotateCcw;
  readonly Save = Save; readonly Lock = Lock;
  readonly Globe = Globe; readonly Database = Database;
  readonly MessageSquare = MessageSquare; readonly Shield = Shield;
  readonly Settings = Settings; readonly Mail = Mail;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private totpService: TotpService
  ) { }

  ngOnInit(): void {
    this.cargarDataGeneral();
    const email = this.currentUserEmail;
    if (email) {
      const authUrl = window.location.hostname === 'localhost' ? 'http://localhost:8081/api/auth' : 'https://edubridge-backend-v2.onrender.com/api/auth';
      this.http.get<any>(`${authUrl}/2fa/status?email=${encodeURIComponent(email)}`).subscribe({
        next: (res) => {
          this.twoFactorAuth = res.enabled;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.warn("No se pudo obtener el estado 2FA del backend para el admin", err);
          this.twoFactorAuth = localStorage.getItem('twoFactorAuth_enabled_' + email) === 'true';
          this.cdr.detectChanges();
        }
      });
    } else {
      this.twoFactorAuth = false;
    }
    this.updateQRCodeUrl();
  }

  cargarDataGeneral(): void {
    this.loading = true;
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });

    forkJoin({
      cursos: this.http.get<any[]>(`${this.API_URL}/courses`, { headers }),
      estudiantes: this.http.get<any[]>(`${this.API_URL}/students`, { headers }),
      matriculas: this.http.get<any[]>(`${this.API_URL}/enrollments`, { headers }),
      profesores: this.http.get<any[]>(`${this.API_URL}/teachers`, { headers }),
      grades: this.http.get<any[]>(`${this.API_URL}/grades`, { headers })
    }).subscribe({
      next: (res: any) => {
        this.estudiantes = (res.estudiantes || []).map((s: any) => ({ ...s, average: s.averageGrade }));
        this.matriculas = res.matriculas || [];
        this.profesores = res.profesores || [];
        this.gradesList = res.grades || [];
        this.stats.totalStudents = this.estudiantes.length;

        const gradesList = res.grades || [];
        this.matriculas.forEach((m: any) => {
          const sg = gradesList.filter((g: any) => g.student?.id === m.student?.id && g.course?.id === m.course?.id);
          m.grade = sg.length > 0 ? parseFloat((sg.reduce((a: number, g: any) => a + g.value, 0) / sg.length / 4.0).toFixed(1)) : null;
        });

        this.cursos = res.cursos.map((curso: any) => {
          const profe = curso.teacher || res.profesores.find((p: any) => p.course?.id === curso.id);
          const totalAlumnos = this.matriculas.filter((m: any) =>
            m.course?.id === curso.id && (m.status === 'APROBADO' || m.status === 'ACTIVA' || m.status === 'ACTIVO')
          ).length;

          return {
            ...curso,
            teacher: profe ? profe.name : "Por asignar",
            initialDoc: profe ? profe.name.substring(0, 2).toUpperCase() : '??',
            students: totalAlumnos,
            occupancy: 0,
            status: totalAlumnos > 0 ? 'Activo' : 'Pendiente'
          };
        });

        this.cursosFiltrados = [...this.cursos];
        this.stats.activeCourses = this.cursos.length;
        this.stats.monthlyEnrollments = this.matriculas.length;

        const uniqueSemesters = Array.from(new Set(this.matriculas.map(m => m.semester).filter(Boolean)));
        this.periodos = uniqueSemesters.sort().reverse();

        this.calcularReportes();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => { console.error("Error:", err); this.loading = false; }
    });
  }



  calcularReportes(): void {
    let list = this.matriculas;
    if (this.selectedReportPeriod !== 'Todos') {
      list = list.filter(m => m.semester === this.selectedReportPeriod);
    }
    if (this.selectedReportCourseId !== null) {
      list = list.filter(m => m.course?.id === Number(this.selectedReportCourseId));
    }

    if (this.reporteActivo === 'Rendimiento Académico') {
      this.pieChartCenterLabel = 'Calific.';

      const gradedEnrolls = list.filter(m => m.grade !== null);
      const avgGrade = gradedEnrolls.length > 0 ? gradedEnrolls.reduce((sum, m) => sum + m.grade, 0) / gradedEnrolls.length : 0;

      const approvedEnrolls = gradedEnrolls.filter(m => m.grade >= 2.625);
      const approvalRate = gradedEnrolls.length > 0 ? (approvedEnrolls.length / gradedEnrolls.length) * 100 : 0;

      const topEnrolls = gradedEnrolls.filter(m => m.grade >= 4.0);
      const riskEnrolls = gradedEnrolls.filter(m => m.grade < 2.625);

      this.reportStats.avgGrade = avgGrade;
      this.reportStats.approvalRate = approvalRate;
      this.reportStats.topStudentsCount = topEnrolls.length;
      this.reportStats.topStudentsPct = gradedEnrolls.length > 0 ? (topEnrolls.length / gradedEnrolls.length) * 100 : 0;
      this.reportStats.riskStudentsCount = riskEnrolls.length;

      this.reporteMaterias = this.cursos.map(c => {
        const cEnrolls = list.filter(m => m.course?.id === c.id);
        const cGraded = cEnrolls.filter(m => m.grade !== null);
        const cAvg = cGraded.length > 0 ? cGraded.reduce((sum, m) => sum + m.grade, 0) / cGraded.length : 0;
        return {
          name: c.name,
          students: cEnrolls.length,
          average: cAvg,
          approved: cGraded.filter(m => m.grade >= 2.625).length,
          top: cGraded.filter(m => m.grade >= 4.0).length,
          risk: cGraded.filter(m => m.grade < 2.625).length
        };
      });

      const maxGrade = 5.0;
      const filteredCoursesForBars = this.cursos.slice(0, 5);
      this.reporteBarras = filteredCoursesForBars.map(c => {
        const matchMat = this.reporteMaterias.find(rm => rm.name === c.name);
        const avg = matchMat ? matchMat.average : 0;
        return {
          label: c.code || c.name.substring(0, 3).toUpperCase(),
          value: avg,
          height: maxGrade > 0 ? (avg / maxGrade) * 100 : 0
        };
      });

      const countA = gradedEnrolls.filter(m => m.grade >= 4.25).length;
      const countB = gradedEnrolls.filter(m => m.grade >= 3.5 && m.grade < 4.25).length;
      const countC = gradedEnrolls.filter(m => m.grade >= 2.75 && m.grade < 3.5).length;
      const countD = gradedEnrolls.filter(m => m.grade >= 2.0 && m.grade < 2.75).length;
      const countF = gradedEnrolls.filter(m => m.grade < 2.0).length;
      const totalGraded = gradedEnrolls.length || 1;

      this.pieChartSlices = [
        { label: 'A (>=17)', color: '#10b981', pct: (countA / totalGraded) * 100 },
        { label: 'B (14-16)', color: '#3b82f6', pct: (countB / totalGraded) * 100 },
        { label: 'C (11-13)', color: '#f59e0b', pct: (countC / totalGraded) * 100 },
        { label: 'D (8-10)', color: '#ef4444', pct: (countD / totalGraded) * 100 },
        { label: 'F (<8)', color: '#ea580c', pct: (countF / totalGraded) * 100 }
      ];

      this.calcularRadarPuntos('Rendimiento Académico');

    } else if (this.reporteActivo === 'Asistencia') {
      this.pieChartCenterLabel = 'Asist.';

      const attendanceEnrolls = list.filter(m => m.totalClasses > 0);
      let totalAttended = 0;
      let totalClassesCount = 0;
      let perfectCount = 0;
      let riskCount = 0;

      attendanceEnrolls.forEach(m => {
        totalAttended += m.attendedClasses || 0;
        totalClassesCount += m.totalClasses || 0;
        const rate = (m.attendedClasses || 0) / m.totalClasses;
        if (rate >= 1.0) perfectCount++;
        if (rate < 0.7) riskCount++;
      });

      const avgAttendance = totalClassesCount > 0 ? (totalAttended / totalClassesCount) * 100 : 100;

      this.reportStats.avgAttendance = avgAttendance;
      this.reportStats.perfectAttendanceCount = perfectCount;
      this.reportStats.perfectAttendancePct = list.length > 0 ? (perfectCount / list.length) * 100 : 0;
      this.reportStats.totalClasses = totalClassesCount;
      this.reportStats.riskAttendanceCount = riskCount;

      this.reporteMaterias = this.cursos.map(c => {
        const cEnrolls = list.filter(m => m.course?.id === c.id);
        let sumAtt = 0;
        let sumTot = 0;
        let cPerfect = 0;
        let cRegular = 0;
        let cRisk = 0;

        cEnrolls.forEach(m => {
          const tot = m.totalClasses || 0;
          const att = m.attendedClasses || 0;
          sumAtt += att;
          sumTot += tot;

          if (tot > 0) {
            const rate = att / tot;
            if (rate >= 1.0) cPerfect++;
            else if (rate >= 0.7) cRegular++;
            else cRisk++;
          }
        });

        const courseAvg = sumTot > 0 ? (sumAtt / sumTot) * 100 : 100;
        return {
          name: c.name,
          students: cEnrolls.length,
          average: courseAvg,
          perfect: cPerfect,
          regular: cRegular,
          risk: cRisk
        };
      });

      const filteredCoursesForBars = this.cursos.slice(0, 5);
      this.reporteBarras = filteredCoursesForBars.map(c => {
        const matchMat = this.reporteMaterias.find(rm => rm.name === c.name);
        const avg = matchMat ? matchMat.average : 100;
        return {
          label: c.code || c.name.substring(0, 3).toUpperCase(),
          value: avg,
          height: avg
        };
      });

      let countPerf = 0;
      let countGood = 0;
      let countReg = 0;
      let countCrit = 0;

      list.forEach(m => {
        const tot = m.totalClasses || 0;
        const att = m.attendedClasses || 0;
        if (tot > 0) {
          const pct = (att / tot) * 100;
          if (pct >= 95) countPerf++;
          else if (pct >= 85) countGood++;
          else if (pct >= 70) countReg++;
          else countCrit++;
        }
      });
      const totalWithAtt = list.filter(m => (m.totalClasses || 0) > 0).length || 1;

      this.pieChartSlices = [
        { label: 'Excl. (>=95%)', color: '#10b981', pct: (countPerf / totalWithAtt) * 100 },
        { label: 'Bueno (85-94%)', color: '#3b82f6', pct: (countGood / totalWithAtt) * 100 },
        { label: 'Reg. (70-84%)', color: '#f59e0b', pct: (countReg / totalWithAtt) * 100 },
        { label: 'Crítico (<70%)', color: '#ef4444', pct: (countCrit / totalWithAtt) * 100 }
      ];

      this.calcularRadarPuntos('Asistencia');

    } else if (this.reporteActivo === 'Matrículas') {
      this.pieChartCenterLabel = 'Matríc.';

      const totalEnrollments = list.length;
      const activeCount = list.filter(m => this.getNormalizedStatus(m.status) === 'Activa').length;
      const pendingCount = list.filter(m => this.getNormalizedStatus(m.status) === 'Pendiente').length;
      const cancelledCount = list.filter(m => this.getNormalizedStatus(m.status) === 'Cancelada').length;

      this.reportStats.totalEnrollments = totalEnrollments;
      this.reportStats.activeEnrollmentsCount = activeCount;
      this.reportStats.activeEnrollmentsPct = totalEnrollments > 0 ? (activeCount / totalEnrollments) * 100 : 0;
      this.reportStats.pendingEnrollmentsCount = pendingCount;
      this.reportStats.cancelledEnrollmentsCount = cancelledCount;

      this.reporteMaterias = this.cursos.map(c => {
        const cEnrolls = list.filter(m => m.course?.id === c.id);
        const cActive = cEnrolls.filter(m => this.getNormalizedStatus(m.status) === 'Activa').length;
        const cPending = cEnrolls.filter(m => this.getNormalizedStatus(m.status) === 'Pendiente').length;
        const cCancelled = cEnrolls.filter(m => this.getNormalizedStatus(m.status) === 'Cancelada').length;
        return {
          name: c.name,
          capacity: (c.credits || 4) * 10,
          students: cEnrolls.length,
          active: cActive,
          pending: cPending,
          cancelled: cCancelled
        };
      });

      const maxEnrollments = Math.max(...this.reporteMaterias.map(rm => rm.students), 5);
      const filteredCoursesForBars = this.cursos.slice(0, 5);
      this.reporteBarras = filteredCoursesForBars.map(c => {
        const matchMat = this.reporteMaterias.find(rm => rm.name === c.name);
        const qty = matchMat ? matchMat.students : 0;
        return {
          label: c.code || c.name.substring(0, 3).toUpperCase(),
          value: qty,
          height: (qty / maxEnrollments) * 100
        };
      });

      const totalEnrolls = list.length || 1;
      this.pieChartSlices = [
        { label: 'Activas', color: '#10b981', pct: (activeCount / totalEnrolls) * 100 },
        { label: 'Pendientes', color: '#f59e0b', pct: (pendingCount / totalEnrolls) * 100 },
        { label: 'Canceladas', color: '#ef4444', pct: (cancelledCount / totalEnrolls) * 100 }
      ];

      this.calcularRadarPuntos('Matrículas');
    }

    this.cdr.detectChanges();
  }

  getPieChartGradient(slices: { color: string, pct: number }[]): string {
    if (!slices || slices.length === 0) {
      return 'conic-gradient(#e2e8f0 0% 100%)';
    }
    let currentPct = 0;
    const parts = slices.map(s => {
      const start = currentPct;
      currentPct += s.pct;
      return `${s.color} ${start}% ${currentPct}%`;
    });
    if (currentPct < 100) {
      parts.push(`#e2e8f0 ${currentPct}% 100%`);
    }
    return `conic-gradient(${parts.join(', ')})`;
  }

  private calcularRadarPuntos(tipoReporte: string): void {
    let v1 = 0.8, v2 = 0.75, v3 = 0.85, v4 = 0.78, v5 = 0.82, v6 = 0.8;

    if (tipoReporte === 'Rendimiento Académico') {
      const cats = ['Matemáticas', 'Ciencias', 'Tecnología', 'Humanidades'];
      const averages = cats.map(cat => {
        const matNombres = this.cursos.filter(c => c.category === cat).map(c => c.name);
        const matchMats = this.reporteMaterias.filter(rm => matNombres.includes(rm.name));
        const val = matchMats.length > 0 ? matchMats.reduce((sum, rm) => sum + rm.average, 0) / matchMats.length : 3.5;
        return val / 5.0;
      });

      v1 = averages[0] || 0.8;
      v2 = averages[3] || 0.75;
      v3 = (averages[0] + averages[1] + averages[2] + averages[3]) / 4 || 0.85;
      v4 = averages[1] || 0.78;
      v5 = averages[2] || 0.82;
      v6 = ((averages[0] + averages[2]) / 2) * 0.95 || 0.8;

    } else if (tipoReporte === 'Asistencia') {
      const cats = ['Matemáticas', 'Ciencias', 'Tecnología', 'Humanidades'];
      const averages = cats.map(cat => {
        const matNombres = this.cursos.filter(c => c.category === cat).map(c => c.name);
        const matchMats = this.reporteMaterias.filter(rm => matNombres.includes(rm.name));
        const val = matchMats.length > 0 ? matchMats.reduce((sum, rm) => sum + rm.average, 0) / matchMats.length : 90;
        return val / 100.0;
      });

      v1 = averages[0] || 0.9;
      v2 = averages[3] || 0.88;
      v3 = (averages[0] + averages[1] + averages[2] + averages[3]) / 4 || 0.92;
      v4 = averages[1] || 0.89;
      v5 = averages[2] || 0.91;
      v6 = v3 * 0.95;

    } else if (tipoReporte === 'Matrículas') {
      const cats = ['Matemáticas', 'Ciencias', 'Tecnología', 'Humanidades'];
      const rates = cats.map(cat => {
        const matNombres = this.cursos.filter(c => c.category === cat).map(c => c.name);
        const matchMats = this.reporteMaterias.filter(rm => matNombres.includes(rm.name));
        const totalCap = matchMats.reduce((sum, rm) => sum + rm.capacity, 0) || 1;
        const totalAct = matchMats.reduce((sum, rm) => sum + rm.active, 0);
        return Math.min(1.0, (totalAct / totalCap) + 0.3);
      });

      v1 = rates[0] || 0.75;
      v2 = rates[3] || 0.72;
      v3 = (rates[0] + rates[1] + rates[2] + rates[3]) / 4 || 0.78;
      v4 = rates[1] || 0.76;
      v5 = rates[2] || 0.8;
      v6 = v3 * 0.9;
    }

    const p1x = 50;
    const p1y = 50 - v1 * 40;

    const p2x = 50 + v2 * 34.64;
    const p2y = 50 - v2 * 20;

    const p3x = 50 + v3 * 34.64;
    const p3y = 50 + v3 * 20;

    const p4x = 50;
    const p4y = 50 + v4 * 40;

    const p5x = 50 - v5 * 34.64;
    const p5y = 50 + v5 * 20;

    const p6x = 50 - v6 * 34.64;
    const p6y = 50 - v6 * 20;

    this.radarPoints = `${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${p2y.toFixed(1)} ${p3x.toFixed(1)},${p3y.toFixed(1)} ${p4x.toFixed(1)},${p4y.toFixed(1)} ${p5x.toFixed(1)},${p5y.toFixed(1)} ${p6x.toFixed(1)},${p6y.toFixed(1)}`;
  }

  imprimirReporte(): void {
    window.print();
  }

  exportarPDF(): void {
    window.print();
  }

  abrirEnviarReporteModal(): void {
    this.selectedTeacherForReport = null;
    this.showSendReportModal = true;
    this.cdr.detectChanges();
  }

  enviarReporteADocente(): void {
    if (!this.selectedTeacherForReport) {
      alert("Por favor, selecciona un profesor.");
      return;
    }

    const teacher = this.selectedTeacherForReport;

    const assignedCourse = this.cursos.find(c => c.teacher === teacher.name || c.id === teacher.course?.id);

    let mensaje = `Hola, Prof. ${teacher.name}. `;
    if (assignedCourse) {
      const cEnrolls = this.matriculas.filter(m => m.course?.id === assignedCourse.id);
      const cGraded = cEnrolls.filter(m => m.grade !== null);
      const cAvg = cGraded.length > 0 ? cGraded.reduce((sum, m) => sum + m.grade, 0) / cGraded.length : 0;

      const cAttenEnrolls = cEnrolls.filter(m => m.totalClasses > 0);
      let sumAtt = 0;
      let sumTot = 0;
      cAttenEnrolls.forEach(m => {
        sumAtt += m.attendedClasses || 0;
        sumTot += m.totalClasses || 0;
      });
      const cAttPct = sumTot > 0 ? Math.round((sumAtt / sumTot) * 100) : 100;

      mensaje += `Aquí tienes el reporte de tu curso "${assignedCourse.name}" (${assignedCourse.code}): Estudiantes inscritos: ${cEnrolls.length}, Promedio de notas: ${cAvg.toFixed(1)}/5.0, Asistencia promedio: ${cAttPct}%.`;
    } else {
      mensaje += `No tienes cursos asignados actualmente, pero te enviamos el reporte institucional general. Estudiantes totales: ${this.stats.totalStudents}, Cursos activos: ${this.stats.activeCourses}.`;
    }

    const payload = {
      studentId: Number(teacher.id),
      message: mensaje,
      content: mensaje,
      type: 'ALERTA'
    };

    const token = localStorage.getItem('token') || localStorage.getItem('jwt') || localStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });

    this.http.post(`${this.API_URL}/notifications`, payload, { headers }).subscribe({
      next: () => {
        alert(`Reporte enviado con éxito al Prof. ${teacher.name}`);
        this.showSendReportModal = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error al enviar notificación:", err);
        alert("Error al enviar el reporte: " + (err.error?.message || "Servicio no disponible"));
      }
    });
  }

  getNormalizedStatus(status: string): string {
    if (!status) return 'Pendiente';
    const s = status.toUpperCase();
    if (s === 'APROBADO' || s === 'ACTIVA' || s === 'ACTIVO') return 'Activa';
    if (s === 'CANCELADO' || s === 'CANCELADA') return 'Cancelada';
    return 'Pendiente';
  }

  getMatriculasCount(statusType: string): number {
    return this.matriculas.filter(m => this.getNormalizedStatus(m.status) === statusType).length;
  }

  getInitials(name: string): string {
    return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
  }

  formatDate(d: string): string {
    const date = new Date(d);
    return isNaN(date.getTime()) ? d : date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  get filteredEnrollments(): any[] {
    return this.matriculas.filter(m => {
      const term = this.searchEnrollmentTerm.toLowerCase();
      const match = !term || m.student?.name.toLowerCase().includes(term) || m.course?.name.toLowerCase().includes(term);
      const matchStatus = this.selectedEnrollmentStatus === 'Todos' || this.getNormalizedStatus(m.status) === this.selectedEnrollmentStatus;
      return match && matchStatus;
    });
  }

  get combinedAccounts(): any[] {
    const studentAccts = this.estudiantes.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone || 'N/A',
      date: s.semester || '2026-I',
      courses: s.courses || 0,
      average: s.average || s.averageGrade || 0,
      status: s.status || 'Activo',
      role: 'estudiante',
      program: s.program || 'Ciencias de la Computación',
      specialization: ''
    }));

    const teacherAccts = this.profesores.map(t => {
      const assignedCourse = t.course ? t.course.name : (this.cursos.find(c => c.teacher === t.name || c.id === t.course?.id)?.name || 'Sin asignar');
      return {
        id: t.id,
        name: t.name,
        email: t.email,
        phone: 'N/A',
        date: 'N/A',
        courses: t.course ? 1 : 0,
        average: 0,
        status: 'Activo',
        role: 'docente',
        program: '',
        specialization: t.specialization || 'General',
        assignedCourse: assignedCourse
      };
    });

    const all = [...studentAccts, ...teacherAccts];

    return all.filter(acc => {
      const term = this.searchAccountTerm.toLowerCase();
      const matchSearch = !term ||
        acc.name.toLowerCase().includes(term) ||
        acc.email.toLowerCase().includes(term) ||
        (acc.specialization && acc.specialization.toLowerCase().includes(term)) ||
        (acc.program && acc.program.toLowerCase().includes(term));

      const matchRole = this.selectedAccountRole === 'Todos' || acc.role === this.selectedAccountRole;

      return matchSearch && matchRole;
    });
  }

  abrirConfirmacion(m: any, action: 'APROBADO' | 'CANCELADO') {
    this.selectedEnrollment = m;
    this.confirmActionType = action;
    this.confirmModalMessage = `¿Estás seguro de ${action.toLowerCase()} la matrícula de ${m.student?.name}?`;
    this.showConfirmModal = true;
  }

  confirmarMatricula() {
    if (!this.selectedEnrollment) return;
    const token = localStorage.getItem('token');
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' });

    this.http.patch(`${this.API_URL}/enrollments/${this.selectedEnrollment.id}/status`, { status: this.confirmActionType }, { headers })
      .subscribe({
        next: () => { this.showConfirmModal = false; this.cargarDataGeneral(); },
        error: (err) => alert("Error: " + (err.error?.message || "No se pudo actualizar"))
      });
  }

  procesarMatricula() {
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${localStorage.getItem('token')}`, 'Content-Type': 'application/json' });
    this.http.post(`${this.API_URL}/enrollments`, this.enrollmentRequest, { headers }).subscribe({
      next: () => {
        this.showNewEnrollmentModal = false;
        this.enrollmentRequest = { studentId: null, courseId: null, semester: '2026-I' };
        this.cargarDataGeneral();
      },

      error: (err) => alert("Error: " + (err.error?.message || err.error || "No se pudo procesar"))
    });
  }

  procesarNuevoEstudiante() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });

    this.http.post(`${this.API_URL}/students`, this.studentRequest, { headers }).subscribe({
      next: () => {
        alert("Estudiante registrado con éxito");
        this.showNewStudentModal = false;
        this.studentRequest = {
          name: '',
          email: '',
          password: 'student123',
          role: 'STUDENT',
          code: '',
          program: 'Ciencias de la Computación',
          semester: '2026-I',
          status: 'Activo',
          phone: '',
          address: '',
          averageGrade: 0.0,
          riskLevel: 'Bajo',
          grade: 'N/A',
          absences: 0,
          totalClasses: 0,
          attendedClasses: 0,
          attendancePercentage: 100
        };
        this.cargarDataGeneral();
      },
      error: (err) => alert("Error: " + (err.error?.message || err.error || "No se pudo registrar"))
    });
  }

  procesarNuevoProfesor() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token') || localStorage.getItem('auth_token')}`,
      'Content-Type': 'application/json'
    });

    const body = {
      name: this.teacherRequest.name,
      email: this.teacherRequest.email,
      password: this.teacherRequest.password || 'teacher123',
      specialization: this.teacherRequest.specialization,
      role: 'DOCENTE',
      course: this.teacherRequest.courseId ? { id: this.teacherRequest.courseId } : null
    };

    this.http.post(`${this.API_URL}/teachers`, body, { headers }).subscribe({
      next: () => {
        alert("Profesor registrado con éxito");
        this.showNewTeacherModal = false;
        this.teacherRequest = {
          name: '',
          email: '',
          password: '',
          specialization: '',
          courseId: null
        };
        this.cargarDataGeneral();
      },
      error: (err) => alert("Error: " + (err.error?.message || err.error || "No se pudo registrar al profesor"))
    });
  }

  abrirEditarCuenta(account: any) {
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' });

    if (account.role === 'estudiante') {
      const student = this.estudiantes.find(s => s.id === account.id);
      if (student) {
        this.selectedStudentId = student.id;
        this.studentRequest = {
          name: student.name,
          email: student.email,
          password: '',
          role: student.role || 'STUDENT',
          code: student.code || '',
          program: student.program || '',
          semester: student.semester || '',
          status: student.status || 'Activo',
          phone: student.phone || '',
          address: student.address || '',
          averageGrade: student.averageGrade || 0.0,
          riskLevel: student.riskLevel || 'Bajo',
          grade: student.grade || 'N/A',
          absences: student.absences || 0,
          totalClasses: student.totalClasses || 0,
          attendedClasses: student.attendedClasses || 0,
          attendancePercentage: student.attendancePercentage || 100
        };
        this.showEditStudentModal = true;
      }
    } else if (account.role === 'docente') {
      const teacher = this.profesores.find(t => t.id === account.id);
      if (teacher) {
        this.selectedTeacherId = teacher.id;
        this.teacherRequest = {
          name: teacher.name,
          email: teacher.email,
          password: '',
          specialization: teacher.specialization || '',
          courseId: teacher.course ? teacher.course.id : null
        };
        this.showEditTeacherModal = true;
      }
    }
  }

  procesarEditarEstudiante() {
    if (!this.selectedStudentId) return;
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' });

    const body = { ...this.studentRequest };
    if (!body.password) {
      delete (body as any).password;
    }

    this.http.put(`${this.API_URL}/students/${this.selectedStudentId}`, body, { headers }).subscribe({
      next: () => {
        alert("Estudiante actualizado con éxito");
        this.showEditStudentModal = false;
        this.selectedStudentId = null;
        this.cargarDataGeneral();
      },
      error: (err) => alert("Error: " + (err.error?.message || err.error || "No se pudo actualizar"))
    });
  }

  procesarEditarProfesor() {
    if (!this.selectedTeacherId) return;
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' });

    const body = {
      name: this.teacherRequest.name,
      email: this.teacherRequest.email,
      specialization: this.teacherRequest.specialization,
      password: this.teacherRequest.password
    };

    let url = `${this.API_URL}/teachers/${this.selectedTeacherId}`;
    if (this.teacherRequest.courseId) {
      url += `?courseId=${this.teacherRequest.courseId}`;
    }

    this.http.put(url, body, { headers }).subscribe({
      next: () => {
        alert("Profesor actualizado con éxito");
        this.showEditTeacherModal = false;
        this.selectedTeacherId = null;
        this.teacherRequest = {
          name: '',
          email: '',
          password: '',
          specialization: '',
          courseId: null
        };
        this.cargarDataGeneral();
      },
      error: (err) => alert("Error: " + (err.error?.message || err.error || "No se pudo actualizar"))
    });
  }

  eliminarCuenta(account: any) {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente la cuenta de ${account.name}?`)) return;

    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': token ? `Bearer ${token}` : '' });
    const endpoint = account.role === 'estudiante' ? 'students' : 'teachers';

    this.http.delete(`${this.API_URL}/${endpoint}/${account.id}`, { headers }).subscribe({
      next: () => {
        alert("Cuenta eliminada con éxito");
        this.cargarDataGeneral();
      },
      error: (err) => alert("Error: " + (err.error?.message || err.error || "No se pudo eliminar la cuenta"))
    });
  }

  toggleEstadoCuenta(account: any) {
    if (account.role !== 'estudiante') return;

    const student = this.estudiantes.find(s => s.id === account.id);
    if (!student) return;

    const nuevoEstado = student.status === 'Activo' ? 'Inactivo' : 'Activo';
    const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
    const headers = new HttpHeaders({ 'Authorization': token ? `Bearer ${token}` : '', 'Content-Type': 'application/json' });

    const body = {
      ...student,
      status: nuevoEstado
    };
    delete (body as any).password;

    this.http.put(`${this.API_URL}/students/${student.id}`, body, { headers }).subscribe({
      next: () => {
        alert(`Estado del estudiante actualizado a: ${nuevoEstado}`);
        this.cargarDataGeneral();
      },
      error: (err) => alert("Error: " + (err.error?.message || err.error || "No se pudo actualizar el estado"))
    });
  }

  procesarNuevoCurso() {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });

    const url = `${this.API_URL}/courses` + (this.courseRequest.teacherId ? `?teacherId=${this.courseRequest.teacherId}` : '');
    const body = {
      name: this.courseRequest.name,
      code: this.courseRequest.code,
      credits: this.courseRequest.credits,
      category: this.courseRequest.category,
      icon: this.courseRequest.icon
    };

    this.http.post(url, body, { headers }).subscribe({
      next: () => {
        alert("Curso creado y asignado con éxito");
        this.showNewCourseModal = false;
        this.courseRequest = {
          name: '',
          code: '',
          credits: 4,
          category: '',
          icon: '',
          teacherId: null
        };
        this.cargarDataGeneral();
      },
      error: (err) => alert("Error: " + (err.error?.message || err.error || "No se pudo crear el curso"))
    });
  }

  abrirEditarCurso(curso: any) {
    this.selectedCourseId = curso.id;

    let currentTeacherId: number | null = null;
    if (curso.teacher) {
      currentTeacherId = curso.teacher.id;
    } else {
      const foundProfe = this.profesores.find((p: any) => p.course?.id === curso.id);
      if (foundProfe) {
        currentTeacherId = foundProfe.id;
      }
    }

    this.editCourseRequest = {
      name: curso.name,
      code: curso.code,
      credits: curso.credits || 4,
      category: curso.category || 'Matemáticas',
      icon: curso.icon || 'book-open',
      teacherId: currentTeacherId
    };
    this.showEditCourseModal = true;
  }

  procesarEditarCurso() {
    if (!this.selectedCourseId) return;
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    });

    const url = `${this.API_URL}/courses/${this.selectedCourseId}` + (this.editCourseRequest.teacherId ? `?teacherId=${this.editCourseRequest.teacherId}` : '');
    const body = {
      name: this.editCourseRequest.name,
      code: this.editCourseRequest.code,
      credits: this.editCourseRequest.credits,
      category: this.editCourseRequest.category,
      icon: this.editCourseRequest.icon
    };

    this.http.put(url, body, { headers }).subscribe({
      next: () => {
        alert("Curso actualizado con éxito");
        this.showEditCourseModal = false;
        this.selectedCourseId = null;
        this.cargarDataGeneral();
      },
      error: (err) => alert("Error: " + (err.error?.message || err.error || "No se pudo actualizar el curso"))
    });
  }

  setCategoria(cat: string) {
    this.categoriaSeleccionada = cat;
    this.cursosFiltrados = cat === 'Todas'
      ? [...this.cursos]
      : this.cursos.filter(c => c.category === cat);
    this.cdr.detectChanges();
  }

  handlePageChange(pageId: string) { if (pageId === 'admin') this.activeTab = 'dashboard'; else if (pageId.includes('estudiantes')) this.activeTab = 'estudiantes'; else if (pageId.includes('cursos')) this.activeTab = 'cursos'; else if (pageId.includes('matriculas')) this.activeTab = 'matriculas'; else if (pageId.includes('reportes')) this.activeTab = 'reportes'; else if (pageId.includes('configuracion')) this.activeTab = 'configuracion'; this.cdr.detectChanges(); }

  getRoleCount(role: string): number {
    if (role === 'admin') {
      return 1;
    } else if (role === 'docente' || role === 'profesor') {
      return this.profesores ? this.profesores.length : 0;
    } else if (role === 'estudiante') {
      return this.estudiantes ? this.estudiantes.length : 0;
    }
    return 0;
  }

  guardarConfiguracion(): void {
    alert("¡Configuración guardada exitosamente!");
  }

  actualizarPasswordConfig(): void {
    if (!this.newPasswordConfig || !this.confirmPasswordConfig) {
      alert("Por favor, completa ambos campos de contraseña.");
      return;
    }
    if (this.newPasswordConfig !== this.confirmPasswordConfig) {
      alert("Las contraseñas no coinciden.");
      return;
    }
    alert("Contraseña de administrador actualizada con éxito.");
    this.newPasswordConfig = '';
    this.confirmPasswordConfig = '';
  }

  toggleTwoFactorSwitch() {
    if (!this.twoFactorAuth) {
      this.totpVerificationCode = '';
      this.totpSecretKey = this.totpService.generateRandomSecret();
      this.updateQRCodeUrl();
      this.show2faSetupModal = true;
    } else {
      if (confirm("¿Estás seguro de que deseas desactivar la Autenticación de Dos Factores? Esto reducirá drásticamente la seguridad de tu cuenta.")) {
        const email = this.currentUserEmail;
        const authUrl = window.location.hostname === 'localhost' ? 'http://localhost:8081/api/auth' : 'https://edubridge-backend-v2.onrender.com/api/auth';
        this.http.post(`${authUrl}/2fa/disable`, { email }).subscribe({
          next: () => {
            this.twoFactorAuth = false;
            localStorage.removeItem('twoFactorAuth_enabled_' + email);
            localStorage.removeItem('twoFactorAuth_secret_' + email);
            alert("Autenticación de Dos Factores desactivada con éxito.");
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error("Error al desactivar 2FA del admin en el servidor", err);
            alert("No se pudo desactivar la Autenticación de Dos Factores en el servidor.");
          }
        });
      }
    }
    this.cdr.detectChanges();
  }

  confirmarActivacion2fa() {
    if (!this.totpVerificationCode || this.totpVerificationCode.length !== 6 || isNaN(Number(this.totpVerificationCode))) {
      alert("Por favor, ingresa el código de 6 dígitos que se muestra en tu aplicación autenticadora.");
      return;
    }

    const email = this.currentUserEmail;
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
        alert("¡Autenticación de Dos Factores (TOTP) configurada y activada con éxito!");
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error("Error al activar 2FA del admin en el servidor", err);
        alert(err.error?.message || "El código ingresado es incorrecto o ha expirado. Por favor, verifica tu aplicación autenticadora.");
      }
    });
  }

  cancelarActivacion2fa() {
    this.show2faSetupModal = false;
    this.twoFactorAuth = false;
    this.cdr.detectChanges();
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_id');
    window.location.reload();
  }
}