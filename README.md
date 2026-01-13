# HabiTracker

🎯 Aplicación personal para rastrear visualmente tu progreso en dieta y ejercicio mediante un calendario interactivo con código de colores.

![HabiTracker](https://qzbmdqnwgoihzjxanpbq.supabase.co/storage/v1/object/public/ImagenesApp/NatviaSlim%20(1).png)

## 🚀 Demo en Vivo

Abre la aplicación localmente con:

```bash
npx -y serve -l 8080
```

Luego visita: **http://localhost:8080**

## ✨ Características

- 📅 **Calendario Visual**: Vista mensual interactiva con código de colores
- 🎨 **Diseño Moderno**: Tema oscuro premium con efectos glassmorphism
- 💾 **Guardado Automático**: Sincronización instantánea con Supabase
- 📱 **Responsive**: Funciona perfectamente en móvil, tablet y desktop
- 🔐 **Sin Autenticación**: Uso personal simplificado

## 🎨 Código de Colores

| Color | Estado | Descripción |
|-------|--------|-------------|
| 🟢 Verde | Éxito Total | Cumpliste ambos objetivos (dieta + ejercicio) |
| 🟡 Amarillo | Parcial | Solo cumpliste ejercicio |
| 🔴 Rojo | Incompleto | No cumpliste objetivos |
| ⚪ Gris | Sin Datos | Día sin registrar |

## 🛠️ Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Supabase (PostgreSQL)
- **Estilos**: CSS Variables, Flexbox, Grid
- **Fuentes**: Google Fonts (Poppins)

## 📦 Instalación

1. **Clona el repositorio**:
```bash
git clone https://github.com/natviadigital/HabiTracker.git
cd HabiTracker
```

2. **Configura Supabase**:
   - Crea un proyecto en [Supabase](https://supabase.com)
   - Ejecuta el script `supabase-setup.sql` en el SQL Editor
   - Actualiza las credenciales en `app.js`

3. **Ejecuta la aplicación**:
```bash
npx -y serve -l 8080
```

4. Abre tu navegador en `http://localhost:8080`

## 📖 Uso

1. **Registra tu Progreso**: Marca las casillas según tus logros del día
2. **Observa el Calendario**: Los colores se actualizan automáticamente
3. **Navega Meses**: Usa las flechas ← → para ver tu historial
4. **¡Celebra tu Progreso!**: Busca patrones y rachas en tu calendario

## 📁 Estructura del Proyecto

```
HabiTracker/
├── index.html          # Página principal
├── styles.css          # Estilos y diseño
├── app.js              # Lógica de la aplicación
├── supabase-setup.sql  # Configuración de base de datos
└── README.md           # Documentación
```

## 🔧 Configuración

### Variables en `app.js`

```javascript
const SUPABASE_URL = 'TU_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';
```

### Base de Datos

La tabla `habit_logs` contiene:
- `date` (DATE): Fecha del registro
- `diet_completed` (BOOLEAN): Objetivo de dieta
- `exercise_completed` (BOOLEAN): Objetivo de ejercicio

## 🤝 Contribuir

Este es un proyecto personal, pero si tienes sugerencias:

1. Haz fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto es de uso personal. Siéntete libre de usarlo como base para tus propios proyectos.

## 👨‍💻 Autor

**Natvia Digital**

---

⭐ Si este proyecto te ayudó, considera darle una estrella en GitHub!
