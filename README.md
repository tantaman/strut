The original project is ancient (2011/2013) and dated. It is now coming back with a facelift, collaborative editing and offline support, powered by [vlcn.io](https://vlcn.io)

[Discord](https://discord.gg/Yxwr4SUQDT)

# Building

The re-write currently requires bleeding edge builds of `cr-sqlite` and refers to packages provided by that project as local dependencies.

To build Strut, you'll need to:

## Create a workspace

```
mkdir strut-workspace
cd strut-workspace
```

All the following cloned repositories should exist in `strut-workspace` as the main `strut` project links to them by path ([example](https://github.com/tantaman/Strut/blob/557ed08cf9de669e0b95979e8becdac4bcccf5ed/app/package.json#L32-L38)).

## Clone a few dependency repositories

**vlcn-io/cr-sqlite:**

```
git clone --recurse-submodules git@github.com:vlcn-io/cr-sqlite.git
cd cr-sqlite
pnpm install
pnpm build
```

**vlcn-io/model:**

```
git clone git@github.com:vlcn-io/model.git
cd model/ts
pnpm install
pnpm build
```

**tantaman/misc:**

```
git clone git@github.com:tantaman/misc.git
cd misc/typescript
pnpm install
pnpm build
```

## Clone Strut

```
git clone git@github.com:tantaman/Strut.git
cd strut
pnpm install
```

You can now run the `app` and `server` components:

**app**

```
cd strut/app
pnpm start
```

**server**

```
cd strut/server
pnpm dev
```

Once `cr-sqlite`, `model` and `misc` stabilize the first few steps will not be required.

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
