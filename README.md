## Installation

You will need:

- [Node.JS](https://nodejs.org/en/download) (10.x || 12.x)
- A Package Manager ([Yarn](https://yarnpkg.com/en/docs/getting-started) or [npm](https://docs.npmjs.com/getting-started/installing-node))
- Rollup CLI (Optional, install via `npm install -g rollup`)

Download the latest source [here](https://github.com/the-random-encounter/screeps-typed-encounter/archive/master.zip) and extract it to a folder.

Open the folder in your terminal and run your package manager to install the required packages and TypeScript declaration files:

```bash
# npm
npm install

# yarn
yarn
```


### Rollup and code upload

Random TypeBot uses rollup to compile typescript and upload it to a screeps branch on a server.

Move or copy `example.screeps.json` to `screeps.json` and edit it, changing the credentials and optionally adding or removing some of the destinations.

## Terminal Commands
### rollup -c

`rollup -c` will compile the code from `./src` but will not push it to any destinations.

### rollup -c --environment DEST:main
`rollup -c --environment DEST:main` will compile your code, and then upload it to a screeps server using the `main` config from `screeps.json`.

### rollup -cw --environment DEST:main
Using `-cw` instead of `-c` for `rollup -cw --environment DEST:main` will automatically upload your code to the specified configuration every time the code is changed.

### NPM Script Aliases
Finally, there are also NPM scripts that serve as aliases for these commands in `package.json` for IDE integration. The format is `npm run` and `push/watch`-`destination`.

`npm run push-main` is equivalent to `rollup -c --environment DEST:main`

`npm run watch-sim` is equivalent to `rollup -cw --dest sim`.

#### Important! To upload code to a private server, you must have [screepsmod-auth](https://github.com/ScreepsMods/screepsmod-auth) installed and configured!

## Typings

The type definitions for Screeps come from [typed-screeps](https://github.com/screepers/typed-screeps). If you find a problem or have a suggestion, please open an issue there.

## Documentation

Formal full documentation is forthcoming. Thank you for your patience.

### Contributing
Issues, Pull Requests, and contributions to the docs are welcome!
