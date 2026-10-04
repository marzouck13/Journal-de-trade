# Trade Journal

Journal de trading personnel, libre, gratuit et open source.

Un outil sobre et analytique pour journaliser ses trades, mesurer ses statistiques et progresser sans aucune promesse de performance.

## Auteur

Cree par Marzouck AFFO, etudiant en 2e annee de genie logiciel (developpement logiciel et intelligence artificielle).

## Licence

MIT - voir le fichier LICENSE.

## Fonctionnalites

- Journalisation complete des trades (date, actif, direction, prix, stop loss, take profit, lot, resultat, R-multiple)
- Capture d'ecran avant/apres chaque trade, compressees automatiquement (WebP adaptatif)
- Statistiques avancees : winrate, profit factor, expectancy, drawdown maximal, serie de gains/pertes
- Analyses par actif, par setup, par jour, par mois, par session de trading
- Suivi de la discipline et de la psychologie
- Objectifs et challenges personnels
- Notes et lecons
- Calendrier mensuel de performance
- Fonctionne 100 % hors ligne
- Aucun compte, aucun email, aucune inscription
- Aucune donnee envoyee a un serveur
- PWA installable sur mobile et ordinateur
- Aucun conseil financier, aucune promesse de performance

## Architecture

    Frontend statique (HTML/CSS/JS vanilla)
        |
        v
    Stockage local navigateur :
      - IndexedDB (donnees structurees)
      - OPFS (captures d'ecran)
      - LocalStorage (preferences)

Aucun serveur. Aucune API. Aucune base de donnees distante.
Tout reste sur l'appareil de l'utilisateur.

## Installation locale

1. Cloner le depot
2. Servir avec un serveur local :

    python -m http.server 5500
    # ou
    npx serve .

Puis ouvrir http://localhost:5500

## Dependances

Chart.js est inclus localement dans `js/vendor/chart.min.js`.
Aucune autre dependance externe n'est requise.

## Structure du projet

    /
    |-- index.html
    |-- manifest.json
    |-- service-worker.js
    |-- robots.txt
    |-- sitemap.xml
    |-- llms.txt
    |-- README.md
    |-- LICENSE
    |-- css/
    |   |-- style.css
    |   |-- responsive.css
    |-- assets/
    |   |-- icon-192.png
    |   |-- icon-512.png
    |   |-- icon-maskable-512.png
    |   |-- apple-touch-icon.png
    |   |-- favicon.png
    |   |-- og-image.png
    |-- js/
    |   |-- vendor/
    |   |   |-- chart.min.js
    |   |-- config.js
    |   |-- utilitaires.js
    |   |-- stockage.js
    |   |-- stockage-images.js
    |   |-- exportateur.js
    |   |-- donnees.js
    |   |-- calculs.js
    |   |-- graphiques.js
    |   |-- graphiques-config.js
    |   |-- notifications.js
    |   |-- navigation.js
    |   |-- theme.js
    |   |-- anti-flash.js
    |   |-- app.js
    |   |-- pwa-register.js
    |   |-- pwa-install.js
    |   |-- pages/
    |-- pages/

## Contribuer

Les contributions sont les bienvenues. Pour proposer une amelioration :

1. Fork le projet
2. Creer une branche (git checkout -b amelioration/ma-fonctionnalite)
3. Commit les changements (git commit -m 'Ajout de ma fonctionnalite')
4. Push sur la branche (git push origin amelioration/ma-fonctionnalite)
5. Ouvrir une Pull Request

## Signaler un bug

Utilise la page Support (https://trade-journal-app.com/pages/support.html) ou ecris a contact@trade-journal-app.com.

## Principes

- Aucun conseil financier
- Aucune promesse de performance
- Respect de la vie privee
- Sobriete
- Open source

## Remerciements

Merci a tous les traders qui utilisent Trade Journal et qui contribuent, d'une maniere ou d'une autre, a rendre l'outil meilleur.