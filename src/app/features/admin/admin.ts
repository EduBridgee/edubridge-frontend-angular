import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar';
import { forkJoin } from 'rxjs';
import {
  LucideAngularModule, Search, Bell, UserPlus, SlidersHorizontal, Download, Edit, UserCheck,
  Trash2, MoreVertical, Plus, BookOpen, User, Users, Clock, Calendar, BarChart3, AlertTriangle,
  TrendingUp, GraduationCap, CheckCircle2, Check, X, Printer, Send, FileDown, DollarSign,
  Activity, RotateCcw, FileSpreadsheet, Save, Lock, Palette, Globe, Database, CreditCard,
  MessageSquare, Shield, Settings
} from 'lucide-angular';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, DecimalPipe, LucideAngularModule, SidebarComponent, FormsModule],
  templateUrl: './admin.html'
})
export class AdminComponent implements OnInit {
  private readonly API_URL = 'https://edubridge-backend-prueba-v2.onrender.com/api';

  activeTab = 'dashboard';
  configTab = 'general';
  loading = true;

  reporteActivo = 'Rendimiento Académico';
  categoriaSeleccionada = 'Todas';
  emailNotifications = true;
  smsNotifications = false;
  twoFactorAuth = false;
  darkMode = false;

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
  readonly DollarSign = DollarSign; readonly Activity = Activity; readonly RotateCcw = RotateCcw;
  readonly FileSpreadsheet = FileSpreadsheet; readonly Save = Save; readonly Lock = Lock;
  readonly Palette = Palette; readonly Globe = Globe; readonly Database = Database;
  readonly CreditCard = CreditCard; readonly MessageSquare = MessageSquare; readonly Shield = Shield;
  readonly Settings = Settings;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.cargarDataGeneral();
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
        this.stats.totalStudents = this.estudiantes.length;

        
        const gradesList = res.grades || [];
        this.matriculas.forEach((m: any) => {
          const sg = gradesList.filter((g: any) => g.student?.id === m.student?.id && g.course?.id === m.course?.id);
          m.grade = sg.length > 0 ? parseFloat((sg.reduce((a: number, g: any) => a + g.value, 0) / sg.length / 4.0).toFixed(1)) : null;
        });

        
        this.cursos = res.cursos.map((curso: any) => {
          const profe = curso.teacher || res.profesores.find((p: any) => p.course?.id === curso.id);
          const totalAlumnos = this.matriculas.filter((m: any) =>
            m.course?.id === curso.id && (m.status === 'APROBADO' || m.status === 'ACTIVA')
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
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => { console.error("Error:", err); this.loading = false; }
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
          category: 'Matemáticas',
          icon: 'book-open',
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

  logout() { localStorage.clear(); window.location.reload(); }
}