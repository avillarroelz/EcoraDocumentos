import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import './PrivacyPolicy.css';

const PrivacyPolicy = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="privacy-container">
          <header className="privacy-header">
            <h1>Política de Privacidad</h1>
            <p className="privacy-updated">Última actualización: 11 de junio de 2026</p>
          </header>

          <section>
            <p>
              Esta Política de Privacidad describe cómo <strong>Ecora</strong> ("nosotros")
              recopila, usa y protege la información de los usuarios de la aplicación
              <strong> Ecora Clic</strong> ("la aplicación"), una herramienta de gestión
              documental con integración a Google Drive.
            </p>
          </section>

          <section>
            <h2>1. Información que recopilamos</h2>
            <p>Para autenticarte y permitir el uso de la aplicación, recopilamos:</p>
            <ul>
              <li><strong>Datos de cuenta de Google:</strong> nombre, dirección de correo electrónico y foto de perfil, obtenidos al iniciar sesión con Google Sign-In.</li>
              <li><strong>Identificadores de usuario:</strong> el identificador único de tu cuenta de Google, usado para asociarte a tu organización y permisos.</li>
              <li><strong>Acceso a Google Drive:</strong> con tu autorización explícita, accedemos en modo solo lectura a los archivos y carpetas que decides sincronizar, para mostrarlos dentro de la estructura documental.</li>
            </ul>
          </section>

          <section>
            <h2>2. Cómo usamos la información</h2>
            <ul>
              <li>Autenticar tu identidad y gestionar tu sesión.</li>
              <li>Asignarte los roles y permisos correspondientes dentro de tu organización.</li>
              <li>Mostrar y organizar los documentos de Google Drive que decides sincronizar.</li>
            </ul>
            <p>No vendemos ni compartimos tu información personal con terceros con fines publicitarios.</p>
          </section>

          <section>
            <h2>3. Almacenamiento y seguridad</h2>
            <p>
              Los datos se almacenan de forma segura en servidores con cifrado en tránsito
              (HTTPS/TLS). El acceso a Google Drive es de solo lectura y nunca modificamos
              ni eliminamos tus archivos originales.
            </p>
          </section>

          <section>
            <h2>4. Servicios de terceros</h2>
            <p>
              La aplicación utiliza servicios de Google (Google Sign-In y Google Drive API).
              El uso de estos servicios está sujeto a la
              <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer"> Política de Privacidad de Google</a>.
            </p>
          </section>

          <section>
            <h2>5. Tus derechos</h2>
            <p>
              Puedes revocar el acceso de la aplicación a tu cuenta de Google en cualquier
              momento desde la
              <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer"> configuración de seguridad de tu cuenta de Google</a>.
              También puedes solicitar la eliminación de tus datos escribiéndonos.
            </p>
          </section>

          <section>
            <h2>6. Contacto</h2>
            <p>
              Si tienes preguntas sobre esta Política de Privacidad, contáctanos en:{' '}
              <a href="mailto:contacto@ecora.cl">contacto@ecora.cl</a>
            </p>
          </section>

          <footer className="privacy-footer">
            <p>© 2026 Ecora. Todos los derechos reservados.</p>
          </footer>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPolicy;
