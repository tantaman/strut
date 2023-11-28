The original project is ancient (2011/2013) and dated. It is now coming back with a facelift, collaborative editing and offline support, powered by [vlcn.io](https://vlcn.io)

We're in the [#strut.io channel](https://discord.com/channels/929781625473073245/1179183030468870235) of [![](https://dcbadge.vercel.app/api/server/lfwdev)](https://discord.gg/lfwdev)

# Contributing

The re-write currently requires bleeding edge builds of `cr-sqlite` and refers to packages provided by that project as local dependencies.

```bash
# Clone the repo + submodules
git clone --recurse-submodules git@github.com:tantaman/strut.git
cd strut
# Install npm packages
pnpm install
# Build submodule repositories
pnpm turbo run build --force
# Start the dev server
pnpm dev
```

---

Readme from 2013:

# [Strut](http://strut.io/)

[![Facelift](https://user-images.githubusercontent.com/1009003/201429020-ad350f8e-a488-4434-bc81-a1093bfa9c3c.png)](http://tantaman.github.io/Strut/dist/)

#### A GUI / Authoring Tool for ImpressJS and Bespoke.js

Don't know what ImpressJS is? Check out the ImpressJS demo presentation: http://bartaz.github.com/impress.js/#/bored

### [Start using Strut!](http://strut.io/)

(works in Firefox, Chrome and Safari with basic support for IE10)

#### Learn a bit about Strut

- http://www.youtube.com/watch?v=TTpiDXEIulg
- previous video: http://www.youtube.com/watch?v=zA5s8wwme44
