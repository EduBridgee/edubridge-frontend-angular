import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { NotificationService } from '../../core/services/notification';
import { LucideAngularModule, Search, BookOpen, Calendar, AlertTriangle, Smartphone, Building, MapPin, FileText, Mail, X } from 'lucide-angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RoleService, UserRole } from '../../core/services/role';

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './estudiantes.html',
  styleUrl: './estudiantes.css'
})
export class EstudiantesComponent implements OnInit {
  user: any = {
    id: localStorage.getItem('user_id'),
    name: localStorage.getItem('user_name'),
    role: localStorage.getItem('user_role')
  };

  readonly Search = Search;
  readonly BookOpen = BookOpen;
  readonly Calendar = Calendar;
  readonly AlertTriangle = AlertTriangle;
  readonly Smartphone = Smartphone;
  readonly Building = Building;
  readonly MapPin = MapPin;
  readonly FileText = FileText;
  readonly Mail = Mail;
  readonly X = X;

  students: any[] = [];
  filteredStudents: any[] = [];
  selectedStudent: any = null;
  courses: any[] = [];
  studentAttendance = {
    attended: 0,
    total: 0,
    percentage: 0
  };

  loading: boolean = true;
  loadingCourses: boolean = false;
  searchTerm: string = '';

  showEditModal = false;
  editingStudent: any = {};
  isMobile: boolean = false;

  newGrade = {
    courseId: null,
    value: null
  };

  private readonly API_URL = 'https://edubridge-backend-prueba-v2.onrender.com/api';

  private breakpointObserver = inject(BreakpointObserver);
  private http = inject(HttpClient);
  private cdRef = inject(ChangeDetectorRef);
  private notificationService = inject(NotificationService);
  private roleService = inject(RoleService);

  constructor() { }

  ngOnInit(): void {
    this.cargarEstudiantes();
    this.configurarResponsive();
  }

  private configurarResponsive() {
    this.breakpointObserver.observe(['(max-width: 768px)']).subscribe((result: BreakpointState) => {
      this.isMobile = result.matches;
      this.cdRef.detectChanges();
    });
  }

