The original project is ancient (2011/2013) and dated. It is now coming back with a facelift, collaborative editing and offline support, powered by [vlcn.io](https://vlcn.io)

[Discord](https://discord.gg/Yxwr4SUQDT)

# Contributing

The re-write currently requires bleeding edge builds of `cr-sqlite` and refers to packages provided by that project as local dependencies.

To build & work on strut:

Get Rust Nightly installed:

```bash
rustup toolchain install nightly
rustup default nightly
```

Make sure you have `pnpm` installed:
```bash
npm install -g pnpm
```

Finally:

```bash
git clone --recurse-submodules git@github.com:vlcn-io/workspace.git strut-workspace
cd strut-workspace
make
```

Make should download, install and build all the things you need.

Now you can:

```bash
cd strut/app
pnpm start
```

To start the UI.

```bash
cd strut/server
pnpm dev
```

To start the server

---

Readme from 2013:

# [Strut](http://strut.io/)

[![Facelift](https://user-images.githubusercontent.com/1009003/201429020-ad350f8e-a488-4434-bc81-a1093bfa9c3c.png)](http://tantaman.github.io/Strut/dist/)

#### A GUI / Authoring Tool for ImpressJS and Bespoke.js

Don't know what ImpressJS is? Check out the ImpressJS demo presentation: http://bartaz.github.com/impress.js/#/bored

### Start using Strut! http://tantaman.github.io/Strut/dist/

(works in Firefox, Chrome and Safari with basic support for IE10)

#### Learn a bit about Strut

- http://www.youtube.com/watch?v=TTpiDXEIulg
- previous video: http://www.youtube.com/watch?v=zA5s8wwme44
