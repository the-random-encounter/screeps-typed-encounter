"use strict";

/**
 *  Used to determine how many seconds each server tick is lasting on average
 * @param tickSamples How many sample ticks to log before averaging out the time of each tick
 * @returns 'Done'
 */
export function calcTickTime(tickSamples: number = 1000): string { // Call this from 1st line of main loop. Can adjust samples used for calculation from there.
  let millis: number = Date.now();

  // Set some sane defaults
  if (typeof Memory.time == "undefined") Memory.time = {};
  if (typeof Memory.time.lastTickMillis == "undefined") Memory.time.lastTickMillis  = millis - 1010;
  if (typeof Memory.time.lastTickTime   == "undefined") Memory.time.lastTickTime    = 1.01;
  if (typeof Memory.time.tickTimeCount  == "undefined") Memory.time.tickTimeCount   = 0;
  if (typeof Memory.time.tickTimeTotal  == "undefined") Memory.time.tickTimeTotal   = 0;

  let lastTickMillis: number = Number(Memory.time.lastTickMillis);
  let tickTimeCount:  number = Number(Memory.time.tickTimeCount );
  let tickTimeTotal:  number = Number(Memory.time.tickTimeTotal );

  if (tickTimeCount >= (tickSamples-1)) {
    tickTimeTotal += millis - lastTickMillis;
    tickTimeCount++;
    let tickTime: number = (tickTimeTotal / tickTimeCount) / 1000;
    log("Calculated tickTime as " + tickTime + " from " + tickTimeCount + "samples.");
    Memory.time.lastTickTime   = tickTime;
    Memory.time.tickTimeTotal  = millis - lastTickMillis;
    Memory.time.tickTimeCount  = 1;
    Memory.time.lastTickMillis = millis;
  } else {
    global.tickTime = Number(Memory.time.lastTickTime);
    tickTimeTotal += millis - lastTickMillis;
    Memory.time.tickTimeTotal  = tickTimeTotal;
    tickTimeCount++;
    Memory.time.tickTimeCount  = tickTimeCount;
    Memory.time.lastTickMillis = millis;
  }
  return 'Done';
}

/**
 *  Get a random name!
 * @returns The name for your creep!
 */
export function randomName() {

  const nameArray = [ 'Olivia' , 'Emma'     , 'Charlotte', 'Amelia' , 'Sophia', 'Isabella', 'Ava'   , 'Mia'   , 'Evelyn'  , 'Luna'   , 'Harper', 'Camila' , 'Sofia' ,  'Scarlett', 'Elizabeth', 'Eleanor', 'Emily' , 'Chloe'   , 'Mila'  , 'Violet', 'Penelope', 'Gianna' , 'Aria'  , 'Abigail', 'Ella'  , 'Avery'    , 'Hazel'    , 'Nora'   , 'Layla' , 'Lily'    , 'Aurora', 'Nova'  , 'Ellie'   , 'Madison', 'Grace' , 'Isla'   , 'Willow', 'Christian', 'Riley'    , 'Stella' , 'Eliana', 'Victoria', 'Emilia', 'Zoey'  , 'Ivy'     , 'Naomi'  , 'Hannah', 'Lucy'   , 'Elena' , 'Lillian'  , 'Paisley'  , 'Addison', 'Maya'  , 'Natalie' , 'Leah'  , 'Everly', 'Delilah' , 'Madelyn', 'Ruby'  , 'Leilani', 'Sophie', 'Kinsley'  , 'Genesis'  , 'Claire' , 'Audrey', 'Aaliyah' , 'Alice' , 'Sadie' , 'Autumn'  , 'Quinn'  , 'Cora'  , 'Kennedy', 'Athena', 'Josephine', 'Valentina', 'Natalia', 'Hailey', 'Brooklyn', 'Aubrey', 'Emery' , 'Savannah', 'Bella'  , 'Eloise', 'Skylar' , 'Ariana', 'Caroline' , 'Gabriella', 'Adeline', 'Nevaeh', 'Serenity', 'Maria' , 'Lydia' , 'Liliana' , 'Sarah'  , 'Oliver', 'Elijah' , 'Anna'  , 'Everleigh', 'Raelynn'  , 'William', 'Henry' , 'Benjamin', 'Iris'  , 'Jade'  , 'Theodore', 'Mateo'  , 'Daniel', 'James'  , 'Lucas' , 'Sebastian', 'Alexander', 'Michael', 'Asher' , 'Samuel'  , 'Ethan' , 'Mason' , 'Jackson' , 'Hudson' , 'Joseph', 'Gabriel', 'Julian', 'Maverick' , 'Santiago' , 'Grayson', 'Cooper', 'Matthew' , 'Andrew', 'Nathan', 'Jeremiah', 'Lincoln', 'Thomas', 'Anthony', 'Jayden', 'Jonathan' , 'Nicholas' , 'Cameron', 'Carter', 'Leonardo', 'Adrian', 'Waylon', 'Everett' , 'Jameson', 'Wyatt' , 'Wesley' , 'Robert', 'Ezekiel'  , 'Bennett'  , 'Greyson', 'Xavier', 'Charles' , 'Josiah', 'Dylan' , 'Isaiah'  , 'Joshua' , 'Brooks', 'Walker' , 'Easton', 'Weston'   , 'Landon'   , 'Colton' , 'Jordan', 'Parker'  , 'Rowan' , 'Caleb' , 'Silas'   , 'Axel'   , 'Jose'  , 'Isaac'  , 'Elias' , 'Micah'    , 'Aiden'    , 'David'  , 'Jacob' , 'Logan'   , 'Miles' , 'Angel' , 'Nolan'   , 'Jaxon'  , 'Roman' , 'Aaron'  , 'Beau'  , 'Adam'     , 'Theo'     , 'Ayla'   , 'Liam'  , 'Noah'    , 'Levi'  , 'Jack'  , 'Owen'    , 'Ezra'   , 'John'  , 'Luca'   , 'Luke'  , 'Ryan'     , 'Kai'      , 'Eli'    , 'Leo'   , 'Zoe'     , 'Ian'   , 'Christopher' ];

  const randIndex = Math.floor(Math.random() * (nameArray.length + 1));

  log('Random Index: ' + randIndex);
  log('Random Name: ' + nameArray[randIndex]);

  return nameArray[randIndex];

};

