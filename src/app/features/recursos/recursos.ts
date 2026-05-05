import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-recursos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recursos.html',
  styleUrl: './recursos.css'
})
export class RecursosComponent implements OnInit {
  @Input() user: any = JSON.parse(localStorage.getItem('user') || '{}');

  recursos: any[] = [];
  filteredRecursos: any[] = [];
  activeFilter: string = 'Todos';
  loading: boolean = true;
  showModal: boolean = false;

  nuevoRecurso = {
    title: '',
    subject: 'Matemáticas',
    type: 'PDF',
    meta: 'Material académico',
    img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
    stats: '0 descargas • 1.0 MB',
    rating: 5.0
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos() {
    this.loading = true;
    this.http.get<any[]>('http://localhost:8081/api/resources').subscribe({
      next: (data) => {
        this.recursos = data;
        this.aplicarFiltro();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error cargando recursos:", err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  setActiveFilter(filter: string) {
    this.activeFilter = filter;
    this.aplicarFiltro();
  }

  aplicarFiltro() {
    if (this.activeFilter === 'Todos') {
      this.filteredRecursos = this.recursos;
    } else {
      const typeMap: any = { 'Documentos': 'PDF', 'Videos': 'Video', 'Quizzes': 'Quiz', 'Audios': 'Audio', 'Presentaciones': 'PPT' };
      const filterValue = typeMap[this.activeFilter] || this.activeFilter;
      this.filteredRecursos = this.recursos.filter(r => r.type === filterValue);
    }
  }

  buscarRecursos(event: any) {
    const busqueda = event.target.value.toLowerCase();
    this.filteredRecursos = this.recursos.filter(r =>
      r.title.toLowerCase().includes(busqueda) ||
      r.subject.toLowerCase().includes(busqueda)
    );
  }

  manejarAccion(recurso: any) {
    const url = recurso.type === 'Video'
      ? `https://www.youtube.com/results?search_query=${recurso.title}`
      : recurso.img;
    window.open(url, '_blank');
  }

  manejarSubida() {
    this.http.post('http://localhost:8081/api/resources', this.nuevoRecurso).subscribe({
      next: () => {
        alert("✅ Recurso publicado exitosamente.");
        this.showModal = false;
        this.cargarDatos();
        this.resetForm();
      },
      error: (err) => alert("Error al subir el recurso al servidor.")
    });
  }

  resetForm() {
    this.nuevoRecurso = {
      title: '', subject: 'Matemáticas', type: 'PDF', meta: 'Material académico',
      img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=400',
      stats: '0 descargas • 1.0 MB', rating: 5.0
    };
  }
}
