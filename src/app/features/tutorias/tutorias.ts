import { Component, OnInit, Input, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tutorias',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tutorias.html',
  styleUrl: './tutorias.css'
})
export class TutoriasComponent implements OnInit {
  @Input() user: any = JSON.parse(localStorage.getItem('user') || '{}');

  sessions: any[] = [];
  loading: boolean = true;
  activeTab: string = 'mis-tutorias';

  private apiUrl = 'https://edubridge-backend-v2.onrender.com/api/tutoring';

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.fetchTutorias();
  }

  fetchTutorias() {
    this.loading = true;
    this.http.get<any[]>(this.apiUrl)
      .subscribe({
        next: (data) => {
          this.sessions = data.filter(s => s.status !== 'Cancelada');
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

  setActiveTab(tab: string) {
    this.activeTab = tab;
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

    const body = { newDate: fechaActual.toISOString() };

    this.http.patch(`${this.apiUrl}/${id}/reschedule`, body).subscribe({
      next: (res: any) => {
        console.log("Actualizado en DB:", res);

        this.fetchTutorias();

        const index = this.sessions.findIndex(s => s.id === id);
        if (index !== -1) {
          this.sessions[index] = res; 
        }
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
    this.nuevaTutoria.teacherName = teacher;
    this.showModal = true;
  }

  guardarTutoria() {
    this.http.post('https://edubridge-backend-v2.onrender.com/api/tutoring/request', this.nuevaTutoria) 
      .subscribe({
        next: () => {
          this.showModal = false;
          this.fetchTutorias(); 
          this.nuevaTutoria = { courseName: '', teacherName: '', topic: '', startTime: '', type: 'INDIVIDUAL' };
        },
        error: (err) => alert('Error al solicitar tutoría')
      });
  }
}