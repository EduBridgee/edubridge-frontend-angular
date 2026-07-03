import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell';

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent],
  templateUrl: './cursos.html',
  styleUrl: './cursos.css'
})
export class CursosComponent implements OnInit {
  user: any = JSON.parse(localStorage.getItem('user') || '{}');
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
    this.cargarCursosDesdeBD();
  }

  cargarCursosDesdeBD() {
    this.loading = true;

    this.http.get<any[]>('http://localhost:8081/api/courses').subscribe({
      next: (dataCursos) => {
        this.http.get<any[]>(`http://localhost:8081/api/grades/student/${this.user.id}`).subscribe({
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
            this.cursosFiltrados = [...this.cursos];
            this.calcularTotales();
            this.procesarDistribucionNotas();
            this.generarHorarioAleatorio();
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

  procesarDistribucionNotas() {
    // Resetear contadores
    this.distribucion.forEach(d => { d.count = 0; d.h = 0; });

    this.cursos.forEach(c => {
      const nota = c.notaReal;
      if (nota >= 0 && nota <= 10) this.distribucion[0].count++;
      else if (nota >= 11 && nota <= 13) this.distribucion[1].count++;
      else if (nota >= 14 && nota <= 16) this.distribucion[2].count++;
      else if (nota >= 17 && nota <= 18) this.distribucion[3].count++;
      else if (nota >= 19 && nota <= 20) this.distribucion[4].count++;
    });

    const maxCount = Math.max(...this.distribucion.map(d => d.count), 1);
    this.distribucion.forEach(d => {
      // Escalamos la altura para que el máximo sea 4.5 (unidades relativas para el gráfico)
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

    // Asignar cada curso al menos una vez
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

    // Rellenar algunos espacios vacíos con más clases aleatorias de los mismos cursos
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
