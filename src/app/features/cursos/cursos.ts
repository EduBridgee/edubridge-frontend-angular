import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell';
import { LucideAngularModule, Search, User, Calendar, TrendingDown } from 'lucide-angular';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent, LucideAngularModule],
  templateUrl: './cursos.html',
  styleUrl: './cursos.css'
})
export class CursosComponent implements OnInit {
  readonly Search = Search;
  readonly User = User;
  readonly Calendar = Calendar;
  readonly TrendingDown = TrendingDown;

  user: any = {
    id: localStorage.getItem('user_id'),
    name: localStorage.getItem('user_name'),
    role: localStorage.getItem('user_role')
  };

  cursos: any[] = [];
  cursosFiltrados: any[] = [];
  searchTerm: string = '';
  loading: boolean = true;

  promedioGeneral: number = 0;
  totalCreditos: number = 0;
  diasSemana = ['l', 'm', 'mi', 'j', 'v'] as const;
  colores = [
    "from-blue-600 to-blue-400",
    "from-purple-600 to-purple-400",
    "from-emerald-600 to-emerald-400",
    "from-orange-600 to-orange-400",
    "from-blue-500 to-indigo-500",
    "from-indigo-600 to-blue-500"
  ];

  distribucion = [
    { label: "0-10", h: 0, count: 0 },
    { label: "11-13", h: 0, count: 0 },
    { label: "14-16", h: 0, count: 0 },
    { label: "17-18", h: 0, count: 0 },
    { label: "19-20", h: 0, count: 0 }
  ];

