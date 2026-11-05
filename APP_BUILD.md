# Applications Android et Windows

Le site OREAC est embarqué dans les deux applications et fonctionne hors ligne.
L'application Android est réalisée avec Capacitor et l'application Windows avec
Electron.

## Télécharger les applications

Ouvrir l'onglet **Actions** du dépôt GitHub, sélectionner la dernière exécution
**Applications Android et Windows**, puis télécharger les deux artefacts :

- **OREAC-Astro-Kabbale-Android-APK** contient `app-debug.apk` à installer sur
  un téléphone Android.
- **OREAC-Astro-Kabbale-Windows-Setup** contient l'installateur Windows `.exe`.

Les artefacts sont créés à chaque modification de la branche `main`. Le bouton
**Run workflow** permet aussi une compilation manuelle.

Ces premiers fichiers sont signés pour le développement uniquement : l'APK
utilise la clé Android de débogage et l'installateur Windows n'a pas de
certificat de signature de code. Une distribution sur Google Play ou un
installateur Windows signé nécessitera les clés correspondantes.

## Compiler soi-même

Prérequis : Node.js 22 ou plus récent. Pour Android, installer aussi Java 17 et
le SDK Android 36.

```sh
npm install
npm run build:web
npx cap add android
npx cap sync android
cd android
./gradlew assembleDebug
```

L'APK se trouve dans `android/app/build/outputs/apk/debug/`.

Sur Windows :

```powershell
npm install
npm run build:windows
```

L'installateur se trouve dans `dist/`.