export function partCost(array: Array<BodyPartConstant>) {

  let runningTotal: number = 0;

  for (let i = 0; i < array.length; i++) {
    switch (array[i]) {
      case WORK:
        runningTotal += 100;
        break;
      case CARRY:
        runningTotal += 50;
        break;
      case MOVE:
        runningTotal += 50;
        break;
      case ATTACK:
        runningTotal += 80;
        break;
      case RANGED_ATTACK:
        runningTotal += 150;
        break;
      case HEAL:
        runningTotal += 250;
        break;
      case TOUGH:
        runningTotal += 10;
        break;
      case CLAIM:
        runningTotal += 600;
        break;
      default:
        log('Invalid part in array');
        return;
    }
  }

  return runningTotal;
}

/**
 * A simple alias for the Game.getObjectById() method
 * @param ID The id of an object
 * @returns The game object of the ID
 */
export function GOBI(ID: Id<AnyCreep | AnyStructure | ConstructionSite | Resource | Tombstone>) {  return Game.getObjectById(ID); }

/**
 *  A simple alias for Game.creeps[name].move(), easier to call from console
 * @param name The name of the creep
 * @param dir The directional constant to  move
 * @returns void
 */
export function MC(name: string, dir: DirectionConstant) {

  switch (dir) {
    case 1:
    case 2:
    case 3:
    case 4:
    case 5:
    case 6:
    case 7:
    case 8:
      break;
    case TOP:
      dir = 1;
      break;
    case TOP_RIGHT:
      dir = 2;
      break;
    case RIGHT:
      dir = 3;
      break;
    case BOTTOM_RIGHT:
      dir = 4;
      break;
    case BOTTOM:
      dir = 5;
      break;
    case BOTTOM_LEFT:
      dir = 6;
      break;
    case LEFT:
      dir = 7;
      break;
    case TOP_LEFT:
      dir = 8;
      break;
  }

  return Game.creeps[name].move(dir)
}


/**
 *
 * @param {StructureController} controller   The controller object that will display the info
 * @return void;
 */
