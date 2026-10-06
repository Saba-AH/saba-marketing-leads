# Performance & Web Vitals — apps/client

> **Este panel es un export estático.** Los Server Components existen, pero se ejecutan en *build time* para generar HTML: sirven para composición y para reducir JS en el cliente, **no** para leer datos. La regla "minimizar el data fetching en cliente" no aplica acá — todos los datos se leen en el navegador, por diseño (ver `dataFetching.md`). Lo que sí aplica sin cambios es todo lo demás: presupuesto de JS, Web Vitals, imágenes, `Suspense`.

## Principles
- Default to **Server Components** for composition; keep client components as small leaf nodes. Cualquier componente que consuma datos es cliente.
- Minimize `useEffect`; **el data fetching va en React Query**, no en efectos.
- Optimize for **LCP, CLS, INP** (Web Vitals).

## Client boundary rules
- Prefer server composition + pass serializable props.
- Split interactivity into small `'use client'` components.
- Wrap slow client islands with `Suspense` and a lightweight fallback.

## Loading strategy
- Use route-level `loading.tsx` for page skeletons when appropriate.
- Prefer **streaming + Suspense** over blocking spinners.

## Bundles
- Use dynamic imports for rare/optional UI:
  - `const Heavy = dynamic(() => import('./heavy'), { ssr: false })`
- Don’t import large libraries into shared root layouts.

## Images
- Use `next/image`.
- Provide `sizes` and correct `width/height`.
- Prefer modern formats (WebP/AVIF) and lazy-load non-critical images.

## Lists
- Avoid rendering huge lists at once; paginate/virtualize if needed.

## Measuring
- If a change is performance-motivated, state what metric should improve (LCP/CLS/INP) and how you would validate.
