const { google } = require('googleapis');
require('dotenv').config();

/**
 * Configuración de Google Drive API OAuth2 Client
 */
class GoogleDriveService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    // Scopes necesarios para leer Drive y perfil de usuario
    this.SCOPES = [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'openid'
    ];
  }

  /**
   * Genera la URL de autenticación de Google
   */
  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.SCOPES,
      prompt: 'consent'
    });
  }

  /**
   * Intercambia el código de autorización por tokens de acceso
   */
  async getTokens(code) {
    const { tokens } = await this.oauth2Client.getToken(code);
    this.oauth2Client.setCredentials(tokens);
    return tokens;
  }

  /**
   * Establece las credenciales desde tokens guardados
   */
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens);
  }

  /**
   * Obtiene el cliente de Drive API autenticado
   */
  getDriveClient() {
    return google.drive({ version: 'v3', auth: this.oauth2Client });
  }

  /**
   * Lista archivos y carpetas de Google Drive con opciones de alcance
   * @param {string} scope - 'all', 'folder', 'shared'
   * @param {string} folderId - ID de carpeta específica (para scope='folder')
   */
  async listDriveContents(scope = 'all', folderId = null) {
    const drive = this.getDriveClient();
    let query = '';

    switch (scope) {
      case 'folder':
        // Listar contenido de una carpeta específica
        if (!folderId) {
          throw new Error('Se requiere folderId para scope="folder"');
        }
        query = `'${folderId}' in parents and trashed=false`;
        break;

      case 'shared':
        // Listar archivos compartidos conmigo
        query = 'sharedWithMe=true and trashed=false';
        break;

      case 'all':
      default:
        // Listar todo (Mi Drive)
        query = "'root' in parents and trashed=false";
        break;
    }

    try {
      const response = await drive.files.list({
        q: query,
        pageSize: 1000,
        fields: 'files(id, name, mimeType, parents, createdTime, modifiedTime, size, webViewLink, iconLink)',
        orderBy: 'folder,name'
      });

      return response.data.files;
    } catch (error) {
      console.error('Error listando archivos de Drive:', error);
      throw error;
    }
  }

  /**
   * Construye recursivamente la estructura jerárquica de carpetas y archivos
   * @param {string} folderId - ID de la carpeta raíz
   * @param {number} maxDepth - Profundidad máxima (por defecto ilimitada)
   */
  async buildHierarchy(folderId = 'root', maxDepth = -1, currentDepth = 0) {
    if (maxDepth !== -1 && currentDepth >= maxDepth) {
      return [];
    }

    const drive = this.getDriveClient();

    try {
      const response = await drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        pageSize: 1000,
        fields: 'files(id, name, mimeType, parents, createdTime, modifiedTime, size, webViewLink, iconLink, description)',
        orderBy: 'folder,name'
      });

      const items = response.data.files;
      const result = [];

      for (const item of items) {
        const isFolder = item.mimeType === 'application/vnd.google-apps.folder';

        const node = {
          id: item.id,
          title: item.name,
          description: item.description || '',
          driveMetadata: {
            mimeType: item.mimeType,
            createdTime: item.createdTime,
            modifiedTime: item.modifiedTime,
            size: item.size,
            webViewLink: item.webViewLink,
            iconLink: item.iconLink,
            isFolder: isFolder
          },
          children: []
        };

        // Si es una carpeta, obtener sus hijos recursivamente
        if (isFolder) {
          node.children = await this.buildHierarchy(item.id, maxDepth, currentDepth + 1);
        }

        result.push(node);
      }

      return result;
    } catch (error) {
      console.error(`Error construyendo jerarquía para folder ${folderId}:`, error);
      throw error;
    }
  }

  /**
   * Convierte la estructura de Drive al formato de secciones de Ecora
   * @param {Array} driveItems - Items de Google Drive
   */
  convertToEcoraSections(driveItems) {
    const { v4: uuidv4 } = require('uuid');

    const convertItem = (item) => {
      const section = {
        id: uuidv4(),
        title: item.title,
        description: item.description || '',
        driveId: item.id, // Guardar referencia al ID de Drive
        driveMetadata: item.driveMetadata,
        createdAt: item.driveMetadata.createdTime || new Date().toISOString(),
        updatedAt: item.driveMetadata.modifiedTime || new Date().toISOString(),
        children: []
      };

      if (item.children && item.children.length > 0) {
        section.children = item.children.map(child => convertItem(child));
      }

      return section;
    };

    return driveItems.map(item => convertItem(item));
  }

  /**
   * Obtiene información de una carpeta específica
   */
  async getFolderInfo(folderId) {
    const drive = this.getDriveClient();

    try {
      const response = await drive.files.get({
        fileId: folderId,
        fields: 'id, name, mimeType, parents, createdTime, modifiedTime, webViewLink, description'
      });

      return response.data;
    } catch (error) {
      console.error(`Error obteniendo info de carpeta ${folderId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene la información del usuario autenticado
   */
  async getUserInfo() {
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });

    try {
      const response = await oauth2.userinfo.get();
      return response.data;
    } catch (error) {
      console.error('Error obteniendo información del usuario:', error);
      throw error;
    }
  }
}

module.exports = GoogleDriveService;