export function visualRCProgress(controller: StructureController): void {

  function add(acc: number, a: number) { return acc + a; }
  let lvlColor: string;

  switch (controller.level) {
    case 1:
      lvlColor = '#002700';
      break;
    case 2:
      lvlColor = '#228600';
      break;
    case 3:
      lvlColor = '#00ffaa';
      break;
    case 4:
      lvlColor = '#22dddd';
      break;
    case 5:
      lvlColor = '#8000ff';
      break;
    case 6:
      lvlColor = '#dd00bb';
      break;
    case 7:
      lvlColor = '#dd7700';
      break;
    case 8:
      lvlColor = '#dd0000';
      break;
  }

  const cont: StructureController = controller;
  const rmName: string   = controller.room.name;
  const rmSettingsPInfo: ProgressInfoSettings  = controller.room.memory.settings.visualSettings.progressInfo;

  if (Memory.miscData.rooms[rmName] === undefined)
      Memory.miscData.rooms[rmName] = {};
  if (Memory.miscData.rooms[rmName].controllerPPTArray === undefined)
      Memory.miscData.rooms[rmName].controllerPPTArray = [];
  if (Memory.miscData.rooms[rmName].controllerProgress === undefined)
      Memory.miscData.rooms[rmName].controllerProgress = 0;
  if (Memory.miscData.rooms[rmName].controllerPPTArray.length > cont.level * 12) {
    const array  : number[] = Memory.miscData.rooms[ rmName ].controllerPPTArray;
    const newArr : number[] = avgArray(array);
    Memory.miscData.rooms[rmName].controllerPPTArray = newArr;
  }

  const progress: number = cont.progress;
  let progressLastTick: number;

  if (Memory.miscData.rooms[rmName].controllerProgress !== 0)
    progressLastTick = progress - Memory.miscData.rooms[rmName].controllerProgress;
  else
    progressLastTick = 0;

  if (!(progressLastTick == 0 && Memory.miscData.rooms[rmName].controllerPPTArray.length == 0))
    Memory.miscData.rooms[rmName].controllerPPTArray.push(progressLastTick);

  Memory.miscData.rooms[rmName].controllerProgress = progress;

  const sum   : number = Memory.miscData.rooms[rmName].controllerPPTArray.reduce(add, 0);
  const arrLen: number = Memory.miscData.rooms[rmName].controllerPPTArray.length;

  const avgProgressPerTick : number    = parseInt((sum / arrLen).toFixed(2));
  const progressRemaining  : number    = cont.progressTotal - cont.progress;
  const ticksRemaining     : number    = parseInt((progressRemaining / avgProgressPerTick).toFixed(0));
  const currentTickDuration: number    = Memory.time.lastTickTime.toFixed(2);
  const secondsRemaining   : number    = ticksRemaining * currentTickDuration;
  const fontSize           : number    = rmSettingsPInfo.fontSize;
  const xOffset            : number    = rmSettingsPInfo.xOffset;
  const yOffsetFactor      : number    = rmSettingsPInfo.yOffsetFactor;
  const stroke             : string    = rmSettingsPInfo.stroke;
  const alignment          : alignment = rmSettingsPInfo.alignment;
  const days               : number    = Math.floor(secondsRemaining / (3600 * 24));
  const hours              : number    = Math.floor(secondsRemaining % (3600 * 24) / 3600);
  const minutes            : number    = Math.floor(secondsRemaining % 3600 / 60);
  const seconds            : number    = Math.floor(secondsRemaining % 60);

  cont.room.visual.text(
    ('L' + cont.level + ' - ' + ((cont.progress / cont.progressTotal) * 100).toFixed(2)) + '%',
    cont.pos.x + xOffset,
    cont.pos.y - (yOffsetFactor * 2),
    { align: alignment, opacity: 0.8, color: lvlColor, font: fontSize, stroke: stroke });

  cont.room.visual.text(
    (cont.progress + '/' + cont.progressTotal) + ' - Avg: +' + avgProgressPerTick,
     cont.pos.x + xOffset,
     cont.pos.y - yOffsetFactor,
    {align: alignment, opacity: 0.8, color: lvlColor, font: fontSize - .1, stroke: stroke });

  if (secondsRemaining)
    cont.room.visual.text(
      days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's (' + ticksRemaining + ' ticks)',
      cont.pos.x + xOffset,
      cont.pos.y,
      { align: alignment, opacity: 0.8, color: lvlColor, font: fontSize - .1, stroke: stroke });
  else
    cont.room.visual.text('Unknown time remaining',
      cont.pos.x + xOffset,
      cont.pos.y,
      { align: alignment, opacity: 0.8, color: '#000000', font: fontSize - .1, stroke: '#ffaa00' });
}

/**
 *  Takes a number array as input and returns the average
 * @param array The array used for calculation
 * @returns The array's average value
 */
function avgArray(array: number[]): number[] {

  function add(acc: number, a: number): number { return acc + a; }

  const sum    : number   = array.reduce(add, 0);
  const arrLen : number   = array.length;
  const avg    : number   = parseInt((sum / arrLen).toFixed(2));
  const newArr : number[] = [avg];

  return newArr;
}

/**
 *  Converts raw seconds into days/hours/minutes/seconds
 * @param seconds The number of seconds to convert
 * @returns The string value of "Xd Xh Xm Xs"
 */
export function secondsToDhms(seconds: number) {
seconds = Number(seconds);
var d: number = Math.floor(seconds / (3600*24));
var h: number = Math.floor(seconds % (3600*24) / 3600);
var m: number = Math.floor(seconds % 3600 / 60);
var s: number = Math.floor(seconds % 60);

var dDisplay: string = d > 0 ? d + (d == 1 ? " day, "    : " days, "    ) : "";
var hDisplay: string = h > 0 ? h + (h == 1 ? " hour, "   : " hours, "   ) : "";
var mDisplay: string = m > 0 ? m + (m == 1 ? " minute, " : " minutes, " ) : "";
var sDisplay: string = s > 0 ? s + (s == 1 ? " second"   : " seconds"   ) : "";
return dDisplay + hDisplay + mDisplay + sDisplay;
}

