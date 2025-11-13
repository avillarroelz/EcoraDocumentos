import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonIcon,
  IonList,
  IonText,
  IonButton,
  IonAlert
} from '@ionic/react';
import { addOutline, refreshOutline, logoGoogle, logOutOutline, saveOutline, cloudOutline, createOutline, eyeOutline } from 'ionicons/icons';
import SectionItem from '../components/SectionItem';
import AddSectionModal from '../components/AddSectionModal';
import SearchBar from '../components/SearchBar';
import GoogleDriveModal from '../components/GoogleDriveModal';
import './Home.css';

const Home = ({ user, onLogout }) => {
  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultsCount, setResultsCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [parentTitle, setParentTitle] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [showGoogleDriveModal, setShowGoogleDriveModal] = useState(false);

  // Estados para drag & drop
  const [draggedId, setDraggedId] = useState(null);
  const [draggedLevel, setDraggedLevel] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  // Detectar si es escritorio o móvil
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Lista de administradores que pueden configurar datos predeterminados
  const ADMIN_EMAILS = ['avillarroel@ecora.cl'];
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  // Estado del modo de edición (solo relevante para admins)
  const [editMode, setEditMode] = useState(false);

  // Detectar cambios en el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cargar datos desde localStorage al iniciar (específicos por usuario)
  useEffect(() => {
    if (!user || !user.email) return;

    // Crear clave única por usuario usando su email
    const userStorageKey = `ecoraHierarchy_${user.email}`;
    const savedSections = localStorage.getItem(userStorageKey);

    if (savedSections) {
      setSections(JSON.parse(savedSections));
    } else {
      // Intentar cargar datos predeterminados configurados por el admin
      const defaultData = localStorage.getItem('ecoraHierarchy_defaults');

      let initialData;
      if (defaultData) {
        // Usar datos predeterminados del admin
        initialData = JSON.parse(defaultData);
      } else {
        // Datos de ejemplo iniciales si no hay predeterminados
        initialData = [
          {
            id: '1',
            title: 'Proyectos de Obras Civiles',
            description: 'Gestión integral de proyectos de construcción',
            children: [
              {
                id: '1-1',
                title: 'Planificación',
                description: 'Etapa de diseño y planificación del proyecto',
                children: [
                  {
                    id: '1-1-1',
                    title: 'Estudios de Factibilidad',
                    description: 'Análisis técnico y económico',
                    children: []
                  }
                ]
              },
              {
                id: '1-2',
                title: 'Ejecución',
                description: 'Construcción y desarrollo del proyecto',
                children: []
              }
            ]
          },
          {
            id: '2',
            title: 'Mantención de Infraestructura',
            description: 'Servicios de mantenimiento preventivo y correctivo',
            children: [
              {
                id: '2-1',
                title: 'Mantenimiento Preventivo',
                description: 'Inspecciones y mantenimiento programado',
                children: []
              }
            ]
          }
        ];
      }
      setSections(initialData);
      localStorage.setItem(userStorageKey, JSON.stringify(initialData));
    }
  }, [user]);

  // Guardar datos en localStorage cada vez que cambien (específicos por usuario)
  useEffect(() => {
    if (!user || !user.email) return;

    const userStorageKey = `ecoraHierarchy_${user.email}`;
    if (sections.length > 0) {
      localStorage.setItem(userStorageKey, JSON.stringify(sections));
    }
  }, [sections, user]);

  // Filtrar secciones cuando cambia la búsqueda
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSections(sections);
      setResultsCount(0);
    } else {
      const { filtered, count } = filterSections(sections, searchQuery);
      setFilteredSections(filtered);
      setResultsCount(count);
    }
  }, [sections, searchQuery]);

  // Función recursiva para filtrar secciones
  const filterSections = (items, query) => {
    let count = 0;
    const filtered = items.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(query.toLowerCase());
      const descMatch = item.description?.toLowerCase().includes(query.toLowerCase());
      const matches = titleMatch || descMatch;

      let childrenFiltered = [];
      let childrenCount = 0;

      if (item.children && item.children.length > 0) {
        const result = filterSections(item.children, query);
        childrenFiltered = result.filtered;
        childrenCount = result.count;
      }

      if (matches) count++;
      count += childrenCount;

      return matches || childrenFiltered.length > 0;
    }).map(item => ({
      ...item,
      children: item.children ? filterSections(item.children, query).filtered : []
    }));

    return { filtered, count };
  };

  // Función recursiva para contar secciones
  const countSections = (items) => {
    return items.reduce((total, item) => {
      const childCount = item.children ? countSections(item.children) : 0;
      return total + 1 + childCount;
    }, 0);
  };

  // Generar ID único
  const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  };

  // Función recursiva para agregar un hijo
  const addChildToSection = (items, targetId, newChild) => {
    return items.map(item => {
      if (item.id === targetId) {
        return {
          ...item,
          children: [...(item.children || []), newChild]
        };
      } else if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: addChildToSection(item.children, targetId, newChild)
        };
      }
      return item;
    });
  };

  // Función recursiva para actualizar una sección
  const updateSection = (items, targetId, updatedData) => {
    return items.map(item => {
      if (item.id === targetId) {
        return {
          ...item,
          ...updatedData
        };
      } else if (item.children && item.children.length > 0) {
        return {
          ...item,
          children: updateSection(item.children, targetId, updatedData)
        };
      }
      return item;
    });
  };

  // Función recursiva para eliminar una sección
  const deleteSection = (items, targetId) => {
    return items
      .filter(item => item.id !== targetId)
      .map(item => ({
        ...item,
        children: item.children ? deleteSection(item.children, targetId) : []
      }));
  };

  // Función recursiva para encontrar una sección por ID
  const findSection = (items, targetId) => {
    for (const item of items) {
      if (item.id === targetId) {
        return item;
      }
      if (item.children && item.children.length > 0) {
        const found = findSection(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  // Función recursiva para reordenar secciones (drag & drop)
  const reorderSections = (items, draggedId, targetId) => {
    // Encontrar la sección arrastrada
    const draggedSection = findSection(items, draggedId);
    if (!draggedSection || draggedId === targetId) return items;

    // Eliminar la sección arrastrada del árbol
    let newItems = deleteSection(items, draggedId);

    // Función para insertar antes de un elemento
    const insertBefore = (arr, targetId, newItem) => {
      const newArr = [];
      for (const item of arr) {
        if (item.id === targetId) {
          newArr.push(newItem);
        }
        if (item.children && item.children.length > 0) {
          const updatedChildren = insertBefore(item.children, targetId, newItem);
          if (updatedChildren !== item.children) {
            newArr.push({ ...item, children: updatedChildren });
            continue;
          }
        }
        newArr.push(item);
      }
      return newArr;
    };

    // Insertar en la nueva posición
    return insertBefore(newItems, targetId, draggedSection);
  };

  // Handlers de búsqueda
  const handleSearchChange = (query) => {
    setSearchQuery(query);
  };

  // Handlers CRUD
  const handleAddSection = (parentSectionId = null) => {
    if (parentSectionId) {
      const parent = findSection(sections, parentSectionId);
      setParentTitle(parent ? parent.title : null);
      setParentId(parentSectionId);
    } else {
      setParentTitle(null);
      setParentId(null);
    }
    setEditingSection(null);
    setShowModal(true);
  };

  const handleEditSection = (section) => {
    setEditingSection(section);
    setParentId(null);
    setParentTitle(null);
    setShowModal(true);
  };

  const handleDeleteSection = (sectionId) => {
    setDeleteId(sectionId);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      setSections(deleteSection(sections, deleteId));
    }
    setShowDeleteAlert(false);
    setDeleteId(null);
  };

  const handleSaveSection = (data) => {
    if (editingSection) {
      // Actualizar sección existente
      setSections(updateSection(sections, editingSection.id, data));
    } else if (parentId) {
      // Agregar como hijo de una sección existente
      const newSection = {
        id: generateId(),
        ...data,
        children: []
      };
      setSections(addChildToSection(sections, parentId, newSection));
    } else {
      // Agregar como sección raíz
      const newSection = {
        id: generateId(),
        ...data,
        children: []
      };
      setSections([...sections, newSection]);
    }
    setShowModal(false);
    setEditingSection(null);
    setParentId(null);
    setParentTitle(null);
  };

  const handleResetData = () => {
    if (!user || !user.email) return;

    const userStorageKey = `ecoraHierarchy_${user.email}`;
    localStorage.removeItem(userStorageKey);
    window.location.reload();
  };

  const handleGoogleDriveImport = (importedData) => {
    // Agregar las secciones importadas de Google Drive
    setSections([...sections, ...importedData]);
    setShowGoogleDriveModal(false);
  };

  // Función para guardar datos actuales como predeterminados (solo admin)
  const handleSaveAsDefaults = () => {
    if (!isAdmin) return;

    localStorage.setItem('ecoraHierarchy_defaults', JSON.stringify(sections));
    alert('✅ Datos guardados como predeterminados.\n\nTodos los nuevos usuarios recibirán esta estructura de secciones al iniciar sesión por primera vez.');
  };

  // Handlers drag & drop
  const handleDragStart = (id, level) => {
    setDraggedId(id);
    setDraggedLevel(level);
  };

  const handleDragOver = (id, level) => {
    if (draggedId && id !== draggedId) {
      setDropTargetId(id);
    }
  };

  const handleDrop = (id, level) => {
    if (draggedId && id !== draggedId && draggedLevel === level) {
      // Solo permitir reordenar en el mismo nivel
      setSections(reorderSections(sections, draggedId, id));
    }
    setDraggedId(null);
    setDraggedLevel(null);
    setDropTargetId(null);
  };

  const handleDragEnd = () => {
    setDraggedId(null);
    setDraggedLevel(null);
    setDropTargetId(null);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <div slot="start" style={{ display: 'flex', alignItems: 'center', paddingLeft: '16px' }}>
            <img
              src="/assets/ecora-logo-white.png"
              alt="Ecora Logo"
              style={{ height: '40px', objectFit: 'contain' }}
            />
          </div>
          <IonTitle>
            <div className="header-title">
              <span className="ecora-logo-text">Sistema de Gestión</span>
            </div>
          </IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={() => setShowGoogleDriveModal(true)}
            title="Importar desde Google Drive"
            style={{ marginRight: '8px', minWidth: '40px' }}
          >
            <img
              src="https://www.gstatic.com/images/branding/product/1x/drive_2020q4_48dp.png"
              alt="Google Drive"
              style={{ width: '24px', height: '24px' }}
            />
          </IonButton>
          {/* Botón para alternar modo de edición (solo admin) */}
          {isAdmin && (
            <IonButton
              slot="end"
              fill={editMode ? "solid" : "clear"}
              color={editMode ? "warning" : "light"}
              onClick={() => setEditMode(!editMode)}
              title={editMode ? "Desactivar modo de edición" : "Activar modo de edición"}
              style={{ marginRight: '8px' }}
            >
              <IonIcon icon={editMode ? createOutline : eyeOutline} slot="icon-only" />
            </IonButton>
          )}
          {/* Botón para guardar como predeterminados (solo admin y modo edición) */}
          {isAdmin && editMode && (
            <IonButton
              slot="end"
              fill="clear"
              color="light"
              onClick={handleSaveAsDefaults}
              title="Guardar estructura actual como predeterminada para nuevos usuarios"
              style={{ marginRight: '8px' }}
            >
              <IonIcon icon={saveOutline} slot="icon-only" />
            </IonButton>
          )}
          {/* Avatar y nombre del usuario */}
          <div slot="end" className="user-info" style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
            {user.picture && (
              <img
                src={user.picture}
                alt={user.name}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  marginRight: '8px',
                  border: '2px solid var(--ecora-blue-light)'
                }}
              />
            )}
            <span style={{
              color: 'white',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: '14px',
              marginRight: '10px'
            }}>
              {user.name}
            </span>
          </div>
          {/* Botón de Logout */}
          <IonButton
            slot="end"
            fill="clear"
            color="light"
            onClick={onLogout}
            title="Cerrar sesión"
            style={{ marginRight: '8px' }}
          >
            <IonIcon icon={logOutOutline} slot="icon-only" />
          </IonButton>
          <IonButton
            slot="end"
            fill="clear"
            onClick={handleResetData}
            title="Restablecer datos de ejemplo"
          >
            <IonIcon icon={refreshOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="home-content">
        <div className="content-container">
          {/* Header de contenido */}
          <div className="content-header">
            <h1 className="page-title">Sistema de Gestión de Información <span style={{ fontSize: '0.6em', fontWeight: '400' }}>(SGI)</span></h1>
            <p className="page-subtitle ecora-tagline">
              Encuentra todo lo que quieras en un solo clic
            </p>
          </div>

          {/* Banner de modo edición */}
          {isAdmin && editMode && (
            <div style={{
              background: 'linear-gradient(135deg, #ff9800 0%, #ff6f00 100%)',
              color: 'white',
              padding: '1rem 1.5rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 16px rgba(255, 152, 0, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontFamily: 'var(--ecora-font-primary)',
              fontSize: '0.9rem',
              fontWeight: '600'
            }}>
              <IonIcon icon={createOutline} style={{ fontSize: '1.5rem' }} />
              <span>
                {isDesktop
                  ? "Modo Edición Activo: Usa los botones para editar o eliminar"
                  : "Modo Edición Activo: Desliza las secciones para editar o eliminar"}
              </span>
            </div>
          )}

          {/* Barra de búsqueda */}
          <SearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            resultsCount={resultsCount}
          />

          {/* Lista de secciones */}
          {filteredSections.length === 0 ? (
            <div className="empty-state">
              <IonText color="medium">
                {searchQuery ? (
                  <>
                    <p>No se encontraron resultados para "{searchQuery}"</p>
                    <p>Intenta con otros términos de búsqueda.</p>
                  </>
                ) : (
                  <>
                    <p>No hay secciones creadas aún.</p>
                    <p>Presiona el botón + para crear tu primera sección.</p>
                  </>
                )}
              </IonText>
            </div>
          ) : (
            <IonList className="sections-list">
              {filteredSections.map((section) => (
                <SectionItem
                  key={section.id}
                  section={section}
                  onAddChild={handleAddSection}
                  onEdit={handleEditSection}
                  onDelete={handleDeleteSection}
                  level={0}
                  searchQuery={searchQuery}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isAdmin={isAdmin && editMode}
                />
              ))}
            </IonList>
          )}
        </div>

        {/* Botón flotante para agregar sección (solo admin en modo edición) */}
        {isAdmin && editMode && (
          <IonFab vertical="bottom" horizontal="end" slot="fixed">
            <IonFabButton onClick={() => handleAddSection()}>
              <IonIcon icon={addOutline} />
            </IonFabButton>
          </IonFab>
        )}

        {/* Modal para agregar/editar */}
        <AddSectionModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setEditingSection(null);
            setParentId(null);
            setParentTitle(null);
          }}
          onSave={handleSaveSection}
          editingSection={editingSection}
          parentTitle={parentTitle}
        />

        {/* Modal de Google Drive */}
        <GoogleDriveModal
          isOpen={showGoogleDriveModal}
          onClose={() => setShowGoogleDriveModal(false)}
          onImport={handleGoogleDriveImport}
        />

        {/* Alerta de confirmación de eliminación */}
        <IonAlert
          isOpen={showDeleteAlert}
          onDidDismiss={() => setShowDeleteAlert(false)}
          header="Confirmar eliminación"
          message="¿Estás seguro de que deseas eliminar esta sección y todas sus subsecciones?"
          buttons={[
            {
              text: 'Cancelar',
              role: 'cancel'
            },
            {
              text: 'Eliminar',
              role: 'confirm',
              handler: confirmDelete
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
