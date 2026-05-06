import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class ChatbotComponent implements OnInit {
  @Input() misCursos: any[] = [];
  
  @Output() tutoriaCreada = new EventEmitter<void>();

  isOpen = false;
  loading = false;
  mensajeUser = '';
  user: any = null;
  chatMessages: any[] = [];

  constructor(private http: HttpClient) { }

  ngOnInit() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
    const nombre = this.user.name || 'Estudiante';
    
    const bienvenida = this.user.role === 'DOCENTE'
      ? `¡Hola, colega! Soy el asistente IA de EduBridge. ¿Te ayudo con la redacción de avisos?`
      : `¡Hola ${nombre}! Soy tu tutor IA. ¿Tienes dudas con tus cursos o quieres agendar una tutoría?`;

    this.chatMessages.push({ role: 'assistant', content: bienvenida });
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

    const cursosStr = this.misCursos && this.misCursos.length > 0
      ? this.misCursos.map(c => c.name).join(", ")
      : "Ecuaciones Diferenciales, Arquitectura de Computadoras, Física II";

    const payload = {
      message: texto,
      role: this.user.role || 'ESTUDIANTE',
      userName: this.user.name || 'Estudiante',
      cursos: cursosStr
    };

    this.http.post('https://edubridge-backend-v2.onrender.com/api/chat/ask', payload).subscribe({
      next: (res: any) => {
        this.loading = false;
        this.typeWriterEffect(res.answer);

        if (res.answer.includes('registrado') || res.answer.includes('agendado')) {
          this.tutoriaCreada.emit();
        }
      },
      error: (err) => {
        this.loading = false;
        this.chatMessages.push({
          role: 'assistant',
          content: 'Error de conexión. ¿Está el backend encendido, Estudiante/a?'
        });
      }
    });
  }

  typeWriterEffect(fullText: string) {
    let index = 0;
    const assistantMessage = { role: 'assistant', content: '' };
    this.chatMessages.push(assistantMessage);

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
        this.scrollToBottom();
      } else {
        clearInterval(interval);
      }
    }, 12);
  }

  private scrollToBottom() {
    setTimeout(() => {
      const container = document.getElementById('chat-box-container');
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, 50);
  }
}