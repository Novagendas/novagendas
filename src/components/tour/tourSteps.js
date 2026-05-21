const TOUR_STEPS = [
  {
    target: 'dashboard',
    title: 'Vista General',
    description: 'Tu panel de control principal. Aquí encuentras el resumen del día: citas próximas, indicadores clave de rendimiento y la actividad reciente de tu negocio.',
    position: 'right',
  },
  {
    target: 'agenda',
    title: 'Agenda de Citas',
    description: 'El corazón de Novagendas. Crea, edita y gestiona todas las citas en vistas de día, semana o mes. Puedes arrastrar y soltar para reprogramar fácilmente.',
    position: 'right',
  },
  {
    target: 'clients',
    title: 'Pacientes',
    description: 'Gestiona el directorio completo de pacientes: información de contacto, historial clínico y abonos disponibles. Búsqueda rápida por nombre o cédula.',
    position: 'right',
  },
  {
    target: 'feriados',
    title: 'Días Bloqueados',
    description: 'Bloquea fechas específicas en el calendario: feriados, vacaciones o días sin atención. Las citas no pueden agendarse en días bloqueados.',
    position: 'right',
  },
  {
    target: 'services',
    title: 'Servicios',
    description: 'Configura el catálogo de servicios de tu negocio: nombre, duración y precio. Aparecen al crear citas y en los registros de pago.',
    position: 'right',
  },
  {
    target: 'payments',
    title: 'Registro de Pagos',
    description: 'Registra y consulta todos los pagos recibidos. Filtra por fecha, paciente o método de pago. Gestiona también abonos y saldos pendientes.',
    position: 'right',
  },
  {
    target: 'inventory',
    title: 'Inventario',
    description: 'Controla el stock de productos utilizados en los servicios. Recibe alertas de inventario bajo y registra el consumo en cada cita.',
    position: 'right',
  },
  {
    target: 'estadisticas',
    title: 'Estadísticas',
    description: 'Analiza el rendimiento de tu negocio: gráficas de citas agendadas, ingresos por período y ocupación por especialista. Decisiones basadas en datos reales.',
    position: 'right',
    adminOnly: true,
  },
  {
    target: 'users',
    title: 'Gestión de Usuarios',
    description: 'Administra el equipo: crea cuentas para especialistas y recepcionistas, asigna roles y controla permisos de acceso a cada módulo.',
    position: 'right',
    adminOnly: true,
  },
  {
    target: 'logs',
    title: 'Registro de Movimientos',
    description: 'Consulta el historial completo de acciones: quién creó, editó o canceló citas, pagos y configuraciones. Imprescindible para el control y la trazabilidad del negocio.',
    position: 'right',
    adminOnly: true,
  },
  {
    target: 'bot',
    title: 'Bot de WhatsApp',
    description: 'Configura el asistente virtual que permite a tus pacientes agendar, editar y cancelar citas por WhatsApp, sin intervención humana.',
    position: 'right',
    adminOnly: true,
    requiresBot: true,
  },
  {
    target: null,
    title: '¡Listo para comenzar!',
    description: 'Ya conoces todas las funcionalidades de Novagendas. Si necesitas recordar algo, haz clic en el botón de ayuda (?) en la esquina inferior derecha.',
    position: 'center',
  },
];

export default TOUR_STEPS;
