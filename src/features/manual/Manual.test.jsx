import { describe, it, expect } from 'vitest';
import { filterSectionsByRole, searchSections } from './manualContent';

const MOCK_SECTIONS = [
  { id: 'intro',    label: 'Primeros pasos', roles: ['admin', 'recepcion', 'especialista'], searchText: 'primeros pasos inicio' },
  { id: 'payments', label: 'Pagos',          roles: ['admin'],                              searchText: 'pagos abonos ingresos' },
  { id: 'agenda',   label: 'Agenda',         roles: ['admin', 'recepcion', 'especialista'], searchText: 'agenda citas calendario' },
  { id: 'users',    label: 'Gestión equipo', roles: ['admin'],                              searchText: 'usuarios equipo roles' },
];

describe('filterSectionsByRole', () => {
  it('muestra todas las secciones para admin', () => {
    const result = filterSectionsByRole(MOCK_SECTIONS, 'admin');
    expect(result).toHaveLength(4);
  });

  it('oculta pagos y usuarios para recepcion', () => {
    const result = filterSectionsByRole(MOCK_SECTIONS, 'recepcion');
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toEqual(['intro', 'agenda']);
  });

  it('muestra solo intro y agenda para especialista', () => {
    const result = filterSectionsByRole(MOCK_SECTIONS, 'especialista');
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toEqual(['intro', 'agenda']);
  });

  it('retorna array vacío si no hay secciones', () => {
    const result = filterSectionsByRole([], 'admin');
    expect(result).toHaveLength(0);
  });
});

describe('searchSections', () => {
  const adminSections = filterSectionsByRole(MOCK_SECTIONS, 'admin');

  it('retorna todas las secciones para query vacío', () => {
    expect(searchSections(adminSections, '')).toHaveLength(4);
    expect(searchSections(adminSections, '   ')).toHaveLength(4);
  });

  it('filtra por texto en label', () => {
    const result = searchSections(adminSections, 'pagos');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('payments');
  });

  it('filtra por texto en searchText', () => {
    const result = searchSections(adminSections, 'calendario');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('agenda');
  });

  it('es case-insensitive', () => {
    const result = searchSections(adminSections, 'AGENDA');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('agenda');
  });

  it('retorna array vacío cuando no hay coincidencias', () => {
    const result = searchSections(adminSections, 'xyz-no-existe');
    expect(result).toHaveLength(0);
  });

  it('puede retornar múltiples secciones si el término aparece en varias', () => {
    const result = searchSections(adminSections, 'pasos');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('intro');
  });
});
