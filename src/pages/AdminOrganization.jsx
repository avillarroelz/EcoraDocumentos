import React, { useState, useEffect } from 'react';
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonList,
  IonItem,
  IonLabel,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonFab,
  IonFabButton,
  IonModal,
  IonButtons,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonToast,
  IonAccordionGroup,
  IonAccordion,
  IonItemDivider,
  IonCheckbox,
  IonAvatar,
  IonSearchbar
} from '@ionic/react';
import {
  businessOutline,
  addOutline,
  createOutline,
  trashOutline,
  arrowBack,
  chevronForwardOutline,
  peopleOutline,
  personCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';
import Navbar from '../components/Navbar';
import { API_BASE } from '../config/api';
import './AdminOrganization.css';

const AdminOrganization = ({ user, onLogout }) => {
  const [jerarquia, setJerarquia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLineaModal, setShowLineaModal] = useState(false);
  const [showUnidadModal, setShowUnidadModal] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [editingLinea, setEditingLinea] = useState(null);
  const [editingUnidad, setEditingUnidad] = useState(null);
  const [selectedUnidad, setSelectedUnidad] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });

  const [lineaForm, setLineaForm] = useState({ nombre: '', descripcion: '' });
  const [unidadForm, setUnidadForm] = useState({ nombre: '', descripcion: '', lineaNegocioId: '' });

  // Estados para gestión de usuarios
  const [usuariosAsignados, setUsuariosAsignados] = useState([]);
  const [usuariosDisponibles, setUsuariosDisponibles] = useState([]);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    loadJerarquia();
  }, []);

  const loadJerarquia = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/organization/hierarchy`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setJerarquia(data.data);
      }
    } catch (error) {
      console.error('Error cargando jerarquía:', error);
      showToast('Error cargando datos', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLinea = async () => {
    try {
      const response = await fetch(`${API_BASE}/organization/business-lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(lineaForm)
      });

      const data = await response.json();

      if (data.success) {
        showToast('Línea de negocio creada exitosamente', 'success');
        setShowLineaModal(false);
        setLineaForm({ nombre: '', descripcion: '' });
        loadJerarquia();
      } else {
        showToast(data.message || 'Error creando línea de negocio', 'danger');
      }
    } catch (error) {
      console.error('Error creando línea:', error);
      showToast('Error creando línea de negocio', 'danger');
    }
  };

  const handleUpdateLinea = async () => {
    try {
      const response = await fetch(`${API_BASE}/organization/business-lines/${editingLinea.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(lineaForm)
      });

      const data = await response.json();

      if (data.success) {
        showToast('Línea de negocio actualizada exitosamente', 'success');
        setShowLineaModal(false);
        setEditingLinea(null);
        setLineaForm({ nombre: '', descripcion: '' });
        loadJerarquia();
      } else {
        showToast(data.message || 'Error actualizando línea de negocio', 'danger');
      }
    } catch (error) {
      console.error('Error actualizando línea:', error);
      showToast('Error actualizando línea de negocio', 'danger');
    }
  };

  const handleDeleteLinea = async (lineaId) => {
    if (!window.confirm('¿Está seguro de eliminar esta línea de negocio? Se eliminarán todas sus unidades.')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/organization/business-lines/${lineaId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        showToast('Línea de negocio eliminada exitosamente', 'success');
        loadJerarquia();
      } else {
        showToast(data.message || 'Error eliminando línea de negocio', 'danger');
      }
    } catch (error) {
      console.error('Error eliminando línea:', error);
      showToast('Error eliminando línea de negocio', 'danger');
    }
  };

  const handleCreateUnidad = async () => {
    try {
      const response = await fetch(`${API_BASE}/organization/business-units`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(unidadForm)
      });

      const data = await response.json();

      if (data.success) {
        showToast('Unidad de negocio creada exitosamente', 'success');
        setShowUnidadModal(false);
        setUnidadForm({ nombre: '', descripcion: '', lineaNegocioId: '' });
        loadJerarquia();
      } else {
        showToast(data.message || 'Error creando unidad de negocio', 'danger');
      }
    } catch (error) {
      console.error('Error creando unidad:', error);
      showToast('Error creando unidad de negocio', 'danger');
    }
  };

  const handleUpdateUnidad = async () => {
    try {
      const response = await fetch(`${API_BASE}/organization/business-units/${editingUnidad.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(unidadForm)
      });

      const data = await response.json();

      if (data.success) {
        showToast('Unidad de negocio actualizada exitosamente', 'success');
        setShowUnidadModal(false);
        setEditingUnidad(null);
        setUnidadForm({ nombre: '', descripcion: '', lineaNegocioId: '' });
        loadJerarquia();
      } else {
        showToast(data.message || 'Error actualizando unidad de negocio', 'danger');
      }
    } catch (error) {
      console.error('Error actualizando unidad:', error);
      showToast('Error actualizando unidad de negocio', 'danger');
    }
  };

  const handleDeleteUnidad = async (unidadId) => {
    if (!window.confirm('¿Está seguro de eliminar esta unidad de negocio?')) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/organization/business-units/${unidadId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        showToast('Unidad de negocio eliminada exitosamente', 'success');
        loadJerarquia();
      } else {
        showToast(data.message || 'Error eliminando unidad de negocio', 'danger');
      }
    } catch (error) {
      console.error('Error eliminando unidad:', error);
      showToast('Error eliminando unidad de negocio', 'danger');
    }
  };

  const openNewLineaModal = () => {
    setEditingLinea(null);
    setLineaForm({ nombre: '', descripcion: '' });
    setShowLineaModal(true);
  };

  const openEditLineaModal = (linea) => {
    setEditingLinea(linea);
    setLineaForm({ nombre: linea.nombre, descripcion: linea.descripcion || '' });
    setShowLineaModal(true);
  };

  const openNewUnidadModal = (lineaId = '') => {
    setEditingUnidad(null);
    setUnidadForm({ nombre: '', descripcion: '', lineaNegocioId: lineaId });
    setShowUnidadModal(true);
  };

  const openEditUnidadModal = (unidad) => {
    setEditingUnidad(unidad);
    setUnidadForm({
      nombre: unidad.nombre,
      descripcion: unidad.descripcion || '',
      lineaNegocioId: unidad.lineaNegocioId
    });
    setShowUnidadModal(true);
  };

  const showToast = (message, color) => {
    setToast({ show: true, message, color });
  };

  const handleRefresh = async (event) => {
    await loadJerarquia();
    event.detail.complete();
  };

  // ========================================
  // GESTIÓN DE USUARIOS EN UNIDADES
  // ========================================

  const openUsersModal = async (unidad) => {
    setSelectedUnidad(unidad);
    setLoadingUsers(true);
    setShowUsersModal(true);
    setSearchText('');

    try {
      // Cargar usuarios asignados y disponibles en paralelo
      const [asignadosRes, disponiblesRes] = await Promise.all([
        fetch(`${API_BASE}/organization/business-units/${unidad.id}/users`, {
          credentials: 'include'
        }),
        fetch(`${API_BASE}/organization/business-units/${unidad.id}/available-users`, {
          credentials: 'include'
        })
      ]);

      const asignadosData = await asignadosRes.json();
      const disponiblesData = await disponiblesRes.json();

      if (asignadosData.success) {
        setUsuariosAsignados(asignadosData.data);
      }

      if (disponiblesData.success) {
        setUsuariosDisponibles(disponiblesData.data);
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showToast('Error cargando usuarios', 'danger');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleUsuario = (usuarioId) => {
    setUsuariosSeleccionados(prev => {
      if (prev.includes(usuarioId)) {
        return prev.filter(id => id !== usuarioId);
      } else {
        return [...prev, usuarioId];
      }
    });
  };

  const handleAsignarUsuarios = async () => {
    if (usuariosSeleccionados.length === 0) {
      showToast('Selecciona al menos un usuario', 'warning');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/organization/business-units/${selectedUnidad.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ usuarioIds: usuariosSeleccionados })
      });

      const data = await response.json();

      if (data.success) {
        showToast(data.message, 'success');
        setUsuariosSeleccionados([]);
        // Recargar listas
        await openUsersModal(selectedUnidad);
      } else {
        showToast(data.message || 'Error asignando usuarios', 'danger');
      }
    } catch (error) {
      console.error('Error asignando usuarios:', error);
      showToast('Error asignando usuarios', 'danger');
    }
  };

  const handleDesasignarUsuario = async (usuarioId) => {
    if (!window.confirm('¿Desea desasignar este usuario de la unidad?')) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/organization/business-units/${selectedUnidad.id}/users/${usuarioId}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (data.success) {
        showToast(data.message, 'success');
        // Recargar listas
        await openUsersModal(selectedUnidad);
      } else {
        showToast(data.message || 'Error desasignando usuario', 'danger');
      }
    } catch (error) {
      console.error('Error desasignando usuario:', error);
      showToast('Error desasignando usuario', 'danger');
    }
  };

  const filteredUsuariosDisponibles = usuariosDisponibles.filter(usuario =>
    usuario.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
    usuario.email.toLowerCase().includes(searchText.toLowerCase())
  );

  if (loading) {
    return (
      <IonPage>
        <Navbar user={user} onLogout={onLogout} />
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" color="primary" />
            <p style={{ marginLeft: '16px', color: 'var(--ecora-blue-primary)' }}>Cargando organización...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <Navbar user={user} onLogout={onLogout} />

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Header con gradiente */}
        <div className="org-content-header">
          <div className="org-header-gradient">
            <div className="org-header-content">
              <IonIcon icon={businessOutline} className="org-header-icon" />
              <div className="org-header-text">
                <h1 className="org-page-title">Gestión de Organización</h1>
                <p className="org-page-subtitle">Administra la estructura organizacional de tu empresa</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="org-stats-container">
          <div className="org-stats-grid">
            <div className="org-stat-card">
              <div className="org-stat-icon-wrapper business">
                <IonIcon icon={businessOutline} className="org-stat-icon" />
              </div>
              <div className="org-stat-content">
                <div className="org-stat-value">{jerarquia.length}</div>
                <div className="org-stat-label">Líneas de Negocio</div>
              </div>
            </div>
            <div className="org-stat-card">
              <div className="org-stat-icon-wrapper units">
                <IonIcon icon={chevronForwardOutline} className="org-stat-icon" />
              </div>
              <div className="org-stat-content">
                <div className="org-stat-value">
                  {jerarquia.reduce((sum, linea) => sum + (linea.unidadesNegocio?.length || 0), 0)}
                </div>
                <div className="org-stat-label">Unidades de Negocio</div>
              </div>
            </div>
          </div>
        </div>

        {/* Jerarquía */}
        <div className="org-hierarchy-container">
          <IonAccordionGroup className="org-accordion-group">
            {jerarquia.map(linea => (
              <IonAccordion key={linea.id} value={linea.id} className="org-accordion">
                <IonItem slot="header" className="org-accordion-header">
                  <div className="org-linea-icon-wrapper">
                    <IonIcon icon={businessOutline} />
                  </div>
                  <IonLabel>
                    <h2 className="org-linea-title">{linea.nombre}</h2>
                    <p className="org-linea-description">{linea.descripcion}</p>
                  </IonLabel>
                  <IonBadge className="org-units-badge">
                    {linea.unidadesNegocio?.length || 0}
                  </IonBadge>
                </IonItem>

              <div slot="content" className="accordion-content">
                <IonList>
                  <IonItemDivider>
                    <IonLabel>Unidades de Negocio</IonLabel>
                    <IonButton size="small" onClick={() => openNewUnidadModal(linea.id)}>
                      <IonIcon icon={addOutline} slot="icon-only" />
                    </IonButton>
                  </IonItemDivider>

                  {linea.unidadesNegocio && linea.unidadesNegocio.length > 0 ? (
                    linea.unidadesNegocio.map(unidad => (
                      <IonItem key={unidad.id}>
                        <IonLabel>
                          <h3>{unidad.nombre}</h3>
                          <p>{unidad.descripcion}</p>
                        </IonLabel>
                        <IonButton fill="clear" color="secondary" onClick={() => openUsersModal(unidad)}>
                          <IonIcon icon={peopleOutline} slot="icon-only" />
                        </IonButton>
                        <IonButton fill="clear" onClick={() => openEditUnidadModal(unidad)}>
                          <IonIcon icon={createOutline} slot="icon-only" />
                        </IonButton>
                        <IonButton fill="clear" color="danger" onClick={() => handleDeleteUnidad(unidad.id)}>
                          <IonIcon icon={trashOutline} slot="icon-only" />
                        </IonButton>
                      </IonItem>
                    ))
                  ) : (
                    <IonItem>
                      <IonLabel color="medium">
                        <p style={{ textAlign: 'center', padding: '20px' }}>
                          No hay unidades de negocio en esta línea
                        </p>
                      </IonLabel>
                    </IonItem>
                  )}
                </IonList>

                <div style={{ padding: '16px', display: 'flex', gap: '8px' }}>
                  <IonButton expand="block" fill="outline" onClick={() => openEditLineaModal(linea)}>
                    <IonIcon icon={createOutline} slot="start" />
                    Editar Línea
                  </IonButton>
                  <IonButton
                    expand="block"
                    fill="outline"
                    color="danger"
                    onClick={() => handleDeleteLinea(linea.id)}
                  >
                    <IonIcon icon={trashOutline} slot="start" />
                    Eliminar
                  </IonButton>
                </div>
              </div>
            </IonAccordion>
          ))}
          </IonAccordionGroup>
        </div>

        {jerarquia.length === 0 && (
          <div className="org-empty-state">
            <div className="org-empty-icon-wrapper">
              <IonIcon icon={businessOutline} className="org-empty-icon" />
            </div>
            <h3 className="org-empty-title">No hay líneas de negocio</h3>
            <p className="org-empty-description">
              Crea tu primera línea de negocio para empezar a estructurar tu organización
            </p>
            <IonButton onClick={openNewLineaModal} className="org-empty-button">
              <IonIcon icon={addOutline} slot="start" />
              Crear Primera Línea
            </IonButton>
          </div>
        )}

        {/* FAB para crear línea */}
        <IonFab vertical="bottom" horizontal="end" slot="fixed">
          <IonFabButton onClick={openNewLineaModal}>
            <IonIcon icon={addOutline} />
          </IonFabButton>
        </IonFab>

        {/* Modal Línea de Negocio */}
        <IonModal isOpen={showLineaModal} onDidDismiss={() => setShowLineaModal(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>{editingLinea ? 'Editar' : 'Nueva'} Línea de Negocio</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowLineaModal(false)}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonList>
              <IonItem>
                <IonLabel position="stacked">Nombre *</IonLabel>
                <IonInput
                  value={lineaForm.nombre}
                  onIonInput={e => setLineaForm({...lineaForm, nombre: e.detail.value})}
                  placeholder="Ej: Construcción"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Descripción</IonLabel>
                <IonTextarea
                  value={lineaForm.descripcion}
                  onIonInput={e => setLineaForm({...lineaForm, descripcion: e.detail.value})}
                  placeholder="Descripción de la línea de negocio"
                  rows={4}
                />
              </IonItem>
            </IonList>

            <IonButton
              expand="block"
              onClick={editingLinea ? handleUpdateLinea : handleCreateLinea}
              disabled={!lineaForm.nombre}
              style={{ marginTop: '20px' }}
            >
              {editingLinea ? 'Actualizar' : 'Crear'} Línea de Negocio
            </IonButton>
          </IonContent>
        </IonModal>

        {/* Modal Unidad de Negocio */}
        <IonModal isOpen={showUnidadModal} onDidDismiss={() => setShowUnidadModal(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>{editingUnidad ? 'Editar' : 'Nueva'} Unidad de Negocio</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowUnidadModal(false)}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            <IonList>
              <IonItem>
                <IonLabel position="stacked">Línea de Negocio *</IonLabel>
                <IonSelect
                  value={unidadForm.lineaNegocioId}
                  onIonChange={e => setUnidadForm({...unidadForm, lineaNegocioId: e.detail.value})}
                  placeholder="Seleccionar línea"
                >
                  {jerarquia.map(linea => (
                    <IonSelectOption key={linea.id} value={linea.id}>
                      {linea.nombre}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Nombre *</IonLabel>
                <IonInput
                  value={unidadForm.nombre}
                  onIonInput={e => setUnidadForm({...unidadForm, nombre: e.detail.value})}
                  placeholder="Ej: Obras Civiles"
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">Descripción</IonLabel>
                <IonTextarea
                  value={unidadForm.descripcion}
                  onIonInput={e => setUnidadForm({...unidadForm, descripcion: e.detail.value})}
                  placeholder="Descripción de la unidad de negocio"
                  rows={4}
                />
              </IonItem>
            </IonList>

            <IonButton
              expand="block"
              onClick={editingUnidad ? handleUpdateUnidad : handleCreateUnidad}
              disabled={!unidadForm.nombre || !unidadForm.lineaNegocioId}
              style={{ marginTop: '20px' }}
            >
              {editingUnidad ? 'Actualizar' : 'Crear'} Unidad de Negocio
            </IonButton>
          </IonContent>
        </IonModal>

        {/* Modal Gestión de Usuarios */}
        <IonModal
          isOpen={showUsersModal}
          onDidDismiss={() => {
            setShowUsersModal(false);
            setUsuariosSeleccionados([]);
            setSearchText('');
          }}
        >
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>
                Gestionar Usuarios - {selectedUnidad?.nombre}
              </IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowUsersModal(false)}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {loadingUsers ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <IonSpinner name="crescent" color="primary" />
                <p style={{ marginLeft: '16px', color: 'var(--ecora-blue-primary)' }}>Cargando usuarios...</p>
              </div>
            ) : (
              <>
                {/* Usuarios Asignados */}
                <IonCard className="users-assign-card">
                  <IonCardHeader>
                    <IonCardTitle className="users-assign-title">
                      <IonIcon icon={peopleOutline} style={{ marginRight: '8px' }} />
                      Usuarios Asignados ({usuariosAsignados.length})
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {usuariosAsignados.length > 0 ? (
                      <IonList className="users-assign-list">
                        {usuariosAsignados.map(usuario => (
                          <IonItem key={usuario.id} className="assigned-user-item">
                            <IonAvatar slot="start">
                              {usuario.fotoPerfil ? (
                                <img src={usuario.fotoPerfil} alt={usuario.nombre} />
                              ) : (
                                <IonIcon icon={personCircleOutline} style={{ fontSize: '40px' }} />
                              )}
                            </IonAvatar>
                            <IonLabel>
                              <h3 className="user-name-assign">{usuario.nombre}</h3>
                              <p className="user-email-assign">{usuario.email}</p>
                              {usuario.roles && usuario.roles.length > 0 && (
                                <p className="user-roles-assign">
                                  {usuario.roles.map(r => r.nombreDescriptivo).join(', ')}
                                </p>
                              )}
                            </IonLabel>
                            <IonButton
                              fill="clear"
                              color="danger"
                              onClick={() => handleDesasignarUsuario(usuario.id)}
                            >
                              <IonIcon icon={closeCircleOutline} slot="icon-only" />
                            </IonButton>
                          </IonItem>
                        ))}
                      </IonList>
                    ) : (
                      <p style={{ textAlign: 'center', color: 'var(--ecora-gray-600)', padding: '20px' }}>
                        No hay usuarios asignados a esta unidad
                      </p>
                    )}
                  </IonCardContent>
                </IonCard>

                {/* Usuarios Disponibles */}
                <IonCard className="users-assign-card">
                  <IonCardHeader>
                    <IonCardTitle className="users-assign-title">
                      <IonIcon icon={addOutline} style={{ marginRight: '8px' }} />
                      Asignar Usuarios
                    </IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    {usuariosDisponibles.length > 0 ? (
                      <>
                        <IonSearchbar
                          value={searchText}
                          onIonInput={e => setSearchText(e.detail.value)}
                          placeholder="Buscar usuarios..."
                          className="users-assign-searchbar"
                        />

                        <IonList className="users-assign-list">
                          {filteredUsuariosDisponibles.map(usuario => (
                            <IonItem key={usuario.id} className="available-user-item">
                              <IonCheckbox
                                slot="start"
                                checked={usuariosSeleccionados.includes(usuario.id)}
                                onIonChange={() => handleToggleUsuario(usuario.id)}
                              />
                              <IonAvatar slot="start">
                                {usuario.fotoPerfil ? (
                                  <img src={usuario.fotoPerfil} alt={usuario.nombre} />
                                ) : (
                                  <IonIcon icon={personCircleOutline} style={{ fontSize: '40px' }} />
                                )}
                              </IonAvatar>
                              <IonLabel>
                                <h3 className="user-name-assign">{usuario.nombre}</h3>
                                <p className="user-email-assign">{usuario.email}</p>
                                {usuario.roles && usuario.roles.length > 0 && (
                                  <p className="user-roles-assign">
                                    {usuario.roles.map(r => r.nombreDescriptivo).join(', ')}
                                  </p>
                                )}
                              </IonLabel>
                            </IonItem>
                          ))}
                        </IonList>

                        {filteredUsuariosDisponibles.length === 0 && (
                          <p style={{ textAlign: 'center', color: 'var(--ecora-gray-600)', padding: '20px' }}>
                            No se encontraron usuarios
                          </p>
                        )}

                        {usuariosSeleccionados.length > 0 && (
                          <IonButton
                            expand="block"
                            onClick={handleAsignarUsuarios}
                            style={{ marginTop: '16px' }}
                          >
                            <IonIcon icon={addOutline} slot="start" />
                            Asignar {usuariosSeleccionados.length} Usuario{usuariosSeleccionados.length > 1 ? 's' : ''}
                          </IonButton>
                        )}
                      </>
                    ) : (
                      <p style={{ textAlign: 'center', color: 'var(--ecora-gray-600)', padding: '20px' }}>
                        No hay usuarios disponibles para asignar
                      </p>
                    )}
                  </IonCardContent>
                </IonCard>
              </>
            )}
          </IonContent>
        </IonModal>

        <IonToast
          isOpen={toast.show}
          onDidDismiss={() => setToast({ ...toast, show: false })}
          message={toast.message}
          duration={3000}
          color={toast.color}
        />
      </IonContent>
    </IonPage>
  );
};

export default AdminOrganization;
