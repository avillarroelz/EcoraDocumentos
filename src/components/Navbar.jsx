import React, { useState, useEffect } from 'react';
import {
  IonHeader,
  IonToolbar,
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

  const isSuperAdmin = user?.roles?.includes('super_admin');

  useEffect(() => {
    setImageError(false);
  }, [user?.picture, user?.fotoPerfil, user?.email]);

  const isActive = (path) => location.pathname === path;

  return (
    <IonHeader className="ecora-header">
      <IonToolbar className="ecora-toolbar">

        {/* Logo */}
        <div slot="start" className="navbar-logo-wrap">
          <img
            src="/assets/ecora-logo-white.png"
            alt="Ecora Logo"
            className="navbar-logo"
            onClick={() => history.push('/home')}
          />
        </div>

        {/* Acciones agrupadas */}
        <div slot="end" className="navbar-actions">

          {location.pathname !== '/home' && (
            <IonButton
              fill="clear"
              color="light"
              onClick={() => history.push('/home')}
              className={`nav-btn${isActive('/home') ? ' nav-btn--active' : ''}`}
              title="Inicio"
            >
              <IonIcon icon={homeOutline} slot="icon-only" />
            </IonButton>
          )}

          {isSuperAdmin && (
            <IonButton
              fill="clear"
              color="light"
              onClick={() => history.push('/admin/users')}
              className={`nav-btn${isActive('/admin/users') ? ' nav-btn--active' : ''}`}
              title="Gestión de Usuarios"
            >
              <IonIcon icon={peopleOutline} slot="icon-only" />
            </IonButton>
          )}

          {isSuperAdmin && (
            <IonButton
              fill="clear"
              color="light"
              onClick={() => history.push('/admin/organization')}
              className={`nav-btn${isActive('/admin/organization') ? ' nav-btn--active' : ''}`}
              title="Gestión de Organización"
            >
              <IonIcon icon={businessOutline} slot="icon-only" />
            </IonButton>
          )}

          {isSuperAdmin && <div className="navbar-divider" />}

          {/* Avatar y nombre */}
          {user && (
            <div className="user-info">
              <div className="user-avatar-ring">
                {(user.picture || user.fotoPerfil) && !imageError ? (
                  <img
                    key={`avatar-${user.email}-${user.picture || user.fotoPerfil}`}
                    src={user.picture || user.fotoPerfil}
                    alt={user.name || user.nombre}
                    className="user-avatar-image"
                    onError={() => setImageError(true)}
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="user-avatar-initial">
                    {(user.name || user.nombre || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="user-name">{user.name || user.nombre}</span>
            </div>
          )}

          <div className="navbar-divider" />

          {/* Logout */}
          <IonButton
            fill="clear"
            color="light"
            onClick={onLogout}
            className="nav-btn nav-btn--logout"
            title="Cerrar sesión"
          >
            <IonIcon icon={logOutOutline} slot="icon-only" />
          </IonButton>

        </div>
      </IonToolbar>
    </IonHeader>
  );
};

export default Navbar;
