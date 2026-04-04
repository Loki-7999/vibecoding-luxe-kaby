# Checklist Core: Next.js + Bienes Raíces

Resumen rápido y condensado de conceptos clave y temas principales a seguir para el desarrollo de la app:

## ⚡ 1. Rendimiento y Optimización (Next.js)
*   [ ] **Componente `<Image>`:** Obligatorio para fotografías de propiedades (optimizadas a WebP/AVIF y escalado automático).
*   [ ] **SSG / ISR prioritario:** Pre-renderiza detalles de propiedades. Usa SSR sólo para buscadores en vivo.
*   [ ] **Blur placeholders (`blurDataURL`):** Añade un efecto de desenfoque a las imágenes principales mientras cargan.
*   [ ] **Lazy Loading en Mapas:** Usa `next/dynamic ({ ssr: false })` para no bloquear el hilo de renderizado inicial.
*   [ ] **CDNs de almacenamiento:** (Ej: Supabase Storage) específicos para entregar fotografías y videos de forma rápida.

## 🔎 2. SEO y Descubrimiento
*   [ ] **Metadata Dinámica:** Genera etiquetas TITLE y META dinámicas para cada propiedad vía `generateMetadata`.
*   [ ] **Schema Markup (JSON-LD):** Implementa datos `RealEstateListing`. Fundamental para destacar fotos/precio en Google.
*   [ ] **SSG Sitemaps:** Generación dinámica del archivo `sitemap.xml` para rápida indexación de nuevas viviendas.
*   [ ] **Slugs Semánticos:** Enlaces descriptivos (`/propiedad/penthouse-frente-al-mar`) en vez de de IDs inútiles (`/1234`).

## 📱 3. Interfaz y Experiencia de Usuario (UI/UX)
*   [ ] **Filtros Sincronizados por URL:** Los filtros de búsqueda deben estar en el Search Params (`?habitaciones=3&precio=max`) para compartir el enlace tal cual.
*   [ ] **Listados con Paginación o Scroll Infinito:** Evita colapsar o ralentizar la app cuando carguen 50+ inmuebles.
*   [ ] **Galerías Swipables Móviles:** Soporte de deslizamiento táctil horizontal nativo para fotos en celular.
*   [ ] **Botón Sticky "Agendar Visita":** Botón persistente de contacto mientras el usuario hace scroll hacia abajo.
*   [ ] **Dark Mode (Lujo):** Fundamental para resaltar fotografía de interiores en apps como Luxe Estate.
*   [ ] **Simulador Rápido:** Calculadora de hipoteca o mensualidad incrustada en el detalle.

## 💾 4. Arquitectura y Mantenimiento
*   [ ] **Supabase / PostgreSQL:** Usa esquemas relacionales. Bienes Raíces depende de tablas conectadas (Inmueble -> Inmobiliaria -> Lead).
*   [ ] **Server Actions (Next 14+):** Simplifica la lógica de los formularios y la captura de leads sin usar API endpoints.
*   [ ] **Autenticación "Frictionless":** OAuth (Google) o Magic Links para que guardar propiedades en favoritos requiera solo un click.

## 💎 5. "Wow Factor" (Características Premium)
*   [ ] **Comparador Lado-a-Lado:** Herramienta para enfrentar 2 propiedades en precio por m², amenidades y vistas.
*   [ ] **Datos de Geolocalización (Walk Score):** Integración de APIs que califiquen la accesibilidad de la zona (parques, escuelas).
*   [ ] **Alertas Push / Emails de Caída de Precio:** Aviso al usuario cuando su propiedad guardada baja de coste.
