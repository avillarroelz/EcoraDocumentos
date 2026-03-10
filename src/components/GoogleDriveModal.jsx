import React, { useState, useEffect, useCallback } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonButtons,
  IonIcon,
  IonText,
  IonSpinner
} from '@ionic/react';
import {
  closeOutline,
  logoGoogle,
  cloudDone,
  folderOutline,
  folderOpenOutline,
  chevronForwardOutline,
  homeOutline,
  arrowBackOutline,
  downloadOutline,
  checkmarkCircleOutline,
  peopleOutline,
  hardwareChipOutline
} from 'ionicons/icons';
import { API_BASE } from '../config/api';
import './GoogleDriveModal.css';

const ROOT_MYDRIVE = { id: 'root', name: 'Mi Drive', driveId: null };

const GoogleDriveModal = ({ isOpen, onClose, onImport }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [error, setError] = useState('');

  // Tabs: 'mydrive' | 'shared'
  const [activeTab, setActiveTab] = useState('mydrive');

  // Mi Drive
  const [myDriveBreadcrumb, setMyDriveBreadcrumb] = useState([ROOT_MYDRIVE]);
  const [myDriveFolders, setMyDriveFolders] = useState([]);
  const [myDriveSelected, setMyDriveSelected] = useState(null);

  // Unidades compartidas
  const [sharedDrives, setSharedDrives] = useState([]);
  const [loadingSharedDrives, setLoadingSharedDrives] = useState(false);
  const [activeDrive, setActiveDrive] = useState(null);       // drive que se está navegando
  const [selectedDrive, setSelectedDrive] = useState(null);   // drive seleccionado para importar (desde la lista)
  const [sharedBreadcrumb, setSharedBreadcrumb] = useState([]);
  const [sharedFolders, setSharedFolders] = useState([]);
  const [sharedSelected, setSharedSelected] = useState(null); // subcarpeta seleccionada dentro del drive

  // ── Auth ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) checkAuthStatus();
  }, [isOpen]);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch(`${API_BASE}/google/status`, { credentials: 'include' });
      const data = await res.json();
      setIsAuthenticated(data.authenticated);
      if (data.authenticated) {
        loadMyDriveFolders('root');
        loadSharedDrivesList();
      }
    } catch {
      setIsAuthenticated(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/google/auth`);
      const data = await res.json();
      if (!data.success || !data.authUrl) throw new Error();

      const w = 600, h = 700;
      const authWindow = window.open(
        data.authUrl, 'Google Auth',
        `width=${w},height=${h},left=${window.screen.width / 2 - w / 2},top=${window.screen.height / 2 - h / 2}`
      );

      const handleMsg = async (e) => {
        if (e.origin !== window.location.origin) return;
        if (e.data?.type === 'GOOGLE_AUTH_SUCCESS' || e.data?.type === 'GOOGLE_AUTH_ERROR') {
          window.removeEventListener('message', handleMsg);
          clearInterval(poll);
          setIsLoading(false);
          if (e.data.type === 'GOOGLE_AUTH_SUCCESS') await checkAuthStatus();
          else setError('Error al autenticar con Google');
        }
      };
      window.addEventListener('message', handleMsg);

      const poll = setInterval(async () => {
        try {
          if (authWindow.closed) {
            clearInterval(poll);
            window.removeEventListener('message', handleMsg);
            setIsLoading(false);
            await checkAuthStatus();
          }
        } catch { /* cross-origin */ }
      }, 500);
    } catch {
      setError('Error al conectar con Google Drive');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_BASE}/google/logout`, { method: 'POST', credentials: 'include' });
    } catch { /* ignorar */ }
    setIsAuthenticated(false);
    resetState();
  };

  const resetState = () => {
    setMyDriveBreadcrumb([ROOT_MYDRIVE]);
    setMyDriveFolders([]);
    setMyDriveSelected(null);
    setSharedDrives([]);
    setActiveDrive(null);
    setSelectedDrive(null);
    setSharedBreadcrumb([]);
    setSharedFolders([]);
    setSharedSelected(null);
    setActiveTab('mydrive');
  };

  // ── Mi Drive ──────────────────────────────────────────────────────────
  const loadMyDriveFolders = useCallback(async (folderId) => {
    setLoadingFolders(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/google/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scope: 'folder', folderId })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMyDriveFolders((data.data || []).filter(f => f.mimeType === 'application/vnd.google-apps.folder'));
    } catch {
      setError('Error al cargar carpetas de Mi Drive');
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  const navigateMyDrive = (folder) => {
    setMyDriveBreadcrumb(prev => [...prev, folder]);
    setMyDriveSelected(null);
    loadMyDriveFolders(folder.id);
  };

  const goBackMyDrive = (index) => {
    const crumb = myDriveBreadcrumb.slice(0, index + 1);
    setMyDriveBreadcrumb(crumb);
    setMyDriveSelected(null);
    loadMyDriveFolders(crumb[crumb.length - 1].id);
  };

  // ── Unidades compartidas ──────────────────────────────────────────────
  const loadSharedDrivesList = async () => {
    setLoadingSharedDrives(true);
    try {
      const res = await fetch(`${API_BASE}/google/shared-drives`, { credentials: 'include' });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSharedDrives(data.data || []);
    } catch {
      // silencioso — puede que no tenga unidades compartidas
    } finally {
      setLoadingSharedDrives(false);
    }
  };

  const enterSharedDrive = (drive) => {
    setActiveDrive(drive);
    setSharedBreadcrumb([{ id: drive.id, name: drive.name, driveId: drive.id }]);
    setSharedSelected(null);
    loadSharedFolders(drive.id, drive.id);
  };

  const loadSharedFolders = useCallback(async (folderId, driveId) => {
    setLoadingFolders(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/google/list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ scope: 'folder', folderId, driveId })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSharedFolders((data.data || []).filter(f => f.mimeType === 'application/vnd.google-apps.folder'));
    } catch {
      setError('Error al cargar carpetas de la unidad compartida');
    } finally {
      setLoadingFolders(false);
    }
  }, []);

  const navigateShared = (folder) => {
    setSharedBreadcrumb(prev => [...prev, { ...folder, driveId: activeDrive.id }]);
    setSharedSelected(null);
    loadSharedFolders(folder.id, activeDrive.id);
  };

  const goBackShared = (index) => {
    if (index < 0) {
      // Volver a la lista de unidades compartidas
      setActiveDrive(null);
      setSelectedDrive(null);
      setSharedBreadcrumb([]);
      setSharedFolders([]);
      setSharedSelected(null);
      return;
    }
    const crumb = sharedBreadcrumb.slice(0, index + 1);
    setSharedBreadcrumb(crumb);
    setSharedSelected(null);
    loadSharedFolders(crumb[crumb.length - 1].id, activeDrive.id);
  };

  // ── Importar ──────────────────────────────────────────────────────────
  const handleImport = async () => {
    setIsLoading(true);
    setError('');
    try {
      let body;

      if (activeTab === 'mydrive') {
        const folder = myDriveSelected || myDriveBreadcrumb[myDriveBreadcrumb.length - 1];
        body = folder.id === 'root'
          ? { scope: 'all', maxDepth: -1 }
          : { scope: 'folder', folderId: folder.id, maxDepth: -1 };
      } else {
        // Caso 1: unidad seleccionada desde la lista (sin navegar dentro)
        if (selectedDrive && !activeDrive) {
          body = { scope: 'shared-drive', driveId: selectedDrive.id, maxDepth: -1 };
        // Caso 2: navegando dentro de un drive, con subcarpeta seleccionada o en nivel actual
        } else if (activeDrive) {
          const folder = sharedSelected || sharedBreadcrumb[sharedBreadcrumb.length - 1];
          const isRoot = folder?.id === activeDrive.id;
          body = isRoot
            ? { scope: 'shared-drive', driveId: activeDrive.id, maxDepth: -1 }
            : { scope: 'folder', folderId: folder.id, driveId: activeDrive.id, maxDepth: -1 };
        } else {
          setError('Selecciona una unidad compartida primero');
          setIsLoading(false);
          return;
        }
      }

      const res = await fetch(`${API_BASE}/google/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body)
      });
      const data = await res.json();

      if (data.success) { onImport(data.data); onClose(); }
      else setError(data.error || 'Error al importar');
    } catch {
      setError('Error al importar. Verifica tu conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Helpers de label ──────────────────────────────────────────────────
  const getImportLabel = () => {
    if (activeTab === 'mydrive') {
      const f = myDriveSelected || myDriveBreadcrumb[myDriveBreadcrumb.length - 1];
      return f.id === 'root' ? 'Importar todo Mi Drive' : `Importar "${f.name}"`;
    } else {
      if (selectedDrive && !activeDrive) return `Importar "${selectedDrive.name}"`;
      if (!activeDrive) return 'Selecciona una unidad compartida';
      const f = sharedSelected || sharedBreadcrumb[sharedBreadcrumb.length - 1];
      return f?.id === activeDrive.id ? `Importar "${activeDrive.name}"` : `Importar "${f?.name}"`;
    }
  };

  const canImport = activeTab === 'mydrive' || (activeTab === 'shared' && (activeDrive || selectedDrive));

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose} className="google-drive-modal">
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>Google Drive</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={onClose}><IonIcon icon={closeOutline} /></IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">

        {!isAuthenticated ? (
          /* ── Sin autenticar ── */
          <div className="auth-section">
            <IonIcon icon={logoGoogle} className="google-icon" />
            <IonText color="medium">
              <h2>Conectar con Google Drive</h2>
              <p>Auténticate para navegar Mi Drive y tus unidades compartidas.</p>
            </IonText>
            <IonButton expand="block" color="primary" onClick={handleGoogleAuth}
              disabled={isLoading} className="auth-button">
              {isLoading
                ? <IonSpinner name="crescent" />
                : <><IonIcon icon={logoGoogle} slot="start" /> Conectar con Google</>}
            </IonButton>
            {error && <p className="drive-error">{error}</p>}
          </div>

        ) : (
          /* ── Navegador ── */
          <div className="browser-section">

            {/* Badge conexión */}
            <div className="connection-badge">
              <IonIcon icon={cloudDone} color="success" />
              <span>Conectado a Google Drive</span>
              <button className="disconnect-btn" onClick={handleLogout}>Desconectar</button>
            </div>

            {/* Tabs */}
            <div className="drive-tabs">
              <button
                className={`drive-tab ${activeTab === 'mydrive' ? 'drive-tab--active' : ''}`}
                onClick={() => setActiveTab('mydrive')}
              >
                <IonIcon icon={homeOutline} /> Mi Drive
              </button>
              <button
                className={`drive-tab ${activeTab === 'shared' ? 'drive-tab--active' : ''}`}
                onClick={() => setActiveTab('shared')}
              >
                <IonIcon icon={peopleOutline} />
                Unidades compartidas
                {sharedDrives.length > 0 && (
                  <span className="tab-badge">{sharedDrives.length}</span>
                )}
              </button>
            </div>

            {/* ── Tab Mi Drive ── */}
            {activeTab === 'mydrive' && (
              <>
                <Breadcrumb
                  crumbs={myDriveBreadcrumb}
                  onNavigate={goBackMyDrive}
                  rootIcon={homeOutline}
                />
                {myDriveBreadcrumb.length > 1 && (
                  <BackButton onClick={() => goBackMyDrive(myDriveBreadcrumb.length - 2)} />
                )}
                <FolderList
                  folders={myDriveFolders}
                  loading={loadingFolders}
                  selected={myDriveSelected}
                  onNavigate={(f) => navigateMyDrive({ id: f.id, name: f.name })}
                  onSelect={(f) => setMyDriveSelected(prev => prev?.id === f.id ? null : { id: f.id, name: f.name })}
                />
              </>
            )}

            {/* ── Tab Unidades compartidas ── */}
            {activeTab === 'shared' && (
              <>
                {!activeDrive ? (
                  /* Lista de unidades compartidas */
                  <div className="shared-drives-list">
                    {loadingSharedDrives ? (
                      <div className="folder-loading"><IonSpinner name="crescent" /><span>Cargando...</span></div>
                    ) : sharedDrives.length === 0 ? (
                      <div className="folder-empty">
                        <IonIcon icon={peopleOutline} />
                        <span>No tienes unidades compartidas</span>
                      </div>
                    ) : (
                      sharedDrives.map(drive => (
                        <div key={drive.id} className={`shared-drive-row ${selectedDrive?.id === drive.id ? 'shared-drive-row--selected' : ''}`}>
                          <IonIcon icon={hardwareChipOutline} className="shared-drive-icon" />
                          <button className="shared-drive-name" onClick={() => enterSharedDrive(drive)}>
                            <span>{drive.name}</span>
                            <IonIcon icon={chevronForwardOutline} className="shared-drive-arrow" />
                          </button>
                          <button
                            className={`select-btn ${selectedDrive?.id === drive.id ? 'select-btn--active' : ''}`}
                            onClick={() => setSelectedDrive(prev => prev?.id === drive.id ? null : drive)}
                          >
                            <IonIcon icon={checkmarkCircleOutline} />
                            {selectedDrive?.id === drive.id ? 'Seleccionada' : 'Seleccionar'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* Navegador dentro de una unidad compartida */
                  <>
                    <Breadcrumb
                      crumbs={sharedBreadcrumb}
                      onNavigate={goBackShared}
                      rootIcon={hardwareChipOutline}
                      onRoot={() => goBackShared(-1)}
                    />
                    <BackButton onClick={() => goBackShared(sharedBreadcrumb.length - 2)} />
                    <FolderList
                      folders={sharedFolders}
                      loading={loadingFolders}
                      selected={sharedSelected}
                      onNavigate={(f) => navigateShared({ id: f.id, name: f.name })}
                      onSelect={(f) => setSharedSelected(prev => prev?.id === f.id ? null : { id: f.id, name: f.name })}
                    />
                  </>
                )}
              </>
            )}

            {/* Target de importación */}
            {canImport && (
              <div className="import-target">
                <IonIcon icon={folderOpenOutline} />
                <div className="import-target-info">
                  <span className="import-target-label">Se importará desde:</span>
                  <strong>
                    {activeTab === 'mydrive'
                      ? (myDriveSelected || myDriveBreadcrumb[myDriveBreadcrumb.length - 1]).name
                      : selectedDrive && !activeDrive
                        ? selectedDrive.name
                        : activeDrive
                          ? (sharedSelected || sharedBreadcrumb[sharedBreadcrumb.length - 1])?.name || activeDrive.name
                          : '—'
                    }
                  </strong>
                  <span className="import-target-sub">Recursivo — incluye todas las subcarpetas y archivos</span>
                </div>
              </div>
            )}

            {error && <p className="drive-error">{error}</p>}

            <IonButton
              expand="block" color="primary"
              onClick={handleImport}
              disabled={isLoading || !canImport}
              className="import-btn"
            >
              {isLoading
                ? <><IonSpinner name="crescent" slot="start" /> Importando...</>
                : <><IonIcon icon={downloadOutline} slot="start" /> {getImportLabel()}</>
              }
            </IonButton>

          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

// ── Componentes auxiliares ────────────────────────────────────────────────

const Breadcrumb = ({ crumbs, onNavigate, rootIcon, onRoot }) => (
  <div className="breadcrumb">
    {onRoot && (
      <>
        <button className="crumb" onClick={onRoot}>
          <IonIcon icon={peopleOutline} />
        </button>
        {crumbs.length > 0 && <IonIcon icon={chevronForwardOutline} className="crumb-sep" />}
      </>
    )}
    {crumbs.map((crumb, i) => (
      <React.Fragment key={crumb.id}>
        <button
          className={`crumb ${i === crumbs.length - 1 ? 'crumb--active' : ''}`}
          onClick={() => i < crumbs.length - 1 && onNavigate(i)}
        >
          {i === 0 ? <IonIcon icon={rootIcon} /> : crumb.name}
        </button>
        {i < crumbs.length - 1 && <IonIcon icon={chevronForwardOutline} className="crumb-sep" />}
      </React.Fragment>
    ))}
  </div>
);

const BackButton = ({ onClick }) => (
  <button className="back-btn" onClick={onClick}>
    <IonIcon icon={arrowBackOutline} /> Volver
  </button>
);

const FolderList = ({ folders, loading, selected, onNavigate, onSelect }) => (
  <div className="folder-list">
    {loading ? (
      <div className="folder-loading"><IonSpinner name="crescent" /><span>Cargando carpetas...</span></div>
    ) : folders.length === 0 ? (
      <div className="folder-empty">
        <IonIcon icon={folderOpenOutline} />
        <span>Sin subcarpetas</span>
      </div>
    ) : (
      folders.map(folder => (
        <div key={folder.id} className="folder-row">
          <button className="folder-name-btn" onClick={() => onNavigate(folder)}>
            <IonIcon icon={folderOutline} className="folder-icon" />
            <span>{folder.name}</span>
          </button>
          <button
            className={`select-btn ${selected?.id === folder.id ? 'select-btn--active' : ''}`}
            onClick={() => onSelect(folder)}
          >
            <IonIcon icon={checkmarkCircleOutline} />
            {selected?.id === folder.id ? 'Seleccionada' : 'Seleccionar'}
          </button>
        </div>
      ))
    )}
  </div>
);

export default GoogleDriveModal;
