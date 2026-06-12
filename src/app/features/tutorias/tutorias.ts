import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

import { NotificationBellComponent } from '../../shared/components/notification-bell/notification-bell';
import { NotificationService } from '../../core/services/notification';
import { RoleService, UserRole } from '../../core/services/role';
import { LucideAngularModule, Search, Plus, Calendar, Users, Clock, Star, MessageCircle, Monitor, BookOpen, ChevronDown, Check, X } from 'lucide-angular';

@Component({
  selector: 'app-tutorias',
  standalone: true,
  imports: [CommonModule, FormsModule, NotificationBellComponent, LucideAngularModule],
  templateUrl: './tutorias.html',
  styleUrl: './tutorias.css'
})
export class TutoriasComponent implements OnInit {
  @Input() user: any = JSON.parse(localStorage.getItem('user') || '{}');

  readonly Search = Search;
  readonly Plus = Plus;
  readonly Calendar = Calendar;
  readonly Users = Users;
  readonly Clock = Clock;
  readonly Star = Star;
  readonly MessageCircle = MessageCircle;
  readonly Monitor = Monitor;
  readonly BookOpen = BookOpen;
  readonly ChevronDown = ChevronDown;
  readonly Check = Check;
  readonly X = X;

  sessions: any[] = [];
  filteredSessions: any[] = [];
  teachers: any[] = [];
  searchTerm: string = '';
  loading: boolean = true;
  activeTab: string = 'mis-tutorias';

  private apiUrl = 'https://edubridge-backend-prueba-v2.onrender.com/api/tutoring';

