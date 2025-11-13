import React, { useState, useEffect } from 'react';
import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';
import Home from './pages/Home';
import SectionDetail from './pages/SectionDetail';
import Login from './pages/Login';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Theme variables */
import './theme/variables.css';
import './theme/global.css';

setupIonicReact();

const App = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Verificar si hay un usuario guardado en localStorage al iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('ecoraUser');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('ecoraUser');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      // Llamar al endpoint de logout en el backend
      await fetch('http://localhost:3001/api/google/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }

    // Limpiar usuario del estado y localStorage
    setUser(null);
    localStorage.removeItem('ecoraUser');
  };

  if (isLoading) {
    return <IonApp></IonApp>;
  }

  return (
    <IonApp>
      <IonReactRouter>
        <IonRouterOutlet>
          <Route exact path="/login">
            {user ? <Redirect to="/home" /> : <Login onLoginSuccess={handleLoginSuccess} />}
          </Route>
          <Route exact path="/">
            {user ? <Redirect to="/home" /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/home">
            {user ? <Home user={user} onLogout={handleLogout} /> : <Redirect to="/login" />}
          </Route>
          <Route exact path="/section/:sectionId">
            {user ? <SectionDetail user={user} onLogout={handleLogout} /> : <Redirect to="/login" />}
          </Route>
        </IonRouterOutlet>
      </IonReactRouter>
    </IonApp>
  );
};

export default App;
