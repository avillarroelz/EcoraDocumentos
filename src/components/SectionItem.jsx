import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import {
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonList,
  IonItemSliding,
  IonItemOptions,
  IonItemOption
} from '@ionic/react';
import {
  chevronDownOutline,
  chevronForwardOutline,
  addCircleOutline,
  createOutline,
  trashOutline,
  enterOutline
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
  isAdmin = false
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const hasChildren = section.children && section.children.length > 0;
  const history = useHistory();

  // Detectar cambios en el tamaño de la ventana
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleViewDetail = (e) => {
    e.stopPropagation();
    // Si tiene enlace de Google Drive, abrirlo en nueva pestaña
    if (section.driveMetadata && section.driveMetadata.webViewLink) {
      window.open(section.driveMetadata.webViewLink, '_blank');
    } else {
      // Si no tiene enlace de Drive, navegar a la página de detalle
      history.push(`/section/${section.id}`);
    }
  };

  // Calcular indentación basada en el nivel
  const indentStyle = {
    paddingLeft: `${level * 1.5 + 1}rem`
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
          className={`section-item level-${level}`}
          style={indentStyle}
          button={hasChildren}
          onClick={hasChildren ? toggleExpand : undefined}
        >
          {/* Icono de expansión */}
          {hasChildren && (
            <IonIcon
              slot="start"
              icon={isExpanded ? chevronDownOutline : chevronForwardOutline}
              className="expand-icon"
            />
          )}

          {/* Línea vertical de jerarquía */}
          {level > 0 && <div className="hierarchy-line" />}

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
            />
          ))}
        </IonList>
      )}
    </div>
  );
};

export default SectionItem;
