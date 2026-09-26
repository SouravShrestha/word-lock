# Changelog

## [1.4.0](https://github.com/SouravShrestha/word-lock/compare/word-lock-monorepo-v1.3.0...word-lock-monorepo-v1.4.0) (2026-09-26)


### Features

* add dark theme toggle and blur effects with mobile UI refinements ([9357202](https://github.com/SouravShrestha/word-lock/commit/93572021007e086952b3f45bad9341b3c9b491b0))
* add grace period support for streaks and update UI footer ([1aa5cbd](https://github.com/SouravShrestha/word-lock/commit/1aa5cbdceddb65337066f5a422bf84ca1fc9277b))
* add TopLoader component for mobile and ignore ESLint during web builds ([c4c69b0](https://github.com/SouravShrestha/word-lock/commit/c4c69b05b549870d3c7854cce431c7b76b279b33))
* **auth,legal:** add public routes, privacy policy, and auth gating ([07d1409](https://github.com/SouravShrestha/word-lock/commit/07d1409775a5618397d059c182f345271d62b05e))
* **auth:** add account system with auth, profiles, leaderboards, and game history ([7a0aeb3](https://github.com/SouravShrestha/word-lock/commit/7a0aeb378678efe1de80c90ab08cfee5b18783e2))
* **avatar:** add player avatar system with customization and persistence ([a70be30](https://github.com/SouravShrestha/word-lock/commit/a70be30038874293a5b4d9f46c72f9183e469cb1))
* **game:** add in-game reactions, redesigned bottom bar, and board layout refinements ([5ba815b](https://github.com/SouravShrestha/word-lock/commit/5ba815bd4b7cc89c2d814b42a9b21b3937f9dadc))
* **game:** add move review system with playback controls and board replay ([54c5eae](https://github.com/SouravShrestha/word-lock/commit/54c5eaeb2355c50f8f109e8fa349cd51a1cb34f6))
* **game:** add rematch functionality and refactor game over screen ([9eaa2e4](https://github.com/SouravShrestha/word-lock/commit/9eaa2e464f8d666daa3e57f1bd5c523786fe607e))
* **game:** add word history display to game over screen ([654949b](https://github.com/SouravShrestha/word-lock/commit/654949b205bb7a37e24d4a23ec3143c68457db0d))
* initial project setup ([93c9af3](https://github.com/SouravShrestha/word-lock/commit/93c9af33aefc1f92d8069c85bfb3914a62bce577))
* **mobile:** update design tokens and navigation styling ([ead3aba](https://github.com/SouravShrestha/word-lock/commit/ead3aba0fec7e3d30941009d8e311de5e07ca031))
* **profile:** add user profile page with game statistics ([d2585e9](https://github.com/SouravShrestha/word-lock/commit/d2585e931fcdfaf1201f737278dc5c856cba0712))
* **profile:** redesign settings with sheet stack, add app metadata and star history tracking ([68951fd](https://github.com/SouravShrestha/word-lock/commit/68951fd63b22f6985bba3ec8c0309c6faa010066))
* **ui:** redesign home lobby with new visual style and branding ([ab0230c](https://github.com/SouravShrestha/word-lock/commit/ab0230cc0d1cbd2f43d0ccb2b80b491df946c057))
* update mobile app icons and add horizontal scroll for played words in GameResultCard ([0599114](https://github.com/SouravShrestha/word-lock/commit/059911461fa7018871e4cbe5481520a97d96f1cb))


### Bug Fixes

* adjust pointer-events handling for buttons and bottom sheet backdrop ([2c095f0](https://github.com/SouravShrestha/word-lock/commit/2c095f081a4c8dc3d4dc33f2f9c5cc0f4333ffae))
* correct SVG viewBox in WordLockLogo and update mobile gitignore ([f06e4d0](https://github.com/SouravShrestha/word-lock/commit/f06e4d0182dc17c2654f9bb7c697712d05731b07))
* **dictionary:** regenerate wordlist from words_alpha.txt with 3-12 letter cap ([39f33d8](https://github.com/SouravShrestha/word-lock/commit/39f33d8fc7c2b823e56ff0ec94b4dc9a2b3c4d08))
* security, correctness, perf and hygiene pass across the app ([895def9](https://github.com/SouravShrestha/word-lock/commit/895def9eb5606ed17db58e7e43e56d72aaa5a400))

## [1.3.0](https://github.com/SouravShrestha/word-lock/compare/word-lock-v1.2.1...word-lock-v1.3.0) (2026-09-21)

### Features

- **auth,legal:** add public routes, privacy policy, and auth gating ([07d1409](https://github.com/SouravShrestha/word-lock/commit/07d1409775a5618397d059c182f345271d62b05e))
- **auth:** add account system with auth, profiles, leaderboards, and game history ([7a0aeb3](https://github.com/SouravShrestha/word-lock/commit/7a0aeb378678efe1de80c90ab08cfee5b18783e2))
- **avatar:** add player avatar system with customization and persistence ([a70be30](https://github.com/SouravShrestha/word-lock/commit/a70be30038874293a5b4d9f46c72f9183e469cb1))
- **game:** add in-game reactions, redesigned bottom bar, and board layout refinements ([5ba815b](https://github.com/SouravShrestha/word-lock/commit/5ba815bd4b7cc89c2d814b42a9b21b3937f9dadc))
- **game:** add move review system with playback controls and board replay ([54c5eae](https://github.com/SouravShrestha/word-lock/commit/54c5eaeb2355c50f8f109e8fa349cd51a1cb34f6))
- **game:** add rematch functionality and refactor game over screen ([9eaa2e4](https://github.com/SouravShrestha/word-lock/commit/9eaa2e464f8d666daa3e57f1bd5c523786fe607e))
- **profile:** redesign settings with sheet stack, add app metadata and star history tracking ([68951fd](https://github.com/SouravShrestha/word-lock/commit/68951fd63b22f6985bba3ec8c0309c6faa010066))
- **ui:** redesign home lobby with new visual style and branding ([ab0230c](https://github.com/SouravShrestha/word-lock/commit/ab0230cc0d1cbd2f43d0ccb2b80b491df946c057))

### Bug Fixes

- security, correctness, perf and hygiene pass across the app ([895def9](https://github.com/SouravShrestha/word-lock/commit/895def9eb5606ed17db58e7e43e56d72aaa5a400))

## [1.2.1](https://github.com/SouravShrestha/word-lock/compare/word-lock-v1.2.0...word-lock-v1.2.1) (2026-09-01)

### Bug Fixes

- **dictionary:** regenerate wordlist from words_alpha.txt with 3-12 letter cap ([39f33d8](https://github.com/SouravShrestha/word-lock/commit/39f33d8fc7c2b823e56ff0ec94b4dc9a2b3c4d08))

## [1.2.0](https://github.com/SouravShrestha/word-lock/compare/word-lock-v1.1.0...word-lock-v1.2.0) (2026-08-18)

### Features

- **game:** add word history display to game over screen ([654949b](https://github.com/SouravShrestha/word-lock/commit/654949b205bb7a37e24d4a23ec3143c68457db0d))

## [1.1.0](https://github.com/SouravShrestha/word-lock/compare/word-lock-v1.0.0...word-lock-v1.1.0) (2026-08-08)

### Features

- **profile:** add user profile page with game statistics ([d2585e9](https://github.com/SouravShrestha/word-lock/commit/d2585e931fcdfaf1201f737278dc5c856cba0712))

## 1.0.0 (2026-08-03)

### Features

- initial project setup ([93c9af3](https://github.com/SouravShrestha/word-lock/commit/93c9af33aefc1f92d8069c85bfb3914a62bce577))
