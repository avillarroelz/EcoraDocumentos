import React from 'react';
import {
  IonChip,
  IonLabel,
  IonIcon,
  IonButton,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import {
  folderOutline,
  documentOutline,
  calendarOutline,
  funnelOutline,
  swapVerticalOutline
} from 'ionicons/icons';
import './AdvancedFilters.css';

const AdvancedFilters = ({
  typeFilter,
  onTypeFilterChange,
  dateFilter,
  onDateFilterChange,
  sortBy,
  onSortByChange,
  onClearAllFilters,
  hasActiveFilters
}) => {
  const [showFilters, setShowFilters] = React.useState(false);

  return (
    <div className="advanced-filters-container">
      {/* Toggle button para mostrar/ocultar filtros */}
      <div className="filters-header">
        <IonButton
          fill="clear"
          size="small"
          onClick={() => setShowFilters(!showFilters)}
          className="toggle-filters-button"
        >
          <IonIcon icon={funnelOutline} slot="start" />
          {showFilters ? 'Ocultar Filtros' : 'Mostrar Filtros Avanzados'}
        </IonButton>
        {hasActiveFilters && (
          <IonButton
            fill="clear"
            size="small"
            color="danger"
            onClick={onClearAllFilters}
            className="clear-all-button"
          >
            Limpiar Todo
          </IonButton>
        )}
      </div>

      {/* Panel de filtros expandible */}
      {showFilters && (
        <div className="filters-panel">
          {/* Filtro por Tipo */}
          <div className="filter-group">
            <div className="filter-label">
              <IonIcon icon={documentOutline} />
              <span>Tipo:</span>
            </div>
            <div className="filter-options">
              <IonChip
                onClick={() => onTypeFilterChange('all')}
                className={`filter-chip ${typeFilter === 'all' ? 'active' : ''}`}
              >
                <IonLabel>Todos</IonLabel>
              </IonChip>
              <IonChip
                onClick={() => onTypeFilterChange('folder')}
                className={`filter-chip ${typeFilter === 'folder' ? 'active' : ''}`}
              >
                <IonIcon icon={folderOutline} />
                <IonLabel>Carpetas</IonLabel>
              </IonChip>
              <IonChip
                onClick={() => onTypeFilterChange('file')}
                className={`filter-chip ${typeFilter === 'file' ? 'active' : ''}`}
              >
                <IonIcon icon={documentOutline} />
                <IonLabel>Archivos</IonLabel>
              </IonChip>
            </div>
          </div>

          {/* Filtro por Fecha */}
          <div className="filter-group">
            <div className="filter-label">
              <IonIcon icon={calendarOutline} />
              <span>Creado:</span>
            </div>
            <div className="filter-options">
              <IonChip
                onClick={() => onDateFilterChange('all')}
                className={`filter-chip ${dateFilter === 'all' ? 'active' : ''}`}
              >
                <IonLabel>Todos</IonLabel>
              </IonChip>
              <IonChip
                onClick={() => onDateFilterChange('today')}
                className={`filter-chip ${dateFilter === 'today' ? 'active' : ''}`}
              >
                <IonLabel>Hoy</IonLabel>
              </IonChip>
              <IonChip
                onClick={() => onDateFilterChange('week')}
                className={`filter-chip ${dateFilter === 'week' ? 'active' : ''}`}
              >
                <IonLabel>Esta Semana</IonLabel>
              </IonChip>
              <IonChip
                onClick={() => onDateFilterChange('month')}
                className={`filter-chip ${dateFilter === 'month' ? 'active' : ''}`}
              >
                <IonLabel>Este Mes</IonLabel>
              </IonChip>
              <IonChip
                onClick={() => onDateFilterChange('older')}
                className={`filter-chip ${dateFilter === 'older' ? 'active' : ''}`}
              >
                <IonLabel>Más Antiguos</IonLabel>
              </IonChip>
            </div>
          </div>

          {/* Ordenamiento */}
          <div className="filter-group">
            <div className="filter-label">
              <IonIcon icon={swapVerticalOutline} />
              <span>Ordenar por:</span>
            </div>
            <div className="filter-options">
              <IonSelect
                value={sortBy}
                onIonChange={(e) => onSortByChange(e.detail.value)}
                interface="popover"
                className="sort-select"
              >
                <IonSelectOption value="name-asc">Nombre (A-Z)</IonSelectOption>
                <IonSelectOption value="name-desc">Nombre (Z-A)</IonSelectOption>
                <IonSelectOption value="date-desc">Más Recientes</IonSelectOption>
                <IonSelectOption value="date-asc">Más Antiguos</IonSelectOption>
                <IonSelectOption value="type">Por Tipo</IonSelectOption>
              </IonSelect>
            </div>
          </div>

          {/* Contador de filtros activos */}
          {hasActiveFilters && (
            <div className="active-filters-indicator">
              <span>
                {(typeFilter !== 'all' ? 1 : 0) +
                  (dateFilter !== 'all' ? 1 : 0) +
                  (sortBy !== 'name-asc' ? 1 : 0)}{' '}
                filtro(s) activo(s)
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdvancedFilters;
