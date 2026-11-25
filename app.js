/**
 * Diario de Estudio — Lógica de la aplicación
 * 
 * Gestiona el registro de sesiones de estudio, el cálculo de la racha de días
 * consecutivos, las estadísticas y contadores acumulados, el cronómetro de sesión
 * y la persistencia en localStorage sin dependencias externas.
 */

// Clave utilizada para almacenar las sesiones en el navegador
const STORAGE_KEY = 'diario_estudio_sesiones';

// Referencias a los elementos del DOM principales
const sessionForm = document.getElementById('sessionForm');
const fechaInput = document.getElementById('fecha');
const temaInput = document.getElementById('tema');
const minutosInput = document.getElementById('minutos');
const streakCard = document.getElementById('streakCard');
const streakCount = document.getElementById('streakCount');
const streakMessage = document.getElementById('streakMessage');
const sessionsContainer = document.getElementById('sessionsContainer');
const sessionCounter = document.getElementById('sessionCounter');

// Referencias a los contadores de estadísticas
const totalTimeCount = document.getElementById('totalTimeCount');
const todayTimeCount = document.getElementById('todayTimeCount');
const totalSessionsCount = document.getElementById('totalSessionsCount');

// Referencias al cronómetro de sesión
const toggleTimerBtn = document.getElementById('toggleTimerBtn');
const timerWidget = document.getElementById('timerWidget');
const timerDigits = document.getElementById('timerDigits');
const timerStatus = document.getElementById('timerStatus');
const timerStartBtn = document.getElementById('timerStartBtn');
const timerResetBtn = document.getElementById('timerResetBtn');
const timerApplyBtn = document.getElementById('timerApplyBtn');

// Referencias al compañero Yuji Itadori (Chatbot)
const yujiAvatarBtn = document.getElementById('yujiAvatarBtn');
const yujiImg = document.getElementById('yujiImg');
const yujiBubble = document.getElementById('yujiBubble');
const yujiSpeech = document.getElementById('yujiSpeech');
const yujiChatForm = document.getElementById('yujiChatForm');
const yujiChatInput = document.getElementById('yujiChatInput');
const yujiSendBtn = document.getElementById('yujiSendBtn');
const yujiTypingIndicator = document.getElementById('yujiTypingIndicator');

// Configuración de la API de Google Gemini
const GEMINI_API_KEY = 'TU_API_KEY_AQUI';
const GEMINI_MODEL = 'gemini-3.5-flash-lite';
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Poses auténticas del personaje (estilo sticker original)
const YUJI_POSES = {
  peace: 'yuji_peace.png',
  cheer: 'yuji.png'
};

let poseActual = 'peace';
let estaConsultandoGemini = false;

// Frases de respaldo en castellano con la voz del doblaje de Yuji Itadori
const FRASES_YUJI = [
  "¡Osu! ¡Nada puede detenernos, venga, a por todas! ✌️🔥",
  "¡Un auténtico hechicero no se rinde! ¡Tú puedes con esto, estoy seguro!",
  "¡Cada minuto que estudias te hace más fuerte! ¡No pares ahora!",
  "El sensei Gojo dice que los descansos son parte del plan... ¡pero ahora toca concentrarse! 💪",
  "¡Tu cerebro está acumulando una cantidad brutal de energía maldita positiva!",
  "¡No te agobies con lo que falta! Céntrate solo en la página que tienes delante. ¡Un paso a la vez!",
  "💡 Consejo de Yuji: Estudia 25 minutos y descansa 5. ¡A mí me funciona de maravilla para mantener el foco!",
  "💡 ¡Explica en voz alta lo que has aprendido! Si puedes enseñarlo, es que lo has pillado de verdad.",
  "¿Cansado? ¡Respira hondo! ¡Juntos somos un equipo imparable! ✌️",
  "¡Ni una maldición de grado especial puede romper nuestra racha de estudio!",
  "¡Siete veces caído, ocho veces de pie! ¡Dalo todo sin reservas!"
];

let indiceUltimaFrase = -1;

/* ==========================================================================
   UTILIDADES DE FECHAS (Hora Local Siempre)
   ========================================================================== */

