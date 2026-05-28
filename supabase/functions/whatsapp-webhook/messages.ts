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
export function buildMenu(
  businessName: string,
  telefonoContacto?: string | null
): Record<string, unknown> {
  const phone = telefonoContacto?.trim() ?? "";
  const contactLine = phone ? `\n\nComunicate con un asesor dando clic aqui: *${phone}*` : "";

  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: {
        text:
          `Hola 👋 Soy el asistente virtual de agendamiento de *${trunc(businessName, 40)}*.\n\n` +
          `Puedo ayudarte a:\n` +
          `📅 Agendar una nueva cita\n` +
          `✏️ Modificar o cancelar citas\n` +
          `🗓 Consultar tus próximas citas\n` +
          `💆 Ver el catálogo de servicios` +
          contactLine +
          `\n\n¿Qué deseas hacer?`,
      },
      action: {
        button: "Ver opciones",
        sections: [
          {
            title: "Opciones disponibles",
            rows: [
              { id: "MENU_AGENDAR",   title: "📅 Agendar cita",   description: "Reserva una nueva cita" },
              { id: "MENU_EDITAR",    title: "✏️ Editar cita",    description: "Cambia fecha u hora" },
              { id: "MENU_VER",       title: "🗓 Ver mis citas",   description: "Consulta tus próximas citas" },
              { id: "MENU_CANCELAR",  title: "❌ Cancelar cita",   description: "Cancela una cita existente" },
              { id: "MENU_SERVICIOS", title: "💆 Ver servicios",   description: "Precios, duración y categorías" },
            ],
          },
        ],
      },
    },
  };
}

export function buildServiceList(
  services: Array<{ idservicios: number; nombre: string; precio: number; duracion: number }>,
  showPrice = true,
  preciosOcultos: number[] = []
): Record<string, unknown> {
  const rows = services.slice(0, 10).map((s) => {
    const showThisPrice = showPrice && !preciosOcultos.includes(s.idservicios);
    return {
      id: `SVC_${s.idservicios}`,
      title: trunc(s.nombre, 24),
      description: trunc(
        showThisPrice ? `${formatCOP(s.precio)} · ${s.duracion} min` : `${s.duracion} min`,
        72
      ),
    };
  });
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "¿Qué servicio deseas agendar?" },
      action: { button: "Ver servicios", sections: [{ title: "Servicios disponibles", rows }] },
    },
  };
}

export function buildCategoryList(
  categories: Array<{ idcategoriaservicio: number; descripcion: string }>
): Record<string, unknown> {
  if (categories.length <= 10) {
    const rows = categories.map((c) => ({
      id: `CAT_${c.idcategoriaservicio}`,
      title: trunc(c.descripcion, 24),
      description: "",
    }));
    return {
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: "¿Qué tipo de servicio deseas?" },
        action: { button: "Ver categorías", sections: [{ title: "Categorías", rows }] },
      },
    };
  }

  const lines = categories.map((c, i) => `${i + 1}. ${c.descripcion}`).join("\n");
  return buildText(`¿Qué tipo de servicio deseas?\n\n${lines}\n\nResponde con el número de tu elección.`);
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
  const rows = dates.slice(0, 9).map((d) => {
    const [year, month, day] = d.split("-").map(Number);
    const dt = new Date(year, month - 1, day);
    const label = dt.toLocaleDateString("es-CO", { weekday: "short", day: "numeric", month: "short" });
    return { id: `DATE_${d}`, title: trunc(label, 24), description: "" };
  });
  // Always add custom date option as last item
  rows.push({
    id: "DATE_CUSTOM",
    title: "📅 Fecha personalizada",
    description: "Escribe la fecha que necesitas",
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

export function buildJornadaSelector(
  jornadas: Array<"mañana" | "tarde" | "noche">
): Record<string, unknown> {
  const MAP: Record<string, { id: string; title: string }> = {
    "mañana": { id: "JORNADA_MANANA", title: "☀️ Mañana" },
    "tarde":  { id: "JORNADA_TARDE",  title: "🌤 Tarde"  },
    "noche":  { id: "JORNADA_NOCHE",  title: "🌙 Noche"  },
  };
  const buttons = jornadas.map((j) => ({ type: "reply", reply: MAP[j] }));
  return {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: "¿En qué jornada prefieres tu cita?" },
      action: { buttons },
    },
  };
}

export function buildTimeList(slots: string[], jornada: string): Record<string, unknown> {
  const label = jornada.charAt(0).toUpperCase() + jornada.slice(1);
  const rows = slots.slice(0, 10).map((t) => ({ id: `TIME_${t}`, title: t, description: "" }));
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: `Horarios disponibles — ${label}:` },
      action: { button: "Ver horarios", sections: [{ title: label, rows }] },
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

export function buildEditAppointmentList(
  appointments: Array<{ idcita: number; fecha: string; hora: string; servicio: string }>
): Record<string, unknown> {
  const rows = appointments.slice(0, 10).map((a) => ({
    id: `EDIT_${a.idcita}`,
    title: trunc(`${a.fecha} ${a.hora}`, 24),
    description: trunc(a.servicio, 72),
  }));
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "Selecciona la cita que deseas editar:" },
      action: { button: "Ver citas", sections: [{ title: "Mis citas", rows }] },
    },
  };
}

