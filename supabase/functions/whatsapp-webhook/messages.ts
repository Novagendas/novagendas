function trunc(str: string, max: number): string {
  return str.length > max ? str.slice(0, max - 1) + "…" : str;
}

// Formatea número como COP sin depender de Intl/locale (evita errores en Deno)
function formatCOP(amount: number | string | null | undefined): string {
  const n = Math.round(Number(amount) || 0);
  return "$" + n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function buildText(body: string): Record<string, unknown> {
  return { type: "text", text: { body } };
}

// Menú principal como lista (soporta 4+ opciones, botones máx 3)
export function buildMenu(businessName: string): Record<string, unknown> {
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: `Bienvenido a *${trunc(businessName, 40)}* 👋\n\n¿Qué deseas hacer?` },
      action: {
        button: "Ver opciones",
        sections: [
          {
            title: "Opciones disponibles",
            rows: [
              { id: "MENU_AGENDAR",   title: "📅 Agendar cita",    description: "Reserva una nueva cita" },
              { id: "MENU_VER",       title: "🗓 Ver mis citas",    description: "Consulta tus próximas citas" },
              { id: "MENU_CANCELAR",  title: "❌ Cancelar cita",    description: "Cancela una cita existente" },
              { id: "MENU_SERVICIOS", title: "💆 Ver servicios",    description: "Precios, duración y categorías" },
            ],
          },
        ],
      },
    },
  };
}

export function buildServiceList(
  services: Array<{ idservicios: number; nombre: string; precio: number; duracion: number }>
): Record<string, unknown> {
  const rows = services.slice(0, 10).map((s) => ({
    id: `SVC_${s.idservicios}`,
    title: trunc(s.nombre, 24),
    description: trunc(`${formatCOP(s.precio)} · ${s.duracion} min`, 72),
  }));
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "¿Qué servicio deseas agendar?" },
      action: { button: "Ver servicios", sections: [{ title: "Servicios disponibles", rows }] },
    },
  };
}

export function buildServiceCatalog(
  services: Array<{ nombre: string; precio: number | string | null; duracion: number; categoria: string }>
): Record<string, unknown> {
  if (services.length === 0) {
    return buildText("No hay servicios disponibles en este momento.");
  }

  const lines = services
    .map((s) => {
      const priceLine = s.precio !== null ? `💰 ${formatCOP(s.precio)}\n` : "";
      return `💆 *${s.nombre}*\n📂 ${s.categoria}\n${priceLine}⏱ ${s.duracion} min`;
    })
    .join("\n\n");

  const body = `📋 *Servicios disponibles*\n\n${lines}`;
  // WhatsApp text máx 4096 chars
  return buildText(body.slice(0, 4090));
}

export function buildSpecialistList(
  specialists: Array<{ idusuario: number; nombre: string; apellido: string }>
): Record<string, unknown> {
  const rows = [
    { id: "ESP_ANY", title: "Sin preferencia", description: "Primero disponible" },
    ...specialists.slice(0, 9).map((e) => ({
      id: `ESP_${e.idusuario}`,
      title: trunc(`${e.nombre} ${e.apellido}`, 24),
      description: "",
    })),
  ];
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "¿Con qué especialista deseas la cita?" },
      action: { button: "Ver especialistas", sections: [{ title: "Especialistas", rows }] },
    },
  };
}

export function buildDateList(dates: string[]): Record<string, unknown> {
  const rows = dates.slice(0, 10).map((d) => {
    const [year, month, day] = d.split("-").map(Number);
    const dt = new Date(year, month - 1, day);
    const label = dt.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
    return { id: `DATE_${d}`, title: trunc(label, 24), description: "" };
  });
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "¿Para qué fecha?" },
      action: { button: "Ver fechas", sections: [{ title: "Fechas disponibles", rows }] },
    },
  };
}

export function buildTimeList(slots: string[]): Record<string, unknown> {
  const rows = slots.slice(0, 10).map((t) => ({
    id: `TIME_${t}`,
    title: t,
    description: "",
  }));
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "Horarios disponibles para ese día:" },
      action: { button: "Ver horarios", sections: [{ title: "Horas libres", rows }] },
    },
  };
}

export function buildConfirmation(
  serviceName: string,
  specialistName: string,
  fecha: string,
  hora: string
): Record<string, unknown> {
  const [year, month, day] = fecha.split("-").map(Number);
  const dt = new Date(year, month - 1, day);
  const fechaLabel = dt.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" });
  return {
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text:
          `📋 *Resumen de tu cita*\n\n` +
          `🏥 Servicio: ${serviceName}\n` +
          `👤 Especialista: ${specialistName}\n` +
          `📅 Fecha: ${fechaLabel}\n` +
          `⏰ Hora: ${hora}\n\n` +
          `¿Confirmas?`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "CONFIRM_YES", title: "✅ Confirmar" } },
          { type: "reply", reply: { id: "CONFIRM_NO",  title: "❌ Cancelar"  } },
        ],
      },
    },
  };
}

export function buildAppointmentList(
  appointments: Array<{ idcita: number; fecha: string; hora: string; servicio: string }>
): Record<string, unknown> {
  const rows = appointments.slice(0, 10).map((a) => ({
    id: `CANCEL_${a.idcita}`,
    title: trunc(`${a.fecha} ${a.hora}`, 24),
    description: trunc(a.servicio, 72),
  }));
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "Selecciona la cita que deseas cancelar:" },
      action: { button: "Ver citas", sections: [{ title: "Mis citas", rows }] },
    },
  };
}

export function buildCancelConfirmation(
  fecha: string,
  hora: string,
  servicio: string
): Record<string, unknown> {
  return {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: `¿Confirmas cancelar esta cita?\n\n📅 ${fecha} a las ${hora}\n🏥 ${servicio}` },
      action: {
        buttons: [
          { type: "reply", reply: { id: "CANCEL_CONFIRM_YES", title: "✅ Sí, cancelar" } },
          { type: "reply", reply: { id: "CANCEL_CONFIRM_NO",  title: "❌ No, volver"   } },
        ],
      },
    },
  };
}