  volverAlListado() {
    this.selectedStudent = null;
    this.courses = [];
    this.cdRef.detectChanges();
  }

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }


  cargarEstudiantes() {
    this.loading = true;
    const normalizedRole = this.roleService.normalizeRole(this.user.role);
    const isDocente = normalizedRole === UserRole.DOCENTE;
    const userId = Number(this.user.id);

    const studentsReq = this.http.get<any[]>(`${this.API_URL}/students`).pipe(catchError(() => of([])));
    const coursesReq = isDocente ? this.http.get<any[]>(`${this.API_URL}/courses`).pipe(catchError(() => of([]))) : of([]);
    const teachersReq = isDocente ? this.http.get<any[]>(`${this.API_URL}/teachers`).pipe(catchError(() => of([]))) : of([]);
    const enrollmentsReq = isDocente ? this.http.get<any[]>(`${this.API_URL}/enrollments`).pipe(catchError(() => of([]))) : of([]);

    forkJoin({
      allStudents: studentsReq,
      allCourses: coursesReq,
      allTeachers: teachersReq,
      allEnrollments: enrollmentsReq
    }).subscribe({
      next: (res) => {
        let finalStudents = res.allStudents;

        if (isDocente) {
          const teacherId = userId;
          
          const nuevosCursos = res.allCourses.filter(c => c.teacher && Number(c.teacher.id) === teacherId);
          const viejosCursos = res.allTeachers.filter(p => Number(p.id) === teacherId && p.course).map(p => p.course);
          const combinados = [...nuevosCursos];
          viejosCursos.forEach(vc => {
            if (vc && !combinados.some(c => c.id === vc.id)) {
              combinados.push(vc);
            }
          });
          const teacherCourseIds = combinados.map(c => Number(c.id));
          const myStudentIds = new Set<number>();
          res.allEnrollments.forEach(m => {
            const cId = m.courseId ? Number(m.courseId) : (m.course ? Number(m.course.id) : null);
            const sId = m.studentId ? Number(m.studentId) : (m.student ? Number(m.student.id) : null);
            if (cId && sId && teacherCourseIds.includes(cId)) {
              myStudentIds.add(sId);
            }
          });
          finalStudents = res.allStudents.filter(alumno => myStudentIds.has(Number(alumno.id)));
        }

        this.students = finalStudents;
        this.filteredStudents = [...finalStudents];

        if (!this.selectedStudent && finalStudents.length > 0) {
          this.seleccionarAlumno(finalStudents[0]);
        } else if (this.selectedStudent) {
          const actualizado = finalStudents.find(s => s.id === this.selectedStudent.id);
          if (actualizado) {
            this.selectedStudent = actualizado;
          } else {
            this.seleccionarAlumno(finalStudents[0] || null);
          }
        } else {
          this.selectedStudent = null;
        }

        this.loading = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error("Error cargando alumnos:", err);
        this.loading = false;
        this.cdRef.detectChanges();
      }
    });
  }

  seleccionarAlumno(alumno: any) {
    this.selectedStudent = alumno;
    if (alumno) {
      this.cargarCursosDelAlumno(alumno.id);
    } else {
      this.courses = [];
      this.studentAttendance = { attended: 0, total: 0, percentage: 0 };
    }
    this.cdRef.detectChanges();
  }

  cargarCursosDelAlumno(studentId: number) {
    this.loadingCourses = true;
    this.courses = [];
    this.studentAttendance = { attended: 0, total: 0, percentage: 0 };

    this.http.get<any[]>(`${this.API_URL}/enrollments/student/${studentId}`).subscribe({
      next: (dataMatriculas) => {
        this.courses = dataMatriculas.map(m => m.course);

        
        let sumAttended = 0;
        let sumTotal = 0;

        dataMatriculas.forEach(m => {
          sumAttended += m.attendedClasses || 0;
          sumTotal += m.totalClasses || 0;
        });

        this.studentAttendance.attended = sumAttended;
        this.studentAttendance.total = sumTotal;
        this.studentAttendance.percentage = sumTotal > 0 ? Math.round((sumAttended / sumTotal) * 100) : 0;

        this.loadingCourses = false;
        this.cdRef.detectChanges();
      },
      error: (err) => {
        console.error("Error al cargar las matrículas del estudiante:", err);
        this.loadingCourses = false;
        this.notificationService.showError("No se pudieron cargar los cursos del estudiante.");
        this.cdRef.detectChanges();
      }
    });
  }

  guardarCambios() {
    if (!this.editingStudent.id) return;

    this.loading = true;
    this.http.put(`${this.API_URL}/students/${this.editingStudent.id}`, this.editingStudent).subscribe({
      next: (updated: any) => {
        this.showEditModal = false;
        this.notificationService.showSuccess("Perfil actualizado correctamente.");
        this.cargarEstudiantes();
      },
      error: (err) => {
        this.loading = false;
        this.notificationService.showError("Error al actualizar el perfil.");
        this.cdRef.detectChanges();
      }
    });
  }

  subirNota() {
    if (!this.selectedStudent || !this.newGrade.courseId || !this.newGrade.value) {
      this.notificationService.showInfo("Completa todos los campos para registrar la nota.", "Información faltante");
      return;
    }

    const payload = {
      studentId: this.selectedStudent.id,
      courseId: Number(this.newGrade.courseId),
      value: this.newGrade.value
    };

    this.http.post(`${this.API_URL}/grades`, payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        this.notificationService.showSuccess("Nota registrada con éxito.");
        this.newGrade = { courseId: null, value: null };
        this.cargarEstudiantes();
      },
      error: (err) => {
        this.notificationService.showError("Error al registrar la nota.");
      }
    });
  }

  filtrarAlumnos() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.filteredStudents = [...this.students];
    } else {
      this.filteredStudents = this.students.filter(s =>
        s.name.toLowerCase().includes(term) ||
        (s.code && s.code.toLowerCase().includes(term))
      );
    }
  }

  abrirEdicion() {
    if (!this.selectedStudent) return;
    this.editingStudent = JSON.parse(JSON.stringify(this.selectedStudent));
    this.showEditModal = true;
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }
}