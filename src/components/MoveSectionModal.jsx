import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonText,
  IonSearchbar
} from '@ionic/react';
import {
  closeOutline,
  folderOutline,
  chevronForwardOutline,
  chevronDownOutline,
  homeOutline
} from 'ionicons/icons';
import './MoveSectionModal.css';

const MoveSectionModal = ({ isOpen, onClose, section, allSections, onMove }) => {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [moving, setMoving] = useState(false);

  // Resetear estado al abrir modal
  useEffect(() => {
    if (isOpen) {
      setExpandedIds(new Set());
      setSearchQuery('');
      setSelectedFolderId(null);
      setMoving(false);
    }
  }, [isOpen]);

  // Filtrar secciones: solo carpetas y excluir la sección actual y sus descendientes
  const getValidFolders = (sections) => {
    const invalidIds = new Set();

    // Agregar el id de la sección que se está moviendo
    invalidIds.add(section?.id);

    // Función recursiva para obtener todos los descendientes
    const addDescendants = (parentId) => {
      sections.forEach(s => {
        if (s.parentId === parentId) {
          invalidIds.add(s.id);
          if (s.type === 'folder') {
            addDescendants(s.id);
          }
        }
      });
    };

    if (section?.id) {
      addDescendants(section.id);
    }

    // Filtrar solo carpetas válidas
    return sections.filter(s =>
      s.type === 'folder' && !invalidIds.has(s.id)
    );
  };

  // Construir jerarquía de carpetas
  const buildHierarchy = (folders) => {
    const map = new Map();
    const roots = [];

    folders.forEach(folder => {
      map.set(folder.id, { ...folder, children: [] });
    });

    folders.forEach(folder => {
      const node = map.get(folder.id);
      if (folder.parentId && map.has(folder.parentId)) {
        map.get(folder.parentId).children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  const validFolders = getValidFolders(allSections);
  const folderHierarchy = buildHierarchy(validFolders);

  // Filtrar por búsqueda
  const filterBySearch = (folders) => {
    if (!searchQuery) return folders;

    const query = searchQuery.toLowerCase();
    return folders.filter(f =>
      f.title.toLowerCase().includes(query) ||
      f.description?.toLowerCase().includes(query)
    );
  };

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleMove = async () => {
    if (moving) return;

    setMoving(true);

    try {
      await onMove(section.id, selectedFolderId);
      onClose();
    } catch (error) {
      console.error('Error al mover:', error);
    } finally {
      setMoving(false);
    }
  };

  const renderFolder = (folder, level = 0) => {
    const isExpanded = expandedIds.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolderId === folder.id;

    return (
      <div key={folder.id} className="move-folder-wrapper">
        <IonItem
          className={`move-folder-item level-${level} ${isSelected ? 'selected' : ''}`}
          button
          onClick={() => setSelectedFolderId(folder.id)}
        >
          <div
            className="move-expand"
            style={{ paddingLeft: `${level * 1.5}rem` }}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpand(folder.id);
            }}
          >
            {hasChildren ? (
              <IonIcon
                icon={isExpanded ? chevronDownOutline : chevronForwardOutline}
                className="expand-chevron"
              />
            ) : (
              <div className="expand-placeholder" />
            )}
          </div>

          <IonIcon
            icon={folderOutline}
            className="folder-icon"
            slot="start"
          />

          <IonLabel>
            <h3 className="folder-title">{folder.title}</h3>
            {folder.description && (
              <p className="folder-description">{folder.description}</p>
            )}
          </IonLabel>

          {isSelected && (
            <IonIcon
              icon={chevronForwardOutline}
              slot="end"
              style={{ color: 'var(--ecora-blue-primary)', fontSize: '1.25rem' }}
            />
          )}
        </IonItem>

        {hasChildren && isExpanded && (
          <div className="move-folder-children">
            {folder.children.map(child => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const filteredHierarchy = filterBySearch(folderHierarchy);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Mover: {section?.title}</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            <IonIcon icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <div className="move-modal-content">
          {/* Instrucciones */}
          <div className="move-instructions">
            <IonText color="medium">
              Selecciona la carpeta destino donde deseas mover <strong>"{section?.title}"</strong>
            </IonText>
          </div>

          {/* Barra de búsqueda */}
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value)}
            placeholder="Buscar carpeta..."
            className="move-searchbar"
          />

          {/* Opción de mover a raíz */}
          <div className="move-root-option">
            <IonItem
              className={`move-folder-item ${selectedFolderId === null ? 'selected' : ''}`}
              button
              onClick={() => setSelectedFolderId(null)}
            >
              <IonIcon icon={homeOutline} slot="start" style={{ color: 'var(--ecora-blue-primary)' }} />
              <IonLabel>
                <h3 className="folder-title">Raíz (sin carpeta padre)</h3>
              </IonLabel>
              {selectedFolderId === null && (
                <IonIcon
                  icon={chevronForwardOutline}
                  slot="end"
                  style={{ color: 'var(--ecora-blue-primary)', fontSize: '1.25rem' }}
                />
              )}
            </IonItem>
          </div>

          {/* Lista de carpetas */}
          <IonList className="move-folder-list">
            {filteredHierarchy.length > 0 ? (
              filteredHierarchy.map(folder => renderFolder(folder))
            ) : (
              <div className="move-no-results">
                <IonText color="medium">
                  No hay carpetas disponibles
                </IonText>
              </div>
            )}
          </IonList>

          {/* Botones de acción */}
          <div className="move-actions">
            <IonButton
              expand="block"
              onClick={handleMove}
              disabled={selectedFolderId === undefined || moving}
              className="move-confirm-button"
            >
              {moving ? 'Moviendo...' : 'Mover aquí'}
            </IonButton>
            <IonButton
              expand="block"
              fill="outline"
              onClick={onClose}
              disabled={moving}
            >
              Cancelar
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default MoveSectionModal;
