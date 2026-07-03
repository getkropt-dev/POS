# Meybrasu POS 🛒

**Meybrasu POS** es una solución integral de Punto de Venta diseñada para ofrecer una gestión eficiente, segura y escalable de negocios comerciales. El sistema combina una interfaz de usuario moderna con un motor de backend robusto y una base de datos optimizada para el alto rendimiento.

## 🏗️ Arquitectura del Sistema

El proyecto está dividido en tres pilares fundamentales:

### 1. Frontend (Cliente) 💻
Ubicado en `/frontend`, es una aplicación de página única (SPA) moderna.
- **Tecnologías:** React 19, Vite, TypeScript, Tailwind CSS 4.
- **Características:**
  - Dashboard interactivo con gráficos (Recharts).
  - Interfaz responsiva y minimalista.
  - Gestión de usuarios y sesiones.
  - Módulos dinámicos para Ventas, Inventario y Clientes (en desarrollo).
  - Iconografía premium con Lucide React.

### 2. Backend (Servidor API) ⚙️
Ubicado en `/backend`, es el núcleo de procesamiento del sistema.
- **Tecnologías:** NestJS, TypeScript, Knex.js.
- **Características:**
  - Arquitectura modular (Auth, Users, Sales, Products, etc.).
  - Seguridad mediante JWT y Passport.js.
  - Validación de datos y manejo de errores centralizado.
  - Documentación clara y estructura escalable.

### 3. Base de Datos (Persistencia) 🗄️
Definida en `schema.sql`, utiliza PostgreSQL con lógica avanzada.
- **Motor:** PostgreSQL.
- **Características de alto rendimiento:**
  - **Triggers Automáticos:** El inventario se actualiza automáticamente al registrar ventas o compras.
  - **Auditoría:** Registro automático de cambios en tablas críticas (`audit_log`).
  - **Integridad Financiera:** Recálculo automático de totales, impuestos y balances de clientes.
  - **Procedimientos Almacenados:** Lógica compleja (como la anulación de ventas) ejecutada directamente en el motor para mayor velocidad y consistencia.

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js (v18+)
- PostgreSQL (v14+)

### Instalación General

1. **Clonar el repositorio.**
2. **Configurar la Base de Datos:**
   - Crea una base de datos en PostgreSQL.
   - Ejecuta el script `schema.sql` para crear las tablas, índices y triggers.
3. **Configurar el Backend:**
   - Entra en `/backend`, instala con `npm install`.
   - Configura el archivo `.env` (ver `backend/README.md`).
   - Inicia con `npm run start:dev`.
4. **Configurar el Frontend:**
   - Entra en `/frontend`, instala con `npm install`.
   - Inicia con `npm run dev`.

## 🛠️ Módulos Principales
- **Ventas (POS):** Facturación rápida y múltiples métodos de pago.
- **Inventario (Kardex):** Seguimiento detallado de entradas y salidas.
- **Compras:** Gestión de proveedores y abastecimiento.
- **Caja (Cash Sessions):** Control de arqueos y flujos de efectivo.
- **Clientes:** CRM integrado con gestión de límites de crédito.

---
Desarrollado para potenciar la eficiencia operativa.
