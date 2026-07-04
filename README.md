<table>
<tr>
<td style="vertical-align: top; width: 100px; padding-right: 15px; border: none;">
<img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ45DITH77up1n8tb7Bx2n7TO8tBq4I65ZIuw&s" align="left" alt="UPC Logo">
</td>
<td style="vertical-align: top; border: none;">
<h1>Universidad Peruana de Ciencias Aplicadas</h1>
<h2>1ACC0236 – Ingeniería de Software</h2>
<p><strong>Sección:</strong> 3244</p>
<p><strong>Profesor:</strong> Peter Jonathan Montalvo Garcia</p>
</td>
</tr>
</table>

## Integrantes

| Código | Apellidos, nombres |
| :--- | :--- |
| U20231C416 | Mendoza Quispe, Carlos Fabian |
| U202310474 | Rojas Sanchez, Patricia Lucia del Rosario |
| U202315959 | Moncada Olivares, Elias David |
| U202317287 | Ibarra Cabrera, Camila Adriana |
| U202320608 | Toledo Mamani, Wilber Franz |

**Startup:** EduBridge  
**Facultad de Ingeniería – 2026-I**

---

## 1. Introducción
**EduBridge** es una startup del sector **EdTech** que desarrolla un ecosistema digital integrado para transformar la gestión educativa. El núcleo del proyecto es una plataforma web y móvil diseñada para centralizar el seguimiento académico, la tutoría personalizada y la gestión docente en una infraestructura basada en la nube.

La propuesta nace para resolver la desarticulación de datos en instituciones de educación superior, donde el rendimiento del alumno, la comunicación y los recursos suelen estar en sistemas separados. El objetivo principal es garantizar un aprendizaje equitativo mediante herramientas de monitoreo precisas y un acceso seguro de última tecnología.

---

## 2. Descripción del Contexto (5W & 2H)
* **Who (¿Quiénes?):** Estudiantes universitarios con necesidades de seguimiento académico y docentes que gestionan múltiples cursos.
* **What (¿Qué?):** Falta de visibilidad clara del rendimiento académico y carencia de herramientas integradas para tutoría.
* **Where (¿Dónde?):** Instituciones de educación superior con plataformas digitales no integradas.
* **When (¿Cuándo?):** Durante todo el ciclo académico, con énfasis en periodos de riesgo de deserción estudiantil.
* **Why (¿Por qué?):** Ausencia de analítica predictiva y sobrecarga administrativa en el profesorado.
* **How (¿Cómo?):** Mediante una plataforma que centraliza información, incorpora analítica y herramientas de intervención directa.
* **How Much (¿Cuánto?):** Buscando reducir la deserción en un 15% y optimizar los reportes docentes en un 25%.

---

## 3. Objetivos del Proyecto
* **Objetivo General:** Implementar una plataforma integral que mejore la retención estudiantil mediante la intervención temprana basada en datos.
* **Objetivos Específicos:**
    * Desarrollar un sistema de alertas proactivas ante bajos rendimientos académicos.
    * Centralizar el acceso a materiales de aprendizaje y registros de notas en una interfaz única.
    * Facilitar canales de comunicación directa entre docentes, alumnos y administradores.
    * Integrar esquemas de seguridad avanzada de múltiples factores (2FA) para proteger la integridad de los datos académicos.

---

## 4. Arquitectura y Tecnologías del Software

EduBridge cuenta con una arquitectura dividida en tres capas: un cliente móvil/web híbrido, una API Gateway de backend en la nube y una base de datos relacional serverless.

### 4.1. Frontend (Cliente)
El frontend está desarrollado bajo el framework **Angular** con soporte multiplataforma nativo para web y aplicaciones móviles híbridas.

* **Framework Principal:** Angular 21 (TypeScript) en arquitectura basada en componentes independientes (`standalone`).
* **Estilos:** CSS3 nativo con componentes responsivos altamente interactivos, paletas armónicas personalizadas y micro-animaciones.
* **Soporte Mobile:** Capacitor 8 para empaquetado nativo en Android e iOS.
* **Iconografía:** Lucide Angular (`lucide-angular`).
* **Visualización de Gráficos:** Chart.js para los diagramas de rendimiento y KPIs en el dashboard.

### 4.2. Backend (Servidor)
El backend está construido con la pila corporativa de Java para APIs REST robustas y seguras.

