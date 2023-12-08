---
description: >-
  Here  you will find a description of the bot, it's behaviors, and information
  on how to use the bot yourself.
---

# Overview

## Introduction

**Random Encounter Bot** (REB) is a Screeps bot developed by [Random Encounter](https://github.com/the-random-encounter), initially in JavaScript and later converted to TypeScript. The project began in October 2023, as Random Encounter's second large JavaScript project, having written \~5,000 lines for a custom interactive Twitch [chatbot ](https://www.github.com/the-random-encounter/chatbot)([Git repo](https://github.com/the-random-encounter/randomencounterbot.git)) to use on his DJ livestreaming channel.

## Installation

Download either a [release package](https://github.com/the-random-encounter/screeps-typed-encounter/releases) of the bot, the current main branch code from the [GitHub repo](https://github.com/the-random-encounter/screeps-typed-encounter), or download it via the Git CLI with the follow command:\
\
`git clone https://github.com/the-random-encounter/screeps-typed-encounter.git`\
\
Open the folder in your terminal and run your package manager to install the required packages and TypeScript declaration files:

```
# npm
npm install

# yarn
yarn
```

#### Rollup and code upload

Random TypeBot uses rollup to compile typescript and upload it to a screeps branch on a server.

Move or copy `example.screeps.json` to `screeps.json` and edit it, changing the credentials and optionally adding or removing some of the destinations.

## Terminal Commands

### rollup -c

`rollup -c` will compile the code from `./src` but will not push it to any destinations.

### rollup -c --environment DEST:main

`rollup -c --environment DEST:main` will compile your code, and then upload it to a screeps server using the `main` config from `screeps.json`.

### rollup -cw --environment DEST:main

Using `-cw` instead of `-c` for `rollup -cw --environment DEST:main` will automatically upload your code to the specified configuration every time the code is changed.

## NPM Script Aliases

Finally, there are also NPM scripts that serve as aliases for these commands in `package.json` for IDE integration. The format is `npm run` and `push/watch`-`destination`.

`npm run push-main` is equivalent to `rollup -c --environment DEST:main`

`npm run watch-sim` is equivalent to `rollup -cw --dest sim`.

**Important! To upload code to a private server, you must have** [**screepsmod-auth**](https://github.com/ScreepsMods/screepsmod-auth) **installed and configured!**



