# DogTrails Native

## Lokaler Start

```powershell
npm start
```

## Echter Android-Testbuild

1. Bei Expo einloggen:

```powershell
npx eas login
```

2. Preview-APK bauen:

```powershell
npm run build:android:preview
```

3. Fuer einen echten Dev Client mit spaeterem Live-Reload:

```powershell
npm run build:android:dev
```

Nach dem Build stellt Expo einen Download-Link fuer die APK bereit. Diese APK kannst du direkt auf Android installieren, ohne Play Store.
