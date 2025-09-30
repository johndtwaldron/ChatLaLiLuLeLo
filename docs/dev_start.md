# Dev Start (ChatLaLiLuLeLo)

## Prereqs
- Node 20+ (nvm on Windows is fine)
- Yarn or npm
- Xcode (mac) / Android Studio (optional, for devices)
- PNPM optional

## First-time setup
```powershell
# clone and install from monorepo root
cd C:\c.projects\ChatLaLiLuLeLo.JDW
npm i

# go to mobile app
cd apps\mobile

# install local expo CLI so Metro stays in-repo
npm i -D expo

# align Expo SDK deps to the app’s SDK line
npx expo install