Object.assign(exports, {

  POLYBLUEDOTTED3: {
    stroke: '#0000ff',
    strokeWidth: 0.1,
    lineStyle: 'dashed'
  }
})

export function fireLink(link1: Id<StructureLink>, link2: Id<StructureLink>) {

  const link1Obj: StructureLink = Game.getObjectById(link1);
  const link2Obj: StructureLink = Game.getObjectById(link2);

  link1Obj.transferEnergy(link2Obj);

  return;
}

export function calcLabReaction(baseReg1: MineralCompoundConstant | MineralConstant, baseReg2: MineralCompoundConstant | MineralConstant) {

  let outputChem: MineralCompoundConstant;

  // DETERMINE OUTPUT COMPOUND BASED ON INPUT COMPOUNDS
  if (baseReg1 === RESOURCE_OXYGEN               || baseReg2 === RESOURCE_OXYGEN) {
    if (baseReg1 === RESOURCE_HYDROGEN           || baseReg2 === RESOURCE_HYDROGEN)
      outputChem = RESOURCE_HYDROXIDE;
    else if (baseReg1 === RESOURCE_UTRIUM        || baseReg2 === RESOURCE_UTRIUM)
      outputChem = RESOURCE_UTRIUM_OXIDE;
    else if (baseReg1 === RESOURCE_KEANIUM       || baseReg2 === RESOURCE_KEANIUM)
      outputChem = RESOURCE_KEANIUM_OXIDE;
    else if (baseReg1 === RESOURCE_LEMERGIUM     || baseReg2 === RESOURCE_LEMERGIUM)
      outputChem = RESOURCE_LEMERGIUM_OXIDE;
    else if (baseReg1 === RESOURCE_ZYNTHIUM      || baseReg2 === RESOURCE_ZYNTHIUM)
      outputChem = RESOURCE_ZYNTHIUM_OXIDE;
    else if (baseReg1 === RESOURCE_GHODIUM       || baseReg2 === RESOURCE_GHODIUM)
      outputChem = RESOURCE_GHODIUM_OXIDE;
  } else if (baseReg1 === RESOURCE_HYDROGEN      || baseReg2 === RESOURCE_HYDROGEN) {
    if (baseReg1 === RESOURCE_UTRIUM             || baseReg2 === RESOURCE_UTRIUM)
      outputChem = RESOURCE_UTRIUM_HYDRIDE;
    else if (baseReg1 === RESOURCE_KEANIUM       || baseReg2 === RESOURCE_KEANIUM)
      outputChem = RESOURCE_KEANIUM_HYDRIDE;
    else if (baseReg1 === RESOURCE_LEMERGIUM     || baseReg2 === RESOURCE_LEMERGIUM)
      outputChem = RESOURCE_LEMERGIUM_HYDRIDE;
    else if (baseReg1 === RESOURCE_ZYNTHIUM      || baseReg2 === RESOURCE_ZYNTHIUM)
      outputChem = RESOURCE_ZYNTHIUM_HYDRIDE;
    else if (baseReg1 === RESOURCE_GHODIUM       || baseReg2 === RESOURCE_GHODIUM)
      outputChem = RESOURCE_GHODIUM_HYDRIDE;
  } else if (baseReg1 === RESOURCE_ZYNTHIUM      || baseReg2 === RESOURCE_ZYNTHIUM) {
    if (baseReg1 === RESOURCE_KEANIUM            || baseReg2 === RESOURCE_KEANIUM)
      outputChem = RESOURCE_ZYNTHIUM_KEANITE;
  } else if (baseReg1 === RESOURCE_UTRIUM        || baseReg2 === RESOURCE_UTRIUM) {
    if (baseReg1 === RESOURCE_LEMERGIUM          || baseReg2 === RESOURCE_LEMERGIUM)
      outputChem = RESOURCE_UTRIUM_LEMERGITE;
  } else if (baseReg1 === RESOURCE_ZYNTHIUM_KEANITE || baseReg2 === RESOURCE_ZYNTHIUM_KEANITE) {
    if (baseReg1 === RESOURCE_UTRIUM_LEMERGITE   || baseReg2 === RESOURCE_UTRIUM_LEMERGITE)
      outputChem = RESOURCE_GHODIUM;
  } else if (baseReg1 === RESOURCE_HYDROXIDE     || baseReg2 === RESOURCE_HYDROXIDE) {
    if (baseReg1 === RESOURCE_UTRIUM_HYDRIDE     || baseReg2 === RESOURCE_UTRIUM_HYDRIDE)
      outputChem = RESOURCE_UTRIUM_ACID;
    if (baseReg1 === RESOURCE_UTRIUM_OXIDE       || baseReg2 === RESOURCE_UTRIUM_OXIDE)
      outputChem = RESOURCE_UTRIUM_ALKALIDE;
    if (baseReg1 === RESOURCE_KEANIUM_HYDRIDE    || baseReg2 === RESOURCE_KEANIUM_HYDRIDE)
      outputChem = RESOURCE_KEANIUM_ACID;
    if (baseReg1 === RESOURCE_KEANIUM_OXIDE      || baseReg2 === RESOURCE_KEANIUM_OXIDE)
      outputChem = RESOURCE_KEANIUM_ALKALIDE;
    if (baseReg1 === RESOURCE_LEMERGIUM_HYDRIDE  || baseReg2 === RESOURCE_LEMERGIUM_HYDRIDE)
      outputChem = RESOURCE_LEMERGIUM_ACID;
    if (baseReg1 === RESOURCE_LEMERGIUM_OXIDE    || baseReg2 === RESOURCE_LEMERGIUM_OXIDE)
      outputChem = RESOURCE_LEMERGIUM_ALKALIDE;
    if (baseReg1 === RESOURCE_ZYNTHIUM_HYDRIDE   || baseReg2 === RESOURCE_ZYNTHIUM_HYDRIDE)
      outputChem = RESOURCE_ZYNTHIUM_ACID;
    if (baseReg1 === RESOURCE_ZYNTHIUM_OXIDE     || baseReg2 === RESOURCE_ZYNTHIUM_OXIDE)
      outputChem = RESOURCE_ZYNTHIUM_ALKALIDE;
    if (baseReg1 === RESOURCE_GHODIUM_HYDRIDE    || baseReg2 === RESOURCE_GHODIUM_HYDRIDE)
      outputChem = RESOURCE_GHODIUM_ACID;
    if (baseReg1 === RESOURCE_GHODIUM_OXIDE      || baseReg2 === RESOURCE_GHODIUM_OXIDE)
      outputChem = RESOURCE_GHODIUM_ALKALIDE;
  } else if (baseReg1 === RESOURCE_CATALYST      || baseReg2 === RESOURCE_CATALYST) {
    if (baseReg1 === RESOURCE_UTRIUM_ACID        || baseReg2 == RESOURCE_UTRIUM_ACID)
      outputChem = RESOURCE_CATALYZED_UTRIUM_ACID;
    if (baseReg1 === RESOURCE_UTRIUM_ALKALIDE    || baseReg2 == RESOURCE_UTRIUM_ALKALIDE)
      outputChem = RESOURCE_CATALYZED_UTRIUM_ALKALIDE;
    if (baseReg1 === RESOURCE_KEANIUM_ACID       || baseReg2 == RESOURCE_KEANIUM_ACID)
      outputChem = RESOURCE_CATALYZED_KEANIUM_ACID;
    if (baseReg1 === RESOURCE_KEANIUM_ALKALIDE   || baseReg2 == RESOURCE_KEANIUM_ALKALIDE)
      outputChem = RESOURCE_CATALYZED_KEANIUM_ALKALIDE;
    if (baseReg1 === RESOURCE_LEMERGIUM_ACID     || baseReg2 == RESOURCE_LEMERGIUM_ACID)
      outputChem = RESOURCE_CATALYZED_LEMERGIUM_ACID;
    if (baseReg1 === RESOURCE_LEMERGIUM_ALKALIDE || baseReg2 == RESOURCE_LEMERGIUM_ALKALIDE)
      outputChem = RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE;
    if (baseReg1 === RESOURCE_ZYNTHIUM_ACID      || baseReg2 == RESOURCE_ZYNTHIUM_ACID)
      outputChem = RESOURCE_CATALYZED_ZYNTHIUM_ACID;
    if (baseReg1 === RESOURCE_ZYNTHIUM_ALKALIDE  || baseReg2 == RESOURCE_ZYNTHIUM_ALKALIDE)
      outputChem = RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE;
    if (baseReg1 === RESOURCE_GHODIUM_ACID       || baseReg2 == RESOURCE_GHODIUM_ACID)
      outputChem = RESOURCE_CATALYZED_GHODIUM_ACID;
    if (baseReg1 === RESOURCE_GHODIUM_ALKALIDE   || baseReg2 == RESOURCE_GHODIUM_ALKALIDE)
      outputChem = RESOURCE_CATALYZED_GHODIUM_ALKALIDE;
  }

  return outputChem;
}

