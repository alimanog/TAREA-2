# MEMORY.md — Diario de Estudio
Memoria del proyecto entre sesiones. Máximo ~50 líneas.

## Estado actual
- Versión 1.7 completada: `index.html`, `styles.css` y `app.js`.
- Integración de voz de Yuji Itadori con el modelo `c5d7f599272a4d7e96470a4a51ab7adb` (Fish Audio TTS) y Web Speech API en inglés.
- Mensajes y diálogo del chatbot cambiados a inglés para coincidir con el modelo fonético de voz.
- Interfaz del chatbot con controles de voz:
  - Botón 🔊 para reproducir o pausar la voz de Yuji (con animación de pulso al hablar).
  - Botón ⚙️ para configurar opcionalmente la clave de API de Fish Audio y guardarla en `localStorage`.
  - Fallback automático a síntesis de voz en inglés del navegador con tono enérgico si no se especifica clave.
- Gemini AI (`gemini-3.5-flash-lite`) respondiendo en inglés breve (1-2 frases) y hablando en directo.
- Base limpia: registro de sesiones, racha 🔥, cronómetro y persistencia local sin servidores ni compilación.

## Decisiones (y por qué)
- Mensajes de Yuji en inglés: optimiza la pronunciación y naturalidad del modelo de voz `c5d7f599272a4d7e96470a4a51ab7adb`. La app de estudio mantiene sus textos y botones en español.
- Configuración de clave de voz con `prompt()` + `localStorage`: permite uso autónomo sin servidor ni exposición de credenciales privadas.
- Fallback con Web Speech API: garantiza que el usuario siempre escuche la voz de Yuji incluso sin configurar API key externa.

## Aprendizajes y errores a evitar
- Los modelos TTS de Fish Audio requieren autenticación Bearer; prever siempre fallback a `window.speechSynthesis` para evitar fallos de reproducción.
- No guardar nunca claves ni tokens en `MEMORY.md`.
