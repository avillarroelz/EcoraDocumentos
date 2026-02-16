import React, { useState, useEffect } from 'react';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon
} from '@ionic/react';
import {
  logOutOutline,
  peopleOutline,
  businessOutline,
  homeOutline
} from 'ionicons/icons';
import { useHistory, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const history = useHistory();
  const location = useLocation();
  const [imageError, setImageError] = useState(false);

  // Verificar si el usuario es super_admin (solo super_admin puede gestionar)
  const isSuperAdmin = user?.roles?.includes('super_admin');
  const canManageUsers = isSuperAdmin;
  const canManageOrganization = isSuperAdmin;

  // Resetear error de imagen cuando cambia el usuario o su foto
  useEffect(() => {
    setImageError(false);
  }, [user?.picture, user?.fotoPerfil, user?.email]);

  // Handler para errores de carga de imagen
  const handleImageError = (e) => {
    console.warn('Error cargando imagen de perfil:', user?.picture || user?.fotoPerfil);
    setImageError(true);
  };

  return (
    <IonHeader>
      <IonToolbar color="primary">
        <div slot="start" style={{ display: 'flex', alignItems: 'center', paddingLeft: '16px' }}>
          <img
            src="/assets/ecora-logo-white.png"
            alt="Ecora Logo"
            style={{ height: '40px', objectFit: 'contain' }}
          />
        </div>

        {/* Botón de Home */}
        {location.pathname !== '/home' && (
          <IonButton
            slot="end"
            fill="clear"
            color="light"
            onClick={() => history.push('/home')}
            title="Ir al inicio"
            style={{ marginRight: '8px' }}
          >
            <IonIcon icon={homeOutline} slot="icon-only" />
          </IonButton>
        )}

        {/* Botones de Administración */}
        {canManageUsers && (
          <IonButton
            slot="end"
            fill="clear"
            color="light"
            onClick={() => history.push('/admin/users')}
            title="Gestión de Usuarios"
            style={{ marginRight: '8px' }}
          >
            <IonIcon icon={peopleOutline} slot="icon-only" />
          </IonButton>
        )}
        {canManageOrganization && (
          <IonButton
            slot="end"
            fill="clear"
            color="light"
            onClick={() => history.push('/admin/organization')}
            title="Gestión de Organización"
            style={{ marginRight: '8px' }}
          >
            <IonIcon icon={businessOutline} slot="icon-only" />
          </IonButton>
        )}

        {/* Avatar y nombre del usuario */}
        {user && (
          <div slot="end" className="user-info" style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
            {(user.picture || user.fotoPerfil) && !imageError ? (
              <img
                key={`avatar-${user.email}-${user.picture || user.fotoPerfil}`}
                src={user.picture || user.fotoPerfil}
                alt={user.name || user.nombre}
                className="user-avatar-image"
                onError={handleImageError}
                crossOrigin="anonymous"
              />
            ) : (
              <div className="user-avatar-initial">
                {(user.name || user.nombre || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <span className="user-name">
              {user.name || user.nombre}
            </span>
          </div>
        )}

        {/* Botón de Logout */}
        <IonButton
          slot="end"
          fill="clear"
          color="light"
          onClick={onLogout}
          title="Cerrar sesión"
          style={{ marginRight: '16px' }}
        >
          <IonIcon icon={logOutOutline} slot="icon-only" />
        </IonButton>
      </IonToolbar>
    </IonHeader>
  );
};

export default Navbar;