export function createRoomFlag(room: string): string | null { // creates a flag named after room at room's center, or at controller if present

  let flagX: number;
  let flagY: number;

  if (Game.rooms[room] !== undefined && Game.rooms[room].controller !== undefined) {
    flagX = Game.rooms[room].controller.pos.x;
    flagY = Game.rooms[room].controller.pos.y;
  } else {
    flagX = 25;
    flagY = 25;
  }

  const flag = Game.rooms[room].createFlag(flagX, flagY, Game.rooms[room].name, randomColor(), randomColor());
  switch (flag) {
    default:
      log('Flag succesfully created.', Game.rooms[room]);
      return Game.rooms[room].name;
    case ERR_NAME_EXISTS:
      log('Error: A flag with that name already exists.', Game.rooms[room]);
      return null;
    case ERR_INVALID_ARGS:
      log('Error: The location or the name is incorrect.', Game.rooms[room]);
      return null;
  }
}

export function randomInt(min: number = 1, max: number = 100) { // Random integer between min & max, inclusive
  return Math.floor(Math.random() * (max - min + 1) + min)
}

export function randomColor() { // Random color returned as CONSTANT
  const colorInt = randomInt(1, 10);

  switch (colorInt) {
    case 1:
      return COLOR_RED;
    case 2:
      return COLOR_PURPLE;
    case 3:
      return COLOR_BLUE;
    case 4:
      return COLOR_CYAN;
    case 5:
      return COLOR_GREEN;
    case 6:
      return COLOR_YELLOW;
    case 7:
      return COLOR_ORANGE;
    case 8:
      return COLOR_BROWN;
    case 9:
      return COLOR_GREY;
    case 10:
      return COLOR_WHITE;
  }
}

