# Macro planning

Application Vue 3 (Vite) pour construire un macro planning projet.

## Developpement local

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
npm run preview
```

Le build genere le dossier `dist/`.

## Deploiement GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` installe les dependances,
build l'application, puis publie `dist/` sur GitHub Pages.

Dans les settings GitHub du depot, Pages doit utiliser `GitHub Actions`
comme source de publication.
