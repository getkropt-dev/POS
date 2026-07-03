# Meybrasu POS - Backend 🚀

Este es el backend robusto del sistema de Punto de Venta (POS) **Meybrasu POS**, desarrollado con **NestJS**. Proporciona una API escalable y segura para gestionar ventas, inventario, usuarios y reportes.

## 🛠️ Tecnologías Utilizadas

- **Framework:** [NestJS](https://nestjs.com/) - Un framework progresivo de Node.js para construir aplicaciones eficientes y confiables.
- **Base de Datos:** [PostgreSQL](https://www.postgresql.org/) con [Knex.js](https://knexjs.org/) como query builder.
- **Autenticación:** [Passport.js](https://www.passportjs.org/) y [JWT](https://jwt.io/) (JSON Web Tokens).
- **Seguridad:** [Bcrypt](https://github.com/kelektiv/node.bcrypt.js) para el hashing de contraseñas.
- **Lenguaje:** [TypeScript](https://www.typescriptlang.org/).

## 📁 Estructura de Módulos

La lógica de negocio está organizada en módulos dentro de `src/modules`:

- **Auth:** Gestión de sesiones, login y protección de rutas mediante JWT.
- **Users:** Administración de usuarios, roles y perfiles.
- **Products:** Gestión del catálogo de productos (CRUD).
- **Inventory:** Control de existencias, movimientos de almacén y stock.
- **Sales:** Procesamiento de transacciones de venta y facturación.
- **Purchases:** Registro de compras a proveedores y entrada de mercancía.
- **Customers:** Módulo de CRM para la gestión de clientes.
- **Cash Sessions:** Control de aperturas y cierres de caja (Corte de caja).
- **Reports:** Generación de resúmenes financieros y estadísticos.
- **Catalogs:** Datos maestros como categorías, marcas y unidades de medida.

## 🚀 Instalación y Configuración

### Pre-requisitos

- [Node.js](https://nodejs.org/) (v18 o superior)
- [PostgreSQL](https://www.postgresql.org/) instalado y en ejecución.

### Pasos

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto basándote en los siguientes campos necesarios:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://usuario:password@host:6543/postgres"
   JWT_SECRET=tu_clave_secreta_super_segura
   ```

3. **Ejecutar Seed de Administrador (Opcional):**
   Para crear un usuario administrador inicial, ejecuta el script de seed correspondiente. Asegúrate de revisar las credenciales configuradas en el archivo de script antes de ejecutarlo.
   ```bash
   npx ts-node seed-admin.ts
   ```

## 💻 Scripts Disponibles

- `npm run start`: Inicia la aplicación.
- `npm run start:dev`: Inicia en modo desarrollo con recarga automática (watch mode).
- `npm run build`: Compila el proyecto para producción.
- `npm run lint`: Ejecuta el linter para mantener la calidad del código.
- `npm run test`: Ejecuta las pruebas unitarias.

## 🔒 Seguridad

El sistema utiliza **Guards** de NestJS para proteger las rutas. La mayoría de los endpoints requieren un token JWT válido en el header `Authorization`:
`Bearer <token>`

---
