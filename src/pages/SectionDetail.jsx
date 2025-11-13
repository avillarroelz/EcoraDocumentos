import React, { useState, useEffect } from 'react';
import { useParams, useHistory } from 'react-router-dom';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonText,
  IonBackButton,
  IonButtons,
  IonFab,
  IonFabButton,
  IonAlert
} from '@ionic/react';
import { addOutline, personCircleOutline, shieldCheckmarkOutline, refreshOutline } from 'ionicons/icons';
import SectionItem from '../components/SectionItem';
import AddSectionModal from '../components/AddSectionModal';
import SearchBar from '../components/SearchBar';
import './SectionDetail.css';

const SectionDetail = ({ userRole, onToggleRole }) => {
  const { sectionId } = useParams();
  const history = useHistory();
  const [section, setSection] = useState(null);
  const [sections, setSections] = useState([]);
  const [filteredChildren, setFilteredChildren] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [resultsCount, setResultsCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [parentId, setParentId] = useState(null);
  const [parentTitle, setParentTitle] = useState(null);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  // Estados para drag & drop
  const [draggedId, setDraggedId] = useState(null);
  const [draggedLevel, setDraggedLevel] = useState(null);
  const [dropTargetId, setDropTargetId] = useState(null);

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

  // Cargar datos desde localStorage
  useEffect(() => {
    const savedSections = localStorage.getItem('ecoraHierarchy');
    if (savedSections) {
      const parsedSections = JSON.parse(savedSections);
      setSections(parsedSections);
      const foundSection = findSection(parsedSections, sectionId);
      if (foundSection) {
        setSection(foundSection);
      } else {
        // Sección no encontrada, regresar al home
        history.push('/');
      }
    } else {
      history.push('/');
    }
  }, [sectionId, history]);

  // Actualizar sección cuando cambian los datos globales
  useEffect(() => {
    if (sections.length > 0) {
      const foundSection = findSection(sections, sectionId);
      if (foundSection) {
        setSection(foundSection);
      }
    }
  }, [sections, sectionId]);

  // Filtrar hijos cuando cambia la búsqueda
  useEffect(() => {
    if (!section) return;

    if (!searchQuery.trim()) {
      setFilteredChildren(section.children || []);
      setResultsCount(0);
    } else {
      const { filtered, count } = filterSections(section.children || [], searchQuery);
      setFilteredChildren(filtered);
      setResultsCount(count);
    }
  }, [section, searchQuery]);

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

  // Función recursiva para reordenar secciones (drag & drop)
  const reorderSections = (items, draggedId, targetId) => {
    const draggedSection = findSection(items, draggedId);
    if (!draggedSection || draggedId === targetId) return items;

    let newItems = deleteSection(items, draggedId);

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

    return insertBefore(newItems, targetId, draggedSection);
  };

  // Guardar cambios en localStorage
  const saveSections = (updatedSections) => {
    setSections(updatedSections);
    localStorage.setItem('ecoraHierarchy', JSON.stringify(updatedSections));
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
      // Agregar hijo directo a la sección actual
      setParentTitle(section ? section.title : null);
      setParentId(sectionId);
    }
    setEditingSection(null);
    setShowModal(true);
  };

  const handleEditSection = (sectionToEdit) => {
    setEditingSection(sectionToEdit);
    setParentId(null);
    setParentTitle(null);
    setShowModal(true);
  };

  const handleDeleteSection = (sectionIdToDelete) => {
    setDeleteId(sectionIdToDelete);
    setShowDeleteAlert(true);
  };

  const confirmDelete = () => {
    if (deleteId) {
      const updatedSections = deleteSection(sections, deleteId);
      saveSections(updatedSections);

      // Si se eliminó la sección actual, regresar al home
      if (deleteId === sectionId) {
        history.push('/');
      }
    }
    setShowDeleteAlert(false);
    setDeleteId(null);
  };

  const handleSaveSection = (data) => {
    let updatedSections;

    if (editingSection) {
      // Actualizar sección existente
      updatedSections = updateSection(sections, editingSection.id, data);
    } else if (parentId) {
      // Agregar como hijo de una sección específica
      const newSection = {
        id: generateId(),
        ...data,
        children: []
      };
      updatedSections = addChildToSection(sections, parentId, newSection);
    }

    saveSections(updatedSections);
    setShowModal(false);
    setEditingSection(null);
    setParentId(null);
    setParentTitle(null);
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
      const updatedSections = reorderSections(sections, draggedId, id);
      saveSections(updatedSections);
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

  if (!section) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar color="primary">
            <IonButtons slot="start">
              <IonBackButton defaultHref="/" />
            </IonButtons>
            <IonTitle>Cargando...</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="loading-container">
            <IonText color="medium">
              <p>Cargando sección...</p>
            </IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonButtons slot="start">
            <IonBackButton defaultHref="/" text="Volver" />
          </IonButtons>
          <div slot="start" style={{ display: 'flex', alignItems: 'center', paddingLeft: '8px' }}>
            <img
              src="/assets/ecora-logo-white.png"
              alt="Ecora Logo"
              style={{ height: '32px', objectFit: 'contain' }}
            />
          </div>
          <IonTitle>{section.title}</IonTitle>
          <IonButton
            slot="end"
            fill="solid"
            color={userRole === 'admin' ? 'warning' : 'secondary'}
            onClick={onToggleRole}
            title={`Cambiar a ${userRole === 'admin' ? 'Usuario' : 'Administrador'}`}
            style={{ marginRight: '8px' }}
          >
            <IonIcon
              icon={userRole === 'admin' ? shieldCheckmarkOutline : personCircleOutline}
              slot="start"
            />
            {userRole === 'admin' ? 'Admin' : 'User'}
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="detail-content">
        <div className="content-container">
          {/* Header de contenido */}
          <div className="detail-header">
            <h1 className="detail-title">{section.title}</h1>
            {section.description && (
              <p className="detail-description">{section.description}</p>
            )}
          </div>

          {/* Barra de búsqueda (solo si hay hijos) */}
          {section.children && section.children.length > 0 && (
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={handleSearchChange}
              resultsCount={resultsCount}
            />
          )}

          {/* Lista de hijos */}
          {!section.children || section.children.length === 0 ? (
            <div className="empty-state">
              <IonText color="medium">
                {searchQuery ? (
                  <>
                    <p>No se encontraron resultados para "{searchQuery}"</p>
                    <p>Intenta con otros términos de búsqueda.</p>
                  </>
                ) : (
                  <>
                    <p>Esta sección no tiene subsecciones aún.</p>
                    {userRole === 'admin' && (
                      <p>Presiona el botón + para crear la primera subsección.</p>
                    )}
                  </>
                )}
              </IonText>
            </div>
          ) : filteredChildren.length === 0 ? (
            <div className="empty-state">
              <IonText color="medium">
                <p>No se encontraron resultados para "{searchQuery}"</p>
                <p>Intenta con otros términos de búsqueda.</p>
              </IonText>
            </div>
          ) : (
            <IonList className="sections-list">
              {filteredChildren.map((child) => (
                <SectionItem
                  key={child.id}
                  section={child}
                  onAddChild={handleAddSection}
                  onEdit={handleEditSection}
                  onDelete={handleDeleteSection}
                  level={0}
                  searchQuery={searchQuery}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onDragEnd={handleDragEnd}
                  isAdmin={userRole === 'admin'}
                />
              ))}
            </IonList>
          )}
        </div>

        {/* Botón flotante para agregar subsección (solo admin) */}
        {userRole === 'admin' && (
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

export default SectionDetail;
