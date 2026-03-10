import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonCheckbox
} from '@ionic/react';
import {
  chevronDownOutline,
  chevronForwardOutline,
  addCircleOutline,
  createOutline,
  trashOutline,
  enterOutline,
  folderOutline,
  folderOpenOutline,
  documentTextOutline
} from 'ionicons/icons';
import './SectionItem.css';

const SectionItem = ({
  section,
  onAddChild,
  onEdit,
  onDelete,
  level = 0,
  searchQuery = '',
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isAdmin = false,
  editMode = false,
  isSelected = false,
  onToggleSelect,
  selectedItems = new Set()
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  // Detectar plataforma nativa (Android/iOS) o usar ancho de ventana
  const isNative = Capacitor.isNativePlatform();
  const [isDesktop, setIsDesktop] = useState(!isNative && window.innerWidth >= 768);
  const hasChildren = section.children && section.children.length > 0;
  const history = useHistory();

  // Detectar cambios en el tamaño de la ventana (solo si no es nativo)
  useEffect(() => {
    if (isNative) return; // En móvil nativo, siempre es "móvil"

    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isNative]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Función para abrir URLs (usa app nativa en Android/iOS)
  const openUrl = async (url) => {
    if (Capacitor.isNativePlatform()) {
      // En Android/iOS, usar Browser plugin que abre la app nativa de Drive
      await Browser.open({ url, windowName: '_system' });
    } else {
      // En web, abrir en nueva pestaña
      window.open(url, '_blank');
    }
  };

  const handleViewDetail = (e) => {
    e.stopPropagation();
    // Si tiene enlace de Google Drive, abrirlo
    if (section.driveMetadata && section.driveMetadata.webViewLink) {
      openUrl(section.driveMetadata.webViewLink);
    } else {
      // Si no tiene enlace de Drive, navegar a la página de detalle
      history.push(`/section/${section.id}`);
    }
  };

  // Handler para clic en el item
  const handleItemClick = (e) => {
    if (hasChildren) {
      // Carpetas: desplegar/colapsar
      toggleExpand();
    } else {
      // Archivos: misma función que el botón de la derecha
      handleViewDetail(e);
    }
  };

  // Calcular indentación basada en el nivel (reducida)
  const indentStyle = {
    paddingLeft: level > 0 ? `${level * 0.5}rem` : '0'
  };

  // Función para resaltar texto de búsqueda
  const highlightText = (text, query) => {
    if (!query || !text) return text;

    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="search-highlight">{part}</mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    );
  };

  // Handlers para drag & drop
  const handleDragStart = (e) => {
    e.stopPropagation();
    if (onDragStart) {
      onDragStart(section.id, level);
    }
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.classList.add('dragging');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDragOver) {
      onDragOver(section.id, level);
    }
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDrop) {
      onDrop(section.id, level);
    }
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    if (onDragEnd) {
      onDragEnd();
    }
  };

  return (
    <div
      className="section-item-container"
      draggable={isAdmin}
      onDragStart={isAdmin ? handleDragStart : undefined}
      onDragOver={isAdmin ? handleDragOver : undefined}
      onDrop={isAdmin ? handleDrop : undefined}
      onDragEnd={isAdmin ? handleDragEnd : undefined}
    >
      <IonItemSliding>
        <IonItem
          className={`section-item level-${level} ${hasChildren ? 'is-folder' : 'is-file'} ${isSelected ? 'is-selected' : ''}`}
          style={indentStyle}
          button={true}
          onClick={handleItemClick}
        >
          {/* Checkbox de selección - solo en modo edición móvil */}
          {editMode && !isDesktop && onToggleSelect && (
            <IonCheckbox
              slot="start"
              checked={isSelected}
              onIonChange={(e) => {
                e.stopPropagation();
                onToggleSelect(section.id);
              }}
              onClick={(e) => e.stopPropagation()}
              className="selection-checkbox"
            />
          )}

          {/* Icono de expansión */}
          {hasChildren && (
            <IonIcon
              slot="start"
              icon={isExpanded ? chevronDownOutline : chevronForwardOutline}
              className="expand-icon"
            />
          )}

          {/* Icono de tipo: carpeta o archivo */}
          <IonIcon
            slot="start"
            icon={hasChildren
              ? (isExpanded ? folderOpenOutline : folderOutline)
              : documentTextOutline
            }
            className={`type-icon ${hasChildren ? 'type-icon--folder' : 'type-icon--file'}`}
          />

          {/* Título de la sección */}
          <IonLabel>
            <h3 className="section-title">
              {highlightText(section.title, searchQuery)}
            </h3>
            {section.description && (
              <p className="section-description">
                {highlightText(section.description, searchQuery)}
              </p>
            )}
          </IonLabel>

          {/* Botón para ver detalle o abrir en Drive */}
          <IonButton
            fill="clear"
            size="small"
            onClick={handleViewDetail}
            className="view-detail-button"
            title={section.driveMetadata && section.driveMetadata.webViewLink ? "Abrir en Google Drive" : "Ver detalles"}
          >
            <IonIcon icon={enterOutline} />
          </IonButton>

          {/* Botones de edición/eliminación en escritorio (solo admin) */}
          {isAdmin && isDesktop && (
            <>
              <IonButton
                fill="clear"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(section);
                }}
                className="desktop-edit-button"
                title="Editar sección"
                color="primary"
              >
                <IonIcon icon={createOutline} />
              </IonButton>
              <IonButton
                fill="clear"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(section.id);
                }}
                className="desktop-delete-button"
                title="Eliminar sección"
                color="danger"
              >
                <IonIcon icon={trashOutline} />
              </IonButton>
            </>
          )}
        </IonItem>

        {/* Opciones deslizables (editar y eliminar) - solo admin en móvil */}
        {isAdmin && !isDesktop && (
          <IonItemOptions side="end">
            <IonItemOption
              color="secondary"
              onClick={() => onEdit(section)}
            >
              <IonIcon icon={createOutline} />
              Editar
            </IonItemOption>
            <IonItemOption
              color="danger"
              onClick={() => onDelete(section.id)}
            >
              <IonIcon icon={trashOutline} />
              Eliminar
            </IonItemOption>
          </IonItemOptions>
        )}
      </IonItemSliding>

      {/* Renderizar hijos recursivamente */}
      {hasChildren && isExpanded && (
        <IonList className="children-list">
          {section.children.map((child) => (
            <SectionItem
              key={child.id}
              section={child}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
              searchQuery={searchQuery}
              onDragStart={onDragStart}
              onDragOver={onDragOver}
              onDrop={onDrop}
              onDragEnd={onDragEnd}
              isAdmin={isAdmin}
              editMode={editMode}
              isSelected={selectedItems.has(child.id)}
              onToggleSelect={onToggleSelect}
              selectedItems={selectedItems}
            />
          ))}
        </IonList>
      )}
    </div>
  );
};

export default SectionItem;