export function randomColorAsInt() { // Random color returned as INTEGER
  return randomInt(1, 10);
}

export function col(colNum: number) {
  const roomName = Memory.colonies.colonyList[colNum - 1];
  return Game.rooms[roomName];
}

export function isArray(value: any) { return value instanceof Array; }

export function exists(value: any) {
  try {
    if (typeof value === 'object' && value !== null)
      return true;
    else if (typeof value !== 'undefined')
      return true;
    else
      return false;
  } catch (e) { return false; }
}

export function validateRoomName(roomName: string) : roomName is RoomName {
  let pattern = /^[EW]([1-9]|[1-5]\d|60)[NS]([1-9]|[1-5]\d|60)$/;
  return pattern.test(roomName);
};

export function roomNameToXY(name: string) {
  let xx = parseInt(name.substr(1, 10));
  let verticalPos = 2;
  if (xx >= 100) {
    verticalPos = 4;
  } else if (xx >= 10) {
    verticalPos = 3;
  }
  let yy:  number   = parseInt(name.substr(verticalPos + 1), 10);
  let horizontalDir: string = name.charAt(0);
  let verticalDir:   string = name.charAt(verticalPos);
  if (horizontalDir === 'W' || horizontalDir === 'w') {
    xx = -xx - 1;
  }
  if (verticalDir === 'N' || verticalDir === 'n') {
    yy = -yy - 1;
  }
  return [xx, yy];
};

export function validateFlagName(input: string[] | string) {

  const gameFlags: string[] = Object.keys(Game.flags) as string[];
  const numFlags:  number   = gameFlags.length;
  let noMatch:     boolean  = false;

  if (input instanceof Array) {
    for (let i = 0; i < input.length; i++) {
      let matched = validateFlagName(input[i]);
      if (matched)
        continue;
      else {
        log('Provided flag name of \'' + input[i] + '\' at index ' + i + ' is not an existent flag.');
        return false;
      }
    }
  } else if (typeof input === 'string') {
    for (let i = 0; i <= numFlags; i++) {
      if (input == gameFlags[i])
        return true;
      else {
        noMatch = true;
        continue;
      }
    }
    if (noMatch) return false;
  } else {
    log('Input parameter to validate must be an array of flag names, or a single flag name.');
    return null;
  }
}

export function calcPath(startPos: RoomPosition, endPos: RoomPosition) {

  let goal = { pos: endPos, range: 1 };

   let ret: PathFinderPath = PathFinder.search(
    startPos, goal,
    {
      // We need to set the defaults costs higher so that we
      // can set the road cost lower in `roomCallback`
      plainCost: 2,
      swampCost: 10,

      roomCallback: function(roomName) {

        let room: Room = Game.rooms[roomName];
        // In this example `room` will always exist, but since
        // PathFinder supports searches which span multiple rooms
        // you should be careful!
        if (!room) return;

          let costs: CostMatrix = new PathFinder.CostMatrix;


          room.find(FIND_STRUCTURES).forEach(function (struct) {
            if (struct.structureType === STRUCTURE_ROAD) {
              // Favor roads over plain tiles
              costs.set(struct.pos.x, struct.pos.y, 1);
            } else if (struct.structureType !== STRUCTURE_CONTAINER &&
              (struct.structureType !== STRUCTURE_RAMPART ||
                !struct.my)) {
              // Can't walk through non-walkable buildings
              costs.set(struct.pos.x, struct.pos.y, 255);
            }
          });

          // Avoid creeps in the room
          //room.find(FIND_CREEPS).forEach(function(creep) {
          //  costs.set(creep.pos.x, creep.pos.y, 0xff);
          //});

          return costs;
        }
      }
  );
  const returnObj = {
    path: ret.path,
    length: ret.path.length
  }

  return returnObj;
}

