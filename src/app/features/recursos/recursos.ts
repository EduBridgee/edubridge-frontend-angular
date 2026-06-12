import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell';
import { NotificationService } from '../../core/services/notification';
import { LucideAngularModule, Search, Plus, FileText, Video, Image, Music, Presentation, Globe, Upload, Download, Link, Rocket, X } from 'lucide-angular';

@Component({
  selector: 'app-recursos',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent, LucideAngularModule],
  templateUrl: './recursos.html',
  styleUrl: './recursos.css'
})
export class RecursosComponent implements OnInit {
  @Input() user: any = JSON.parse(localStorage.getItem('user') || '{}');

  readonly Search = Search;
  readonly Plus = Plus;
  readonly FileText = FileText;
  readonly Video = Video;
  readonly Image = Image;
  readonly Music = Music;
  readonly Presentation = Presentation;
  readonly Globe = Globe;
  readonly Upload = Upload;
  readonly Download = Download;
  readonly Link = Link;
  readonly Rocket = Rocket;
  readonly X = X;

  recursos: any[] = [];
  cursos: any[] = [];
  filteredRecursos: any[] = [];
  recentActivity: any[] = [];
  activeFilter: string = 'Todos';
  loading: boolean = true;
  showModal:boolean = false;
  isDragging: boolean = false;
  selectedFile: File | null = null;
  videoUrl: string = '';

  private readonly ACTIVITY_KEY = 'eb_recent_activity';

  nuevoRecurso = {
    title: '',
    subject: '', 
    type: 'PDF',
    meta: '',
    img: '',
    stats: '0 descargas • 0 MB',
    rating: 5.0
  };

