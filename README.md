# Le Jardin des additions

Un jeu en TypeScript pour apprendre les **110 additions de 1 + 0 à 10 + 10**. Adapté aux téléphones, tablettes et ordinateurs. Illustrations originales en SVG, interface française, sans animation continue ni son imposé.

## Jouer

**https://girianshiido.github.io/jardin-des-additions/**

- **Je découvre** : compter deux groupes de points et choisir la somme.
- **Je m’entraîne** : saisir la somme avec le clavier tactile ou physique.
- **Le nombre caché** : compléter l’un des deux termes de l’addition.
- **Le défi minute** : trouver des sommes pendant 60 secondes. Pause manuelle et automatique en arrière-plan.

Sélection des tables de 1 à 10 ; le second terme va toujours de 0 à 10. Les parties sans chronomètre comptent 10 calculs. Les calculs moins maîtrisés arrivent en premier ; une erreur revient après quelques questions. Un indice ou une réponse corrigée ne donne pas une fleur : il faut trois réponses consécutives justes, autonomes et du premier coup. La découverte ne modifie pas la maîtrise. Les étoiles récompensent les découvertes ou les bonnes réponses autonomes.

## Installer sur téléphone

- **iPhone / iPad** : ouvrir dans Safari → Partager → Sur l’écran d’accueil. Choisir « Ouvrir comme app web » si proposé.
- **Android** : ouvrir dans Chrome → menu ⋮ → Installer l’application / Ajouter à l’écran d’accueil. Le bouton Installer du jeu ouvre le dialogue système quand disponible.

C’est une application web installable (PWA), sans publication sur l’App Store ou Google Play. Ouvrir une première fois avec Internet, attendre **Prêt hors connexion**, puis jouer même sans réseau. Les progrès restent sur cet appareil, dans ce navigateur ; ils ne se synchronisent pas entre appareils et peuvent être effacés avec les données du navigateur. Les versions navigateur et application installée peuvent utiliser des sauvegardes distinctes selon le système. Aucun compte, suivi, publicité ou service externe pendant le jeu.

Sources installation : [Apple](https://support.apple.com/guide/iphone/iphea86e5236/ios), [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable).

## Développer

Node.js 22 et pnpm 11.19.

```sh
pnpm install
pnpm dev
pnpm test
pnpm build
pnpm preview
```

Le code du jeu est dans `src/`. Le moteur pédagogique est indépendant de l’interface dans `src/engine.ts`. La compilation produit `docs/`, publié sur GitHub Pages depuis `main:/docs`. Les chemins relatifs permettent le déploiement dans un sous-répertoire. Le service worker est généré après la compilation et précache les vrais fichiers de la version ; son nom de cache dépend de leur contenu. Une mise à jour attend la fermeture des fenêtres du jeu avant de s’activer.

Les tests du moteur contrôlent la couverture complète des additions, la variété des choix et des parties, la progression et la résistance aux sauvegardes endommagées. Le workflow GitHub contrôle les tests, le typage et la reproductibilité du site compilé.
