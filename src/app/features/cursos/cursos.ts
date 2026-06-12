import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cursos.html',
  styleUrl: './cursos.css'
})
export class CursosComponent implements OnInit {
  user: any = JSON.parse(localStorage.getItem('user') || '{}');
  cursos: any[] = [];
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
    { label: "0-10", h: 0.5 },
    { label: "11-13", h: 1 },
    { label: "14-16", h: 2.5 },
    { label: "17-18", h: 4 },
    { label: "19-20", h: 1.5 }
  ];

  horario = [
    { time: "08:00-10:00", l: "Matemáticas", m: "Literatura", mi: "Matemáticas", j: "", v: "Matemáticas" },
    { time: "10:00-12:00", l: "", m: "Fisica II", mi: "", j: "Fisica II", v: "Literatura" },
    { time: "14:00-16:00", l: "Arquitectura", m: "", mi: "Arquitectura", j: "Historia", v: "" },
    { time: "16:00-17:30", l: "Inglés", m: "", mi: "Inglés", j: "", v: "Inglés" }
  ];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.cargarCursosDesdeBD();
  }

  cargarCursosDesdeBD() {
    this.loading = true;

    this.http.get<any[]>('https://edubridge-backend-v2.onrender.com/api/courses').subscribe({
      next: (dataCursos) => {

        this.http.get<any[]>(`https://edubridge-backend-v2.onrender.com/api/grades/student/${this.user.id}`).subscribe({
          next: (notas) => {

            this.cursos = dataCursos.map((curso, index) => {
              const notaRelacionada = notas.find(n => n.course.id === curso.id);

              return {
                ...curso,
                color: this.colores[index % this.colores.length],
                prof: curso.professor || "Prof. Asignado",
                notaReal: notaRelacionada ? notaRelacionada.value : 0,
                asis: "95%",
                prog: Math.floor(Math.random() * (90 - 60 + 1)) + 60
              };
            });
            this.calcularTotales();
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error("Error:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularTotales() {
    if (this.cursos && this.cursos.length > 0) {
      this.totalCreditos = this.cursos.reduce((acc, c) => acc + (c.credits || 0), 0);

      const cursosConNota = this.cursos.filter(c => c.notaReal > 0);

      if (cursosConNota.length > 0) {
        const sumaNotas = cursosConNota.reduce((acc, c) => acc + c.notaReal, 0);
        const promedio = sumaNotas / cursosConNota.length;
        this.promedioGeneral = Math.round(promedio * 10) / 10;
      } else {
        this.promedioGeneral = 0;
      }
    }
  }
}
