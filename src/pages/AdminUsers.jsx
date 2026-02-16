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
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonChip,
  IonAvatar,
  IonModal,
  IonButtons,
  IonSelect,
  IonSelectOption,
  IonToggle,
  IonRefresher,
  IonRefresherContent,
  IonSpinner,
  IonToast
} from '@ionic/react';
import {
  personCircleOutline,
  shieldCheckmarkOutline,
  businessOutline,
  checkmarkCircle,
  closeCircle,
  createOutline,
  arrowBack
} from 'ionicons/icons';
import Navbar from '../components/Navbar';
import { API_BASE } from '../config/api';
import './AdminUsers.css';

const AdminUsers = ({ user, onLogout }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [lineasNegocio, setLineasNegocio] = useState([]);
  const [unidadesNegocio, setUnidadesNegocio] = useState([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', color: 'success' });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [usuarios, searchText, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadUsuarios(),
        loadRoles(),
        loadLineasNegocio(),
        loadUnidadesNegocio()
      ]);
    } catch (error) {
      console.error('Error cargando datos:', error);
      showToast('Error cargando datos', 'danger');
    } finally {
      setLoading(false);
    }
  };

  const loadUsuarios = async () => {
    try {
      const response = await fetch(`${API_BASE}/users`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        console.error('❌ No autorizado - Redirigiendo al login');
        showToast('Sesión expirada. Por favor, inicia sesión nuevamente', 'warning');
        // Podrías redirigir al login aquí si lo deseas
        return;
      }

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      console.log('👥 Usuarios cargados:', data);

      if (data.success) {
        setUsuarios(data.data || []);
      } else {
        console.error('Error en respuesta:', data.error);
        showToast(data.error || 'Error cargando usuarios', 'danger');
      }
    } catch (error) {
      console.error('Error cargando usuarios:', error);
      showToast('Error de conexión al cargar usuarios', 'danger');
    }
  };

  const loadRoles = async () => {
    const response = await fetch(`${API_BASE}/users/system/roles`, {
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      setRoles(data.data);
    }
  };

  const loadLineasNegocio = async () => {
    const response = await fetch(`${API_BASE}/organization/business-lines`, {
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      setLineasNegocio(data.data);
    }
  };

  const loadUnidadesNegocio = async () => {
    const response = await fetch(`${API_BASE}/organization/business-units`, {
      credentials: 'include'
    });
    const data = await response.json();
    if (data.success) {
      setUnidadesNegocio(data.data);
    }
  };

  const filterUsers = () => {
    let filtered = usuarios;

    // Filtrar por búsqueda
    if (searchText) {
      filtered = filtered.filter(u =>
        u.nombre.toLowerCase().includes(searchText.toLowerCase()) ||
        u.email.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Filtrar por estado
    if (filterStatus === 'active') {
      filtered = filtered.filter(u => u.estado);
    } else if (filterStatus === 'inactive') {
      filtered = filtered.filter(u => !u.estado);
    }

    setFilteredUsuarios(filtered);
  };

  const handleEditUser = (usuario) => {
    setSelectedUser(usuario);
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    try {
      const roleIds = selectedUser.roles.map(r => r.id);
      const unidadNegocioIds = selectedUser.unidadesNegocio.map(u => u.id);

      const response = await fetch(`${API_BASE}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          nombre: selectedUser.nombre,
          estado: selectedUser.estado,
          roleIds,
          unidadNegocioIds
        })
      });

      const data = await response.json();

      if (data.success) {
        showToast('Usuario actualizado exitosamente', 'success');
        setShowEditModal(false);
        loadUsuarios();
      } else {
        showToast(data.message || 'Error actualizando usuario', 'danger');
      }
    } catch (error) {
      console.error('Error guardando usuario:', error);
      showToast('Error guardando cambios', 'danger');
    }
  };

  const handleToggleStatus = async (usuario) => {
    try {
      const endpoint = usuario.estado ? 'deactivate' : 'activate';
      const response = await fetch(`${API_BASE}/users/${usuario.id}/${endpoint}`, {
        method: 'POST',
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        showToast(`Usuario ${usuario.estado ? 'desactivado' : 'activado'} exitosamente`, 'success');
        loadUsuarios();
      } else {
        showToast(data.message || 'Error cambiando estado', 'danger');
      }
    } catch (error) {
      console.error('Error cambiando estado:', error);
      showToast('Error cambiando estado del usuario', 'danger');
    }
  };

  const showToast = (message, color) => {
    setToast({ show: true, message, color });
  };

  const getRoleBadgeColor = (roleName) => {
    const colors = {
      super_admin: 'danger',
      admin: 'warning',
      manager: 'tertiary',
      user: 'primary',
      viewer: 'medium'
    };
    return colors[roleName] || 'primary';
  };

  const handleRefresh = async (event) => {
    await loadData();
    event.detail.complete();
  };

  if (loading) {
    return (
      <IonPage>
        <Navbar user={user} onLogout={onLogout} />
        <IonContent className="ion-padding">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <IonSpinner name="crescent" color="primary" />
            <p style={{ marginLeft: '16px', color: 'var(--ecora-blue-primary)' }}>Cargando usuarios...</p>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <Navbar user={user} onLogout={onLogout} />

      <IonContent className="admin-users-content">
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {/* Header con gradiente */}
        <div className="users-content-header">
          <div className="users-header-gradient">
            <div className="users-header-content">
              <IonIcon icon={personCircleOutline} className="users-header-icon" />
              <div className="users-header-text">
                <h1 className="users-page-title">Gestión de Usuarios</h1>
                <p className="users-page-subtitle">Administra roles, permisos y accesos de los usuarios</p>
              </div>
            </div>

            {/* Barra de búsqueda integrada */}
            <IonSearchbar
              value={searchText}
              onIonInput={e => setSearchText(e.detail.value)}
              placeholder="Buscar por nombre o email..."
              animated
              className="users-searchbar"
            />

            {/* Segmento de filtros */}
            <IonSegment value={filterStatus} onIonChange={e => setFilterStatus(e.detail.value)} className="users-segment">
              <IonSegmentButton value="all">
                <IonLabel>Todos</IonLabel>
                <IonBadge className="segment-badge">{usuarios.length}</IonBadge>
              </IonSegmentButton>
              <IonSegmentButton value="active">
                <IonLabel>Activos</IonLabel>
                <IonBadge className="segment-badge">{usuarios.filter(u => u.estado).length}</IonBadge>
              </IonSegmentButton>
              <IonSegmentButton value="inactive">
                <IonLabel>Inactivos</IonLabel>
                <IonBadge className="segment-badge">{usuarios.filter(u => !u.estado).length}</IonBadge>
              </IonSegmentButton>
            </IonSegment>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="users-stats-container">
          <div className="users-stats-grid">
            <div className="users-stat-card">
              <div className="users-stat-icon-wrapper total">
                <IonIcon icon={personCircleOutline} className="users-stat-icon" />
              </div>
              <div className="users-stat-content">
                <div className="users-stat-value">{usuarios.length}</div>
                <div className="users-stat-label">Total Usuarios</div>
              </div>
            </div>
            <div className="users-stat-card">
              <div className="users-stat-icon-wrapper active">
                <IonIcon icon={checkmarkCircle} className="users-stat-icon" />
              </div>
              <div className="users-stat-content">
                <div className="users-stat-value">{usuarios.filter(u => u.estado).length}</div>
                <div className="users-stat-label">Activos</div>
              </div>
            </div>
            <div className="users-stat-card">
              <div className="users-stat-icon-wrapper roles">
                <IonIcon icon={shieldCheckmarkOutline} className="users-stat-icon" />
              </div>
              <div className="users-stat-content">
                <div className="users-stat-value">{roles.length}</div>
                <div className="users-stat-label">Roles Disponibles</div>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de usuarios */}
        <div className="users-list-container">
          {filteredUsuarios.map(usuario => (
            <div key={usuario.id} className="user-card-modern">
              {/* Header de la card */}
              <div className="user-card-header">
                <div className="user-info-main">
                  <div className="user-avatar-wrapper">
                    {usuario.fotoPerfil ? (
                      <img src={usuario.fotoPerfil} alt={usuario.nombre} className="user-avatar-modern" />
                    ) : (
                      <div className="user-avatar-placeholder">
                        <IonIcon icon={personCircleOutline} />
                      </div>
                    )}
                    <div className={`user-status-indicator ${usuario.estado ? 'active' : 'inactive'}`} />
                  </div>
                  <div className="user-details">
                    <h3 className="user-name-modern">{usuario.nombre}</h3>
                    <p className="user-email-modern">{usuario.email}</p>
                  </div>
                </div>
                <div className="user-actions-modern">
                  <div className={`status-badge-modern ${usuario.estado ? 'active' : 'inactive'}`}>
                    <IonIcon icon={usuario.estado ? checkmarkCircle : closeCircle} />
                    <span>{usuario.estado ? 'Activo' : 'Inactivo'}</span>
                  </div>
                  <IonButton className="edit-button-modern" onClick={() => handleEditUser(usuario)}>
                    <IonIcon icon={createOutline} slot="start" />
                    Editar
                  </IonButton>
                </div>
              </div>

              {/* Body de la card */}
              <div className="user-card-body">
                {/* Roles */}
                {usuario.roles && usuario.roles.length > 0 && (
                  <div className="user-section">
                    <div className="section-header">
                      <IonIcon icon={shieldCheckmarkOutline} className="section-icon" />
                      <span className="section-title">Roles</span>
                    </div>
                    <div className="roles-container-modern">
                      {usuario.roles.map(rol => (
                        <div key={rol.id} className={`role-chip-modern ${rol.nombre}`}>
                          <IonIcon icon={shieldCheckmarkOutline} />
                          <span>{rol.nombreDescriptivo}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Unidades de Negocio */}
                {usuario.unidadesNegocio && usuario.unidadesNegocio.length > 0 && (
                  <div className="user-section">
                    <div className="section-header">
                      <IonIcon icon={businessOutline} className="section-icon" />
                      <span className="section-title">Unidades de Negocio</span>
                      <IonBadge className="section-count">{usuario.unidadesNegocio.length}</IonBadge>
                    </div>
                    <div className="units-container-modern">
                      {usuario.unidadesNegocio.map(unidad => (
                        <div key={unidad.id} className="unit-badge-modern">
                          <IonIcon icon={businessOutline} />
                          <span>{unidad.nombre}</span>
                          {unidad.lineaNegocio && (
                            <span className="unit-line">· {unidad.lineaNegocio.nombre}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredUsuarios.length === 0 && (
            <div className="users-empty-state">
              <div className="users-empty-icon-wrapper">
                <IonIcon icon={personCircleOutline} className="users-empty-icon" />
              </div>
              <h3 className="users-empty-title">No se encontraron usuarios</h3>
              <p className="users-empty-description">
                {searchText
                  ? `No hay usuarios que coincidan con "${searchText}"`
                  : filterStatus === 'active'
                  ? 'No hay usuarios activos en este momento'
                  : filterStatus === 'inactive'
                  ? 'No hay usuarios inactivos'
                  : 'Aún no hay usuarios registrados en el sistema'
                }
              </p>
            </div>
          )}
        </div>

        {/* Modal de Edición */}
        <IonModal isOpen={showEditModal} onDidDismiss={() => setShowEditModal(false)}>
          <IonHeader>
            <IonToolbar color="primary">
              <IonTitle>Editar Usuario</IonTitle>
              <IonButtons slot="end">
                <IonButton onClick={() => setShowEditModal(false)}>Cerrar</IonButton>
              </IonButtons>
            </IonToolbar>
          </IonHeader>
          <IonContent className="ion-padding">
            {selectedUser && (
              <>
                <IonCard className="edit-modal-card">
                  <IonCardHeader>
                    <IonCardTitle>Información Básica</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonItem lines="none">
                      <IonLabel position="stacked" style={{ color: 'var(--ecora-blue-primary)', fontWeight: 600 }}>Nombre</IonLabel>
                      <p style={{ padding: '8px 0', fontSize: '15px' }}>{selectedUser.nombre}</p>
                    </IonItem>
                    <IonItem lines="none">
                      <IonLabel position="stacked" style={{ color: 'var(--ecora-blue-primary)', fontWeight: 600 }}>Email</IonLabel>
                      <p style={{ padding: '8px 0', fontSize: '15px', color: '#6b7280' }}>{selectedUser.email}</p>
                    </IonItem>
                    <IonItem lines="none">
                      <IonLabel style={{ color: 'var(--ecora-blue-primary)', fontWeight: 600 }}>Estado</IonLabel>
                      <IonToggle
                        checked={selectedUser.estado}
                        onIonChange={e => setSelectedUser({...selectedUser, estado: e.detail.checked})}
                        color="success"
                      />
                    </IonItem>
                  </IonCardContent>
                </IonCard>

                <IonCard className="edit-modal-card">
                  <IonCardHeader>
                    <IonCardTitle>Roles</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonItem lines="none">
                      <IonLabel style={{ color: 'var(--ecora-blue-primary)', fontWeight: 600 }}>Seleccionar Roles</IonLabel>
                      <IonSelect
                        multiple
                        value={selectedUser.roles.map(r => r.id)}
                        onIonChange={e => {
                          const selectedRoles = roles.filter(r => e.detail.value.includes(r.id));
                          setSelectedUser({...selectedUser, roles: selectedRoles});
                        }}
                        interface="alert"
                      >
                        {roles.map(rol => (
                          <IonSelectOption key={rol.id} value={rol.id}>
                            {rol.nombreDescriptivo}
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  </IonCardContent>
                </IonCard>

                <IonCard className="edit-modal-card">
                  <IonCardHeader>
                    <IonCardTitle>Unidades de Negocio</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <IonItem lines="none">
                      <IonLabel style={{ color: 'var(--ecora-blue-primary)', fontWeight: 600 }}>Seleccionar Unidades</IonLabel>
                      <IonSelect
                        multiple
                        value={selectedUser.unidadesNegocio.map(u => u.id)}
                        onIonChange={e => {
                          const selectedUnidades = unidadesNegocio.filter(u => e.detail.value.includes(u.id));
                          setSelectedUser({...selectedUser, unidadesNegocio: selectedUnidades});
                        }}
                        interface="alert"
                      >
                        {unidadesNegocio.map(unidad => (
                          <IonSelectOption key={unidad.id} value={unidad.id}>
                            {unidad.nombre} ({unidad.lineaNegocio?.nombre})
                          </IonSelectOption>
                        ))}
                      </IonSelect>
                    </IonItem>
                  </IonCardContent>
                </IonCard>

                <IonButton className="modal-save-button" expand="block" onClick={handleSaveUser}>
                  Guardar Cambios
                </IonButton>
                <IonButton
                  className="modal-toggle-button"
                  expand="block"
                  fill="outline"
                  onClick={() => handleToggleStatus(selectedUser)}
                  color={selectedUser.estado ? 'danger' : 'success'}
                >
                  <IonIcon icon={selectedUser.estado ? closeCircle : checkmarkCircle} slot="start" />
                  {selectedUser.estado ? 'Desactivar Usuario' : 'Activar Usuario'}
                </IonButton>
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

export default AdminUsers;
