# data-base

Esta carpeta contiene datos iniciales que en el futuro servirán para crear las bases de datos en Supabase.

Contenido:

- `data.json`: archivo JSON con datos de ejemplo (usuarios, meta).
- `admin.js`: módulo JavaScript simple que exporta las credenciales del usuario admin (para pruebas locales únicamente).

Importante:

- Este contenido es de ejemplo y NO debe usarse en producción. Las contraseñas están en texto plano para facilitar pruebas iniciales.
- Cuando migres a Supabase, importa `data.json` o transforma los objetos según tu esquema.

Ejemplo de uso:

- Para pruebas en frontend se puede usar `fetch('/data-base/data.json')` si colocas `data.json` en `public/data-base`.