export function getBody(segment: BodyPartConstant[], room: Room) {
  let body: BodyPartConstant[] = [];

  // How much each segment costs
  let segmentCost: number = _.sum(segment, s => BODYPART_COST[s]);

  // how much energy we can use total
  let energyAvailable: number = room.energyCapacityAvailable;

  // how many times we can include the segment with room energy
  let maxSegments: number = Math.floor(energyAvailable / segmentCost);

  // push the segment multiple times
  _.times(maxSegments, function () {
    _.forEach(segment, s => body.push(s));
  });

  return body;
}

export function pushWaypoints(creepName: string, waypoints: string | string[]) {

  const creep = Game.creeps[creepName];

  if (waypoints instanceof Array) {
    if (creep.memory.rallyPoint == 'none') {
      delete creep.memory.rallyPoint;
      creep.memory.rallyPoint = waypoints;
      return waypoints;
    } else if (creep.memory.rallyPoint instanceof Array) {
      let oldRallyPoints = creep.memory.rallyPoint;
      const newRallyPoints = oldRallyPoints.concat(waypoints);
      creep.memory.rallyPoint = newRallyPoints;
      return newRallyPoints;
    } else if (creep.memory.rallyPoint !== 'none' && typeof creep.memory.rallyPoint === 'string') {
      const oldRallyPoint = [creep.memory.rallyPoint];
      const newRallyPoints = oldRallyPoint.concat(waypoints);
      creep.memory.rallyPoint = newRallyPoints;
      return newRallyPoints;
    }
  } else if (typeof waypoints === 'string') {
    if (creep.memory.rallyPoint == 'none') {
      delete creep.memory.rallyPoint;
      creep.memory.rallyPoint = waypoints;
      return waypoints;
    } else if (creep.memory.rallyPoint instanceof Array) {
      let currentRallyPoints = creep.memory.rallyPoint;
      currentRallyPoints.push(waypoints);
      creep.memory.rallyPoint.push(waypoints);
      return currentRallyPoints;
    } else if (creep.memory.rallyPoint !== 'none' && typeof creep.memory.rallyPoint === 'string') {
      const currentRallyPoint = creep.memory.rallyPoint;
      const newRallyPoints = [currentRallyPoint, waypoints];
      creep.memory.rallyPoint = newRallyPoints;
      return newRallyPoints
    }
  }
}

export function entries<K extends string, V extends {}>(obj: Partial<Record<K, V>>): [K, V][] {
  return <[K, V][]>Object.entries(obj);
}

export function keys<K extends string>(obj: Record<K, any>): K[] {
  return Object.keys(obj) as K[];
}

export function buildProgress(cSite: ConstructionSite, room: Room): void {
  const progPercent: number = parseInt(((cSite.progress / cSite.progressTotal) * 100).toFixed(1));
        let boxWidth: number = 1.2;
        let boxX: number = .6;
        let progColor: string;
        let boxColor: string;
        if (progPercent >= 90) {
          progColor = '#00ff00';
          boxColor = '#00aa00';
        }
        else if (progPercent >= 80) {
          progColor = '#008800';
          boxColor = '#005500';
        }
        else if (progPercent >= 70) {
          progColor = '#004400';
          boxColor = '#002200';
        }
        else if (progPercent >= 60) {
          progColor = '#ffff00';
          boxColor = '#aaaa00';
        }
        else if (progPercent >= 50) {
          progColor = '#aaaa00';
          boxColor = '#888800';
        }
        else if (progPercent >= 40) {
          progColor = '#999900';
          boxColor = '#555500';
        }
        else if (progPercent >= 30) {
          progColor = '#ff8800';
          boxColor = '#aa5500';
        }
        else if (progPercent >= 20) {
          progColor = '#ff5500';
          boxColor = '#884400';
        }
        else if (progPercent >= 10) {
          progColor = '#aa2200';
          boxColor = '#882200';
        }
        else if (progPercent < 10 && progPercent > 0) {
          progColor = '#ff0000';
          boxColor = '#880000';
          boxWidth = .95;
          boxX = .475
        }
        room.visual.rect(cSite.pos.x - boxX, cSite.pos.y + .65, boxWidth, .5, { fill: boxColor, opacity: 0.5, stroke: progColor, strokeWidth: 0.05, lineStyle: 'solid' });
        room.visual.rect(cSite.pos.x - boxX + 0.05, cSite.pos.y + .68, boxWidth - .1, .43, { fill: 'transparent', opacity: 0.8, stroke: '#000000', strokeWidth: 0.025, lineStyle: 'solid' });
        room.visual.text(((cSite.progress / cSite.progressTotal) * 100).toFixed(1) + '%', cSite.pos.x, cSite.pos.y + 1.025, { stroke: '#000000', strokeWidth: 0.055, color: progColor, font: 0.35 })
}

