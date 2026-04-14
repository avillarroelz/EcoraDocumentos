# Configuracion de Produccion - AWS Elastic Beanstalk + Google OAuth

## Problemas Identificados

Tu configuracion actual tiene estos problemas:

1. **GOOGLE_REDIRECT_URI** apunta a `localhost` - debe apuntar a tu URL de Elastic Beanstalk
2. **Sesiones/Cookies** no estan configuradas para HTTPS
3. **Google Cloud Console** necesita las URIs de produccion
4. **APK** necesita manejar OAuth de forma especial (deep linking)

---

## PASO 1: Variables de Entorno en Elastic Beanstalk

Ve a tu consola de AWS Elastic Beanstalk:
- Configuration > Software > Environment properties

Configura estas variables:

```env
# Servidor
PORT=8080
NODE_ENV=production

# CORS - IMPORTANTE: Incluir todos los origenes necesarios
CORS_ORIGIN=http://ecora-prod-v3.eba-tdqgyq2z.us-east-1.elasticbeanstalk.com,https://ecora-prod-v3.eba-tdqgyq2z.us-east-1.elasticbeanstalk.com,capacitor://localhost,http://localhost

# Google OAuth - CRITICO: Cambiar la URI de redireccion
GOOGLE_CLIENT_ID=<TU_GOOGLE_CLIENT_ID>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<TU_GOOGLE_CLIENT_SECRET>
GOOGLE_REDIRECT_URI=http://<tu-app>.<region>.elasticbeanstalk.com/api/google/callback

# Session - IMPORTANTE: Generar un nuevo secret seguro
SESSION_SECRET=<genera_un_secret_aleatorio_muy_largo_y_seguro>

# Base de datos RDS
DB_HOST=<TU_DB_HOST>.<region>.rds.amazonaws.com
DB_USER=<TU_DB_USER>
DB_PASSWORD=<TU_DB_PASSWORD>
DB_NAME=<TU_DB_NAME>
DB_PORT=5432
```

---

## PASO 2: Configurar Google Cloud Console

Ve a: https://console.cloud.google.com/apis/credentials

### 2.1 Editar OAuth 2.0 Client ID

Busca tu Client ID OAuth 2.0 (el que usas en `GOOGLE_CLIENT_ID`) y edita:

#### Authorized JavaScript Origins (Origenes autorizados)
```
http://localhost:3000
http://localhost:3001
http://localhost:8100
http://ecora-prod-v3.eba-tdqgyq2z.us-east-1.elasticbeanstalk.com
https://ecora-prod-v3.eba-tdqgyq2z.us-east-1.elasticbeanstalk.com
```

#### Authorized redirect URIs (URIs de redireccion)
```
http://localhost:3001/api/google/callback
http://ecora-prod-v3.eba-tdqgyq2z.us-east-1.elasticbeanstalk.com/api/google/callback
https://ecora-prod-v3.eba-tdqgyq2z.us-east-1.elasticbeanstalk.com/api/google/callback
```

**IMPORTANTE**: Guarda los cambios y espera unos minutos para que se propaguen.

---

## PASO 3: Actualizar Configuracion de Sesiones para Produccion

El archivo `server.js` necesita ajustes para manejar correctamente las cookies en produccion. El problema es que Elastic Beanstalk usa HTTP por defecto detras del Load Balancer.

### Opcion A: Si usas HTTP (sin SSL)

Modifica la configuracion de sesiones en `server.js`:

```javascript
// Session middleware para almacenar tokens temporalmente
app.use(session({
  secret: process.env.SESSION_SECRET || 'ecora-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Cambiar a false si no usas HTTPS
    httpOnly: true,
    sameSite: 'lax', // Usar 'lax' para HTTP
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));
```

### Opcion B: Si configuras HTTPS (recomendado)

```javascript
// Trust proxy para que Express reconozca HTTPS detras del Load Balancer
app.set('trust proxy', 1);

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'ecora-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

---

## PASO 4: Problema Especifico con APK (Android)

El problema principal con la APK es que Google OAuth abre un navegador externo, y cuando el callback regresa, la app no puede recibir la notificacion.

### Solucion: Deep Linking

1. **Actualiza `capacitor.config.json`**:

```json
{
  "appId": "com.ecora.app",
  "appName": "Ecora",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": true,
    "url": "http://ecora-prod-v3.eba-tdqgyq2z.us-east-1.elasticbeanstalk.com"
  },
  "plugins": {
    "App": {
      "androidDeepLinks": [
        {
          "scheme": "ecora",
          "host": "auth"
        }
      ]
    }
  }
}
```

2. **Agrega Intent Filter en Android**

Edita `android/app/src/main/AndroidManifest.xml` dentro del `<activity>`:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="ecora" android:host="auth" />
</intent-filter>
```