  horario: any[] = [];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    if (this.user.id) {
      setTimeout(() => {
        this.cargarCursosDesdeBD();
      }, 100);
    } else {
      console.error("No se encontró el ID del usuario en el sistema de sesión.");
      this.loading = false;
    }
  }

  cargarCursosDesdeBD() {
    this.loading = true;

    const role = this.user.role ? this.user.role.toLowerCase() : '';
    if (role === 'docente' || role === 'teacher') {
      this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/courses').subscribe({
        next: (allCourses) => {
          this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/teachers').subscribe({
            next: (profesores) => {
              const misCursos = allCourses.filter(c => c.teacher && Number(c.teacher.id) === Number(this.user.id));
              const viejosCursos = profesores.filter(p => Number(p.id) === Number(this.user.id) && p.course).map(p => p.course);
              
              const combinados = [...misCursos];
              viejosCursos.forEach(vc => {
                if (!combinados.some(c => c.id === vc.id)) {
                  combinados.push(vc);
                }
              });

              this.cursos = combinados.map((curso, index) => {
                return {
                  ...curso,
                  color: this.colores[index % this.colores.length],
                  prof: this.user.name || 'Docente',
                  evaluaciones: [],
                  notaPromedio: 0,
                  asis: "100%",
                  puntosParticipacion: 0,
                  prog: 100
                };
              });

              this.cursosFiltrados = [...this.cursos];
              this.calcularTotales();
              this.procesarDistribucionNotas();
              this.generarHorarioAleatorio();
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error("Error al cargar profesores:", err);
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
        },
        error: (err) => {
          console.error("Error al cargar cursos:", err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.http.get<any[]>(`https://edubridge-backend-prueba-v2.onrender.com/api/enrollments/student/${this.user.id}`).subscribe({
      next: (dataMatriculas) => {
        this.http.get<any[]>(`https://edubridge-backend-prueba-v2.onrender.com/api/grades/student/${this.user.id}`).subscribe({
          next: (notas) => {
            this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/teachers').subscribe({
              next: (profesores) => {

                this.cursos = dataMatriculas.map((matricula, index) => {
                  const curso = matricula.course;
                  const notasDelCurso = notas.filter(n => n.course && n.course.id === curso.id);
                  const profesorReal = curso.teacher || profesores.find(p => p.course && p.course.id === curso.id);

                  return {
                    ...curso,
                    color: this.colores[index % this.colores.length],
                    prof: profesorReal ? profesorReal.name : "Prof. Por Asignar",
                    evaluaciones: notasDelCurso.map(n => ({ type: n.type, value: n.value })),

                    
                    notaPromedio: notasDelCurso.length > 0
                      ? notasDelCurso.reduce((acc, n) => acc + n.value, 0) / notasDelCurso.length
                      : 0,

                    
                    asis: (matricula.attendancePercentage !== undefined && matricula.attendancePercentage !== null)
                      ? `${matricula.attendancePercentage}%`
                      : "0%",

                    
                    puntosParticipacion: matricula.participations || 0,

                    prog: Math.floor(Math.random() * (90 - 60 + 1)) + 60
                  };
                });

                this.cursosFiltrados = [...this.cursos];
                this.calcularTotales();
                this.procesarDistribucionNotas();
                this.generarHorarioAleatorio();
                this.loading = false;
                this.cdr.detectChanges();
              },
              error: (err) => {
                console.error("Error al cargar profesores:", err);
                this.loading = false;
                this.cdr.detectChanges();
              }
            });
          },
          error: (err) => {
            console.error("Error al cargar notas:", err);
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error("Error al cargar matrículas:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  procesarDistribucionNotas() {
    this.distribucion.forEach(d => { d.count = 0; d.h = 0; });

    this.cursos.forEach(c => {
      const nota = c.notaPromedio;
      if (nota >= 0 && nota <= 10) this.distribucion[0].count++;
      else if (nota >= 11 && nota <= 13) this.distribucion[1].count++;
      else if (nota >= 14 && nota <= 16) this.distribucion[2].count++;
      else if (nota >= 17 && nota <= 18) this.distribucion[3].count++;
      else if (nota >= 19 && nota <= 20) this.distribucion[4].count++;
    });

    const maxCount = Math.max(...this.distribucion.map(d => d.count), 1);
    this.distribucion.forEach(d => {
      d.h = (d.count / maxCount) * 4.5;
    });
  }

  generarHorarioAleatorio() {
    if (this.cursos.length === 0) return;

    const bloques = ["08:00-10:00", "10:00-12:00", "14:00-16:00", "16:00-17:30"];
    const dias = ['l', 'm', 'mi', 'j', 'v'];

    this.horario = bloques.map(time => ({
      time,
      l: "", m: "", mi: "", j: "", v: ""
    }));

    this.cursos.forEach(curso => {
      let asignado = false;
      while (!asignado) {
        const bloqueRandom = Math.floor(Math.random() * bloques.length);
        const diaRandom = dias[Math.floor(Math.random() * dias.length)] as 'l' | 'm' | 'mi' | 'j' | 'v';

        if (!this.horario[bloqueRandom][diaRandom]) {
          this.horario[bloqueRandom][diaRandom] = curso.name;
          asignado = true;
        }
      }
    });

    for (let i = 0; i < 4; i++) {
      const cursoRandom = this.cursos[Math.floor(Math.random() * this.cursos.length)];
      const bloqueRandom = Math.floor(Math.random() * bloques.length);
      const diaRandom = dias[Math.floor(Math.random() * dias.length)] as 'l' | 'm' | 'mi' | 'j' | 'v';

      if (!this.horario[bloqueRandom][diaRandom]) {
        this.horario[bloqueRandom][diaRandom] = cursoRandom.name;
      }
    }
  }

  filtrarCursos() {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      this.cursosFiltrados = [...this.cursos];
    } else {
      this.cursosFiltrados = this.cursos.filter(c =>
        c.name.toLowerCase().includes(term) ||
        c.code.toLowerCase().includes(term)
      );
    }
    this.cdr.detectChanges();
  }

  calcularTotales() {
    if (this.cursos && this.cursos.length > 0) {
      this.totalCreditos = this.cursos.reduce((acc, c) => acc + (c.credits || 0), 0);

      const cursosConNota = this.cursos.filter(c => c.evaluaciones && c.evaluaciones.length > 0);

      if (cursosConNota.length > 0) {
        const sumaNotas = cursosConNota.reduce((acc, c) => acc + c.notaPromedio, 0);
        const promedio = sumaNotas / cursosConNota.length;
        this.promedioGeneral = Math.round(promedio * 10) / 10;
      } else {
        this.promedioGeneral = 0;
      }
    }
  }
}