/**
 * Devuelve una fecha en formato YYYY-MM-DD usando exclusivamente la zona horaria local.
 * Se evita el uso de toISOString() ya que este convierte a UTC y causaría desfasajes de día.
 */
function obtenerFechaLocalISO(fecha = new Date()) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Desplaza una fecha en N días en hora local de forma segura ante cambios de horario (DST).
 * Usamos las 12:00:00 (mediodía) para evitar transiciones de medianoche.
 */
function desplazarDias(fechaISO, cantidadDias) {
  const [anio, mes, dia] = fechaISO.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia, 12, 0, 0);
  fecha.setDate(fecha.getDate() + cantidadDias);
  return obtenerFechaLocalISO(fecha);
}

/**
 * Formatea una fecha ISO (YYYY-MM-DD) para mostrarla de forma amigable al usuario.
 */
function formatearFechaLegible(fechaISO) {
  const hoyISO = obtenerFechaLocalISO(new Date());
  const ayerISO = desplazarDias(hoyISO, -1);

  if (fechaISO === hoyISO) {
    return 'Hoy';
  }
  if (fechaISO === ayerISO) {
    return 'Ayer';
  }

  const [anio, mes, dia] = fechaISO.split('-').map(Number);
  const fecha = new Date(anio, mes - 1, dia, 12, 0, 0);

  return fecha.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formatea minutos a un formato claro de horas y minutos (ej. 2h 15m)
 */
function formatearTiempoAcumulado(minutosTotales) {
  if (!minutosTotales || minutosTotales <= 0) {
    return '0h 00m';
  }
  const horas = Math.floor(minutosTotales / 60);
  const mins = minutosTotales % 60;
  return `${horas}h ${String(mins).padStart(2, '0')}m`;
}

/* ==========================================================================
   PERSISTENCIA (localStorage)
   ========================================================================== */

function cargarSesiones() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Error al leer de localStorage:', error);
    return [];
  }
}

function guardarSesiones(sesiones) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sesiones));
  } catch (error) {
    console.error('Error al guardar en localStorage:', error);
  }
}

/* ==========================================================================
   LÓGICA DE NEGOCIO: CÁLCULO DE RACHA
   ========================================================================== */

function calcularRacha(sesiones) {
  if (!sesiones || sesiones.length === 0) {
    return { racha: 0, estado: 'vacia' };
  }

  const diasConSesion = new Set(sesiones.map(s => s.fecha));
  const hoyISO = obtenerFechaLocalISO(new Date());
  const ayerISO = desplazarDias(hoyISO, -1);

  let fechaCursor = null;
  let estado = 'inactiva';

  if (diasConSesion.has(hoyISO)) {
    fechaCursor = hoyISO;
    estado = 'completada_hoy';
  } else if (diasConSesion.has(ayerISO)) {
    fechaCursor = ayerISO;
    estado = 'pendiente_hoy';
  } else {
    return { racha: 0, estado: 'rota' };
  }

  let racha = 0;
  while (diasConSesion.has(fechaCursor)) {
    racha++;
    fechaCursor = desplazarDias(fechaCursor, -1);
  }

  return { racha, estado };
}

/* ==========================================================================
   RENDERIZADO DE LA INTERFAZ
   ========================================================================== */

/**
 * Actualiza el indicador visual de la racha y su mensaje motivador.
 */
function actualizarVistaRacha(sesiones, animar = false) {
  const { racha, estado } = calcularRacha(sesiones);

  streakCount.textContent = racha;

  if (racha > 0) {
    streakCard?.classList.add('has-streak');
  } else {
    streakCard?.classList.remove('has-streak');
  }

  if (animar) {
    streakCount.classList.remove('bump-animation');
    void streakCount.offsetWidth;
    streakCount.classList.add('bump-animation');
  }

  if (racha === 0) {
    streakMessage.textContent = 'Registra una sesión hoy para empezar tu racha.';
    return;
  }

  if (estado === 'completada_hoy') {
    if (racha === 1) {
      streakMessage.textContent = '¡Racha iniciada hoy! Vuelve mañana para continuar.';
    } else {
      streakMessage.textContent = '¡Excelente trabajo! Has sumado el día de hoy a tu racha.';
    }
  } else if (estado === 'pendiente_hoy') {
    if (racha === 1) {
      streakMessage.textContent = 'Estudiaste ayer. ¡Registra una sesión hoy para no perder la racha!';
    } else {
      streakMessage.textContent = `Llevas ${racha} días seguidos. ¡Estudia hoy para mantener la racha viva!`;
    }
  }
}

