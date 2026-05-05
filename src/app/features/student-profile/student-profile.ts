import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-student-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-profile.html',
  styleUrl: './student-profile.css'
})
export class StudentProfileComponent implements OnInit {
  @Input() user: any = JSON.parse(localStorage.getItem('user') || '{}');

  students: any[] = [];
  filteredStudents: any[] = [];
  selectedStudent: any = null;
  courses: any[] = [];
  loading: boolean = true;
  loadingCourses: boolean = true;
  searchTerm: string = '';

  showEditModal: boolean = false;
  editingStudent: any = {};
  newGrade = { courseId: null, value: null };

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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarEstudiantes();
    this.cargarCursosDesdeBD();
  }


  cargarEstudiantes() {
    this.loading = true;
    this.http.get<any[]>('http://localhost:8081/api/students').subscribe({
      next: (data) => {
        this.students = data;
        this.filteredStudents = data;
        this.selectedStudent = data.find(s => s.email === this.user.email) || data[0];
        this.loading = false;
      },
      error: (err) => {
        console.error("Error al cargar estudiantes", err);
        this.loading = false;
      }
    });
  }

  cargarCursosDesdeBD() {
    this.loadingCourses = true;
    this.http.get<any[]>('http://localhost:8081/api/courses').subscribe({
      next: (data) => {
        this.courses = data;
        this.loadingCourses = false;
      },
      error: (err) => {
        console.error("Error al cargar cursos", err);
        this.loadingCourses = false;
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
    this.loading = true;
    this.http.put(`http://localhost:8081/api/students/${this.editingStudent.id}`, this.editingStudent).subscribe({
      next: (updated: any) => {
        const index = this.students.findIndex(s => s.id === updated.id);
        if (index !== -1) {
          this.students[index] = updated;
          this.selectedStudent = updated;
          this.filtrarAlumnos();
        }
        this.showEditModal = false;
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  subirNota() {
    if (!this.selectedStudent || !this.newGrade.courseId || !this.newGrade.value) {
      alert("Completa todos los campos del registro.");
      return;
    }

    const payload = {
      studentId: this.selectedStudent.id,
      courseId: Number(this.newGrade.courseId),
      value: this.newGrade.value
    };

    this.http.post('http://localhost:8081/api/grades', payload).subscribe({
      next: () => {
        alert("Nota sincronizada correctamente.");
        this.newGrade = { courseId: null, value: null };
        this.cargarEstudiantes(); 
      },
      error: (err) => console.error("Error al registrar nota", err)
    });
  }
}