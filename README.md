# Le Jardin des additions

Un jeu en TypeScript pour apprendre les **110 additions de 1 + 0 à 10 + 10**. Adapté aux téléphones, tablettes et ordinateurs. Illustrations originales en SVG, interface française, sans animation continue ni son imposé.

## Jouer

**https://girianshiido.github.io/jardin-des-additions/**

- **J’apprends mes tables** : lire une table complète dans l’ordre, de + 0 à + 10, avec toutes les réponses. Des points numérotés expliquent chaque addition et le passage à la ligne suivante. Cacher les résultats, puis les révéler individuellement pour mémoriser à son rythme, sans score ni chronomètre. Passer ensuite à l’entraînement sur cette même table.
- **Je découvre** : compter deux groupes de points et choisir la somme.
- **Je m’entraîne** : saisir la somme avec le clavier tactile ou physique.
- **Le nombre caché** : compléter l’un des deux termes de l’addition.
- **Le défi minute** : trouver des sommes pendant 60 secondes. Pause manuelle et automatique en arrière-plan.

Sélection des tables de 1 à 10 ; le second terme va toujours de 0 à 10. L’apprentissage présente les 11 lignes de la table choisie ; les parties d’exercices sans chronomètre comptent 10 calculs. Les calculs moins maîtrisés arrivent en premier ; une erreur revient après quelques questions. Un indice ou une réponse corrigée ne donne pas une fleur : il faut trois réponses consécutives justes, autonomes et du premier coup. La lecture et la mémorisation des tables ne modifient pas les scores ou la maîtrise. La découverte ne modifie pas la maîtrise. Les étoiles récompensent les découvertes ou les bonnes réponses autonomes.

## Apprendre avec la voix

Dans **J’apprends mes tables**, activer **Lecture automatique** pour écouter la table à partir de la ligne sélectionnée jusqu’à + 10. Une pause de 3 secondes entre les additions permet de répéter. **Pause** arrête immédiatement la lecture ; **Écouter la table d’ici** la reprend. Désactiver la lecture automatique conserve la possibilité d’écouter une seule addition. Le choix est mémorisé sur cet appareil ; le son est désactivé lors de la première visite.

**3 + 5 = 8** est lu **« trois plus cinq, huit »**, avec les trois premiers mots rapprochés, une courte pause avant le résultat et sans prononcer « égale ». La voix est accélérée de 8 % sans changer sa hauteur. Changer de table ou de ligne interrompt la lecture précédente. Cacher les résultats coupe le son ; seul un résultat explicitement révélé peut ensuite être lu, sans passer automatiquement à la ligne suivante. Quitter le mode, ouvrir une fenêtre d’aide ou passer en arrière-plan coupe aussi la lecture. En cas de restriction de lecture du navigateur, toucher **Écouter** pour reprendre. Les sons sont inclus dans le cache hors connexion de la PWA.

Voix et enregistrements : [Poslovitch sur Lingua Libre](https://lingualibre.org/wiki/Q142683). Les 21 nombres (0 à 20) et le signe « + » proviennent de Wikimedia Commons, sous **CC0**, licences vérifiées fichier par fichier. Les sources sont conservées dans `audio-sources/` : WAV originaux pour 0 à 19, transcodages Ogg officiels de Wikimedia pour 20 et « + ». Ils ont été raccourcis au niveau des silences, harmonisés en volume, assemblés et convertis en MP3. Aucune synthèse vocale ni appel à un service externe pendant le jeu. [Liste complète des sources et licences](https://girianshiido.github.io/jardin-des-additions/audio/CREDITS.txt), également disponible dans `public/audio/sources.json`.

Pour régénérer les 110 phrases avec Python 3 et FFmpeg : `python3 scripts/build-audio.py`, puis `pnpm build`. Cette génération sonore est indépendante de la compilation web ordinaire et du workflow CI.

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

Le code du jeu est dans `src/`. Le moteur pédagogique est indépendant de l’interface dans `src/engine.ts`. La compilation produit `docs/`, publié sur GitHub Pages depuis `main:/docs`. Les chemins relatifs permettent le déploiement dans un sous-répertoire. Le service worker est généré après la compilation et précache les vrais fichiers de la version ; son nom de cache dépend de leur contenu. Une mise à jour ne s’active qu’après le téléchargement complet des nouveaux fichiers. Les parties déjà ouvertes continuent normalement ; recharger le jeu affiche ensuite la nouvelle version. La vérification des mises à jour contourne le cache du navigateur. La navigation essaie le réseau en premier et conserve une version complète de secours hors connexion. Les anciens fichiers compilés sont conservés dans `docs/assets/` pour éviter une page blanche quand un navigateur charge encore une ancienne page HTML.

Les tests contrôlent la couverture complète des additions, la variété des choix et des parties, la progression et la résistance aux sauvegardes endommagées, ainsi que les interruptions de lecture, les restrictions sonores du navigateur et les requêtes audio partielles hors connexion. Le workflow GitHub contrôle les tests, le typage et la reproductibilité du site compilé.
