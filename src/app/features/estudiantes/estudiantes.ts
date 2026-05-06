import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Añadido HttpHeaders
import { FormsModule } from '@angular/forms';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-estudiantes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estudiantes.html',
  styleUrl: './estudiantes.css'
})
export class EstudiantesComponent implements OnInit {
  courses: any[] = [];
  students: any[] = [];
  filteredStudents: any[] = [];
  selectedStudent: any = null;
  loading: boolean = true;
  loadingCourses: boolean = true;
  searchTerm: string = '';

  showEditModal = false;
  editingStudent: any = {};

  newGrade = {
    courseId: null,
    value: null
  };

  private readonly API_URL = 'http://localhost:8081/api';

  constructor(private http: HttpClient, private cdRef: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.cargarEstudiantes();
    this.cargarCursosDesdeBD();
  }

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  guardarCambios() {
    this.loading = true;
    this.http.put(`${this.API_URL}/students/${this.editingStudent.id}`, this.editingStudent).subscribe({
      next: (updated: any) => {
        this.showEditModal = false; 
        this.loading = false;
        this.cargarEstudiantes(); 
        this.cdRef.detectChanges(); 
      },
      error: (err) => {
        this.loading = false;
        this.cdRef.detectChanges();
      }
    });
  }

  cargarEstudiantes() {
    this.http.get<any[]>(`${this.API_URL}/students`).subscribe({
      next: (data) => {
        this.students = data;

        this.filteredStudents = [...data];

        if (this.selectedStudent) {
          const actualizado = data.find(s => s.id === this.selectedStudent.id);
          if (actualizado) {
            this.selectedStudent = actualizado;
          }
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

  subirNota() {
    if (!this.selectedStudent || !this.newGrade.courseId || !this.newGrade.value) {
      alert("Completa todos los campos");
      return;
    }

    const payload = {
      studentId: this.selectedStudent.id,
      courseId: Number(this.newGrade.courseId),
      value: this.newGrade.value
    };

    this.http.post(`${this.API_URL}/grades`, payload, { headers: this.getHeaders() }).subscribe({
      next: () => {
        alert("Nota registrada en la base de datos.");
        this.newGrade = { courseId: null, value: null };
        this.cargarEstudiantes();
      },
      error: (err) => console.error("Error al subir nota:", err)
    });
  }

  cargarCursosDesdeBD() {
    this.loadingCourses = true;
    this.http.get<any[]>(`${this.API_URL}/courses`).subscribe({
      next: (data) => {
        this.courses = data;
        this.loadingCourses = false;
        this.cdRef.detectChanges(); 
      },
      error: (err) => {
        console.error("Error al cargar cursos:", err);
        this.loadingCourses = false;
        this.cdRef.detectChanges(); 
      }
    });
  }



  filtrarAlumnos() {
    const term = this.searchTerm.toLowerCase();
    this.filteredStudents = this.students.filter(s =>
      s.name.toLowerCase().includes(term) ||
      (s.code && s.code.toLowerCase().includes(term))
    );
  }

  seleccionarAlumno(alumno: any) {
    this.selectedStudent = alumno;
  }

  abrirEdicion() {
    if (!this.selectedStudent) return;
    this.editingStudent = JSON.parse(JSON.stringify(this.selectedStudent));
    this.showEditModal = true;
  }

  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }
}