* **Framework Principal:** Spring Boot 3 (Java).
* **Seguridad y Control de Acceso:** Spring Security con interceptación JWT (JSON Web Tokens).
* **Envío de Correos y Seguridad de Contraseñas:** Integración de la API de **Resend** para cambios de contraseñas, recuperación por código temporal y avisos del sistema.
* **Gestión de Dominio:** Namecheap para el direccionamiento y despliegue del ecosistema web.

### 4.3. Base de Datos
* **Motor:** Neon PostgreSQL (Base de datos relacional serverless).
* **Acceso a Datos:** Spring Data JPA (Hibernate) para persistencia y mapeo objeto-relacional (ORM).

---

## 5. Nueva Funcionalidad: Autenticación de Dos Factores (2FA)

Para salvaguardar la privacidad de la información, se ha implementado un sistema robusto de **Autenticación de Dos Factores (2FA)** mediante contraseñas únicas temporales basadas en tiempo (TOTP - RFC 6238).

### 5.1. Flujo de Funcionamiento
1. **Activación Independiente**: Cada usuario (Admin, Docente, Estudiante) puede ir a su respectivo perfil y activar la seguridad 2FA mediante un switch.
2. **Generación Única**: Al activarlo, el sistema genera una clave secreta Base32 aleatoria de 16 caracteres exclusiva para esa cuenta y crea un código QR para escanear en aplicaciones móviles como *Google Authenticator* o *Authy*.
3. **Validación del Servidor**: El servidor valida matemáticamente (con una ventana de tolerancia de ±30 segundos para diferencias de reloj) que el código OTP ingresado coincida con la clave secreta antes de habilitarla de manera permanente en la tabla `user_2fa_config` en Neon DB.
4. **Intercepción en Login**: Al iniciar sesión con credenciales válidas, si el usuario tiene activo 2FA, el backend detiene la emisión de la sesión (`requires2fa = true`). El frontend muestra un modal de seguridad y solicita el código dinámico de la app del teléfono. Solo al validar este código de forma correcta en el servidor se emite el token final.

---

## 6. Estructura del Proyecto Frontend

La estructura del código fuente de Angular en `src/app` está organizada de la siguiente manera:

```text
src/app/
├── core/                  # Servicios globales y lógica de negocio core
│   ├── services/
│   │   ├── auth.ts        # Sincronización del login e intercepción 2FA
│   │   ├── notification.ts# Servicio para notificaciones visuales (toast)
│   │   ├── role.ts        # Gestión y normalización de roles (admin/docente/estudiante)
│   │   └── totp.ts        # Utilidades de generación/verificación 2FA local
│   └── guards/            # Protectores de rutas por token y rol
├── features/              # Componentes de las vistas principales de usuario
│   ├── admin/             # Módulo del Administrador (gestión de cuentas, cursos e integraciones)
│   ├── auth/              # Formularios de Login, Recuperación y Registro
│   ├── dashboard/         # Dashboard del Estudiante (rendimiento, asistencia y alertas)
│   ├── gestion-docente/   # Módulo del Docente (subida de notas, participaciones y asistencia)
│   └── student-profile/   # Perfil del Estudiante (datos personales e historial académico)
├── shared/                # Componentes comunes e independientes
│   └── components/
│       ├── sidebar/       # Barra lateral de navegación adaptativa
│       └── notification-bell/# Campana de alertas en tiempo real
```

---

## 7. Instrucciones para Ejecución Local

### Prerrequisitos
* Node.js (v18+)
* Java JDK (v17+) y Maven
* Base de datos PostgreSQL activa (o cadena de conexión de Neon DB)

### Paso 1: Configurar y Correr el Backend
1. Navega a la carpeta del backend `edubridge-backend`.
2. Crea un archivo de propiedades o configura las variables de entorno para la base de datos y llaves de cifrado en tu entorno de desarrollo.
3. Ejecuta el servidor usando el Maven wrapper:
   ```bash
   ./mvnw spring-boot:run
   ```
4. El servidor se levantará en `http://localhost:8081`.

### Paso 2: Configurar y Correr el Frontend
1. Navega a la carpeta del frontend `edubridge-frontend`.
2. Instala las dependencias del proyecto:
   ```bash
   npm install
   ```
3. Ejecuta el servidor de desarrollo de Angular:
   ```bash
   npm run start
   ```
4. Abre tu navegador en `http://localhost:4200` para interactuar con la aplicación.
