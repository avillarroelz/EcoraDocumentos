/**
 * Modelo de Estructura Organizacional
 * Líneas de Negocio -> Unidades de Negocio
 */

const { v4: uuidv4 } = require('uuid');

// Base de datos en memoria para Líneas de Negocio
let businessLines = [
  {
    id: uuidv4(),
    name: 'Construcción',
    description: 'Proyectos de obras civiles y construcción',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Mantención',
    description: 'Servicios de mantenimiento de infraestructura',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Ingeniería',
    description: 'Servicios de ingeniería y consultoría',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Base de datos en memoria para Unidades de Negocio
let businessUnits = [
  // Unidades de Construcción
  {
    id: uuidv4(),
    name: 'Obras Civiles',
    description: 'Construcción de infraestructura civil',
    businessLineId: businessLines[0].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Edificación',
    description: 'Construcción de edificios y estructuras',
    businessLineId: businessLines[0].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Unidades de Mantención
  {
    id: uuidv4(),
    name: 'Mantención Preventiva',
    description: 'Mantenimiento programado y preventivo',
    businessLineId: businessLines[1].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Mantención Correctiva',
    description: 'Reparaciones y mantenimiento correctivo',
    businessLineId: businessLines[1].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  // Unidades de Ingeniería
  {
    id: uuidv4(),
    name: 'Ingeniería de Proyectos',
    description: 'Diseño y planificación de proyectos',
    businessLineId: businessLines[2].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: uuidv4(),
    name: 'Consultoría Técnica',
    description: 'Asesoría técnica especializada',
    businessLineId: businessLines[2].id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Funciones CRUD para Líneas de Negocio

const getAllBusinessLines = () => {
  return businessLines;
};

const getBusinessLineById = (id) => {
  return businessLines.find(bl => bl.id === id);
};

const createBusinessLine = (data) => {
  const newBusinessLine = {
    id: uuidv4(),
    name: data.name,
    description: data.description || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  businessLines.push(newBusinessLine);
  return newBusinessLine;
};

const updateBusinessLine = (id, data) => {
  const index = businessLines.findIndex(bl => bl.id === id);
  if (index === -1) return null;

  businessLines[index] = {
    ...businessLines[index],
    ...data,
    id: businessLines[index].id,
    createdAt: businessLines[index].createdAt,
    updatedAt: new Date().toISOString()
  };
  return businessLines[index];
};

const deleteBusinessLine = (id) => {
  // Verificar si hay unidades de negocio asociadas
  const associatedUnits = businessUnits.filter(bu => bu.businessLineId === id);
  if (associatedUnits.length > 0) {
    throw new Error('No se puede eliminar la línea de negocio porque tiene unidades asociadas');
  }

  const index = businessLines.findIndex(bl => bl.id === id);
  if (index === -1) return false;

  businessLines.splice(index, 1);
  return true;
};

// Funciones CRUD para Unidades de Negocio

const getAllBusinessUnits = () => {
  return businessUnits;
};

const getBusinessUnitById = (id) => {
  return businessUnits.find(bu => bu.id === id);
};

const getBusinessUnitsByLineId = (businessLineId) => {
  return businessUnits.filter(bu => bu.businessLineId === businessLineId);
};

const createBusinessUnit = (data) => {
  // Verificar que la línea de negocio exista
  const businessLine = getBusinessLineById(data.businessLineId);
  if (!businessLine) {
    throw new Error('La línea de negocio especificada no existe');
  }

  const newBusinessUnit = {
    id: uuidv4(),
    name: data.name,
    description: data.description || '',
    businessLineId: data.businessLineId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  businessUnits.push(newBusinessUnit);
  return newBusinessUnit;
};

const updateBusinessUnit = (id, data) => {
  const index = businessUnits.findIndex(bu => bu.id === id);
  if (index === -1) return null;

  // Si se actualiza businessLineId, verificar que exista
  if (data.businessLineId && data.businessLineId !== businessUnits[index].businessLineId) {
    const businessLine = getBusinessLineById(data.businessLineId);
    if (!businessLine) {
      throw new Error('La línea de negocio especificada no existe');
    }
  }

  businessUnits[index] = {
    ...businessUnits[index],
    ...data,
    id: businessUnits[index].id,
    createdAt: businessUnits[index].createdAt,
    updatedAt: new Date().toISOString()
  };
  return businessUnits[index];
};

const deleteBusinessUnit = (id) => {
  const index = businessUnits.findIndex(bu => bu.id === id);
  if (index === -1) return false;

  businessUnits.splice(index, 1);
  return true;
};

// Función para obtener la jerarquía completa
const getOrganizationalHierarchy = () => {
  return businessLines.map(line => ({
    ...line,
    businessUnits: businessUnits.filter(unit => unit.businessLineId === line.id)
  }));
};

module.exports = {
  // Business Lines
  getAllBusinessLines,
  getBusinessLineById,
  createBusinessLine,
  updateBusinessLine,
  deleteBusinessLine,

  // Business Units
  getAllBusinessUnits,
  getBusinessUnitById,
  getBusinessUnitsByLineId,
  createBusinessUnit,
  updateBusinessUnit,
  deleteBusinessUnit,

  // Hierarchy
  getOrganizationalHierarchy
};