  constructor(
    private http: HttpClient, 
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  private handleFile(file: File) {
    
    const MAX_SIZE_KB = 500;
    if (file.size > MAX_SIZE_KB * 1024) {
      this.notificationService.showError(`El archivo es demasiado grande (${(file.size / 1024).toFixed(1)}KB). Límite permitido: ${MAX_SIZE_KB}KB.`, 'Archivo excedido');
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    this.nuevoRecurso.stats = `0 descargas • ${sizeMB} MB`;

    const reader = new FileReader();
    reader.onload = (e: any) => {
      
      this.nuevoRecurso.img = e.target.result;
      this.cdr.detectChanges();
    };
    reader.readAsDataURL(file);
  }

  manejarSubida() {
    if (!this.nuevoRecurso.title) return;

    
    const payload = {
      type: this.nuevoRecurso.type,
      title: this.nuevoRecurso.title,
      subject: this.nuevoRecurso.subject, 
      meta: this.nuevoRecurso.meta || 'Material académico',
      stats: this.nuevoRecurso.stats,
      rating: this.nuevoRecurso.rating,
      img: this.nuevoRecurso.type === 'Video' ? this.videoUrl : this.nuevoRecurso.img 
    };

    console.log('Enviando recurso al backend (Modelo exacto):', { ...payload, img: payload.img?.substring(0, 50) + '...' });

    this.http.post('https://edubridge-backend-prueba-v2.onrender.com/api/resources', payload).subscribe({
      next: () => {
        this.notificationService.showSuccess("El recurso ha sido publicado exitosamente.");
        this.showModal = false;
        this.cargarDatos();
        this.resetForm();
      },
      error: (err) => {
        console.error("Error al subir:", err);
        if (err.status === 500) {
          this.notificationService.showError("El servidor no pudo guardar el archivo. Verifica el tamaño o formato.", "Error de Servidor (500)");
        } else {
          this.notificationService.showError(`No se pudo subir el recurso (Error ${err.status}).`, "Error al publicar");
        }
      }
    });
  }

  private resetForm() {
    this.nuevoRecurso = {
      title: '',
      subject: this.cursos.length > 0 ? this.cursos[0].name : '',
      type: 'PDF',
      meta: '',
      img: '',
      stats: '0 descargas • 0 MB',
      rating: 5.0
    };
    this.selectedFile = null;
    this.videoUrl = '';
    this.isDragging = false;
  }

  ngOnInit(): void {
    if (!this.user || !this.user.role) {
      this.user = {
        id: localStorage.getItem('user_id'),
        name: localStorage.getItem('user_name'),
        role: localStorage.getItem('user_role')
      };
    }
    this.cargarDatos();
    this.cargarActividad();
    this.cargarCursos();
  }

  cargarCursos() {
    const role = this.user.role ? this.user.role.toLowerCase() : '';
    this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/courses').subscribe({
      next: (data) => {
        if (role === 'docente' || role === 'teacher') {
          this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/teachers').subscribe({
            next: (profesores) => {
              const misCursos = data.filter(c => c.teacher && Number(c.teacher.id) === Number(this.user.id));
              const viejosCursos = profesores.filter(p => Number(p.id) === Number(this.user.id) && p.course).map(p => p.course);
              
              const combinados = [...misCursos];
              viejosCursos.forEach(vc => {
                if (!combinados.some(c => c.id === vc.id)) {
                  combinados.push(vc);
                }
              });
              
              this.cursos = combinados;
              if (this.cursos.length > 0) {
                this.nuevoRecurso.subject = this.cursos[0].name;
              }
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error("Error cargando profesores en Recursos:", err);
              this.cursos = [];
              this.cdr.detectChanges();
            }
          });
        } else {
          this.cursos = data;
          if (this.cursos.length > 0) {
            this.nuevoRecurso.subject = this.cursos[0].name;
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => console.error("Error cargando cursos:", err)
    });
  }

  cargarActividad() {
    const saved = localStorage.getItem(this.ACTIVITY_KEY);
    if (saved) {
      this.recentActivity = JSON.parse(saved);
    }
  }

  registrarActividad(recurso: any) {
    
    this.recentActivity = this.recentActivity.filter(a => a.id !== recurso.id);
    
    
    this.recentActivity.unshift({
      id: recurso.id,
      title: recurso.title,
      subject: recurso.subject,
      type: recurso.type,
      timestamp: new Date().getTime()
    });

    
    this.recentActivity = this.recentActivity.slice(0, 4);
    
    localStorage.setItem(this.ACTIVITY_KEY, JSON.stringify(this.recentActivity));
    this.cdr.detectChanges();
  }

  cargarDatos() {
    this.loading = true;
    const role = this.user.role ? this.user.role.toLowerCase() : '';
    
    this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/resources').subscribe({
      next: (dataRecursos) => {
        if (role === 'estudiante' || role === 'student') {
          this.http.get<any[]>(`https://edubridge-backend-prueba-v2.onrender.com/api/enrollments/student/${this.user.id}`).subscribe({
            next: (dataMatriculas) => {
              const cursosMatriculados = dataMatriculas.map(m => m.course?.name?.toLowerCase().trim());
              this.recursos = dataRecursos.filter(r => {
                const subjectLower = r.subject ? r.subject.toLowerCase().trim() : '';
                return cursosMatriculados.includes(subjectLower);
              });
              this.aplicarFiltro();
              this.loading = false;
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error("Error cargando matrículas para recursos:", err);
              this.recursos = [];
              this.aplicarFiltro();
              this.loading = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          this.recursos = dataRecursos;
          this.aplicarFiltro();
          this.loading = false;
          this.cdr.detectChanges();
        }
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
      const typeMap: any = { 
        'Documentos': 'PDF', 
        'Videos': 'Video', 
        'Quizzes': 'Quiz', 
        'Audios': 'Audio', 
        'Presentaciones': 'PPT',
        'Imágenes': 'Imagen'
      };
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
    this.registrarActividad(recurso);
    
    let content = recurso.img;

    if (!content) {
      if (recurso.type === 'Video') {
        content = `https://www.youtube.com/results?search_query=${recurso.title}`;
      } else {
        this.notificationService.showInfo('No hay contenido disponible para visualizar este recurso.', 'Sin contenido');
        return;
      }
    }

    
    if (content.startsWith('data:')) {
      try {
        const byteString = atob(content.split(',')[1]);
        const mimeString = content.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], {type: mimeString});
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      } catch (e) {
        console.error("Error al procesar Base64:", e);
        window.open(content, '_blank');
      }
    } else {
      window.open(content, '_blank');
    }
  }

  descargarRecurso(recurso: any) {
    const content = recurso.img;
    
    if (!content) {
      this.notificationService.showInfo('No hay un archivo físico disponible para descargar.', 'Sin archivo');
      return;
    }

    if (recurso.type === 'Video' && !content.startsWith('data:')) {
      window.open(content, '_blank');
      return;
    }

    const processBlob = (blob: Blob, fileName: string) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }, 100);
    };

    if (content.startsWith('data:')) {
      try {
        const mimeType = content.split(',')[0].split(':')[1].split(';')[0];
        const extension = mimeType.split('/')[1] || 'file';
        const byteString = atob(content.split(',')[1]);
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
          ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], {type: mimeType});
        processBlob(blob, `${recurso.title}.${extension}`);
      } catch (e) {
        console.error("Error al descargar Base64:", e);
        window.open(content, '_blank');
      }
    } else {
      fetch(content)
        .then(response => response.blob())
        .then(blob => {
          const extension = content.split('.').pop()?.split('?')[0] || 'file';
          processBlob(blob, `${recurso.title}.${extension}`);
        })
        .catch(() => window.open(content, '_blank'));
    }
  }
}