  teacherKpis = {
    todaySessions: 0,
    activeStudents: 0,
    totalHours: 0,
    satisfaction: 4.8
  };

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private roleService: RoleService
  ) { }

  ngOnInit(): void {
    this.fetchTutorias();
    this.fetchTeachers();
  }

  fetchTutorias() {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl)
      .subscribe({
        next: (data) => {
          const isDocente = this.roleService.isDocente(this.user.role);
          if (isDocente) {
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

  fetchTeachers() {
    
    this.http.get<any[]>('https://edubridge-backend-prueba-v2.onrender.com/api/teachers').subscribe({
      next: (data) => {
        this.teachers = data.map(t => ({
          n: t.name,
          s: t.specialization || (t.course ? t.course.name : 'General'),
          i: this.getInitials(t.name)
        }));
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar docentes:", err)
    });
  }
  getInitials(name: string): string {
    if (!name) return '??';
    const parts = name.split(' ');
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  }

  calcularKpisDocente() {
    const hoy = new Date().toLocaleDateString();
    this.teacherKpis.todaySessions = this.sessions.filter(s => new Date(s.startTime).toLocaleDateString() === hoy).length;
    this.teacherKpis.activeStudents = this.sessions.reduce((acc, s) => acc + (s.studentCount || 0), 0);
    this.teacherKpis.totalHours = this.sessions.length * 1.5; 
  }

  finalizarTutoria(id: number) {
    if (confirm('¿Deseas marcar esta tutoría como finalizada?')) {
      this.http.patch(`${this.apiUrl}/${id}/finalize`, {}).subscribe({
        next: () => {
          this.fetchTutorias();
          this.notificationService.showSuccess("La tutoría ha sido marcada como finalizada.");
        },
        error: () => this.notificationService.showError('Error al intentar finalizar la sesión.')
      });
    }
  }

  aceptarSolicitud(id: number) {
    this.http.patch(`${this.apiUrl}/${id}/accept`, {}).subscribe({
      next: () => {
        this.fetchTutorias();
        this.notificationService.showSuccess("Solicitud de tutoría aceptada correctamente.");
      },
      error: () => this.notificationService.showError('Error al confirmar la solicitud.')
    });
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;
    this.filtrarTutorias();
  }

  filtrarTutorias() {
    const term = this.searchTerm.toLowerCase().trim();
    let base = [...this.sessions];

    if (this.roleService.isDocente(this.user.role)) {
      if (this.activeTab === 'proximas' || this.activeTab === 'mis-tutorias') {
        base = base.filter(s => s.status === 'Pendiente' || s.status === 'Confirmada');
      } else if (this.activeTab === 'historial-docente') {
        base = base.filter(s => s.status === 'Finalizada');
      }
    }

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

  unirseASesion(session: any) {
    const sessionObj = typeof session === 'string' ? { courseName: session, id: 0 } : session;
    this.activeMeetingCourse = sessionObj.courseName;
    this.showVideoModal = true;
    this.cdr.detectChanges();

    const cleanCourseName = sessionObj.courseName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-+|-+$/g, "");

    const roomName = `EduBridge-${cleanCourseName}-${sessionObj.id}`;
    const domain = 'meet.opensuse.org';
    
    if (this.jitsiAPI) {
      this.jitsiAPI.dispose();
      this.jitsiAPI = null;
    }

    setTimeout(() => {
      const options = {
        roomName: roomName,
        width: '100%',
        height: '100%',
        parentNode: document.querySelector('#jitsi-iframe-container'),
        userInfo: {
          displayName: this.user.name || 'Usuario EduBridge',
          email: this.user.email || ''
        },
        configOverwrite: {
          lobbyEnabled: false,
          prejoinPageEnabled: true,
          disableDeepLinking: true,
          startWithAudioMuted: true,
          startWithVideoMuted: true
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false
        }
      };

      this.jitsiAPI = new (window as any).JitsiMeetExternalAPI(domain, options);

      if (this.roleService.isDocente(this.user.role)) {
        this.jitsiAPI.addEventListener('videoConferenceJoined', () => {
          this.jitsiAPI.executeCommand('toggleLobby', true);
        });
      }
    }, 100);
  }

  cerrarVideoLlamada() {
    if (this.jitsiAPI) {
      this.jitsiAPI.dispose();
      this.jitsiAPI = null;
    }
    this.showVideoModal = false;
    this.activeMeetingCourse = '';
    this.cdr.detectChanges();
  }

  abrirPizarra(curso: string) {
    const roomName = curso.toLowerCase().replace(/\s+/g, '-');
    const encryptionKey = "EduBridgeKey2026Angular!";
    const meetingUrl = `https://excalidraw.com/#room=edubridge-${roomName},${encryptionKey}`;
    window.open(meetingUrl, '_blank');
  }

  cancelarTutoria(id: number) {
    if (confirm('¿Estás seguro de que deseas cancelar esta tutoría?')) {
      
      this.http.patch(`${this.apiUrl}/${id}/cancel`, {}).subscribe({
        next: () => {
          this.fetchTutorias();
          this.notificationService.showSuccess("La tutoría ha sido cancelada.");
        },
        error: (err) => this.notificationService.showError('Error al intentar cancelar la sesión.')
      });
    }
  }

  reprogramarTutoria(id: number) {
    const session = this.sessions.find(s => s.id === id);
    if (!session) return;

    const fechaActual = new Date(session.startTime);
    fechaActual.setDate(fechaActual.getDate() + 7);

    
    const body = { newDate: fechaActual.toISOString() };

    this.http.patch(`${this.apiUrl}/${id}/reschedule`, body).subscribe({
      next: (res: any) => {
        console.log("Actualizado en DB:", res);
        this.fetchTutorias();
        this.notificationService.showSuccess("La tutoría ha sido reprogramada para la próxima semana.");
      },
      error: (err) => this.notificationService.showError('No se pudo reprogramar la sesión automáticamente.')
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
  showVideoModal = false;
  activeMeetingCourse = '';
  jitsiAPI: any = null;
  nuevaTutoria = {
    courseName: '',
    teacherName: '',
    topic: '',
    startTime: '',
    type: 'INDIVIDUAL'
  };

  abrirModal(teacher: string) {
    
    this.nuevaTutoria = {
      courseName: '',
      teacherName: teacher, 
      topic: '',
      startTime: '',
      type: 'INDIVIDUAL'
    };
    this.showModal = true;
    this.cdr.detectChanges(); 
  }

  guardarTutoria() {
    if (this.roleService.isDocente(this.user.role)) {
      this.nuevaTutoria.teacherName = this.user.name;
    }

    if (!this.nuevaTutoria.courseName || !this.nuevaTutoria.startTime) {
      this.notificationService.showInfo('Por favor completa el curso y la fecha seleccionada.', 'Información necesaria');
      return;
    }

    this.http.post('https://edubridge-backend-prueba-v2.onrender.com/api/tutoring/request', this.nuevaTutoria)
      .subscribe({
        next: () => {
          this.showModal = false;
          this.fetchTutorias();
          this.notificationService.showSuccess("Tu solicitud de tutoría ha sido enviada exitosamente.");
          
          this.nuevaTutoria = { courseName: '', teacherName: '', topic: '', startTime: '', type: 'INDIVIDUAL' };
        },
        error: (err) => {
          console.error(err);
          this.notificationService.showError('Hubo un problema al procesar tu solicitud de tutoría.');
        }
      });
  }

  
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