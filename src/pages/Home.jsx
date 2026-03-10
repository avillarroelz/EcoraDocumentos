import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonFab,
  IonFabButton,
  IonFabList,
  IonIcon,
  IonList,
  IonText,
  IonButton,
  IonAlert,
  IonActionSheet
} from '@ionic/react';
import {
  addOutline,
  refreshOutline,
  logOutOutline,
  saveOutline,
  createOutline,
  eyeOutline,
  folderOpenOutline,
  menuOutline,
  moveOutline,
  trashOutline,
  syncOutline,
  closeOutline,
  checkmarkDoneOutline
} from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import SectionItem from '../components/SectionItem';
import AddSectionModal from '../components/AddSectionModal';
import SearchBar from '../components/SearchBar';
import GoogleDriveModal from '../components/GoogleDriveModal';
import MoveSectionModal from '../components/MoveSectionModal';
import SyncFolderModal from '../components/SyncFolderModal';
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
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Estados para drag & drop
  const [draggedId, setDraggedId] = useState(null);
  const [draggedLevel, setDraggedLevel] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

  // Detectar si es escritorio o móvil (plataforma nativa siempre es "móvil")
  const isNative = Capacitor.isNativePlatform();
  const [isDesktop, setIsDesktop] = useState(!isNative && window.innerWidth >= 768);

  // Lista de administradores que pueden configurar datos predeterminados
  const ADMIN_EMAILS = ['avillarroel@ecora.cl'];
  const isAdmin = user && ADMIN_EMAILS.includes(user.email);

  // Estado del modo de edición (solo relevante para admins)
  const [editMode, setEditMode] = useState(false);

  // Estados para selección múltiple
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [fabExpanded, setFabExpanded] = useState(false);

  // Estados para modales de mover y sincronizar
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [sectionToSync, setSectionToSync] = useState(null);

  // Detectar cambios en el tamaño de la ventana (solo si no es nativo)
  useEffect(() => {
    if (isNative) return; // En móvil nativo, siempre es "móvil"

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isNative]);

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
    if (deleteId === 'multiple') {
      confirmDeleteMultiple();
    } else if (deleteId) {
      setSections(deleteSection(sections, deleteId));
      setShowDeleteAlert(false);
      setDeleteId(null);
    }
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

  // === FUNCIONES DE SELECCIÓN MÚLTIPLE ===
  const toggleSelectItem = (id) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => {
    setSelectedItems(new Set());
    setFabExpanded(false);
  };

  // Obtener todos los IDs recursivamente
  const getAllIds = (items) => {
    return items.flatMap(i => [i.id, ...getAllIds(i.children || [])]);
  };

  const selectAll = () => {
    setSelectedItems(new Set(getAllIds(sections)));
  };

  // Limpiar selección cuando se desactiva el modo edición
  useEffect(() => {
    if (!editMode) {
      clearSelection();
    }
  }, [editMode]);

  // Verificar si hay items seleccionados con driveMetadata
  const hasSelectedWithDrive = () => {
    const checkDrive = (items) => {
      for (const item of items) {
        if (selectedItems.has(item.id) && item.driveMetadata?.id) {
          return true;
        }
        if (item.children && checkDrive(item.children)) {
          return true;
        }
      }
      return false;
    };
    return checkDrive(sections);
  };

  // Obtener la primera sección seleccionada con driveMetadata
  const getSelectedSectionForSync = () => {
    const findFirst = (items) => {
      for (const item of items) {
        if (selectedItems.has(item.id) && item.driveMetadata?.id) {
          return item;
        }
        if (item.children) {
          const found = findFirst(item.children);
          if (found) return found;
        }
      }
      return null;
    };
    return findFirst(sections);
  };

  // Aplanar las secciones para el modal de mover
  const flattenSections = (items, parentId = null) => {
    return items.flatMap(item => {
      const hasChildren = item.children && item.children.length > 0;
      return [
        {
          ...item,
          parentId,
          type: hasChildren ? 'folder' : 'file'
        },
        ...flattenSections(item.children || [], item.id)
      ];
    });
  };

  // === ACCIONES MASIVAS ===
  const handleDeleteSelected = () => {
    if (selectedItems.size === 0) return;
    setDeleteId('multiple');
    setShowDeleteAlert(true);
  };

  const confirmDeleteMultiple = () => {
    setSections(prev => {
      const deleteRecursive = (items) =>
        items
          .filter(item => !selectedItems.has(item.id))
          .map(item => ({
            ...item,
            children: deleteRecursive(item.children || [])
          }));
      return deleteRecursive(prev);
    });
    clearSelection();
    setShowDeleteAlert(false);
    setDeleteId(null);
  };

  // Handler para mover secciones
  const handleMoveSection = async (sectionId, newParentId) => {
    // Encontrar y extraer la sección a mover
    let sectionToMove = null;

    const extractSection = (items) => {
      return items.filter(item => {
        if (item.id === sectionId) {
          sectionToMove = { ...item };
          return false; // Remover de esta ubicación
        }
        if (item.children) {
          item.children = extractSection(item.children);
        }
        return true;
      });
    };

    let newSections = extractSection([...sections]);

    if (!sectionToMove) return;

    // Insertar en la nueva ubicación
    if (newParentId === null) {
      // Mover a raíz
      newSections = [...newSections, sectionToMove];
    } else {
      // Mover dentro de una carpeta
      const insertInParent = (items) => {
        return items.map(item => {
          if (item.id === newParentId) {
            return {
              ...item,
              children: [...(item.children || []), sectionToMove]
            };
          }
          if (item.children) {
            return {
              ...item,
              children: insertInParent(item.children)
            };
          }
          return item;
        });
      };
      newSections = insertInParent(newSections);
    }

    setSections(newSections);
    clearSelection();
  };

  // Handler para sincronizar con Google Drive
  const handleSyncFolder = async (folderId, driveId, recursive) => {
    // Aquí iría la lógica de sincronización con la API de Google Drive
    // Por ahora, simular la sincronización
    console.log('Sincronizando carpeta:', folderId, 'con Drive ID:', driveId);

    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    return {
      filesUpdated: Math.floor(Math.random() * 10),
      foldersUpdated: Math.floor(Math.random() * 5)
    };
  };

  // Abrir modal de sincronización
  const openSyncModal = () => {
    // Primero buscar si hay uno con Drive
    let section = getSelectedSectionForSync();

    // Si no hay con Drive, tomar el primero seleccionado
    if (!section && selectedItems.size > 0) {
      const firstSelectedId = Array.from(selectedItems)[0];
      section = findSection(sections, firstSelectedId);
    }

    if (section) {
      setSectionToSync(section);
      setShowSyncModal(true);
      setFabExpanded(false);
    }
  };

  // Abrir modal de mover
  const openMoveModal = () => {
    setShowMoveModal(true);
    setFabExpanded(false);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          {/* Logo - siempre visible */}
          <div slot="start" style={{ display: 'flex', alignItems: 'center', paddingLeft: '16px' }}>
            <img
              src="/assets/ecora-logo-white.png"
              alt="Ecora Logo"
              style={{ height: '40px', objectFit: 'contain' }}
            />
          </div>

          {/* Título - solo en desktop */}
          {isDesktop && (
            <IonTitle>
              <div className="header-title">
                <span className="ecora-logo-text">Sistema de Gestión</span>
              </div>
            </IonTitle>
          )}

          {/* === MÓVIL: Solo avatar que abre menú === */}
          {!isDesktop && (
            <div
              slot="end"
              onClick={() => setShowUserMenu(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginRight: '16px',
                cursor: 'pointer'
              }}
            >
              {user.picture ? (
                <img
                  src={user.picture}
                  alt={user.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: '2px solid var(--ecora-blue-light)',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  border: '2px solid var(--ecora-blue-light)',
                  background: 'var(--ecora-coral)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '18px',
                  fontFamily: 'var(--ecora-font-primary)'
                }}>
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

          {/* === DESKTOP: Todos los botones visibles === */}
          {isDesktop && (
            <>
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
                  fontFamily: 'var(--ecora-font-primary)',
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
            </>
          )}
        </IonToolbar>
      </IonHeader>

      {/* ActionSheet del menú de usuario (móvil) */}
      <IonActionSheet
        isOpen={showUserMenu}
        onDidDismiss={() => setShowUserMenu(false)}
        cssClass="user-menu-action-sheet"
        header={user?.name || 'Usuario'}
        subHeader={user?.email}
        buttons={[
          {
            text: 'Importar desde Google Drive',
            icon: folderOpenOutline,
            handler: () => setShowGoogleDriveModal(true)
          },
          ...(isAdmin ? [{
            text: editMode ? 'Desactivar modo edición' : 'Activar modo edición',
            icon: editMode ? eyeOutline : createOutline,
            handler: () => setEditMode(!editMode)
          }] : []),
          ...(isAdmin && editMode ? [{
            text: 'Guardar como predeterminados',
            icon: saveOutline,
            handler: handleSaveAsDefaults
          }] : []),
          {
            text: 'Restablecer datos',
            icon: refreshOutline,
            handler: handleResetData
          },
          {
            text: 'Cerrar sesión',
            icon: logOutOutline,
            role: 'destructive',
            handler: onLogout
          },
          {
            text: 'Cancelar',
            role: 'cancel'
          }
        ]}
      />

      <IonContent className="home-content">
        <div className="content-container">
          {/* Header de contenido */}
          <div className="content-header">
            <h1 className="page-title">Ecora Clic</h1>
            <p className="page-subtitle">
              Gestión documental inteligente
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
                  : "Modo Edición: Selecciona elementos con el checkbox"}
              </span>
            </div>
          )}

          {/* Banner de selección múltiple */}
          {editMode && selectedItems.size > 0 && (
            <div className="selection-banner">
              <div className="selection-info">
                <IonIcon icon={checkmarkDoneOutline} />
                <span>{selectedItems.size} elemento(s) seleccionado(s)</span>
              </div>
              <div className="selection-actions">
                <IonButton fill="clear" size="small" onClick={clearSelection}>
                  <IonIcon icon={closeOutline} slot="start" />
                  Deseleccionar
                </IonButton>
                <IonButton fill="clear" size="small" onClick={selectAll}>
                  <IonIcon icon={checkmarkDoneOutline} slot="start" />
                  Seleccionar todo
                </IonButton>
              </div>
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
                  editMode={editMode}
                  isSelected={selectedItems.has(section.id)}
                  onToggleSelect={toggleSelectItem}
                  selectedItems={selectedItems}
                />
              ))}
            </IonList>
          )}
        </div>

        {/* FAB Menu - Desktop: solo agregar, Móvil: menú completo */}
        {isAdmin && editMode && (
          <>
            {/* Desktop: FAB simple para agregar */}
            {isDesktop && (
              <IonFab vertical="bottom" horizontal="end" slot="fixed">
                <IonFabButton onClick={() => handleAddSection()}>
                  <IonIcon icon={addOutline} />
                </IonFabButton>
              </IonFab>
            )}

            {/* Móvil: FAB expandible con acciones */}
            {!isDesktop && (
              <IonFab vertical="bottom" horizontal="end" slot="fixed" className="edit-fab-menu">
                <IonFabButton
                  onClick={() => setFabExpanded(!fabExpanded)}
                  className={fabExpanded ? 'fab-expanded' : ''}
                >
                  <IonIcon icon={fabExpanded ? closeOutline : menuOutline} />
                </IonFabButton>
                <IonFabList side="top" activated={fabExpanded}>
                  {/* Agregar nueva sección */}
                  <IonFabButton
                    onClick={() => {
                      setFabExpanded(false);
                      handleAddSection();
                    }}
                    data-action="add"
                    title="Agregar sección"
                  >
                    <IonIcon icon={addOutline} />
                  </IonFabButton>

                  {/* Sincronizar/Actualizar con Drive */}
                  <IonFabButton
                    onClick={openSyncModal}
                    data-action="sync"
                    disabled={selectedItems.size === 0}
                    className={selectedItems.size === 0 ? 'fab-disabled' : ''}
                    title={hasSelectedWithDrive() ? "Sincronizar con Drive" : "Vincular con Drive"}
                  >
                    <IonIcon icon={syncOutline} />
                  </IonFabButton>

                  {/* Mover */}
                  <IonFabButton
                    onClick={openMoveModal}
                    data-action="move"
                    disabled={selectedItems.size === 0}
                    className={selectedItems.size === 0 ? 'fab-disabled' : ''}
                    title="Mover seleccionados"
                  >
                    <IonIcon icon={moveOutline} />
                  </IonFabButton>

                  {/* Eliminar */}
                  <IonFabButton
                    onClick={handleDeleteSelected}
                    data-action="delete"
                    disabled={selectedItems.size === 0}
                    className={selectedItems.size === 0 ? 'fab-disabled' : ''}
                    title="Eliminar seleccionados"
                  >
                    <IonIcon icon={trashOutline} />
                  </IonFabButton>
                </IonFabList>
              </IonFab>
            )}
          </>
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
          message={
            deleteId === 'multiple'
              ? `¿Eliminar ${selectedItems.size} elemento(s) seleccionado(s) y todas sus subsecciones?`
              : "¿Estás seguro de que deseas eliminar esta sección y todas sus subsecciones?"
          }
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

        {/* Modal para mover secciones */}
        <MoveSectionModal
          isOpen={showMoveModal}
          onClose={() => setShowMoveModal(false)}
          section={selectedItems.size === 1 ? findSection(sections, Array.from(selectedItems)[0]) : null}
          allSections={flattenSections(sections)}
          onMove={handleMoveSection}
        />

        {/* Modal de sincronización */}
        <SyncFolderModal
          isOpen={showSyncModal}
          onClose={() => {
            setShowSyncModal(false);
            setSectionToSync(null);
          }}
          folder={sectionToSync}
          onSync={handleSyncFolder}
          onImportFromDrive={(folder) => {
            setShowSyncModal(false);
            setShowGoogleDriveModal(true);
          }}
        />
      </IonContent>
    </IonPage>
  );
};

export default Home;
