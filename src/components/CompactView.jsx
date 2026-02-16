import React, { useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonIcon,
  IonButton,
  IonChip,
  IonList
} from '@ionic/react';
import {
  folderOutline,
  documentOutline,
  starOutline,
  star,
  chevronForwardOutline,
  chevronDownOutline,
  createOutline,
  trashOutline,
  addCircleOutline,
  copyOutline,
  syncOutline,
  openOutline,
  moveOutline,
  cloudOutline
} from 'ionicons/icons';
import FilePreviewModal from './FilePreviewModal';
import MoveSectionModal from './MoveSectionModal';
import { API_BASE } from '../config/api';
import './CompactView.css';

const CompactView = ({
  sections,
  onAddChild,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
  onAddToRecents,
  onUpdateKeepExpanded,
  onSyncFolder,
  onImportFromDrive,
  isAdmin,
  searchQuery,
  level = 0
}) => {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [keepExpandedIds, setKeepExpandedIds] = useState(new Set()); // IDs de carpetas que deben permanecer expandidas
  const [previewFile, setPreviewFile] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [syncingIds, setSyncingIds] = useState(new Set()); // IDs de carpetas que están sincronizando
  const [sectionToMove, setSectionToMove] = useState(null); // Sección que se va a mover
  const [showMoveModal, setShowMoveModal] = useState(false);

  // Función recursiva para extraer IDs con keepExpanded: true
  const extractKeepExpandedIds = (sectionList) => {
    const ids = new Set();
    const traverse = (items) => {
      items.forEach(item => {
        if (item.keepExpanded === true && item.type === 'folder') {
          ids.add(item.id);
        }
        if (item.children && item.children.length > 0) {
          traverse(item.children);
        }
      });
    };
    traverse(sectionList);
    return ids;
  };

  // Inicializar keepExpandedIds desde las secciones cargadas de la BD
  React.useEffect(() => {
    if (sections && sections.length > 0) {
      const initialKeepExpandedIds = extractKeepExpandedIds(sections);
      setKeepExpandedIds(initialKeepExpandedIds);
      // También expandir automáticamente las carpetas que tienen keepExpanded: true
      setExpandedIds(prevExpanded => {
        const newExpanded = new Set(prevExpanded);
        initialKeepExpandedIds.forEach(id => newExpanded.add(id));
        return newExpanded;
      });
    }
  }, [sections]);

  const getTagColor = (colorName) => {
    const colors = {
      blue: '#0676e8',
      green: '#2dd36f',
      coral: '#ff9976',
      purple: '#a855f7',
      yellow: '#fbbf24',
      red: '#ef4444',
      cyan: '#90e0ff',
      pink: '#ec4899'
    };
    return colors[colorName] || '#0676e8';
  };

  const highlightText = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} className="search-highlight">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleKeepExpanded = async (id) => {
    // Determinar el nuevo valor
    const newValue = !keepExpandedIds.has(id);

    // Actualizar estado local inmediatamente para UI responsiva
    setKeepExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
        // Si se marca como "mantener expandido", también expandirlo
        setExpandedIds((prevExpanded) => {
          const newExpanded = new Set(prevExpanded);
          newExpanded.add(id);
          return newExpanded;
        });
      }
      return newSet;
    });

    // Guardar en backend
    try {
      const response = await fetch(`${API_BASE}/sections/${id}/keep-expanded`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ keepExpanded: newValue })
      });

      const data = await response.json();

      if (!data.success) {
        console.error('Error al actualizar keepExpanded:', data.error);
        // Revertir cambio si falló
        setKeepExpandedIds((prev) => {
          const newSet = new Set(prev);
          if (newValue) {
            newSet.delete(id);
          } else {
            newSet.add(id);
          }
          return newSet;
        });
      } else {
        console.log('✅ keepExpanded actualizado en BD para sección:', id);
        // No llamamos a onUpdateKeepExpanded para evitar re-renderizaciones
        // El estado local ya está actualizado y el backend tiene el valor correcto
      }
    } catch (error) {
      console.error('Error al guardar keepExpanded:', error);
      // Revertir cambio si falló
      setKeepExpandedIds((prev) => {
        const newSet = new Set(prev);
        if (newValue) {
          newSet.delete(id);
        } else {
          newSet.add(id);
        }
        return newSet;
      });
    }
  };

  const handleItemClick = (section) => {
    if (section.type === 'folder') {
      // Para carpetas, expandir/colapsar
      toggleExpand(section.id);
    } else {
      // Para archivos, agregar a recientes y abrir
      onAddToRecents(section);

      const driveLink = section.webViewLink || section.driveMetadata?.webViewLink;
      if (driveLink) {
        window.open(driveLink, '_blank');
      } else {
        // Para archivos sin Drive, abrir preview
        setPreviewFile(section);
        setShowPreview(true);
      }
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewFile(null);
  };

  const handleSync = async (section) => {
    // Verificar que la sección tenga un driveId
    const driveId = section.driveMetadata?.id || section.driveId;
    if (!driveId) {
      alert('Esta carpeta no está vinculada a Google Drive');
      return;
    }

    // Confirmar con el usuario
    const confirmSync = window.confirm(
      `¿Sincronizar "${section.title}" con Google Drive?\n\n` +
      `Esto reflejará todos los cambios realizados en Drive (archivos agregados, eliminados o renombrados).`
    );

    if (!confirmSync) return;

    // Marcar como sincronizando
    setSyncingIds(prev => {
      const newSet = new Set(prev);
      newSet.add(section.id);
      return newSet;
    });

    try {
      const response = await fetch(`${API_BASE}/sections/${section.id}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        const { stats } = data;
        const message = `✅ Sincronización completada:\n\n` +
          `➕ Agregados: ${stats.added}\n` +
          `✏️ Actualizados: ${stats.updated}\n` +
          `🗑️ Eliminados: ${stats.deleted}\n` +
          `✓ Sin cambios: ${stats.unchanged}`;

        alert(message);

        // Recargar la página para mostrar los cambios
        window.location.reload();
      } else {
        alert(`Error al sincronizar: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al sincronizar:', error);
      alert('Error de conexión al sincronizar con Google Drive');
    } finally {
      // Quitar marca de sincronizando
      setSyncingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(section.id);
        return newSet;
      });
    }
  };

  // Función para obtener todas las secciones de manera plana (para el modal de mover)
  const getAllSectionsFlat = () => {
    const allSections = [];

    const flatten = (items) => {
      items.forEach(item => {
        allSections.push(item);
        if (item.children && item.children.length > 0) {
          flatten(item.children);
        }
      });
    };

    flatten(sections);
    return allSections;
  };

  const handleOpenMoveModal = (section) => {
    setSectionToMove(section);
    setShowMoveModal(true);
  };

  const handleCloseMoveModal = () => {
    setShowMoveModal(false);
    setSectionToMove(null);
  };

  const handleMove = async (sectionId, newParentId) => {
    try {
      const response = await fetch(`${API_BASE}/sections/${sectionId}/move`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ newParentId })
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message);
        // Recargar la página para mostrar los cambios
        window.location.reload();
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error al mover:', error);
      alert('Error de conexión al mover la sección');
      throw error;
    }
  };

  return (
    <>
      <IonList className="compact-view-list">
        {sections.map((section) => {
        // Si la carpeta está marcada como "mantener expandido", siempre está expandida
        // Si no, usar el estado local expandedIds
        const isExpanded = keepExpandedIds.has(section.id) || expandedIds.has(section.id);
        const hasChildren = section.type === 'folder' && section.children && section.children.length > 0;
        const isKeepExpanded = keepExpandedIds.has(section.id);

        return (
          <div key={section.id} className="compact-item-wrapper">
            <IonItem
              className={`compact-item level-${level} ${section.type}-item`}
              button
              onClick={(e) => {
                if (!e.target.closest('.compact-actions')) {
                  handleItemClick(section);
                }
              }}
            >
              {/* Expansión para carpetas */}
              <div className="compact-expand" style={{ paddingLeft: `${level * 1.5}rem` }}>
                {hasChildren ? (
                  <IonIcon
                    icon={isExpanded ? chevronDownOutline : chevronForwardOutline}
                    className="expand-chevron"
                  />
                ) : (
                  <div className="expand-placeholder" />
                )}
              </div>

              {/* Icono de tipo */}
              <IonIcon
                icon={section.type === 'folder' ? folderOutline : documentOutline}
                className={`compact-type-icon ${section.type}-icon`}
                slot="start"
              />

              {/* Contenido */}
              <IonLabel className="compact-label">
                <h3 className="compact-title">
                  {highlightText(section.title, searchQuery)}
                  {hasChildren && (
                    <span className="compact-count">({section.children.length})</span>
                  )}
                </h3>
                {section.description && (
                  <p className="compact-description">
                    {highlightText(section.description, searchQuery)}
                  </p>
                )}
                {/* Tags */}
                {section.tags && section.tags.length > 0 && (
                  <div className="compact-tags">
                    {section.tags.slice(0, 2).map((tag) => (
                      <IonChip
                        key={tag.id}
                        className="compact-tag"
                        style={{
                          '--background': getTagColor(tag.color),
                          '--color': '#ffffff'
                        }}
                      >
                        {tag.name}
                      </IonChip>
                    ))}
                    {section.tags.length > 2 && (
                      <span className="compact-tag-more">+{section.tags.length - 2}</span>
                    )}
                  </div>
                )}
              </IonLabel>

              {/* Acciones */}
              <div className="compact-actions" slot="end" onClick={(e) => e.stopPropagation()}>
                {/* Favorito */}
                <IonButton
                  fill="clear"
                  size="small"
                  className="compact-favorite-button"
                  onClick={() => onToggleFavorite(section.id)}
                >
                  <IonIcon
                    icon={section.isFavorite ? star : starOutline}
                    className={section.isFavorite ? 'favorite-active' : ''}
                  />
                </IonButton>

                {/* Botón para expandir/colapsar carpetas con hijos */}
                {section.type === 'folder' && section.children && section.children.length > 0 && (
                  <IonButton
                    fill="clear"
                    size="small"
                    className="compact-action-button compact-expand-button"
                    onClick={() => toggleExpand(section.id)}
                    title={expandedIds.has(section.id) || keepExpandedIds.has(section.id) ? "Colapsar carpeta" : "Expandir carpeta"}
                  >
                    <IonIcon icon={expandedIds.has(section.id) || keepExpandedIds.has(section.id) ? chevronDownOutline : chevronForwardOutline} />
                  </IonButton>
                )}

                {/* Acciones de admin */}
                {isAdmin && (
                  <>

                    {/* Checkbox "Mostrar expandido" - solo para carpetas con hijos */}
                    {section.type === 'folder' && hasChildren && (
                      <div
                        className="keep-expanded-checkbox"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleKeepExpanded(section.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          padding: '0.2rem 0.35rem',
                          background: isKeepExpanded ? 'rgba(6, 118, 232, 0.1)' : 'transparent',
                          borderRadius: '6px',
                          border: `1px solid ${isKeepExpanded ? 'var(--ecora-blue-primary)' : 'rgba(0, 0, 0, 0.1)'}`,
                          transition: 'all 0.2s ease',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                        title="Mantener esta carpeta siempre expandida"
                      >
                        <input
                          type="checkbox"
                          checked={isKeepExpanded}
                          readOnly
                          style={{
                            width: '14px',
                            height: '14px',
                            cursor: 'pointer',
                            accentColor: 'var(--ecora-blue-primary)',
                            margin: 0,
                            pointerEvents: 'none'
                          }}
                        />
                        <span style={{
                          fontSize: '0.7rem',
                          color: isKeepExpanded ? 'var(--ecora-blue-primary)' : '#666',
                          fontWeight: isKeepExpanded ? '600' : '400',
                          whiteSpace: 'nowrap'
                        }}>
                          Expandido
                        </span>
                      </div>
                    )}

                    {section.type === 'folder' && (
                      <IonButton
                        fill="clear"
                        size="small"
                        className="compact-action-button compact-add-button"
                        onClick={() => onAddChild(section.id)}
                        title="Agregar hijo"
                      >
                        <IonIcon icon={addCircleOutline} />
                      </IonButton>
                    )}
                    <IonButton
                      fill="clear"
                      size="small"
                      className="compact-action-button compact-move-button"
                      onClick={() => handleOpenMoveModal(section)}
                      title="Mover"
                    >
                      <IonIcon icon={moveOutline} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      size="small"
                      className="compact-action-button compact-duplicate-button"
                      onClick={() => onDuplicate && onDuplicate(section)}
                      title="Duplicar"
                    >
                      <IonIcon icon={copyOutline} />
                    </IonButton>
                    {/* Botón de sincronización para carpetas */}
                    {section.type === 'folder' && (
                      <IonButton
                        fill="clear"
                        size="small"
                        className="compact-action-button compact-sync-button"
                        onClick={() => onSyncFolder && onSyncFolder(section)}
                        title="Sincronizar con Google Drive"
                        color={section.driveMetadata?.id ? "success" : "warning"}
                      >
                        <IonIcon icon={section.driveMetadata?.id ? syncOutline : cloudOutline} />
                      </IonButton>
                    )}
                    <IonButton
                      fill="clear"
                      size="small"
                      className="compact-action-button compact-edit-button"
                      onClick={() => onEdit(section)}
                      title="Editar"
                    >
                      <IonIcon icon={createOutline} />
                    </IonButton>
                    <IonButton
                      fill="clear"
                      size="small"
                      className="compact-action-button compact-delete-button"
                      onClick={() => onDelete(section.id)}
                      title="Eliminar"
                    >
                      <IonIcon icon={trashOutline} />
                    </IonButton>
                  </>
                )}
              </div>
            </IonItem>

            {/* Hijos expandidos */}
            {hasChildren && isExpanded && (
              <div className="compact-children">
                <CompactView
                  sections={section.children}
                  onAddChild={onAddChild}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onDuplicate={onDuplicate}
                  onToggleFavorite={onToggleFavorite}
                  onAddToRecents={onAddToRecents}
                  onUpdateKeepExpanded={onUpdateKeepExpanded}
                  onSyncFolder={onSyncFolder}
                  onImportFromDrive={onImportFromDrive}
                  isAdmin={isAdmin}
                  searchQuery={searchQuery}
                  level={level + 1}
                />
              </div>
            )}
          </div>
        );
      })}
    </IonList>

      {/* Modal de vista previa de archivos */}
      <FilePreviewModal
        isOpen={showPreview}
        onClose={handleClosePreview}
        file={previewFile}
      />

      {/* Modal de mover sección */}
      {showMoveModal && sectionToMove && (
        <MoveSectionModal
          isOpen={showMoveModal}
          onClose={handleCloseMoveModal}
          section={sectionToMove}
          allSections={getAllSectionsFlat()}
          onMove={handleMove}
        />
      )}
    </>
  );
};

export default CompactView;
