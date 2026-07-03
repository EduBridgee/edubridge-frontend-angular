import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell';

@Component({
  selector: 'app-tutorias',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent],
  templateUrl: './tutorias.html',
  styleUrl: './tutorias.css'
})
export class TutoriasComponent implements OnInit {
  @Input() user: any = JSON.parse(localStorage.getItem('user') || '{}');

  sessions: any[] = [];
  filteredSessions: any[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  activeTab: string = 'mis-tutorias';

  private apiUrl = 'http://localhost:8081/api/tutoring';

  teacherKpis = {
    todaySessions: 0,
    activeStudents: 0,
    totalHours: 0,
    satisfaction: 4.8
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.fetchTutorias();
  }

  fetchTutorias() {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl)
      .subscribe({
        next: (data) => {
          if (this.user.role === 'docente' || this.user.role === 'DOCENTE') {
            this.sessions = data.filter(s => s.teacherName === this.user.name && s.status !== 'Cancelada');
            this.calcularKpisDocente();
          } else {
            this.sessions = data.filter(s => s.status !== 'Cancelada');
          }

          this.filteredSessions = [...this.sessions];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error cargando tutorías:", err);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  calcularKpisDocente() {
    const hoy = new Date().toLocaleDateString();
    this.teacherKpis.todaySessions = this.sessions.filter(s => new Date(s.startTime).toLocaleDateString() === hoy).length;
    this.teacherKpis.activeStudents = this.sessions.reduce((acc, s) => acc + (s.studentCount || 0), 0);
    this.teacherKpis.totalHours = this.sessions.length * 1.5; // Estimación: 1.5 horas por sesión
  }

  finalizarTutoria(id: number) {
    if (confirm('¿Deseas marcar esta tutoría como finalizada?')) {
      this.http.patch(`${this.apiUrl}/${id}/finalize`, {}).subscribe({
        next: () => this.fetchTutorias(),
        error: () => alert('Error al finalizar la sesión')
      });
    }
  }

  aceptarSolicitud(id: number) {
    this.http.patch(`${this.apiUrl}/${id}/accept`, {}).subscribe({
      next: () => this.fetchTutorias(),
      error: () => alert('Error al confirmar la solicitud')
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.filtrarTutorias();
  }

  filtrarTutorias() {
    const term = this.searchTerm.toLowerCase().trim();
    let base = [...this.sessions];

    // Filtrado por pestaña para Docente
    if (this.user.role === 'docente' || this.user.role === 'DOCENTE') {
      if (this.activeTab === 'proximas' || this.activeTab === 'mis-tutorias') {
        base = base.filter(s => s.status === 'Pendiente' || s.status === 'Confirmada');
      } else if (this.activeTab === 'historial-docente') {
        base = base.filter(s => s.status === 'Finalizada');
      }
    }

    // Filtrado por búsqueda
    if (!term) {
      this.filteredSessions = base;
    } else {
      this.filteredSessions = base.filter(s =>
        s.courseName.toLowerCase().includes(term) ||
        (s.teacherName && s.teacherName.toLowerCase().includes(term))
      );
    }
    this.cdr.detectChanges();
  }

  unirseASesion(curso: string) {
    const roomName = curso.toLowerCase().replace(/\s+/g, '-');
    const meetingUrl = `https://meet.jit.si/EduBridge-${roomName}`;
    window.open(meetingUrl, '_blank');
  }

  abrirPizarra(curso: string) {
    const roomName = curso.toLowerCase().replace(/\s+/g, '-');
    const encryptionKey = "EduBridgeKey2026Angular!";
    const meetingUrl = `https://excalidraw.com/#room=edubridge-${roomName},${encryptionKey}`;
    window.open(meetingUrl, '_blank');
  }

  cancelarTutoria(id: number) {
    if (confirm('¿Estás seguro de que deseas cancelar esta tutoría?')) {
      // Ajustado al endpoint del backend: PATCH /api/tutoring/{id}/cancel
      this.http.patch(`${this.apiUrl}/${id}/cancel`, {}).subscribe({
        next: () => {
          this.fetchTutorias();
        },
        error: (err) => alert('Error al cancelar la sesión')
      });
    }
  }

  reprogramarTutoria(id: number) {
    const session = this.sessions.find(s => s.id === id);
    if (!session) return;

    const fechaActual = new Date(session.startTime);
    fechaActual.setDate(fechaActual.getDate() + 7);

    // Ajustado al backend: Espera un Map con "newDate" y formato ISO
    const body = { newDate: fechaActual.toISOString() };

    this.http.patch(`${this.apiUrl}/${id}/reschedule`, body).subscribe({
      next: (res: any) => {
        console.log("Actualizado en DB:", res);
        this.fetchTutorias();
      },
      error: (err) => alert('Error al reprogramar automáticamente')
    });
  }

  getFormattedTime(timeString: string) {
    if (!timeString) return '';
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  getFormattedDate(timeString: string) {
    if (!timeString) return '';
    return new Date(timeString).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' });
  }

  showModal = false;
  nuevaTutoria = {
    courseName: '',
    teacherName: '',
    topic: '',
    startTime: '',
    type: 'INDIVIDUAL'
  };

  abrirModal(teacher: string) {
    // Limpiamos el objeto antes de abrir para evitar basura de registros anteriores
    this.nuevaTutoria = {
      courseName: '',
      teacherName: teacher, // Aquí recibe user.name
      topic: '',
      startTime: '',
      type: 'INDIVIDUAL'
    };
    this.showModal = true;
    this.cdr.detectChanges(); // Forzamos la detección de cambios para mostrar el modal
  }

  guardarTutoria() {
    // Aseguramos que el nombre del docente sea el del usuario actual si es docente
    if (this.user.role?.toLowerCase() === 'docente') {
      this.nuevaTutoria.teacherName = this.user.name;
    }

    if (!this.nuevaTutoria.courseName || !this.nuevaTutoria.startTime) {
      alert('Por favor completa el curso y la fecha');
      return;
    }

    this.http.post('http://localhost:8081/api/tutoring/request', this.nuevaTutoria)
      .subscribe({
        next: () => {
          this.showModal = false;
          this.fetchTutorias();
          // Reset completo
          this.nuevaTutoria = { courseName: '', teacherName: '', topic: '', startTime: '', type: 'INDIVIDUAL' };
        },
        error: (err) => {
          console.error(err);
          alert('Error al procesar la tutoría');
        }
      });
  }

  // --- LÓGICA DE FAQ ---
  faqs = [
    {
      category: 'Proceso de Tutorías',
      questions: [
        { q: '¿Cómo solicito una nueva tutoría?', a: 'Ve a la pestaña "Buscar Tutor", elige a tu profesor y haz clic en "+ Solicitar Tutoría". Completa el formulario y ¡listo!', open: false },
        { q: '¿Con cuánta anticipación debo solicitarla?', a: 'Se recomienda solicitarla con al menos 24 horas de anticipación para que el docente pueda organizar su agenda.', open: false },
        { q: '¿Puedo cancelar una sesión ya confirmada?', a: 'Sí, puedes cancelarla desde "Mis Tutorías" hasta 2 horas antes del inicio de la sesión.', open: false }
      ]
    },
    {
      category: 'Herramientas Digitales',
      questions: [
        { q: '¿Qué plataforma se usa para las videollamadas?', a: 'Usamos Jitsi Meet, una plataforma segura y fácil de usar que no requiere instalación.', open: false },
        { q: '¿Cómo accedo a la pizarra virtual?', a: 'Dentro de tu tutoría, haz clic en "Detalles" y luego en el botón "Abrir Pizarra" para colaborar en tiempo real.', open: false }
      ]
    },
    {
      category: 'Calificaciones y Progreso',
      questions: [
        { q: '¿Las tutorías tienen costo adicional?', a: 'No, todas las tutorías académicas son gratuitas y forman parte de los beneficios de EduBridge.', open: false },
        { q: '¿Puedo calificar el desempeño del tutor?', a: '¡Por supuesto! Al finalizar cada sesión, podrás asignar una puntuación de estrellas en la pestaña de "Historial".', open: false }
      ]
    }
  ];

  toggleFaq(catIndex: number, qIndex: number) {
    this.faqs[catIndex].questions[qIndex].open = !this.faqs[catIndex].questions[qIndex].open;
  }
}