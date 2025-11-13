import React from 'react';
import {
  IonSearchbar,
  IonToolbar,
  IonChip,
  IonLabel,
  IonIcon
} from '@ionic/react';
import { closeCircleOutline } from 'ionicons/icons';
import './SearchBar.css';

const SearchBar = ({ searchQuery, onSearchChange, resultsCount }) => {
  return (
    <div className="search-container">
      <IonToolbar className="search-toolbar">
        <IonSearchbar
          value={searchQuery}
          onIonInput={(e) => onSearchChange(e.detail.value)}
          placeholder="Buscar secciones..."
          debounce={300}
          animated
          className="ecora-searchbar"
        />
      </IonToolbar>

      {searchQuery && (
        <div className="search-results-info">
          <IonChip className="results-chip" color="secondary">
            <IonLabel>
              {resultsCount} {resultsCount === 1 ? 'resultado' : 'resultados'}
            </IonLabel>
            <IonIcon
              icon={closeCircleOutline}
              onClick={() => onSearchChange('')}
            />
          </IonChip>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
