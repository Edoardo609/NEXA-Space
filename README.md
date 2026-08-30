# NEXA Space

Official NEXA Space application and website.

## Cordova Android build
This repository is prepared so the existing Hatchable web project remains unchanged while a standard Cordova web root is generated locally.

Run:
```
npm install
npm run build:android
```

The build preparation copies `public/` to `www/` and promotes `public/config.xml` to the Cordova root automatically. This keeps the live Hatchable project compatible while producing the standard Cordova layout:

- config.xml
- package.json
- www/index.html
- www/assets...

The application name is **NEXA Space** and package id is **com.nexa.space**.

## Offline behavior
The local interface can open without Internet. Features backed by the NEXA server show an offline state instead of redirecting or blocking startup, and resume when connectivity returns.