export function buildEditConfirmation(
  serviceName: string,
  fechaAnterior: string,
  horaAnterior: string,
  fechaNueva: string,
  horaNueva: string
): Record<string, unknown> {
  const parseDate = (d: string): string => {
    const [year, month, day] = d.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("es-CO", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  };
  return {
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text:
          `✏️ *Editar cita*\n\n` +
          `🏥 Servicio: ${serviceName}\n\n` +
          `📅 Antes: ${parseDate(fechaAnterior)} a las ${horaAnterior}\n` +
          `📅 Nueva: ${parseDate(fechaNueva)} a las ${horaNueva}\n\n` +
          `¿Confirmas el cambio?`,
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "EDIT_CONFIRM_YES", title: "✅ Confirmar" } },
          { type: "reply", reply: { id: "EDIT_CONFIRM_NO",  title: "❌ Cancelar"  } },
        ],
      },
    },
  };
}

export function buildPaymentOptions(): Record<string, unknown> {
  return {
    type: "interactive",
    interactive: {
      type: "button",
      body: {
        text: "¿Deseas realizar un abono o pago anticipado para confirmar tu cita?",
      },
      action: {
        buttons: [
          { type: "reply", reply: { id: "PAYMENT_YES", title: "💳 Sí, abonar" } },
          { type: "reply", reply: { id: "PAYMENT_NO",  title: "💵 No, en efectivo" } },
        ],
      },
    },
  };
}

export function buildPaymentInfo(
  numeroNequi: string | null,
  llaveBreb: string | null,
  telefonoContacto: string | null
): Record<string, unknown> {
  const lines: string[] = ["💳 *Métodos de pago*\n"];
  if (numeroNequi) lines.push(`📱 *NEQUI:* ${numeroNequi}`);
  if (llaveBreb) lines.push(`🔑 *Llave Bre-B:* ${llaveBreb}`);
  const tel = telefonoContacto?.trim();
  if (tel) {
    lines.push(`\nEnvía el comprobante al número *${tel}*.`);
  } else {
    lines.push("\nEnvía el comprobante al número de contacto del negocio.");
  }
  lines.push("\n¡Gracias por tu preferencia! 🙏");
  return buildText(lines.join("\n"));
}

export function buildViewCategoryList(
  categories: Array<{ idcategoriaservicio: number; descripcion: string }>
): Record<string, unknown> {
  const rows = categories.slice(0, 10).map((c) => ({
    id: `VCAT_${c.idcategoriaservicio}`,
    title: trunc(c.descripcion, 24),
    description: "Ver servicios de esta categoría",
  }));
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "¿Qué categoría de servicios deseas ver?" },
      action: { button: "Ver categorías", sections: [{ title: "Categorías", rows }] },
    },
  };
}

export function buildViewServiceList(
  services: Array<{ idservicios: number; nombre: string; precio: number; duracion: number }>,
  showPrice = true,
  preciosOcultos: number[] = [],
  excluidos: number[] = []
): Record<string, unknown> {
  const filtered = services.filter((s) => !excluidos.includes(s.idservicios));
  if (filtered.length === 0) {
    return buildText("No hay servicios disponibles en esta categoría.");
  }
  const rows = filtered.slice(0, 10).map((s) => {
    const showThisPrice = showPrice && !preciosOcultos.includes(s.idservicios);
    return {
      id: `VSVC_${s.idservicios}`,
      title: trunc(s.nombre, 24),
      description: trunc(
        showThisPrice
          ? `${formatCOP(s.precio)} · ${s.duracion} min — toca para ver descripción`
          : `${s.duracion} min — toca para ver descripción`,
        72
      ),
    };
  });
  return {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: "Selecciona un servicio para ver su descripción:" },
      action: { button: "Ver servicios", sections: [{ title: "Servicios", rows }] },
    },
  };
}

export function buildCategoryCard(
  cat: { idcategoriaservicio: number; descripcion: string }
): Record<string, unknown> {
  return {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: `📂 *${cat.descripcion}*` },
      action: {
        buttons: [
          { type: "reply", reply: { id: `VCAT_${cat.idcategoriaservicio}`, title: "Ver servicios" } },
        ],
      },
    },
  };
}

export function buildServiceCard(
  svc: { idservicios: number; nombre: string; precio: number; duracion: number },
  showPrice = true,
  isPriceHidden = false
): Record<string, unknown> {
  const priceInfo = showPrice && !isPriceHidden
    ? `💰 ${formatCOP(svc.precio)} · ⏱ ${svc.duracion} min`
    : `⏱ ${svc.duracion} min`;
  return {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: `💆 *${svc.nombre}*\n${priceInfo}` },
      action: {
        buttons: [
          { type: "reply", reply: { id: `VSVC_${svc.idservicios}`, title: "Ver descripción" } },
        ],
      },
    },
  };
}

export function buildBookFromServicePrompt(
  svcId: number,
  svcNombre: string
): Record<string, unknown> {
  return {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: `¿Deseas agendar una cita de *${trunc(svcNombre, 40)}*?` },
      action: {
        buttons: [
          { type: "reply", reply: { id: `BOOK_SVC_${svcId}`, title: "Sí, quiero agendar" } },
          { type: "reply", reply: { id: "CONTACT_ASESOR", title: "Hablar con asesor" } },
        ],
      },
    },
  };
}