3. **Actualiza la URI de redireccion en Google Console** para incluir:
```
ecora://auth/callback
```

4. **Modifica el callback del servidor** para redirigir a la app:

En `server.js`, cambia la respuesta del callback para que redirija a la app:

```javascript
// Al final del callback exitoso, en lugar de enviar HTML:
if (req.query.mobile === 'true') {
  // Redirigir a la app via deep link
  return res.redirect(`ecora://auth/callback?success=true&token=${req.sessionID}`);
}
// ... resto del codigo HTML para web
```

---

## PASO 5: Solucion Alternativa para APK (Mas Simple)

Si el deep linking es complicado, puedes usar una solucion mas simple:

### Usar InAppBrowser de Capacitor

1. **Instala el plugin**:
```bash
npm install @capacitor/browser
npx cap sync
```

2. **Modifica el flujo de autenticacion** en `GoogleDriveModal.jsx`:

```javascript
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

const handleGoogleLogin = async () => {
  const response = await fetch(`${API_BASE}/google/auth`);
  const data = await response.json();

  if (Capacitor.isNativePlatform()) {
    // En movil, usar InAppBrowser
    await Browser.open({
      url: data.authUrl,
      windowName: '_self' // Abre en la misma ventana
    });

    // Escuchar cuando el usuario regresa a la app
    Browser.addListener('browserFinished', async () => {
      // Verificar estado de autenticacion
      const statusRes = await fetch(`${API_BASE}/google/status`, {
        credentials: 'include'
      });
      const statusData = await statusRes.json();
      if (statusData.authenticated) {
        // Autenticacion exitosa
        onAuthSuccess(statusData.user);
      }
    });
  } else {
    // En web, usar popup
    window.open(data.authUrl, 'google-auth', 'width=500,height=600');
  }
};
```

---

## PASO 6: Verificar Conectividad RDS

Asegurate de que tu instancia de Elastic Beanstalk pueda conectarse a RDS:

1. **Security Groups**: El security group de RDS debe permitir conexiones entrantes desde el security group de Elastic Beanstalk en el puerto 5432

2. **VPC**: Ambos deben estar en la misma VPC o tener conectividad configurada

---

## PASO 7: Checklist de Despliegue

Antes de desplegar:

- [ ] Variables de entorno configuradas en EB
- [ ] Google Cloud Console actualizado con URIs de produccion
- [ ] Security Groups permiten conexion RDS <-> EB
- [ ] `NODE_ENV=production` configurado
- [ ] `GOOGLE_REDIRECT_URI` apunta a la URL de EB
- [ ] `SESSION_SECRET` es un valor seguro y unico
- [ ] `CORS_ORIGIN` incluye todos los origenes necesarios

Despues de desplegar:

- [ ] Probar `/api/health` funciona
- [ ] Probar conexion a base de datos
- [ ] Probar flujo de autenticacion Google desde web
- [ ] Probar flujo de autenticacion desde APK

---

## Comandos Utiles

### Desplegar a Elastic Beanstalk
```bash
cd backend
zip -r ../backend-deploy.zip . -x "node_modules/*" -x ".git/*"
# Subir el zip a EB via consola o CLI
```

### Ver logs de EB
```bash
eb logs
# o desde la consola AWS: Elastic Beanstalk > Environments > Logs
```

### Probar endpoint de salud
```bash
curl http://ecora-prod-v3.eba-tdqgyq2z.us-east-1.elasticbeanstalk.com/api/health
```

---

## Errores Comunes

### "redirect_uri_mismatch"
- La URI en Google Console no coincide con `GOOGLE_REDIRECT_URI`
- Solucion: Verificar que sean exactamente iguales

### "Error: Session not found" / Cookies no funcionan
- El navegador no puede guardar cookies cross-origin
- Solucion: Configurar `sameSite: 'none'` y `secure: true` (requiere HTTPS)

### APK no recibe callback
- El navegador externo no puede comunicarse con la app
- Solucion: Implementar deep linking o usar InAppBrowser

### "CORS error"
- El origen de la peticion no esta en `CORS_ORIGIN`
- Solucion: Agregar el origen a la lista de permitidos

---

**Fecha**: Febrero 2026
**Autor**: Claude Code