export function repairProgress(building: AnyStructure, room: Room): void {
  const repPercent: number = parseInt(((building.hits / building.hitsMax) * 100).toFixed(1));
  let boxWidth: number = 1.2;
  let boxX: number = .6;
  let repColor: string;
  let boxColor: string;
  if (repPercent >= 90) {
    repColor = '#00ff00';
    boxColor = '#00aa00';
  }
  else if (repPercent >= 80) {
    repColor = '#008800';
    boxColor = '#005500';
  }
  else if (repPercent >= 70) {
    repColor = '#004400';
    boxColor = '#002200';
  }
  else if (repPercent >= 60) {
    repColor = '#ffff00';
    boxColor = '#aaaa00';
  }
  else if (repPercent >= 50) {
    repColor = '#aaaa00';
    boxColor = '#888800';
  }
  else if (repPercent >= 40) {
    repColor = '#999900';
    boxColor = '#555500';
  }
  else if (repPercent >= 30) {
    repColor = '#ff8800';
    boxColor = '#aa5500';
  }
  else if (repPercent >= 20) {
    repColor = '#ff5500';
    boxColor = '#884400';
  }
  else if (repPercent >= 10) {
    repColor = '#aa2200';
    boxColor = '#882200';
  }
  else if (repPercent < 10) {
    repColor = '#ff0000';
    boxColor = '#880000';
    boxWidth = .95;
    boxX = .475
  }

  room.visual.rect(building.pos.x - boxX, building.pos.y + .65, boxWidth, .5, { fill: boxColor, opacity: 0.5, stroke: repColor, strokeWidth: 0.05, lineStyle: 'solid' });
  room.visual.rect(building.pos.x - boxX + 0.05, building.pos.y + .68, boxWidth - .1, .43, { fill: 'transparent', opacity: 0.8, stroke: '#000000', strokeWidth: 0.025, lineStyle: 'solid' });
  room.visual.text(repPercent + '%', building.pos.x, building.pos.y + 1.025, { stroke: '#000000', strokeWidth: 0.025, color: repColor, font: 0.35 });
}

export function returnCode(rCode: ScreepsReturnCode): ReturnCode {
  switch (rCode) {
    case 0:
      return 'OK';
    case -1:
      return 'ERR_NOT_OWNER';
    case -2:
      return 'ERR_NO_PATH';
    case -3:
      return 'ERR_NAME_EXISTS';
    case -4:
      return 'ERR_BUSY';
    case -5:
      return 'ERR_NOT_FOUND';
    case -6:
      return 'ERR_NOT_ENOUGH_RESOURCES';
    case -7:
      return 'ERR_INVALID_TARGET';
    case -8:
      return 'ERR_FULL';
    case -9:
      return 'ERR_NOT_IN_RANGE';
    case -10:
      return 'ERR_INVALID_ARGS';
    case -11:
      return 'ERR_TIRED';
    case -12:
      return 'ERR_NO_BODYPART';
    case -14:
      return 'ERR_RCL_NOT_ENOUGH';
    case -15:
      return 'ERR_GCL_NOT_ENOUGH';
  }
}

/**
 *
 * @param {string}   logMsg  A string that is to be logged to console
 * @param {string[]} logMsg  An array of strings that are to be logged to console
 * @param {Room}     room    A copy of the room object where the log message originated, if available
 *
 */
export function log(logMsg: string | string[], room: Room | false = false): void {
  if (logMsg instanceof Array) {
    let finalLog: string;
    for (let i = 0; i < logMsg.length; i++) {
      if (room)
        finalLog += room.link() + logMsg[i] + '\n';
      else
        finalLog += '[GENERAL]: ' + logMsg[i] + '\n';
    }
    console.log(finalLog);
    return;
  } else if (typeof logMsg === 'string') {
    if (room)
      console.log(room.link() + logMsg);
    else
      console.log('[GENERAL]: ' + logMsg);
    return;
  }
}
