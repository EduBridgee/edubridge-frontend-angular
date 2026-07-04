import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RoleService, UserRole } from '../../../core/services/role';
import { LucideAngularModule, Bot, X, Send, Rocket } from 'lucide-angular';
import { API_BASE_URL } from '../../../core/config/api.config';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';


@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class ChatbotComponent implements OnInit {
  readonly Bot = Bot;
  readonly X = X;
  readonly Send = Send;
  readonly Rocket = Rocket;

  @Input() misCursos: any[] = [];

  @Output() tutoriaCreada = new EventEmitter<void>();

  isOpen = false;
  loading = false;
  mensajeUser = '';
  user: any = null;
  chatMessages: any[] = [];

  currentTab = 'chat';
  userRiskLevel = 'Estable';
  derivacionMotivo = 'Rendimiento Académico';
  derivacionDetalle = '';
  derivacionEnviada = false;
  derivacionCargando = false;
  coursesInRisk: any[] = [];
  derivacionCurso: any = 'general';
  activeTicket: any = null;
  mensajeRespuesta = '';
  enviandoRespuesta = false;
  esEstudiante = false;
  teacherTickets: any[] = [];
  selectedTicketTeacher: any = null;
  respuestaDocenteTexto = '';
  enviandoRespuestaDocente = false;

  constructor(
    private http: HttpClient, 
    private roleService: RoleService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    this.esEstudiante = !this.roleService.isDocente(this.user.role);
    const nombre = this.user.name || 'Estudiante';

    const bienvenida = this.roleService.isDocente(this.user.role)
      ? '¡Hola, colega! Soy el asistente IA de EduBridge. ¿Te ayudo con la redacción de avisos?'
      : `¡Hola ${nombre}! Soy tu tutor IA. ¿Tienes dudas con tus cursos o quieres agendar una tutoría?`;

    this.chatMessages.push({ role: 'assistant', content: bienvenida });

    const role = this.user.role ? this.user.role.toLowerCase() : '';
    if (role === 'estudiante' || role === 'student') {
      this.loadStudentRiskAndCourses();
      this.loadStudentTickets();
    } else if (role === 'docente' || role === 'teacher') {
      this.loadTeacherTickets();
    }
  }

  loadStudentRiskAndCourses() {
    const studentId = Number(this.user.id);
    
    this.http.get<any[]>(`${API_BASE_URL}/enrollments/student/${studentId}`).subscribe({
      next: (enrollments) => {
        this.http.get<any[]>(`${API_BASE_URL}/grades/student/${studentId}`).subscribe({
          next: (grades) => {
            const riskCourses: any[] = [];
            
            enrollments.forEach(enrollment => {
              const course = enrollment.course;
              if (!course) return;
              
              const courseGrades = grades.filter(g => g.course && g.course.id === course.id);
              if (courseGrades.length > 0) {
                const sum = courseGrades.reduce((acc, curr) => acc + curr.value, 0);
                const avg = sum / courseGrades.length;
                
                if (avg < 13.0) {
                  riskCourses.push({
                    courseId: course.id,
                    courseName: course.name,
                    teacherId: course.teacher ? course.teacher.id : null,
                    teacherName: course.teacher ? course.teacher.name : 'Docente Asignado',
                    average: avg
                  });
                }
              }
            });
            
            this.coursesInRisk = riskCourses;
            if (riskCourses.length > 0) {
              this.userRiskLevel = 'Alto Riesgo';
              this.derivacionCurso = riskCourses[0];
            } else {
              this.userRiskLevel = 'Estable';
              this.derivacionCurso = 'general';
            }
            this.cdr.detectChanges();
          },
          error: (err) => console.error("Error al obtener notas para chatbot:", err)
        });
      },
      error: (err) => console.error("Error al obtener matrículas para chatbot:", err)
    });
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  enviarMensaje() {
    if (!this.mensajeUser.trim() || this.loading) return;

    const texto = this.mensajeUser;
    this.chatMessages.push({ role: 'user', content: texto });
    this.mensajeUser = '';
    this.loading = true;
    this.cdr.detectChanges();

    const cursosStr = this.misCursos && this.misCursos.length > 0
      ? this.misCursos.map(c => c.name).join(", ")
      : "Ecuaciones Diferenciales, Architecture of Computadoras, Física II";

    const payload = {
      message: texto,
      role: this.user.role || 'ESTUDIANTE',
      userName: this.user.name || 'Estudiante',
      userId: this.user.id ? this.user.id.toString() : null, 
      cursos: cursosStr
    };

    this.http.post(`${API_BASE_URL}/chat/ask`, payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.cdr.detectChanges();
        this.typeWriterEffect(res.answer);

        if (res.answer.includes('registrado') || res.answer.includes('agendado') || res.answer.includes('sincronizada')) {
          this.tutoriaCreada.emit();
        }
      },
      error: (err) => {
        this.loading = false;
        this.chatMessages.push({
          role: 'assistant',
          content: 'Error de conexión. ¿Está el backend encendido, Estudiante/a?'
        });
        this.cdr.detectChanges();
      }
    });
  }

  typeWriterEffect(fullText: string) {
    let index = 0;
    const assistantMessage = { role: 'assistant', content: '' };
    this.chatMessages.push(assistantMessage);
    this.cdr.detectChanges();

    const formattedText = fullText
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      .replace(/\n/g, '<br>');

    const interval = setInterval(() => {
      if (index < formattedText.length) {
        if (formattedText.charAt(index) === '<') {
          const tagEnd = formattedText.indexOf('>', index);
          assistantMessage.content += formattedText.substring(index, tagEnd + 1);
          index = tagEnd + 1;
        } else {
          assistantMessage.content += formattedText.charAt(index);
          index++;
        }
        this.cdr.detectChanges();
        this.scrollToBottom();
      } else {
        clearInterval(interval);
      }
    }, 12);
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-box');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  loadStudentTickets() {
    const studentId = Number(this.user.id);
    this.http.get<any[]>(`${API_BASE_URL}/support/tickets/student/${studentId}`).subscribe({
      next: (tickets) => {
        if (tickets && tickets.length > 0) {
          const active = tickets.find(t => t.status !== 'CERRADO') || tickets[0];
          this.activeTicket = active;
        } else {
          this.activeTicket = null;
        }
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar tickets de soporte:", err)
    });
  }

  enviarDerivacion() {
    if (!this.derivacionDetalle.trim() || this.derivacionCargando) return;

    this.derivacionCargando = true;
    this.cdr.detectChanges();

    let targetTeacherId = null;
    let targetTeacherName = 'Soporte General';
    let targetCourseName = 'General';

    if (this.derivacionCurso && this.derivacionCurso !== 'general') {
      targetTeacherId = this.derivacionCurso.teacherId;
      targetTeacherName = this.derivacionCurso.teacherName;
      targetCourseName = this.derivacionCurso.courseName;
    }

    const ticketPayload = {
      studentId: Number(this.user.id),
      studentName: this.user.name,
      teacherId: targetTeacherId,
      teacherName: targetTeacherName,
      courseName: targetCourseName,
      motivo: this.derivacionMotivo,
      description: this.derivacionDetalle
    };

    this.http.post(`${API_BASE_URL}/support/tickets`, ticketPayload).subscribe({
      next: (savedTicket: any) => {
        const studentNotificationPayload = {
          studentId: Number(this.user.id),
          type: 'SOPORTE',
          message: `Tu solicitud de derivación a soporte por "${this.derivacionMotivo}" ha sido registrada.`
        };

        this.http.post(`${API_BASE_URL}/notifications`, studentNotificationPayload).subscribe({
          next: () => {
            if (targetTeacherId) {
              const teacherNotificationPayload = {
                studentId: Number(targetTeacherId),
                type: 'SOPORTE',
                message: `ALERTA DE SOPORTE: El alumno ${this.user.name} solicita apoyo en tu curso "${targetCourseName}". Promedio: ${this.derivacionCurso.average ? this.derivacionCurso.average.toFixed(1) : ''}.\nComentario: ${this.derivacionDetalle}`
              };

              this.http.post(`${API_BASE_URL}/notifications`, teacherNotificationPayload).subscribe({
                next: () => {
                  this.finalizeTicketSubmission(savedTicket);
                },
                error: (err) => {
                  console.error("Error al notificar al profesor:", err);
                  this.finalizeTicketSubmission(savedTicket);
                }
              });
            } else {
              this.finalizeTicketSubmission(savedTicket);
            }
          },
          error: (err) => {
            console.error("Error al guardar notificacion del alumno:", err);
            this.finalizeTicketSubmission(savedTicket);
          }
        });
      },
      error: (err) => {
        console.error("Error al crear ticket de soporte:", err);
        this.derivacionCargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  finalizeTicketSubmission(savedTicket: any) {
    this.derivacionCargando = false;
    this.derivacionEnviada = true;
    this.derivacionDetalle = '';
    this.activeTicket = savedTicket;
    this.cdr.detectChanges();
    this.scrollSupportChatToBottom();
  }

  enviarMensajeSoporte() {
    if (!this.mensajeRespuesta.trim() || this.enviandoRespuesta || !this.activeTicket) return;

    this.enviandoRespuesta = true;
    this.cdr.detectChanges();

    const payload = {
      senderRole: 'ESTUDIANTE',
      senderName: this.user.name,
      message: this.mensajeRespuesta
    };

    this.http.post(`${API_BASE_URL}/support/tickets/${this.activeTicket.id}/messages`, payload).subscribe({
      next: (savedMessage: any) => {
        this.enviandoRespuesta = false;
        if (!this.activeTicket.messages) {
          this.activeTicket.messages = [];
        }
        this.activeTicket.messages.push(savedMessage);
        this.activeTicket.status = 'PENDIENTE';
        this.mensajeRespuesta = '';
        this.cdr.detectChanges();
        this.scrollSupportChatToBottom();
      },
      error: (err) => {
        console.error("Error al enviar mensaje de soporte:", err);
        this.enviandoRespuesta = false;
        this.cdr.detectChanges();
      }
    });
  }

  scrollSupportChatToBottom() {
    setTimeout(() => {
      const container = document.getElementById('support-chat-box');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }

  nuevaConsulta() {
    this.activeTicket = null;
    this.derivacionEnviada = false;
    this.cdr.detectChanges();
  }

  volverAlChat() {
    this.derivacionEnviada = false;
    this.currentTab = 'chat';
    this.cdr.detectChanges();
  }

  loadTeacherTickets() {
    const teacherId = Number(this.user.id);
    this.http.get<any[]>(`${API_BASE_URL}/support/tickets/teacher/${teacherId}`).subscribe({
      next: (tickets) => {
        this.teacherTickets = tickets || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error al cargar tickets de soporte para docente:", err)
    });
  }

  seleccionarTicketTeacher(ticket: any) {
    this.selectedTicketTeacher = ticket;
    this.respuestaDocenteTexto = '';
    this.cdr.detectChanges();
    this.scrollTeacherChatToBottom();
  }

  deseleccionarTicketTeacher() {
    this.selectedTicketTeacher = null;
    this.cdr.detectChanges();
  }

  enviarRespuestaDocente() {
    if (!this.respuestaDocenteTexto.trim() || this.enviandoRespuestaDocente || !this.selectedTicketTeacher) return;

    this.enviandoRespuestaDocente = true;
    this.cdr.detectChanges();

    const payload = {
      senderRole: 'DOCENTE',
      senderName: this.user.name || 'Docente',
      message: this.respuestaDocenteTexto
    };

    this.http.post<any>(`${API_BASE_URL}/support/tickets/${this.selectedTicketTeacher.id}/messages`, payload).subscribe({
      next: (savedMessage) => {
        this.enviandoRespuestaDocente = false;
        if (!this.selectedTicketTeacher.messages) {
          this.selectedTicketTeacher.messages = [];
        }
        this.selectedTicketTeacher.messages.push(savedMessage);
        this.selectedTicketTeacher.status = 'RESPONDIDO';

        const idx = this.teacherTickets.findIndex(t => t.id === this.selectedTicketTeacher.id);
        if (idx !== -1) {
          this.teacherTickets[idx].status = 'RESPONDIDO';
        }

        const studentNotificationPayload = {
          studentId: Number(this.selectedTicketTeacher.studentId),
          type: 'SOPORTE',
          message: `El profesor ${this.user.name} ha respondido a tu solicitud de soporte en "${this.selectedTicketTeacher.courseName}".`
        };

        this.http.post(`${API_BASE_URL}/notifications`, studentNotificationPayload).subscribe({
          error: (err) => console.error("Error al enviar notificacion al alumno:", err)
        });

        this.respuestaDocenteTexto = '';
        this.cdr.detectChanges();
        this.scrollTeacherChatToBottom();
      },
      error: (err) => {
        console.error("Error al guardar respuesta del docente:", err);
        this.enviandoRespuestaDocente = false;
        this.cdr.detectChanges();
      }
    });
  }

  scrollTeacherChatToBottom() {
    setTimeout(() => {
      const container = document.getElementById('teacher-chatbot-chat-box');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }
}