/**
 * Actualiza los contadores estadísticos de la barra superior:
 * - Tiempo total acumulado
 * - Minutos estudiados hoy
 * - Total de sesiones registradas
 */
function actualizarContadoresEstadisticas(sesiones) {
  const hoyISO = obtenerFechaLocalISO(new Date());

  const minutosTotales = sesiones.reduce((acum, s) => acum + (Number(s.minutos) || 0), 0);
  const minutosHoy = sesiones
    .filter(s => s.fecha === hoyISO)
    .reduce((acum, s) => acum + (Number(s.minutos) || 0), 0);

  if (totalTimeCount) {
    totalTimeCount.textContent = formatearTiempoAcumulado(minutosTotales);
  }

  if (todayTimeCount) {
    if (minutosHoy >= 60) {
      const h = Math.floor(minutosHoy / 60);
      const m = minutosHoy % 60;
      todayTimeCount.textContent = `${h}h ${m}m`;
    } else {
      todayTimeCount.textContent = `${minutosHoy}m`;
    }
  }

  if (totalSessionsCount) {
    totalSessionsCount.textContent = sesiones.length;
  }
}

/**
 * Actualiza la lista de sesiones ordenadas de más reciente a más antigua.
 */
function actualizarVistaSesiones(sesiones, idNuevaSesion = null) {
  const total = sesiones.length;
  sessionCounter.textContent = `${total} ${total === 1 ? 'sesión' : 'sesiones'}`;

  if (total === 0) {
    sessionsContainer.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon" aria-hidden="true">📖</span>
        <p class="empty-state-text">No hay sesiones registradas todavía.</p>
        <p class="empty-state-subtext">Usa el formulario superior para apuntar tu primer estudio.</p>
      </div>
    `;
    return;
  }

  const sesionesOrdenadas = [...sesiones].sort((a, b) => {
    if (b.fecha !== a.fecha) {
      return b.fecha.localeCompare(a.fecha);
    }
    return (b.creadoEn || 0) - (a.creadoEn || 0);
  });

  sessionsContainer.innerHTML = sesionesOrdenadas.map(sesion => {
    const esNueva = sesion.id === idNuevaSesion;
    const claseNueva = esNueva ? ' session-item-new' : '';

    return `
      <article class="session-item${claseNueva}">
        <div class="session-main">
          <span class="session-topic">${escaparHTML(sesion.tema)}</span>
          <time class="session-date" datetime="${sesion.fecha}">
            ${formatearFechaLegible(sesion.fecha)}
          </time>
        </div>
        <span class="session-minutes">
          ${sesion.minutos} min
        </span>
      </article>
    `;
  }).join('');
}

function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto;
  return div.innerHTML;
}

function renderizarApp(idNuevaSesion = null) {
  const sesiones = cargarSesiones();
  actualizarVistaRacha(sesiones, Boolean(idNuevaSesion));
  actualizarContadoresEstadisticas(sesiones);
  actualizarVistaSesiones(sesiones, idNuevaSesion);
}

/* ==========================================================================
   LÓGICA DEL CRONÓMETRO DE ESTUDIO (Contador en directo)
   ========================================================================== */

function formatearTiempoCronometro(totalSegundos) {
  const mins = Math.floor(totalSegundos / 60);
  const segs = totalSegundos % 60;
  return `${String(mins).padStart(2, '0')}:${String(segs).padStart(2, '0')}`;
}

function iniciarCronometro() {
  cronometroEnMarcha = true;
  timerStartBtn.textContent = '⏸ Pausar';
  timerStatus.textContent = 'Cronometrando estudio...';
  timerResetBtn.disabled = false;
  timerApplyBtn.disabled = false;

  // Yuji genera respuesta en directo con Gemini (en español)
  consultarGemini(
    "¡Acabo de empezar mi sesión de estudio ahora mismo!",
    "El usuario acaba de iniciar el cronómetro de estudio en vivo. ¡Suelta un grito de batalla enérgico y lleno de energía para animarle!"
  );

  cronometroIntervalo = setInterval(() => {
    cronometroSegundos++;
    timerDigits.textContent = formatearTiempoCronometro(cronometroSegundos);
  }, 1000);
}

function pausarCronometro() {
  cronometroEnMarcha = false;
  clearInterval(cronometroIntervalo);
  cronometroIntervalo = null;
  timerStartBtn.textContent = '▶ Reanudar';
  timerStatus.textContent = 'Contador en pausa';
}

function reiniciarCronometro() {
  pausarCronometro();
  cronometroSegundos = 0;
  timerDigits.textContent = '00:00';
  timerStartBtn.textContent = '▶ Iniciar';
  timerStatus.textContent = 'Detenido';
  timerResetBtn.disabled = true;
  timerApplyBtn.disabled = true;
}

function aplicarMinutosCronometro() {
  // Convertir segundos a minutos (mínimo 1 minuto si ha corrido algo)
  const minutosCalculados = Math.max(1, Math.round(cronometroSegundos / 60));
  minutosInput.value = minutosCalculados;
  pausarCronometro();
  minutosInput.focus();

  // Yuji reacciona con Gemini (en español)
  consultarGemini(
    "¡Acabo de terminar de cronometrar mi sesión de estudio!",
    `El usuario ha cronometrado ${minutosCalculados} minutos de estudio. ¡Recuérdale con entusiasmo que guarde la sesión!`
  );
}

function toggleWidgetCronometro() {
  const estaOculto = timerWidget.hasAttribute('hidden');
  if (estaOculto) {
    timerWidget.removeAttribute('hidden');
    toggleTimerBtn.setAttribute('aria-expanded', 'true');
    toggleTimerBtn.textContent = '✕ Ocultar cronómetro';
  } else {
    timerWidget.setAttribute('hidden', '');
    toggleTimerBtn.setAttribute('aria-expanded', 'false');
    toggleTimerBtn.textContent = '⏱️ Usar cronómetro';
  }
}

/* ==========================================================================
   LÓGICA DEL CHATBOT DE YUJI ITADORI CON GEMINI AI Y VOZ (Fish Audio)
   ========================================================================== */

function animarYuji(alternarPose = false) {
  if (!yujiImg) return;
  yujiImg.classList.remove('jumping');
  void yujiImg.offsetWidth;
  yujiImg.classList.add('jumping');

  if (alternarPose) {
    poseActual = (poseActual === 'peace') ? 'cheer' : 'peace';
    yujiImg.src = YUJI_POSES[poseActual];
  }
}

/**
 * Consulta a la API de Gemini personificando a Yuji Itadori en español
 */
async function consultarGemini(mensajeUsuario, contextoExtra = '') {
  if (estaConsultandoGemini) return;
  estaConsultandoGemini = true;

  if (yujiTypingIndicator) yujiTypingIndicator.hidden = false;
  if (yujiSendBtn) yujiSendBtn.disabled = true;
  animarYuji(true);

  const promptSistema = `Eres Yuji Itadori de Jujutsu Kaisen. Eres el compañero de estudio del usuario en la app "Diario de Estudio".
Habla EXACTAMENTE como Yuji en el doblaje al español: enérgico, optimista, leal, juvenil y sin filtros. Usa expresiones propias del doblaje como "¡Osu!", "¡A por todas!", "¡Dalo todo!", "¡Sin reservas!", "energía maldita", "hechicero", "maldición" cuando encajen de forma natural.
Nunca hables en inglés. Responde SIEMPRE en español castellano con el tono y la personalidad del doblaje original del anime.
IMPORTANTE: Respuesta MUY CORTA (1 o 2 frases máximo), pensada para un bocadillo de chat.`;

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `${promptSistema}\n${contextoExtra ? `[Situation: ${contextoExtra}]\n` : ''}User message: "${mensajeUsuario}"`
          }
        ]
      }
    ],
    generationConfig: {
      maxOutputTokens: 120,
      temperature: 0.75
    }
  };

  try {
    const res = await fetch(GEMINI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      throw new Error(`Error en API Gemini (${res.status})`);
    }

    const data = await res.json();
    const respuestaTexto = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (respuestaTexto && yujiSpeech) {
      const textoFinal = respuestaTexto.trim();
      yujiSpeech.textContent = textoFinal;
      animarYuji(false);
    } else {
      usarFraseLocalFallback();
    }
  } catch (error) {
    console.warn('No se pudo contactar con Gemini, usando respuesta local:', error);
    usarFraseLocalFallback();
  } finally {
    estaConsultandoGemini = false;
    if (yujiTypingIndicator) yujiTypingIndicator.hidden = true;
    if (yujiSendBtn) yujiSendBtn.disabled = false;
  }
}

function usarFraseLocalFallback(mensajeFijo = null) {
  if (!yujiSpeech) return;
  if (mensajeFijo) {
    yujiSpeech.textContent = mensajeFijo;
    return;
  }
  let nuevoIndice;
  do {
    nuevoIndice = Math.floor(Math.random() * FRASES_YUJI.length);
  } while (nuevoIndice === indiceUltimaFrase && FRASES_YUJI.length > 1);
  indiceUltimaFrase = nuevoIndice;
  const frase = FRASES_YUJI[nuevoIndice];
  yujiSpeech.textContent = frase;
}

function hacerHablarYuji(mensajePersonalizado = null) {
  animarYuji(true);
  if (mensajePersonalizado) {
    if (yujiSpeech) yujiSpeech.textContent = mensajePersonalizado;
    return;
  }
  consultarGemini("¡Dame un empujón motivacional espontáneo o un consejo de estudio para hoy!");
}

/* ==========================================================================
   MANEJADORES DE EVENTOS
   ========================================================================== */

function inicializar() {
  fechaInput.value = obtenerFechaLocalISO(new Date());

  renderizarApp();

  sessionForm.addEventListener('submit', manejarEnvioFormulario);

  // Eventos del cronómetro
  toggleTimerBtn?.addEventListener('click', toggleWidgetCronometro);
  
  timerStartBtn?.addEventListener('click', () => {
    if (cronometroEnMarcha) {
      pausarCronometro();
    } else {
      iniciarCronometro();
    }
  });

  timerResetBtn?.addEventListener('click', reiniciarCronometro);
  timerApplyBtn?.addEventListener('click', aplicarMinutosCronometro);

  // Enviar mensaje en el chat de Yuji
  yujiChatForm?.addEventListener('submit', (evento) => {
    evento.preventDefault();
    const texto = yujiChatInput.value.trim();
    if (!texto) return;
    yujiChatInput.value = '';
    consultarGemini(texto);
  });

  // Clic en Yuji para interactuar espontáneamente
  yujiAvatarBtn?.addEventListener('click', () => hacerHablarYuji());

  // Accesibilidad por teclado (Enter o Espacio sobre Yuji)
  yujiAvatarBtn?.addEventListener('keydown', (evento) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      hacerHablarYuji();
    }
  });
}

function manejarEnvioFormulario(evento) {
  evento.preventDefault();

  const fechaValor = fechaInput.value.trim();
  const temaValor = temaInput.value.trim();
  const minutosValor = parseInt(minutosInput.value, 10);

  if (!fechaValor) {
    fechaInput.focus();
    return;
  }

  if (!temaValor) {
    temaInput.focus();
    return;
  }

  if (isNaN(minutosValor) || minutosValor <= 0) {
    minutosInput.focus();
    return;
  }

  const nuevaSesion = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fecha: fechaValor,
    tema: temaValor,
    minutos: minutosValor,
    creadoEn: Date.now()
  };

  const sesiones = cargarSesiones();
  sesiones.push(nuevaSesion);
  guardarSesiones(sesiones);

  // Actualizar la interfaz
  renderizarApp(nuevaSesion.id);

  // Yuji celebra la nueva sesión registrada mediante Gemini en español
  consultarGemini(
    '¡Acabo de registrar una sesión de estudio!',
    `El usuario acaba de guardar una sesión de ${minutosValor} minutos sobre "${temaValor}". ¡Celebra con entusiasmo su progreso y su racha de estudio!`
  );

  // Limpiar campos y restablecer cronómetro si estaba en marcha
  temaInput.value = '';
  minutosInput.value = '';
  fechaInput.value = obtenerFechaLocalISO(new Date());

  if (cronometroSegundos > 0) {
    reiniciarCronometro();
  }

  temaInput.focus();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}
