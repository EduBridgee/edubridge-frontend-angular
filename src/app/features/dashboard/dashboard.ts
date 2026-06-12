import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { RoleService, UserRole } from '../../core/services/role';
import { LucideAngularModule, Search, Users, Award, Target, AlertTriangle, TrendingUp, BarChart3, Check, Clock, BookOpen, Calendar } from 'lucide-angular';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NotificationBellComponent, DecimalPipe, LucideAngularModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  
  user: any = {
    id: localStorage.getItem('user_id'),
    name: localStorage.getItem('user_name'),
    role: localStorage.getItem('user_role')
  };

  readonly Search = Search;
  readonly Users = Users;
  readonly Award = Award;
  readonly Target = Target;
  readonly AlertTriangle = AlertTriangle;
  readonly TrendingUp = TrendingUp;
  readonly BarChart3 = BarChart3;
  readonly Check = Check;
  readonly Clock = Clock;
  readonly BookOpen = BookOpen;
  readonly Calendar = Calendar;

  students: any[] = [];
  loading: boolean = true;

  
  data: any = null;
  statsGrados: any[] = [];
  distribucionRiesgo = { bajo: 0, medio: 0, alto: 0 };
  globalHealth: number = 0;
  trendLinePath: string = 'M0,150 L600,150';
  trendAreaPath: string = 'M0,150 L600,150 L600,240 L0,240 Z';

  
  promedioCalculadoEstudiante: number = 0;
  studentSummary: any = null;
  studentGrades: any[] = [];
  averageEvolution: any[] = [];
  studentEnrolledCoursesCount: number = 0;
  studentAttendancePct: number = 0;
  studentAttendedClasses: number = 0;
  studentTotalClasses: number = 0;

  
  tendenciaMensual: string = '+0.0';
  esTendenciaPositiva: boolean = true;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef, private roleService: RoleService) { }

  ngOnInit(): void {
    if (this.user.id) {
      this.fetchData();
    } else {
      this.loading = false;
    }
  }

  fetchData() {
    this.loading = true;
    const normalizedRole = this.roleService.normalizeRole(this.user.role);
    const userId = Number(this.user.id);

    
    if (normalizedRole === UserRole.ADMIN) {
      this.processAdminDashboard();
      return;
    }

    const isDocente = normalizedRole === UserRole.DOCENTE;

    const studentsReq = this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/students')
      .pipe(catchError(() => of([])));

    const coursesReq = isDocente
      ? this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/courses').pipe(catchError(() => of([])))
      : of([]);

    const teachersReq = isDocente
      ? this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/teachers').pipe(catchError(() => of([])))
      : of([]);

    const enrollmentsReq = isDocente
      ? this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/enrollments').pipe(catchError(() => of([])))
      : this.http.get<any[]>(`https://edubridge-backend-prueba-v2.onrender.com/api/enrollments/student/${userId}`).pipe(catchError(() => of([])));

    const gradesReq = isDocente
      ? this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/grades').pipe(catchError(() => of([])))
      : this.http.get<any[]>(`https://edubridge-backend-prueba-v2.onrender.com/api/grades/student/${userId}`)
        .pipe(catchError(() => of([])));

    forkJoin({
      allStudents: studentsReq,
      allCourses: coursesReq,
      allTeachers: teachersReq,
      allEnrollments: enrollmentsReq,
      myGrades: gradesReq
    }).subscribe({
      next: (res) => {
        if (isDocente) {
          const teacherId = Number(this.user.id);

          
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

          
          const myStudents = res.allStudents.filter(alumno => myStudentIds.has(Number(alumno.id)));
          this.students = myStudents;

          
          const myGrades = res.myGrades.filter(g => g.course && teacherCourseIds.includes(Number(g.course.id)));

          this.processDocenteData(myStudents, myGrades, combinados, res.allEnrollments);
        } else {
          this.students = res.allStudents;
          this.processEstudianteData(res.allStudents, res.myGrades, userId, res.allEnrollments);
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

  
  
  
  private processAdminDashboard() {
    
    forkJoin({
      allStudents: this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/students').pipe(catchError(() => of([]))),
      allCourses: this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/courses').pipe(catchError(() => of([])))
    }).subscribe({
      next: (res) => {
        this.students = res.allStudents;
        const totalStudents = res.allStudents.length;

        
        const sumaNotas = res.allStudents.reduce((acc, s) => acc + (s.averageGrade || 0), 0);

        this.data = {
          totalStudents: totalStudents,
          totalCourses: res.allCourses.length,
          averageGrade: totalStudents > 0 ? (sumaNotas / totalStudents) : 0,
          highRiskCount: res.allStudents.filter(s => s.riskLevel === 'Alto Riesgo').length
        };

        
        const alto = this.data.highRiskCount;
        const medio = res.allStudents.filter(s => s.riskLevel === 'Riesgo Medio').length;
        const bajo = totalStudents > 0 ? (totalStudents - (alto + medio)) : 0;

        this.distribucionRiesgo = {
          bajo: totalStudents > 0 ? Math.round((bajo / totalStudents) * 100) : 0,
          medio: totalStudents > 0 ? Math.round((medio / totalStudents) * 100) : 0,
          alto: totalStudents > 0 ? Math.round((alto / totalStudents) * 100) : 0
        };

        this.globalHealth = 100 - this.distribucionRiesgo.alto;
        this.tendenciaMensual = '+1.4'; 
        this.esTendenciaPositiva = true;

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error en analíticas globales del Admin:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private processDocenteData(allStudents: any[], myGrades: any[] = [], myCourses: any[] = [], allEnrollments: any[] = []) {
    const total = allStudents.length;
    if (total === 0) {
      this.data = {
        totalStudents: 0,
        averageGrade: 0,
        highRiskCount: 0
      };
      this.statsGrados = [];
      this.distribucionRiesgo = { bajo: 0, medio: 0, alto: 0 };
      this.globalHealth = 100;
      this.trendLinePath = 'M0,150 L600,150';
      this.trendAreaPath = 'M0,150 L600,150 L600,240 L0,240 Z';
      return;
    }

    const sumaNotas = allStudents.reduce((acc, s) => acc + (s.averageGrade || 0), 0);
    const dataAvg = total > 0 ? (sumaNotas / total) : 12.0;

    this.data = {
      totalStudents: total,
      averageGrade: dataAvg,
      highRiskCount: allStudents.filter(s => s.riskLevel === 'Alto Riesgo').length
    };

    
    if (myCourses.length > 0) {
      const counts = myCourses.map(course => {
        const enrolls = allEnrollments.filter(m => {
          const cId = m.courseId ? Number(m.courseId) : (m.course ? Number(m.course.id) : null);
          return cId === Number(course.id);
        });
        return enrolls.length;
      });

      const maxCount = Math.max(...counts, 1);

      this.statsGrados = myCourses.map((course, i) => ({
        l: course.code || course.name.substring(0, 3).toUpperCase(),
        h: (counts[i] / maxCount * 100) + '%'
      }));
    } else {
      this.statsGrados = [];
    }

    const alto = allStudents.filter(s => s.riskLevel === 'Alto Riesgo').length;
    const medio = allStudents.filter(s => s.riskLevel === 'Riesgo Medio').length;
    const bajo = total - (alto + medio);

    this.distribucionRiesgo = {
      bajo: Math.round((bajo / total) * 100),
      medio: Math.round((medio / total) * 100),
      alto: Math.round((alto / total) * 100)
    };

    this.globalHealth = 100 - this.distribucionRiesgo.alto;

    
    const pc1Grades = myGrades.filter(g => g.type === 'PC1').map(g => g.value);
    const pc2Grades = myGrades.filter(g => g.type === 'PC2').map(g => g.value);
    const eaGrades = myGrades.filter(g => g.type === 'EA').map(g => g.value);
    const pc3Grades = myGrades.filter(g => g.type === 'PC3').map(g => g.value);
    const ebGrades = myGrades.filter(g => g.type === 'EB' || g.type === 'TF').map(g => g.value);

    const getAvg = (arr: number[], fallback: number) => {
      return arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length) : fallback;
    };

    const avgPC1 = getAvg(pc1Grades, dataAvg);
    const avgEA = getAvg(eaGrades, avgPC1);
    const avgPC2 = getAvg(pc2Grades, avgEA);
    const avgPC3 = getAvg(pc3Grades, avgPC2);
    const avgEB = getAvg(ebGrades, avgPC3);

    const valToY = (val: number) => {
      const cl = Math.max(0, Math.min(20, val));
      return 210 - (cl * 9); 
    };

    const y0 = valToY(avgPC1 - 0.6);
    const y1 = valToY(avgPC1);
    const y2 = valToY(avgEA);
    const y3 = valToY(avgPC2);
    const y4 = valToY(avgPC3);
    const y5 = valToY(avgEB);

    this.trendLinePath = `M0,${y0} L120,${y1} L240,${y2} L360,${y3} L480,${y4} L600,${y5}`;
    this.trendAreaPath = `M0,${y0} L120,${y1} L240,${y2} L360,${y3} L480,${y4} L600,${y5} L600,240 L0,240 Z`;
  }

  getConicGradient() {
    const bajo = this.distribucionRiesgo.bajo;
    const medio = this.distribucionRiesgo.medio;
    const alto = this.distribucionRiesgo.alto;

    if (bajo === 0 && medio === 0 && alto === 0) {
      return 'conic-gradient(#e2e8f0 0% 100%)';
    }

    const limit1 = bajo;
    const limit2 = bajo + medio;

    return `conic-gradient(#10b981 0% ${limit1}%, #f59e0b ${limit1}% ${limit2}%, #ef4444 ${limit2}% 100%)`;
  }

  private processEstudianteData(allStudents: any[], myGrades: any[], userId: number, myEnrollments: any[] = []) {
    this.studentSummary = allStudents.find(s => s.id === userId);

    
    this.studentEnrolledCoursesCount = myEnrollments.length;
    let sumAttended = 0;
    let sumTotal = 0;
    myEnrollments.forEach(m => {
      sumAttended += m.attendedClasses || 0;
      sumTotal += m.totalClasses || 0;
    });
    this.studentAttendedClasses = sumAttended;
    this.studentTotalClasses = sumTotal;
    this.studentAttendancePct = sumTotal > 0 ? Math.round((sumAttended / sumTotal) * 100) : 0;

    if (myGrades && myGrades.length > 0) {
      const cursosMap: { [key: number]: { nombre: string, suma: number, cantidad: number } } = {};
      const fechaActual = new Date();
      const inicioMesActual = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);

      let sumaNotasMesPasado = 0;
      let cantNotasMesPasado = 0;

      myGrades.forEach(g => {
        if (g.course) {
          if (!cursosMap[g.course.id]) {
            cursosMap[g.course.id] = { nombre: g.course.name, suma: 0, cantidad: 0 };
          }
          cursosMap[g.course.id].suma += g.value;
          cursosMap[g.course.id].cantidad++;

          const fechaNota = g.createdAt ? new Date(g.createdAt) : new Date();
          if (fechaNota < inicioMesActual) {
            sumaNotasMesPasado += g.value;
            cantNotasMesPasado++;
          }
        }
      });

      const keys = Object.keys(cursosMap);
      let sumaPromediosCursos = 0;

      this.studentGrades = keys.map(key => {
        const c = cursosMap[Number(key)];
        const promedioCurso = c.suma / c.cantidad;
        sumaPromediosCursos += promedioCurso;

        return {
          label: c.nombre.substring(0, 3).toUpperCase(),
          value: Math.round(promedioCurso * 10) / 10,
          percentage: (promedioCurso / 20 * 100) + '%'
        };
      });

      const finalProm = sumaPromediosCursos / keys.length;
      this.promedioCalculadoEstudiante = Math.round(finalProm * 10) / 10;

      if (cantNotasMesPasado > 0) {
        const promMesPasado = sumaNotasMesPasado / cantNotasMesPasado;
        const diferencia = this.promedioCalculadoEstudiante - promMesPasado;

        this.esTendenciaPositiva = diferencia >= 0;
        this.tendenciaMensual = (diferencia >= 0 ? '+' : '') + (Math.round(diferencia * 10) / 10).toFixed(1);
      } else {
        this.tendenciaMensual = 'Estable';
        this.esTendenciaPositiva = true;
      }

    } else if (this.studentSummary) {
      this.promedioCalculadoEstudiante = 0;
      this.tendenciaMensual = 'Estable';
    }

    this.generateEvolutionChart(this.promedioCalculadoEstudiante);
  }

  generateEvolutionChart(baseValue: number) {
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
    this.averageEvolution = months.map((m, i) => ({
      month: m,
      value: baseValue > 0 ? baseValue - (1.2 - i * 0.4) : 0
    }));
  }

  get firstName() {
    return this.user?.name?.split(' ')[0] || 'Usuario';
  }
}