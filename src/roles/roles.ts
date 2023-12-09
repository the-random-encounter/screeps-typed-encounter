import { repairProgress, log } from '../prototypes/miscFunctions';

export const roleBuilder = {

  run: function (creep: Creep) {

      const room: Room = creep.room;
      const cMem: CreepMemory = creep.memory;
      const rMem: RoomMemory = room.memory;
      const pos: RoomPosition = creep.pos;

      if (cMem.disableAI === undefined) cMem.disableAI = false;
      if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

      if (!cMem.disableAI) {

        if (cMem.rallyPoint === 'none') {
          if (creep.ticksToLive <= 2) {
            creep.drop(RESOURCE_ENERGY);
            creep.say('☠️');
          }

          if (cMem.working && creep.store[RESOURCE_ENERGY] == 0) {
            cMem.working = false;
            creep.say('🔼');
          }
          if (!cMem.working && creep.store.getFreeCapacity() == 0) {
            cMem.working = true;
            creep.say('🏗️');
          }
          if (cMem.claimant && rMem.objects.spawns.length > 0) delete cMem.claimant;
          if (pos.x == 49) creep.move(LEFT);
          else if (pos.x == 0) creep.move(RIGHT);
          else if (pos.y == 49) creep.move(TOP);
          else if (pos.y == 0) creep.move(BOTTOM);

          let cSites = room.find(FIND_MY_CONSTRUCTION_SITES);
          if (rMem.settings.flags.sortConSites)
            cSites = cSites.sort((a, b) => b.progress - a.progress);

          if (creep.store.getUsedCapacity() == 0) {

            switch (Memory.rooms[cMem.homeRoom].settings.flags.centralStorageLogic) {
              case true: {

                const droppedPiles: Array<Resource | Structure> = room.find(FIND_DROPPED_RESOURCES);
                const containersWithEnergy: Array<Structure> = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_STORAGE || i.structureType == STRUCTURE_CONTAINER) && i.store[RESOURCE_ENERGY] > 0) });
                const targets: Array<Resource | Structure> = droppedPiles.concat(containersWithEnergy);
                let target: any = pos.findClosestByRange(targets);

                if (target) {
                  if (creep.pickup(target) == ERR_NOT_IN_RANGE || creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    creep.moveTo(target, pathing.builderPathing);
                  else creep.withdraw(target, RESOURCE_ENERGY);
                }
                break;
              }

              default:
              case false: {

                let outboxes: Array<StructureContainer> = [];

                if (rMem.settings.containerSettings.outboxes.length > 0) {
                  let outboxIDs = rMem.settings.containerSettings.outboxes;
                  for (let i = 0; i < outboxIDs.length; i++) {
                    const outbox = Game.getObjectById(outboxIDs[i]);
                    outboxes.push(outbox);
                  }
                } else {
                  const sources: Array<Source> = room.find(FIND_SOURCES);
                  for (let i = 0; i < sources.length; i++) {
                    const outbox: Array<StructureContainer> = sources[i].pos.findInRange(FIND_STRUCTURES, 2, { filter: { structureType: STRUCTURE_CONTAINER } });
                    if (outbox.length > 0) outboxes.push(outbox[0]);
                  }
                }

                if (outboxes.length > 0) {
                  outboxes = outboxes.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]);
                  let dPiles = room.find(FIND_DROPPED_RESOURCES, { filter: { resourceType: RESOURCE_ENERGY } });
                  if (dPiles.length) {
                    if (dPiles.length > 1)
                      dPiles = dPiles.sort((a, b) => b.amount - a.amount);
                    const closestPile = pos.findClosestByRange(dPiles);
                    const closestBox = pos.findClosestByRange(outboxes);
                    if (closestPile.amount > closestBox.store[RESOURCE_ENERGY]) {
                      if (creep.pickup(closestPile) == ERR_NOT_IN_RANGE)
                        creep.moveTo(closestPile, pathing.builderPathing)
                    } else {
                      const closestBox = pos.findClosestByRange(outboxes);
                      if (closestBox.store[RESOURCE_ENERGY] > 0) {
                        if (creep.withdraw(closestBox, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                          creep.moveTo(closestBox, pathing.builderPathing);
                      }
                    }
                  } else {

                    const closestBox = pos.findClosestByRange(outboxes);
                    if (closestBox.store[RESOURCE_ENERGY] > 0) {
                      if (creep.withdraw(closestBox, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        creep.moveTo(closestBox, pathing.builderPathing);
                    } else {
                      let droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                      if (droppedPiles.length > 0) {
                        const target = pos.findClosestByRange(droppedPiles);

                        if (target) {
                          if (creep.pickup(target) == ERR_NOT_IN_RANGE)
                            creep.moveTo(target, pathing.builderPathing);
                        }
                      }
                    }
                  }
                } else {
                  let droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                  if (droppedPiles.length > 0) {
                    const target = pos.findClosestByRange(droppedPiles);

                    if (target) {
                      if (creep.pickup(target) == ERR_NOT_IN_RANGE)
                        creep.moveTo(target, pathing.builderPathing);
                    }
                  }
                }
                break;
              }
            }
          } else { //: HAVE ENERGY, FIND BUILDINGS TO WORK ON
            let target;
            if (rMem.settings.flags.closestConSites)
              target = pos.findClosestByRange(cSites);
            else
              target = cSites[0];

            if (target) {
              const result = creep.build(target);
              switch (result) {
                case OK:
                  if (cMem.claimant)
                    Game.rooms[cMem.homeRoom].memory.data.claimRooms[room.name as RoomName].energyRemaining -= (creep.getActiveBodyparts(WORK) * 5);
                  break;
                case ERR_NOT_IN_RANGE:
                  creep.moveTo(target, pathing.builderPathing);
                  break;
                default:
                  break;
                  creep.moveTo(target, pathing.builderPathing);
              }
            } else { //: NO BUILDINGS, DO REPAIRS IF NO REPAIRERS
              const repairers = room.find(FIND_MY_CREEPS, { filter: (i) => i.memory.role === 'repairer' });

              if (repairers.length == 0) { //: NO REPAIRERS, DO REPAIRS
                let basics: AnyStructure[] = [];
                let ramparts: StructureRampart[] = [];
                let walls: StructureWall[] = [];
                let validTargets: AnyStructure[] = [];
                const rampartsMax = Memory.rooms[cMem.homeRoom].settings.repairSettings.repairRampartsTo;
                const wallsMax = Memory.rooms[cMem.homeRoom].settings.repairSettings.repairWallsTo;

                if (Memory.rooms[cMem.homeRoom].settings.flags.repairBasics) {
                  basics = room.find(FIND_STRUCTURES, { filter: (i) => (i.hits < i.hitsMax * .8) && (i.structureType !== STRUCTURE_WALL && i.structureType !== STRUCTURE_RAMPART) });
                  validTargets = validTargets.concat(basics);
                }

                //: add ramparts to the repair list, based on room flag & room max repair limit
                if (Memory.rooms[cMem.homeRoom].settings.flags.repairRamparts) {
                  ramparts = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_RAMPART) && (i.hits  <= rampartsMax)) });
                  validTargets = validTargets.concat(ramparts);
                }

                //: add walls to the repair list, based on room flag & room max repair limit
                if (Memory.rooms[cMem.homeRoom].settings.flags.repairWalls) {
                  walls = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_WALL) && (i.hits <= wallsMax)) })
                  validTargets = validTargets.concat(walls);
                }

                validTargets = validTargets.sort((a, b) => a.hits - b.hits);

                if (validTargets.length > 0) { //: VALID TARGETS, MOVE TO REPAIR
                  if (creep.repair(validTargets[0]) == ERR_NOT_IN_RANGE) creep.moveTo(validTargets[0], pathing.builderPathing);
                } else { //: NO VALID TARGETS, UPGRADE CONTROLLER INSTEAD
                  if (creep.upgradeController(room.controller) == ERR_NOT_IN_RANGE) creep.moveTo(room.controller, pathing.builderPathing);
                }
              } else { //: THERE ARE REPAIRERS, SO UPGRADE CONTROLLER INSTEAD
                if (creep.upgradeController(room.controller) == ERR_NOT_IN_RANGE) creep.moveTo(room.controller, pathing.builderPathing);
              }
            }
          }
        } else //: I HAVE A RALLY POINT, LET'S BOOGY!
          navRallyPoint(creep);
      } else
        aiAlert(creep);
  }
}
export const roleClaimer = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    let claimObjective;
    if (cMem.disableAI  === undefined) cMem.disableAI  = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';
    if (cMem.claimRoom  === undefined) {
      if (rMem.data.claimRooms) {
        const rooms = Object.keys(rMem.data.claimRooms) as RoomName[];
        for (let i = 0; i < rooms.length; i++) {
          if (rMem.data.claimRooms[rooms[i]].hasBeenClaimed === false) {
            cMem.claimRoom = rooms[i];
            claimObjective = rMem.data.claimRooms[rooms[i]];
            break;
          } else
            continue;
        }
      }
    }

    if (cMem.remoteWaypoints === undefined) {
      if (rMem.data.claimRooms)
        cMem.remoteWaypoints = rMem.data.claimRooms[cMem.claimRoom].waypoints;
      else
        cMem.remoteWaypoints = 'none';
    }

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if (creep.getActiveBodyparts(CARRY) > 0 && creep.store.getUsedCapacity() == 0) {
          const storage = Game.rooms[cMem.homeRoom].storage;
          const result = creep.withdraw(storage, RESOURCE_ENERGY);
          switch (result) {
            case OK:
              //rMem.data.claimRooms[claimRoom].energyRemaining -= (creep.store.getUsedCapacity());
              break;
            case ERR_NOT_IN_RANGE:
              creep.moveTo(storage);
              break;
            default:
              break;
          }
        } else {

          if (cMem.remoteWaypoints !== 'none') {
            if (cMem.remoteWaypoints.length == 0) cMem.remoteWaypoints = 'none';
            else if (!pos.isNearTo(Game.flags[cMem.remoteWaypoints[0]])) creep.moveTo(Game.flags[cMem.remoteWaypoints[0]], pathing.claimerPathing);
            else {
              if (cMem.remoteWaypoints.length > 1)
                creep.moveTo(Game.flags[cMem.remoteWaypoints[1]], pathing.claimerPathing);
              log(creep.name + ': Reached waypoint \'' + cMem.remoteWaypoints[0] + '\'', room);
              const nextWaypoint = cMem.remoteWaypoints.shift();
              log(nextWaypoint, room);
              if (nextWaypoint === 'undefined') {
                delete cMem.remoteWaypoints;
                cMem.remoteWaypoints = 'none';
              }
            }
          } else {

            if      (pos.x == 49) creep.move(LEFT   );
            else if (pos.x == 0 ) creep.move(RIGHT  );
            else if (pos.y == 49) creep.move(TOP    );
            else if (pos.y == 0 ) creep.move(BOTTOM );

            const claimRoom = cMem.claimRoom;

            if (room.name !== claimRoom)
              creep.moveTo(Game.flags[claimRoom], pathing.claimerPathing);
            else {
              const result = creep.claimController(room.controller);
              switch (result) {
                case OK:
                  rMem.data.claimRooms[claimRoom.name].hasBeenClaimed = true;
                  cMem.haveClaimed = true;
                  break;
                case ERR_NOT_IN_RANGE:
                  creep.moveTo(room.controller, pathing.claimerPathing);
                  break;
              }

              if (!room.controller.sign || room.controller.sign.username !== 'randomencounter')
                creep.signController(room.controller, 'There\'s no place like 127.0.0.1!');
              else if (cMem.haveClaimed) {
                const logSpot = new RoomPosition(claimObjective.logSpot.x, claimObjective.logSpot.y, claimRoom);

                if (!pos.isEqualTo(logSpot))
                  creep.moveTo(logSpot, pathing.claimerPathing);
                else
                  creep.drop(RESOURCE_ENERGY);
              }
            }
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleCollector = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI  === undefined) cMem.disableAI  = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';
    if (room.storage && !cMem.pickup) cMem.pickup = room.storage.id;

    if (!cMem.disableAI) { //: MY AI ISN'T DISABLED, SO...

      if (cMem.rallyPoint == 'none') { //: I HAVE NO RALLY POINT, SO...

        if (pos.x == 49) creep.move(LEFT);
        else if (pos.x == 0) creep.move(RIGHT);
        else if (pos.y == 49) creep.move(TOP);
        else if (pos.y == 0) creep.move(BOTTOM);

        if (creep.ticksToLive <= 2) creep.say('☠️');

        if (creep.store.getFreeCapacity() > 0) {
          const piles = room.find(FIND_DROPPED_RESOURCES);
          if (piles.length) {
            const nearestPile = pos.findClosestByRange(piles);
            if (nearestPile) {
              if (creep.pickup(nearestPile) === ERR_NOT_IN_RANGE)
                creep.moveTo(nearestPile, pathing.collectorPathing);
            }
          } else {
            const tombstones = room.find(FIND_TOMBSTONES, {filter: (i) => i.store.getUsedCapacity() > 0});

            if (tombstones.length) {
              const nearestStone = pos.findClosestByRange(tombstones);
              if (nearestStone) {
                const stoneInv = Object.keys(nearestStone) as ResourceConstant[];
                if (creep.withdraw(nearestStone, stoneInv[0]) === ERR_NOT_IN_RANGE)
                  creep.moveTo(nearestStone, pathing.collectorPathing);
              }
            }
          }
        } else {
          if (room.storage) {
            const storage = room.storage;
            const inventory = Object.keys(creep.store) as ResourceConstant[];
            if (creep.transfer(storage, inventory[0]) === ERR_NOT_IN_RANGE)
              creep.moveTo(storage, pathing.collectorPathing);
          } else {
            const extensions = room.find(FIND_MY_STRUCTURES, { filter: (i) => i.structureType === STRUCTURE_EXTENSION && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
            const spawns = room.find(FIND_MY_STRUCTURES, { filter: (i) => i.structureType === STRUCTURE_SPAWN && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0});
            const needsFilling = extensions.concat(spawns);

            if (needsFilling.length) {
              const closestFill = pos.findClosestByRange(needsFilling);
              if (closestFill) {
                if (creep.transfer(closestFill, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                  creep.moveTo(closestFill, pathing.collectorPathing);
              }
            } else {
              const inbox = room.controller.pos.findInRange(FIND_STRUCTURES, 3, { filter: (i) => i.structureType === STRUCTURE_CONTAINER && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0});

              if (inbox.length) {
                const theBox = pos.findClosestByRange(inbox);
                if (theBox) {
                  if (creep.transfer(theBox, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                    creep.moveTo(theBox, pathing.collectorPathing);
                }
              }
            }
          }
        }
      } else
        navRallyPoint(creep);
    } else
    aiAlert(creep);
  }
}
export const roleCrane = {

  run: function (creep: Creep) {

    const room: Room = creep.room;
    const cMem: CreepMemory = creep.memory;
    const rMem: RoomMemory = room.memory;
    const pos: RoomPosition = creep.pos;

    if (cMem.disableAI === undefined) cMem.disableAI = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if (pos.x == 49) creep.move(LEFT);
        else if (pos.x == 0) creep.move(RIGHT);
        else if (pos.y == 49) creep.move(TOP);
        else if (pos.y == 0) creep.move(BOTTOM);

        if (!cMem.link) cMem.link = rMem.data.linkRegistry.central;
        if (!cMem.storage) cMem.storage = rMem.objects.storage;
        //if (!cMem.terminal && rMem.objects.terminal) cMem.terminal = rMem.objects.terminal[0];
        if (!cMem.destination && rMem.data.linkRegistry.destination) cMem.destination = rMem.data.linkRegistry.destination;
        if (!cMem.atCraneSpot === undefined) cMem.atCraneSpot = false;
        if (cMem.upgrading == true && creep.store.getUsedCapacity() == 0) cMem.upgrading = false;

        const objLink: StructureLink = Game.getObjectById(cMem.link);
        const objStorage: StructureStorage = Game.getObjectById(cMem.storage);
        const objTerminal: StructureTerminal = Game.getObjectById(cMem.terminal);
        const objDestination: StructureLink = Game.getObjectById(cMem.destination);

        let craneSpot = rMem.data.craneSpot;


        if (!cMem.atCraneSpot) {
          if (pos.x !== craneSpot[ 0 ] || pos.y !== craneSpot[ 1 ]) {
            creep.moveTo(new RoomPosition(craneSpot[ 0 ], craneSpot[ 1 ], room.name), pathing.cranePathing);
          } else {
            cMem.atCraneSpot = true;
            //log('crane at spot', room);
          }
        }

        if (cMem.atCraneSpot == true) {
          if (creep.store.getFreeCapacity() == 0 && cMem.dropLink == false) {
            //log('full inventory, droplink false', room);
            const resTypes: ResourceConstant[] = Object.keys(creep.store) as ResourceConstant[];
            for (let types of resTypes) {
              if (types !== RESOURCE_ENERGY)
                creep.transfer(objStorage, types)
            }
          }

          if (cMem.dropLink == true) {
            //log('droplink true', room);
            creep.transfer(objStorage, RESOURCE_ENERGY)
            creep.say('🎇');
            cMem.dropLink = false;
            cMem.upgrading = false;
            return;
          } else if (creep.store[ RESOURCE_ENERGY ] > 0 && cMem.xferDest == true) {
            creep.transfer(objLink, RESOURCE_ENERGY);
            creep.say('🎆');
            if (objLink.store[ RESOURCE_ENERGY ] > 700) {
              cMem.xferDest = false;
              cMem.upgrading = false;
              objLink.transferEnergy(objDestination);
            }
            return;
          } else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0 && cMem.upgrading == false) {
            //log('free energy capacity is zero, upgrading is false', room);
            creep.transfer(objStorage, RESOURCE_ENERGY);
            creep.say('🎇');
          } else {
            if (objLink.store[ RESOURCE_ENERGY ] >= 30) {
              //log('link store >= 30', room);
              if (creep.withdraw(objLink, RESOURCE_ENERGY) == OK) {
                creep.say('⚡');
                cMem.dropLink = true;
                cMem.upgrading = false;
                return;
              }
            } else if ((rMem.settings.flags.craneUpgrades) && (cMem.upgrading == false)) {
              if (creep.store.getUsedCapacity() == 0) {
                creep.withdraw(objStorage, RESOURCE_ENERGY);
                creep.say('⚡');
                cMem.upgrading = true;
              } else {
                creep.upgradeController(room.controller)
              }
            } else if (objDestination && objDestination.store.getFreeCapacity(RESOURCE_ENERGY) >= objLink.store.getUsedCapacity(RESOURCE_ENERGY) && objLink.cooldown == 0) {
              if (creep.store.getFreeCapacity() > 0) {
                //log('crane: getting energy for C2D xfer', room);
                creep.withdraw(objStorage, RESOURCE_ENERGY);
                creep.say('⚡');
                cMem.xferDest = true;
              }
            }
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else
      aiAlert(creep);
  }
}
export const roleFiller = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI  === undefined) cMem.disableAI  = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';
    if (room.storage && !cMem.pickup) cMem.pickup = room.storage.id;

    if (!cMem.disableAI) { //: MY AI ISN'T DISABLED, SO...

      if (cMem.rallyPoint == 'none') { //: I HAVE NO RALLY POINT, SO...

        if (pos.x == 49) creep.move(LEFT);
        else if (pos.x == 0) creep.move(RIGHT);
        else if (pos.y == 49) creep.move(TOP);
        else if (pos.y == 0) creep.move(BOTTOM);

        if (creep.ticksToLive <= 2) creep.say('☠️');

        if (cMem.invaderLooter && room.storage) { //: THERE ARE INVADERS TO LOOT AND STORAGE TO PUT IT IN!
          const tombstones: Tombstone[] = room.find(FIND_TOMBSTONES, { filter: (i) => i.store.getUsedCapacity() > 0 && !i.creep.my });

          if (tombstones.length > 0) {

            const target: Tombstone = pos.findClosestByRange(tombstones);
            const lootTypes: ResourceConstant[] = Object.keys(creep.store) as ResourceConstant[];
            log('lootTypes: ' + lootTypes, room);

            if (target.store.getUsedCapacity() == 0 && (lootTypes.length <= 1 && lootTypes[ 0 ] == 'energy')) {
              if (cMem.xferGoods !== undefined) delete cMem.xferGoods;
              delete cMem.invaderLooter;
            } else if (target.store.getUsedCapacity() > 0) {

              if (creep.withdraw(target, lootTypes[ lootTypes.length - 1 ]) == ERR_NOT_IN_RANGE)
                creep.moveTo(target, pathing.invaderPathing)
            }
          } else {
            delete cMem.xferGoods;
            delete cMem.invaderLooter;
          }

          if (cMem.xferGoods === true && creep.store.getFreeCapacity() > 0) {
            if (!pos.isNearTo(room.storage))
              creep.moveTo(room.storage, pathing.invaderPathing);
            else {

              const creepLootTypes: ResourceConstant[] = Object.keys(creep.store) as ResourceConstant[];
              log('creepLootTypes: ' + creepLootTypes, room);
              creep.transfer(room.storage, creepLootTypes[ creepLootTypes.length - 1 ]);

              if (creep.store.getUsedCapacity() == 0) delete cMem.xferGoods;
            }
          } else {
            /*
            if (target) { //: I FOUND THE CLOSEST ENEMY TOMBSTONE
              const lootTypes = Object.keys(target.store);
              log(lootTypes, room);

              if (lootTypes.length == 1 && lootTypes[0] == 'energy' && target.store[RESOURCE_ENERGY] < 25) cMem.invaderLooter = false;

              else {*/ //: THERE'S WORTHWHILE LOOT
            if (creep.store.getFreeCapacity() !== 0) { //: AND I HAVE FREE SPACE
              const tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store.getUsedCapacity() > 0 && !i.creep.my });

              if (tombstones.length > 0) {
                const target = pos.findClosestByRange(tombstones);

                if (pos.isNearTo(target)) {
                  const lootTypes: ResourceConstant[] = Object.keys(target.store) as ResourceConstant[];
                  log('lootTypes: ' + lootTypes, room);
                  creep.withdraw(target, lootTypes[ lootTypes.length - 1 ]);
                }
                else creep.moveTo(target, pathing.invaderPathing);

              } else { //: I NEED TO UNLOAD MY INVENTORY

                const storage = room.storage || pos.findClosestByRange(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_STORAGE } });

                if (pos.isNearTo(storage)) { //: SINCE I'M BY STORAGE,

                  const creepLootTypes: ResourceConstant[] = Object.keys(creep.store) as ResourceConstant[];
                  log('creepLootTypes: ' + creepLootTypes, room);
                  creep.transfer(storage, creepLootTypes[ creepLootTypes.length - 1 ]);
                  cMem.xferGoods = false;
                } else creep.moveTo(storage, pathing.invaderPathing);
              }

              const creepGonnaDie = creep.ticksToLive;
              const tombsWithStuff = room.find(FIND_TOMBSTONES, { filter: (i) => i.store.getUsedCapacity() > 0 });

              if (tombsWithStuff.length == 0 || creepGonnaDie < 100) delete cMem.invaderLooter;
            }
          }
        } else { //: NO INVADERS TO LOOT, SO...

          if (creep.store[ RESOURCE_ENERGY ] == 0) { //: NO ENERGY, SO...

            let tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store.getUsedCapacity() > 0 && i.creep.my });

            if (tombstones.length > 0) {
              const tombstoneItem = Object.keys(tombstones[ 0 ].store) as ResourceConstant[];

              if (tombstoneItem.length > 1 || (tombstoneItem.length == 1 && tombstoneItem[ 0 ] !== RESOURCE_ENERGY)) cMem.tombXfer = true;
              if (creep.withdraw(tombstones[ 0 ], tombstoneItem[ 0 ]) == ERR_NOT_IN_RANGE)
                creep.moveTo(tombstones[ 0 ], pathing.collectorPathing);

            } else { //: NO TOMBSTONES, NEED TO FIND OTHER SOURCES OF ENERGY...

              if (room.storage) { //: IF RCL IS OVER 3 AND WE HAVE A STORAGE
                let droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                droppedPiles = droppedPiles.sort((a, b) => b.amount - a.amount);

                if (droppedPiles.length > 0 && droppedPiles[0].amount > creep.store.getCapacity()) {
                  if (creep.pickup(droppedPiles[ 0 ]) == ERR_NOT_IN_RANGE)
                    creep.moveTo(droppedPiles[ 0 ], pathing.collectorPathing);
                } else {

                  if (!cMem.pickup) cMem.pickup = room.storage.id;
                  const storage = room.storage;

                  if (room.storage.store[ RESOURCE_ENERGY ] >= creep.store.getCapacity()) {

                    if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                      creep.moveTo(storage, pathing.collectorPathing);
                  }
                }
              } else { //: IF RCL IS 3 OR LESS (AND THUS NO STORAGE)

                let outboxes: Array<StructureContainer> = [];

                if (rMem.settings.containerSettings.outboxes.length > 0) {

                  let outboxIDs = rMem.settings.containerSettings.outboxes;
                  for (let i = 0; i < outboxIDs.length; i++) {
                    const outbox = Game.getObjectById(outboxIDs[ i ]);
                    outboxes.push(outbox);
                  }
                } else {

                  const sources: Array<Source> = room.find(FIND_SOURCES);
                  for (let i = 0; i < sources.length; i++) {
                    const outbox: Array<StructureContainer> = sources[ i ].pos.findInRange(FIND_STRUCTURES, 2, { filter: { structureType: STRUCTURE_CONTAINER } });
                    if (outbox.length > 0) outboxes.push(outbox[ 0 ]);
                  }
                }

                if (outboxes.length > 0) {
                  outboxes = outboxes.sort((a, b) => b.store[ RESOURCE_ENERGY ] - a.store[ RESOURCE_ENERGY ]);
                  if (outboxes[ 0 ].store[ RESOURCE_ENERGY ] > creep.store.getCapacity()) {
                    if (creep.withdraw(outboxes[ 0 ], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                      creep.moveTo(outboxes[ 0 ], pathing.collectorPathing);
                  } else {
                    let droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                    droppedPiles = droppedPiles.sort((a, b) => b.amount - a.amount);

                    if (droppedPiles.length > 0) {
                      const closestPile = pos.findClosestByRange(droppedPiles);
                      if (creep.pickup(closestPile) == ERR_NOT_IN_RANGE)
                        creep.moveTo(closestPile, pathing.collectorPathing);
                    }
                  }
                }
              }
            }
          } else { //: IF MY STORE IS FULL OF ENERGY...
            const targets: Array<StructureSpawn | StructureExtension> = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_SPAWN || i.structureType == STRUCTURE_EXTENSION) && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0) });

            if (targets.length > 0) { //: FIND SPAWNS & EXTENSIONS THAT NEED TO  BE FILLED
              const target: StructureSpawn | StructureExtension = pos.findClosestByRange(targets);

              if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                creep.moveTo(target, pathing.collectorPathing);

            } else { //: NO SPAWNS/EXTENSIONS NEED FILLING, WHAT ABOUT TOWERS...?
              let towers: StructureTower[] = room.find(FIND_MY_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_TOWER && (i.store.getFreeCapacity(RESOURCE_ENERGY) !== 0) })
              if (towers.length > 1)
                towers = towers.sort((a, b) => a.store[ RESOURCE_ENERGY ] - b.store[ RESOURCE_ENERGY ]);
              if (towers.length > 0) { //: HEAD TO CLOSEST NON-FULL TOWER AND FILL IT
                if (creep.transfer(towers[ 0 ], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                  creep.moveTo(towers[ 0 ], pathing.collectorPathing);
              } else {
                const spawn = Game.getObjectById(rMem.objects.spawns[ 0 ]);
                if (!pos.isEqualTo(spawn.pos.x + 1, spawn.pos.y))
                  creep.moveTo(spawn.pos.x + 1, spawn.pos.y, pathing.collectorPathing);
                else if (pos.isNearTo(spawn.pos.x + 1, spawn.pos.y))
                  return;
              }
            }
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else { //: MY AI IS DISABLED, DURRRRR..... *drools*
      if (!Memory.globalSettings.alertDisabled)
        log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.', room);
      creep.say('💤');
    }
  }
}
export const roleHarvester = {

  run: function (creep: Creep) {

    const room: Room         = creep.room;
    const cMem: CreepMemory  = creep.memory;
    const rMem: RoomMemory   = room.memory;
    const pos : RoomPosition = creep.pos;

    if (cMem.disableAI  === undefined) cMem.disableAI  = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (creep.ticksToLive <= 2) {
          creep.unloadEnergy();
          creep.say('☠️');
        }

        if (creep.getActiveBodyparts(CARRY) === 0) {
          if (!cMem.source) creep.assignHarvestSource();

          const source = Game.getObjectById(cMem.source);
          if (!pos.isNearTo(source))
            creep.moveTo(source, pathing.harvesterPathing);
          else {
            const containers = pos.findInRange(FIND_STRUCTURES, 2, { filter: { structureType: STRUCTURE_CONTAINER } });
            if (containers.length) {
              const bucket = pos.findClosestByRange(containers);
              if (bucket) {
                if (!pos.isEqualTo(bucket))
                  creep.moveTo(bucket, pathing.harvesterPathing);
                else
                  creep.harvestEnergy();
              }
            } else
              creep.harvestEnergy();
          }
        } else {

          if (creep.store.getFreeCapacity() == 0 || creep.store.getFreeCapacity() < (creep.getActiveBodyparts(WORK) * 2)) {
            if (!cMem.bucket) {

              const containers = pos.findInRange(FIND_STRUCTURES, 3, { filter: { structureType: STRUCTURE_CONTAINER } });
              if (containers.length > 0) {
                const target = pos.findClosestByRange(containers);
                if (cMem.claimant) delete cMem.claimant;
                if (!pos.isNearTo(target)) creep.moveTo(target, pathing.harvesterPathing);
                else {
                  if (target.hits < target.hitsMax) creep.repair(target);
                  else {
                    creep.unloadEnergy();
                    creep.harvestEnergy();
                  }
                }
              } else {
                const nearbySites = pos.findInRange(FIND_CONSTRUCTION_SITES, 2);
                if (nearbySites.length == 0) room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
                else {
                  const buildersNearby = room.find(FIND_MY_CREEPS, { filter: (i) => i.memory.role == 'remotebuilder' || i.memory.role == 'builder' });
                  if (buildersNearby.length > 0) {
                    const mySite = pos.findInRange(FIND_CONSTRUCTION_SITES, 1);
                    if (mySite.length)
                      creep.build(mySite[0]);
                    else {
                      creep.unloadEnergy();
                      creep.harvestEnergy();
                    }
                  } else {
                    creep.build(nearbySites[0]);
                    if (cMem.claimant)
                      Game.rooms[cMem.homeRoom].memory.data.claimRooms[room.name as RoomName].energyRemaining -= (creep.getActiveBodyparts(WORK) * 5);
                  }
                }
                //creep.unloadEnergy();
                //creep.harvestEnergy();
              }

            } else {
              const dropBucket = Game.getObjectById(cMem.bucket);
              if (dropBucket) {
                if (pos.isNearTo(dropBucket)) {
                  creep.unloadEnergy();
                  creep.harvestEnergy();
                }
                else creep.moveTo(dropBucket, pathing.harvesterPathing);
              } else {
                creep.unloadEnergy();
                creep.harvestEnergy();
              }
            }
          } else creep.harvestEnergy();
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleHealer = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI === undefined) cMem.disableAI = false;
    if (cMem.attackRoom === undefined) cMem.attackRoom = room.name;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (creep.ticksToLive <= 2) creep.say('☠️');

        const target = pos.findClosestByRange(FIND_MY_CREEPS, { filter: (object) => object.memory.role === 'warrior' || object.memory.role === 'ranger' });

        if (target) {
          if (!Memory.globalSettings.healerStayPut) creep.moveTo(target, pathing.healerPathing);
          if (pos.isNearTo(target)) {
            if (target.hits < target.hitsMax) creep.heal(target);
          }
          else {
            if (target.hits < target.hitsMax) creep.rangedHeal(target);
            if (!Memory.globalSettings.healerStayPut) creep.moveTo(target);
          }
        } else {
          const secondaryTarget = pos.findClosestByRange(FIND_MY_CREEPS, { filter: (object) => object.memory.squad == cMem.squad && (object.memory.subTeam == 'combatants' || object.memory.subTeam == 'healers') });

          if (secondaryTarget) {
            if (!Memory.globalSettings.healerStayPut) creep.moveTo(secondaryTarget, pathing.healerPathing);
            if (pos.isNearTo(secondaryTarget)) {
              if (secondaryTarget.hits < secondaryTarget.hitsMax) creep.heal(secondaryTarget);
            }
            else {
              if (secondaryTarget.hits < secondaryTarget.hitsMax) creep.rangedHeal(secondaryTarget);
            }
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleInvader = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI  === undefined) cMem.disableAI  = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    if (cMem.attackRoom === undefined) {
      if (rMem.data.combatObjectives.attackRoom === undefined) rMem.data.combatObjectives.attackRoom;
      else cMem.attackRoom = rMem.data.combatObjectives.attackRoom;
    }

    if (cMem.musterPoint === undefined) {
      if (rMem.data.combatObjectives.musterPoint === undefined) {
        rMem.data.combatObjectives.musterPoint = new RoomPosition(25, 25, room.name);
        cMem.musterPoint = rMem.data.combatObjectives.musterPoint;
      }
      else cMem.musterPoint = rMem.data.combatObjectives.musterPoint;
    }

    if (cMem.groupSize === undefined) {
      if (rMem.data.combatObjectives.invaderGroupSize === undefined) {
        rMem.data.combatObjectives.invaderGroupSize = 3;
        cMem.groupSize = 3;
      } else cMem.groupSize = rMem.data.combatObjectives.invaderGroupSize;
    }

    if (!cMem.disableAI) {

      if (cMem.rallyPoint === 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (cMem.combatRole === undefined) {
          if      (creep.getActiveBodyparts(ATTACK) > 0)        cMem.combatRole = 'melee';
          else if (creep.getActiveBodyparts(RANGED_ATTACK) > 0) cMem.combatRole = 'ranged';
          else if (creep.getActiveBodyparts(HEAL) > 0)          cMem.combatRole = 'healer';
          else if (creep.getActiveBodyparts(WORK) > 0)          cMem.combatRole = 'engineer';
          else cMem.combatRole = 'unknown';
        }

        switch (cMem.combatRole) {

          case 'melee': {

            if (room.name == cMem.targetRoom) {
              let hostilesInRoom = room.find(FIND_HOSTILE_CREEPS);
              _.filter(hostilesInRoom, (hostile) => hostile.getActiveBodyparts(ATTACK) > 0 || hostile.getActiveBodyparts(RANGED_ATTACK) > 0 || hostile.getActiveBodyparts(HEAL) > 0);

              if (hostilesInRoom.length > 0) {
                const nearestHostileCombatant = pos.findClosestByRange(hostilesInRoom);
                const attackResult = creep.rangedAttack(nearestHostileCombatant);

                switch (attackResult) {

                  case ERR_NOT_IN_RANGE:
                    creep.say('Moving to engage enemy combatant!');
                    creep.moveTo(nearestHostileCombatant, pathing.invaderPathing);
                    break;
                  case OK:
                    creep.say('Attacking enemy combatant!');
                    break;
                }

              } else {
                let hostileTowers = room.find(FIND_HOSTILE_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });

                if (hostileTowers.length > 0) {

                  const closestHostileTowerByPath = pos.findClosestByPath(hostileTowers);
                  const attackResult              = creep.rangedAttack(closestHostileTowerByPath);

                  switch (attackResult) {
                    case ERR_NOT_IN_RANGE:
                      creep.say('Moving to engage tower!');
                      creep.moveTo(closestHostileTowerByPath, pathing.invaderPathing);
                      break;
                    case OK:
                      creep.say('Attacking enemy tower!');
                      break;
                  }
                } else {

                  let enemyCivilians = room.find(FIND_HOSTILE_CREEPS);

                  if (enemyCivilians.length > 0) {
                    const closestEnemyCivilian = pos.findClosestByRange(enemyCivilians);
                    const attackResult = creep.rangedAttack(closestEnemyCivilian);
                    switch (attackResult) {
                      case ERR_NOT_IN_RANGE:
                        creep.say('Moving to engage enemy civilian!');
                        creep.moveTo(closestEnemyCivilian, pathing.invaderPathing);
                        break;
                      case OK:
                        creep.say('Attacking enemy civilian!');
                        break;
                    }
                  }
                }
              }
            }
            break;
          }
          case 'ranged': {

            if (room.name == cMem.targetRoom) {

              let hostilesInRoom = room.find(FIND_HOSTILE_CREEPS);

              _.filter(hostilesInRoom, (hostile) => hostile.getActiveBodyparts(ATTACK) > 0 || hostile.getActiveBodyparts(RANGED_ATTACK) > 0 || hostile.getActiveBodyparts(HEAL) > 0);

              if (hostilesInRoom.length > 0) {
                const nearestHostileCombatant = pos.findClosestByRange(hostilesInRoom);
                const attackResult = creep.rangedAttack(nearestHostileCombatant);

                switch (attackResult) {
                  case ERR_NOT_IN_RANGE:
                    creep.say('Moving to engage enemy combatant!');
                    creep.moveTo(nearestHostileCombatant, pathing.invaderPathing);
                    break;
                  case OK:
                    creep.say('Attacking enemy combatant!');
                    break;
                }

              } else {

                let hostileTowers = room.find(FIND_HOSTILE_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });

                if (hostileTowers.length > 0) {
                  const closestHostileTowerByPath = pos.findClosestByPath(hostileTowers);
                  const attackResult = creep.rangedAttack(closestHostileTowerByPath);

                  switch (attackResult) {
                    case ERR_NOT_IN_RANGE:
                      creep.say('Moving to engage tower!');
                      creep.moveTo(closestHostileTowerByPath, pathing.invaderPathing);
                      break;
                    case OK:
                      creep.say('Attacking enemy tower!');
                      break;
                  }
                } else {

                  let enemyCivilians = room.find(FIND_HOSTILE_CREEPS);

                  if (enemyCivilians.length > 0) {
                    const closestEnemyCivilian = pos.findClosestByRange(enemyCivilians);
                    const attackResult = creep.rangedAttack(closestEnemyCivilian);

                    switch (attackResult) {
                      case ERR_NOT_IN_RANGE:
                        creep.say('Moving to engage enemy civilian!');
                        creep.moveTo(closestEnemyCivilian, pathing.invaderPathing);
                        break;
                      case OK:
                        creep.say('Attacking enemy civilian!');
                        break;
                    }
                  }
                }
              }
            }
            break;
          }
          case 'healer': {

            let buddies: Creep[];
            const muster = cMem.musterPoint;
            if (pos.isNearTo(cMem.musterPoint)) buddies = pos.findInRange(FIND_MY_CREEPS, 10, { filter: (crp) => crp.memory.role == 'invader' });

            const closest = pos.findClosestByRange(buddies);

            if (closest) {
              creep.moveTo(closest);
              const healTargets = buddies.filter((crp) => crp.hits < crp.hitsMax);
              const healTarget = pos.findClosestByRange(healTargets);
              if (creep.isNearTo(healTarget)) creep.heal(healTarget);
              else creep.rangedHeal(healTarget);
            }
            break;
          }
          case 'engineer': {

            if (room.name == cMem.targetRoom) {
              const enemySpawns = room.find(FIND_HOSTILE_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN } });

              if (enemySpawns.length > 0) {
                const closestEnemySpawn = pos.findClosestByRange(enemySpawns);
                const dismantleResult   = creep.dismantle(closestEnemySpawn);

                switch (dismantleResult) {
                  case ERR_NOT_IN_RANGE:
                    creep.say('Moving to dismantle enemy spawn!');
                    creep.moveTo(closestEnemySpawn, pathing.invaderPathing);
                    break;
                  case OK:
                    creep.say('Dismantling enemy spawn!');
                    break;
                }
              } else {
                const enemyStructures = room.find(FIND_HOSTILE_STRUCTURES);

                if (enemyStructures.length > 0) {
                  const closestEnemyStructure = pos.findClosestByRange(enemyStructures);
                  const dismantleResult = creep.dismantle(closestEnemyStructure);

                  switch (dismantleResult) {
                    case ERR_NOT_IN_RANGE:
                      creep.say('Moving to dismantle enemy structure!');
                      creep.moveTo(closestEnemyStructure, pathing.invaderPathing);
                      break;
                    case OK:
                      creep.say('Dismantling enemy structure!');
                      break;
                  }
                } else {
                  const enemyConSites = room.find(FIND_HOSTILE_CONSTRUCTION_SITES);

                  if (enemyConSites.length > 0) {
                    const closestEnemyConSite = pos.findClosestByRange(enemyConSites);
                    if (!pos.isEqualTo(closestEnemyConSite))
                      creep.moveTo(closestEnemyConSite, pathing.invaderPathing)
                  }
                }
              }
            }
            break;
          }
          case 'unknown': {
            creep.say('My role is unknown!');
            break;
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleMiner = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI  === undefined) cMem.disableAI  = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    if (!cMem.disableAI) {

      if (cMem.rallyPoint === 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (creep.ticksToLive <= 2) {
          creep.unloadMineral();
          creep.say('☠️');
        }

        if (!cMem.working && creep.store[RESOURCE_ENERGY] > 0) {
          cMem.working = true;
          creep.say('⛏️');
        }

        if (cMem.working && creep.store.getFreeCapacity() < (creep.getActiveBodyparts(WORK) * 2))
          cMem.working = false;

        if (creep.store.getFreeCapacity() == 0 || creep.store.getFreeCapacity() < (creep.getActiveBodyparts(WORK) * 2))
          creep.unloadMineral();

        else {
          if (Game.getObjectById(room.memory.objects.extractor).cooldown == 0)
            creep.harvestMineral();
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleProvider = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI  === undefined)  cMem.disableAI  = false;
    if (cMem.rallyPoint  === undefined)  cMem.rallyPoint  = 'none';
    //if (cMem.targetRoom  === undefined)  cMem.targetRoom  = rMem.data.claimRooms[]
    if (cMem.travelling  === undefined)  cMem.travelling  = false;

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (creep.store.getUsedCapacity() == 0) {

          const piles = room.find(FIND_DROPPED_RESOURCES);

          if (piles.length > 0) {
            const closestPile = pos.findClosestByRange(piles);
            if (creep.pickup(closestPile) == ERR_NOT_IN_RANGE)
              creep.moveTo(closestPile, pathing.providerPathing);
          } else {
            const tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store.getUsedCapacity() > 0 });
            if (tombstones.length > 0) {
              const closestTombstone = pos.findClosestByRange(tombstones);
              if (creep.withdraw(closestTombstone, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                creep.moveTo(closestTombstone, pathing.providerPathing)
            } else {
              const storage = room.storage;
              if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                creep.moveTo(storage, pathing.providerPathing);
            }
          }
        } else {
          if (!cMem.travelling) {
            cMem.rallyPoint = rMem.data.remoteLogistics[cMem.targetRoom].waypoints;
            cMem.travelling = true;
          } else {
            const logSpot   = new RoomPosition(rMem.data.remoteLogistics[cMem.targetRoom].logisticsTarget[0], rMem.data.remoteLogistics[cMem.targetRoom].logisticsTarget[1], rMem.data.remoteLogistics[cMem.targetRoom].roomName);

            if (pos.isNearTo(logSpot))
              creep.drop(RESOURCE_ENERGY);
            else
              creep.moveTo(logSpot, pathing.providerPathing)
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleRanger = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI    === undefined) cMem.disableAI   = false;
    if (cMem.attackRoom   === undefined) cMem.attackRoom  = rMem.data.attackRoom || room.name;
    if (cMem.rallyPoint   === undefined) cMem.rallyPoint  = 'none';
    if (cMem.customTarget === undefined && rMem.data.customAttackTarget !== undefined)
        cMem.customTarget = rMem.data.customAttackTarget;

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if (creep.ticksToLive <= 2)  creep.say('☠️');

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (cMem.customTarget) {
          if (room.name !== cMem.attackRoom)
            creep.moveTo(Game.flags[cMem.attackRoom], pathing.warriorPathing);
          else {
          const cAT: AnyStructure = Game.getObjectById(cMem.customTarget)
            if (creep.rangedAttack(cAT) === ERR_NOT_IN_RANGE)
              creep.moveTo(cAT, pathing.rangerPathing);
          }
        } else {
          if (room.name !== cMem.attackRoom) {
            creep.moveTo(Game.flags[cMem.attackRoom], pathing.rangerPathing);
          } else {
            const towers = room.find(FIND_HOSTILE_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });

            if (towers.length) {
              const target = pos.findClosestByRange(towers);
              if (target) {
                if (creep.rangedAttack(target) === ERR_NOT_IN_RANGE)
                  creep.moveTo(target, pathing.rangerPathing);
                else
                  creep.moveTo(target, pathing.rangerPathing);
              } else {
                const spawns = room.find(FIND_HOSTILE_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN } });

                if (spawns.length) {
                  const target = pos.findClosestByRange(spawns);
                  if (target) {
                    if (creep.rangedAttack(target) === ERR_NOT_IN_RANGE) {
                      const nearbyCreeps = pos.findInRange(FIND_HOSTILE_CREEPS, 3);
                      creep.moveTo(target, pathing.rangerPathing);
                      if (nearbyCreeps.length)
                        creep.rangedMassAttack();
                    }
                  } else {
                    const hostiles = room.find(FIND_HOSTILE_CREEPS);
                    const target = pos.findClosestByRange(hostiles);

                    if (target) {
                      if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
                        creep.moveTo(target, pathing.rangerPathing);
                    } else {
                      const structures = room.find(FIND_HOSTILE_STRUCTURES);
                      const target = pos.findClosestByRange(structures);
                      if (target) {
                        if (creep.getActiveBodyparts(WORK) > 0) {
                          if (creep.dismantle(target) == ERR_NOT_IN_RANGE)
                            creep.moveTo(target, pathing.warriorPathing);
                        } else {
                          if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
                            creep.moveTo(target, pathing.rangerPathing);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleRebooter = {

  run: function (creep: Creep) {

    const room: Room         = creep.room;
    const cMem: CreepMemory  = creep.memory;
    const rMem: RoomMemory   = room.memory;
    const pos:  RoomPosition = creep.pos;

    if (cMem.disableAI === undefined ) cMem.disableAI  = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (creep.ticksToLive <= 2) creep.say('☠️');

        if (creep.store.getFreeCapacity() !== 0)
          creep.harvestEnergy()
        else {
          var targets = room.find(FIND_STRUCTURES, {
            filter: (structure) => {
              return (structure.structureType == STRUCTURE_EXTENSION ||
                structure.structureType == STRUCTURE_SPAWN) &&
                structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
              }
          });
          if (targets.length > 0) {
            const target = creep.pos.findClosestByRange(targets);
            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
              creep.moveTo(target, pathing.rebooterPathing);
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleRemoteBuilder = {

  run: function(creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;
    const workRoom = rMem.data.remoteWorkRoom;

    if (cMem.initialTravelDone === undefined) cMem.initialTravelDone = false;
    if (cMem.disableAI === undefined) cMem.disableAI = false;
    if (cMem.workRoom === undefined) { if (rMem.data.remoteWorkRoom) cMem.workRoom = rMem.data.remoteWorkRoom; }
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if (creep.ticksToLive <= 2) creep.say('☠️');

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        //* create RoomPosition of remote target for travel
        const workPos = new RoomPosition(25, 25, cMem.workRoom);

        //* if not in workRoom, travel to workRoom RoomPosition
        if (room.name !== cMem.workRoom) creep.moveTo(workPos, pathing.remoteBuilderPathing);
        else {
          if (creep.store[RESOURCE_ENERGY] == 0) creep.say('🔼');
          if (creep.store.getFreeCapacity() == 0) creep.say('🏗️');

          if (creep.store.getUsedCapacity() == 0) {

            const tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store[RESOURCE_ENERGY] > 0 });

            if (tombstones.length > 0) {
              const tombstone = pos.findClosestByRange(tombstones);
              if (tombstone) {
                if (creep.withdraw(tombstone, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                  creep.moveTo(tombstone, pathing.remoteBuilderPathing);
              }
            } else {
              const droppedPiles = room.find(FIND_DROPPED_RESOURCES);
              if (droppedPiles.length > 0) {
                const closestPile = pos.findClosestByRange(droppedPiles);
                if (closestPile) {
                  if (creep.pickup(closestPile) === ERR_NOT_IN_RANGE)
                    creep.moveTo(closestPile, pathing.remoteBuilderPathing);
                }
              } else {
                const containersWithEnergy = room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE) && i.store[RESOURCE_ENERGY] > 0 });
                if (containersWithEnergy.length > 0) {
                  const container = pos.findClosestByRange(containersWithEnergy);
                  if (container) {
                    if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                      creep.moveTo(container, pathing.remoteBuilderPathing);
                  }
                }
              }
            }
          } else if (creep.store.getUsedCapacity() > 0) {
            const targets = room.find(FIND_MY_CONSTRUCTION_SITES);
            if (targets.length) {
              const target = pos.findClosestByRange(targets);
              if (creep.build(target) == ERR_NOT_IN_RANGE)
                creep.moveTo(target, pathing.remoteBuilderPathing);
            }
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
};
export const roleRemoteGuard = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI === undefined) cMem.disableAI = false;
    if (cMem.outpostRoom === undefined) {
      cMem.outpostRoom = Game.rooms[cMem.homeRoom].memory.outposts.roomList[Memory.miscData.outpostCounterRG];
      Memory.miscData.outpostCounterRG++;
      if (Memory.miscData.outpostCounterRG >= Game.rooms[cMem.homeRoom].memory.outposts.roomList.length)
        Memory.miscData.outpostCounterRG = 0;
    }
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    const outpostRoom = cMem.outpostRoom;

    if (!cMem.disableAI) {
      if (creep.ticksToLive <= 2)  creep.say('☠️');

      if (cMem.rallyPoint == 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
      else if (pos.x == 0 ) creep.move(RIGHT  );
      else if (pos.y == 49) creep.move(TOP    );
      else if (pos.y == 0 ) creep.move(BOTTOM );

        if (room.name !== outpostRoom) {
          creep.moveTo(Game.flags[outpostRoom], pathing.remoteGuardPathing);
        } else {
          const hostiles = room.find(FIND_HOSTILE_CREEPS);
          if (hostiles.length > 0) {
            const target = pos.findClosestByRange(hostiles);
            if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
              creep.moveTo(target, pathing.remoteGuardPathing);
          } else {
            if (!pos.isNearTo(Game.flags[outpostRoom]))
              creep.moveTo(Game.flags[outpostRoom], pathing.remoteGuardPathing);
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleRemoteHarvester = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI  === undefined) cMem.disableAI  = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if (creep.ticksToLive <= 2) creep.say('☠️');
        else {

          if (pos.x == 49) creep.move(LEFT);
          else if (pos.x == 0) creep.move(RIGHT);
          else if (pos.y == 49) creep.move(TOP);
          else if (pos.y == 0) creep.move(BOTTOM);

          if (creep.store.getFreeCapacity() == 0 || creep.store.getFreeCapacity() < (creep.getActiveBodyparts(WORK) * 2)) {
            const containers = pos.findInRange(FIND_STRUCTURES, 3, { filter: (i) => (i.structureType == STRUCTURE_CONTAINER)});

            if (containers.length > 0) {
              const target = pos.findClosestByRange(containers);

              if (target) {
                if (!pos.isNearTo(target)) creep.moveTo(target, pathing.harvesterPathing);
                else {
                  if (target.hits < target.hitsMax) creep.repair(target);
                  else {
                    creep.unloadEnergy();
                    creep.harvestEnergy();
                  }
                }
              }
            } else {
              if (rMem.outpostOfRoom) {
                const nearbySites = pos.findInRange(FIND_CONSTRUCTION_SITES, 2);
                if (nearbySites.length == 0) room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
                else {
                  const buildersNearby = room.find(FIND_MY_CREEPS, { filter: (i) => i.memory.role == 'remotebuilder' });
                  if (buildersNearby.length > 0) {
                    creep.unloadEnergy();
                    creep.harvestEnergy();
                  }
                  else creep.build(nearbySites[0]);
                }
              }
              else {
                creep.unloadEnergy();
                creep.harvestEnergy();
              }
            }
          } else creep.harvestEnergy();
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleRemoteLogistician = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;
    const workRoom   = rMem.data.remoteWorkRoom;

    if (cMem.disableAI     === undefined) cMem.disableAI     = false;
    //if (cMem.rallyPoint    === undefined) cMem.rallyPoint    = remoteLogs.waypoints;
    //if (cMem.destPos       === undefined) cMem.destPos       = remoteLogs.logisticsTarget;
    if (cMem.destRoom      === undefined) cMem.destRoom      = rMem.data.remoteWorkRoom;
    if (cMem.storage       === undefined) cMem.storage       = room.storage.id;
    if (cMem.initialEnergy === undefined) cMem.initialEnergy = false;

    if (!cMem.disableAI) {

      if (cMem.initialEnergy == false) {
        const homeStorage: StructureStorage = Game.getObjectById(cMem.storage);
        if (homeStorage) {
          const result = creep.withdraw(homeStorage, RESOURCE_ENERGY)
          switch (result) {
            case ERR_NOT_IN_RANGE:
              creep.moveTo(homeStorage, pathing.remoteLogisticianPathing);
              break;
            case OK:
              cMem.initialEnergy = true;
              Game.rooms[cMem.homeRoom].memory.data.claimRooms[cMem.destRoom].energyRemaining -= creep.store.getUsedCapacity();
              break;
          }
        }
      } else {
        if (cMem.rallyPoint == 'none') {

          if (pos.x == 49) creep.move(LEFT);
          else if (pos.x == 0) creep.move(RIGHT);
          else if (pos.y == 49) creep.move(TOP);
          else if (pos.y == 0) creep.move(BOTTOM);

          if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) { //: I HAVE NO ENERGY
            //* Search local room for dropped resources, excluding any that the creep created
            if (cMem.customTarget) {
              const cTarget: AnyStructure = Game.getObjectById(cMem.customTarget);

              if (creep.withdraw(cTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                creep.moveTo(cTarget, pathing.remoteLogisticianPathing);
            } else {
              let droppedPiles = room.find(FIND_DROPPED_RESOURCES);
              if (droppedPiles.length > 0) {
                if (cMem.ignorePile) {
                  const index = droppedPiles.findIndex((i) => { return i.id === cMem.ignorePile });
                  droppedPiles.splice(index, 1);
                }
                droppedPiles = droppedPiles.sort((a, b) => b.amount - a.amount);
                if (creep.pickup(droppedPiles[ 0 ]) === ERR_NOT_IN_RANGE)
                  creep.moveTo(droppedPiles[ 0 ], pathing.remoteLogisticianPathing);
              } else {
                //* No dropped resources, if we're at home room just fill from storage (typically at spawn time)
                if (creep.room.name === cMem.homeRoom) {
                  const homeStorage: StructureStorage = Game.getObjectById(cMem.storage);
                  if (homeStorage) {
                    if (creep.withdraw(homeStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                      creep.moveTo(homeStorage, pathing.remoteLogisticianPathing);
                  }
                }
              }
            }
          } else { //: I HAVE ENERGY
            //* Go to target room position from memory
            const targetPosition = new RoomPosition(cMem.destPos[ 0 ], cMem.destPos[ 1 ], cMem.destRoom);
            if (pos.isEqualTo(targetPosition)) {
              //* When there, transfer energy (to creeps, or to container, or just dump it on the ground)
              const workerCreeps = pos.findInRange(FIND_MY_CREEPS, 3, { filter: (i) => i.getActiveBodyparts(WORK) > 0 });
              if (workerCreeps.length > 0) {
                const result = creep.transfer(workerCreeps[ 0 ], RESOURCE_ENERGY);
                if (result == ERR_NOT_IN_RANGE) {
                  creep.moveTo(workerCreeps[ 0 ], pathing.remoteLogisticianPathing);
                  creep.transfer(workerCreeps[ 0 ], RESOURCE_ENERGY);
                }
              } else {
                const containers = pos.findInRange(FIND_STRUCTURES, 3, { filter: { structureType: STRUCTURE_CONTAINER } });
                if (containers.length > 0) {
                  if (creep.transfer(containers[ 0 ], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                    creep.moveTo(containers[ 0 ], pathing.remoteLogisticianPathing)
                  else {
                    creep.drop(RESOURCE_ENERGY);
                    const myPile: Array<Resource> = pos.findInRange(FIND_DROPPED_RESOURCES, 2);
                    const pileID: Id<Resource> = myPile[ 0 ].id;
                    cMem.ignorePile = pileID;
                  }
                }
              }
            } else //* If the creep is not at the target position, move towards it
              creep.moveTo(targetPosition, pathing.remoteLogisticianPathing);
          } //! end of primary logic
        } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
      }
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
};
export const roleRepairer = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    const rampartsMax: number = Memory.rooms[ cMem.homeRoom ].settings.repairSettings.repairRampartsTo;
    const wallsMax   : number = Memory.rooms[ cMem.homeRoom ].settings.repairSettings.repairWallsTo;

    if (cMem.disableAI  === undefined) cMem.disableAI  = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (creep.ticksToLive <= 2) creep.say('☠️');

        if (creep.store.getUsedCapacity() == 0) {

          switch (rMem.settings.flags.centralStorageLogic) {
            case true: {
              const target = pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (i) => i.structureType == STRUCTURE_STORAGE &&
                  i.store[RESOURCE_ENERGY] > 0
              });
              if (target) {
                if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                  creep.moveTo(target, pathing.repairerPathing);
              }
              break;
            }
            case false:
            default: {

              const tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store[RESOURCE_ENERGY] > 0 });
              if (tombstones.length > 0) {
                const tombstone = pos.findClosestByRange(tombstones);
                if (tombstone) {
                  if (creep.withdraw(tombstone, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                    creep.moveTo(tombstone, pathing.repairerPathing);
                }
              } else {
                const droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                if (droppedPiles.length > 0) {
                  const closestPile = pos.findClosestByRange(droppedPiles);
                  if (closestPile) {
                    if (creep.pickup(closestPile) === ERR_NOT_IN_RANGE)
                      creep.moveTo(closestPile, pathing.repairerPathing);
                  }
                } else {
                  const containersWithEnergy = room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE) && i.store[RESOURCE_ENERGY] > 0 });
                  if (containersWithEnergy.length > 0) {
                    const container = pos.findClosestByRange(containersWithEnergy);
                    if (container) {
                      if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                        creep.moveTo(container, pathing.repairerPathing);
                    }
                  }
                }
              }
              break;
            }
          }
        } else { //: now that we have some energy on hand, let's find something to fix (or towers to juice up)

          if (cMem.currentRepairTarget) {
            const target: AnyStructure = Game.getObjectById(cMem.currentRepairTarget) as AnyStructure;
            if (target) {
              if ((target.structureType !== STRUCTURE_RAMPART && target.structureType !== STRUCTURE_WALL) && (target.hits >= (target.hitsMax * .35)))
                delete cMem.currentRepairTarget;
              else if (target.structureType === STRUCTURE_WALL && target.hits >= wallsMax)
                delete cMem.currentRepairTarget;
              else if (target.structureType === STRUCTURE_RAMPART && target.hits >= rampartsMax)
                delete cMem.currentRepairTarget;
              else {
                repairProgress(target, creep.room);
                if (creep.repair(target) == ERR_NOT_IN_RANGE)
                  creep.moveTo(target, pathing.repairerPathing);
              }
            }
          } else {
            const towers: StructureTower[] = room.find(FIND_MY_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_TOWER && (i.store[ RESOURCE_ENERGY ] <= 800) });
            if (towers.length) {
              //: transfer energy
              let towersSorted: StructureTower[] = towers.sort((a, b) => a.store[ RESOURCE_ENERGY ] - b.store[ RESOURCE_ENERGY ]);
              const tower = towersSorted[ 0 ];
              if (creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                creep.moveTo(tower, pathing.repairerPathing);
            } else {
              //: towers are stocked up, look for fix'er'uppers
              let basics: AnyStructure[] = [];
              let ramparts: StructureRampart[] = [];
              let walls: StructureWall[] = [];
              let validTargets: AnyStructure[] = [];

              //: search for basically everything that's not a wall or a rampart
              if (Memory.rooms[ cMem.homeRoom ].settings.flags.repairBasics) {
                basics = room.find(FIND_STRUCTURES, {
                  filter: (i) => (i.hits < i.hitsMax * .25) && (i.structureType !== STRUCTURE_WALL && i.structureType !== STRUCTURE_RAMPART)
                });
                basics = basics.sort((a, b) => a.hits - b.hits);
                validTargets = validTargets.concat(basics);
              }

              //: add ramparts to the repair list, based on room flag & room max repair limit
              if (Memory.rooms[ cMem.homeRoom ].settings.flags.repairRamparts) {
                ramparts = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_RAMPART) && (i.hits <= rampartsMax)) && i.isActive});
                ramparts = ramparts.sort((a, b) => a.hits - b.hits);
                validTargets = validTargets.concat(ramparts);
              }
              //: add walls to the repair list, based on room flag & room max repair limit
              if (Memory.rooms[ cMem.homeRoom ].settings.flags.repairWalls) {
                walls = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_WALL) && (i.hits <= wallsMax)) && i.isActive})
                walls = walls.sort((a, b) => a.hits - b.hits);
                validTargets = validTargets.concat(walls);
              }

              const target: AnyStructure = pos.findClosestByRange(validTargets);

              //: travel to closest object within repair criteria and start repairing!
              if (target) {
                cMem.currentRepairTarget = target.id;
                repairProgress(target, creep.room)
                if (creep.repair(target) === ERR_NOT_IN_RANGE)
                  creep.moveTo(target, pathing.repairerPathing);
              }
            }
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleReserver = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos:   RoomPosition  = creep.pos;

    if (cMem.disableAI  === undefined) cMem.disableAI  = false;
    if (cMem.homeRoom   === undefined) cMem.homeRoom   = room.name;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';
    if (cMem.targetRoom === undefined) {
      cMem.targetRoom = Game.rooms[cMem.homeRoom].memory.outposts.roomList[Memory.miscData.outpostCounterRv];
      Memory.miscData.outpostCounterRv++;
      if (Memory.miscData.outpostCounterRv >= Game.rooms[cMem.homeRoom].memory.outposts.roomList.length)
        Memory.miscData.outpostCounterRv = 0;
    }
    if (rMem.data.controllerAttack) {
      if (cMem.controllerAttack === undefined)
        cMem.controllerAttack = rMem.data.controllerAttack;
    }

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (cMem.controllerAttack !== undefined && cMem.controllerAttack === true) {
          if (room.name === cMem.controllerAttack) {
            const result = creep.rangedAttackController(room.controller);
            switch (result) {
              case OK:
                if (room.controller.upgradeBlocked) {
                  if (!room.controller.sign || room.controller.sign.username !== 'randomencounter' || room.controller.sign.text !== 'There\'s no place like 127.0.0.1!')
                    creep.signController(room.controller, 'There\'s no place like 127.0.0.1!');
                  delete cMem.controllerAttack;
                  break;
                }
              case ERR_NOT_IN_RANGE:
                creep.moveTo(room.controller, pathing.reserverPathing);
                break;
              case ERR_TIRED:
                if (room.controller.upgradeBlocked) {
                  delete cMem.controllerAttack;
                  break;
                }
              default:
                break;
            }
          } else {
            creep.moveTo(Game.flags[ cMem.controllerAttack ], pathing.reserverPathing);
          }
        } else {
          if (room.name == cMem.targetRoom) {
            if (!rMem.objects) room.cacheObjects();
            if (Game.rooms[ room.name ].controller.owner === undefined) {
              if (creep.reserveController(room.controller) == ERR_NOT_IN_RANGE)
                creep.moveTo(room.controller, pathing.reserverPathing);
            } else if (typeof Game.rooms[ room.name ].controller.owner === 'object') {
              if (Game.rooms[ room.name ].controller.owner.username !== 'randomencounter') {
                if (creep.rangedAttackController(room.controller) == ERR_NOT_IN_RANGE)
                  creep.moveTo(room.controller, pathing.reserverPathing);
              }
            }
            if (!room.controller.sign || room.controller.sign.username !== 'randomencounter' || room.controller.sign.text !== 'There\'s no place like 127.0.0.1!')
              creep.signController(room.controller, 'There\'s no place like 127.0.0.1!');
          } else {
            if (Game.flags[ cMem.targetRoom ])
              creep.moveTo(Game.flags[ cMem.targetRoom ], pathing.reserverPathing);
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleRunner = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI  === undefined) cMem.disableAI  = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (creep.ticksToLive <= 2) creep.say('☠️');

        if (!cMem.pickup && !cMem.dropoff) creep.assignLogisticalPair();

        if (cMem.cargo === undefined) cMem.cargo = 'energy';
        if (cMem.dropoff == 'none') if (room.storage) cMem.dropoff = room.storage.id;

        const pickupTarget = Game.getObjectById(cMem.pickup);
        const dropoffTarget = Game.getObjectById(cMem.dropoff);

        if (creep.store[RESOURCE_ENERGY] == 0 || creep.store[cMem.cargo] == 0) {
          if (cMem.pickup) {

            if (pickupTarget) {
              if (creep.withdraw(pickupTarget, cMem.cargo) == ERR_NOT_IN_RANGE)
                creep.moveTo(pickupTarget, pathing.runnerPathing);
              else
                creep.moveTo(dropoffTarget, pathing.runnerPathing);
            }
          }
        } else {
          if (dropoffTarget) {
            if (pos.isNearTo(dropoffTarget)) {
              if (dropoffTarget.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                const result = creep.transfer(dropoffTarget, RESOURCE_ENERGY);
                if (result === OK)
                  creep.moveTo(pickupTarget, pathing.runnerPathing);
              }
            }
            else {
            /*  if (creep.getActiveBodyparts(WORK) > 0) {
                const roadUnderCreep = room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_ROAD && i.pos.x == pos.x && i.pos.y == pos.y && i.hits !== i.hitsMax) })
                const roadTarget = pos.findClosestByRange(roadUnderCreep);
                if (roadUnderCreep.length > 0) creep.repair(roadUnderCreep[0]);
                else creep.moveTo(dropoffTarget, pathing.runnerPathing);
              }
              else*/ creep.moveTo(dropoffTarget, pathing.runnerPathing);
            }
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}
export const roleScientist = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI  === undefined) cMem.disableAI  = false;
    if (cMem.rallyPoint === undefined) cMem.rallyPoint = 'none';

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (!rMem.objects.labs) room.cacheObjects();
        if (!rMem.settings.labSettings) room.initRoom();

        if (creep) {
          if (rMem.objects && rMem.objects.labs) {
            let reagentLab1;
            let reagentLab2;
            let reactionLab1;
            const storage = Game.getObjectById(rMem.objects.storage);

            const baseReg1    = rMem.settings.labSettings.reagentOne;
            const baseReg2    = rMem.settings.labSettings.reagentTwo;
            const boostChem    = rMem.settings.labSettings.boostCompound;
            const outputChem  = room.calcLabReaction();

            if (rMem.objects.labs[0]) reagentLab1    = Game.getObjectById(rMem.objects.labs[0]);
            if (rMem.objects.labs[1]) reagentLab2    = Game.getObjectById(rMem.objects.labs[1]);
            if (rMem.objects.labs[2]) reactionLab1  = Game.getObjectById(rMem.objects.labs[2]);

            if (reagentLab1.store[RESOURCE_ENERGY] < 2000) {
              if (creep.store[RESOURCE_ENERGY] == 0) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                  creep.moveTo(storage, pathing.scientistPathing);
              }
            } else if (reagentLab2.store[RESOURCE_ENERGY] < 2000) {
              if (creep.store[RESOURCE_ENERGY] == 0) {
                if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                  creep.moveTo(storage, pathing.scientistPathing);
              }
            } else if (rMem.settings.flags.doScience) {
              if (reagentLab1.store[baseReg1] < 3000) {
                if (creep.store[baseReg1] == 0) {
                  if (creep.withdraw(storage, baseReg1) == ERR_NOT_IN_RANGE)
                    creep.moveTo(storage, pathing.scientistPathing);
                }
              } else if (reagentLab2.store[baseReg2] < 3000) {
                if (creep.store[baseReg2] == 0) {
                  if (creep.withdraw(storage, baseReg2) == ERR_NOT_IN_RANGE)
                    creep.moveTo(storage, pathing.scientistPathing);
                }
              } else reactionLab1.runReaction(reagentLab1, reagentLab2);

              if (reactionLab1.store[outputChem] > 0) {
                if (creep.withdraw(reactionLab1, outputChem) == ERR_NOT_IN_RANGE)
                  creep.moveTo(reactionLab1, pathing.scientistPathing);
              } else {
                if (creep.transfer(storage, outputChem) == ERR_NOT_IN_RANGE)
                  creep.moveTo(storage, pathing.scientistPathing);
              }
            }
          }
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
};
export const roleScout = {

  run: function (creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI    === undefined) cMem.disableAI    = false;
    if (cMem.homeRoom     === undefined) cMem.homeRoom     = room.name;
    if (cMem.scoutList    === undefined) cMem.scoutList    = [];
    if (cMem.compiledList === undefined) cMem.compiledList = false;
    if (cMem.rallyPoint   === undefined) cMem.rallyPoint   = 'none';

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        let scoutArray = [];

        for (let i = 0; i < Memory.colonies.registry[cMem.homeRoom].exitRooms.length; i++) {
          const theRoom = Memory.colonies.registry[cMem.homeRoom].exitRooms[i];
          scoutArray.push(theRoom);
        }
        cMem.scoutList    = scoutArray;
        cMem.compiledList  = true;

        if (cMem.compiledList) {
          if (cMem.targetRoom === undefined) cMem.targetRoom = cMem.scoutList[0];

          let goToPos = new RoomPosition(25, 25, cMem.targetRoom);
          if (cMem.scoutList.length > 0 && room.name == cMem.targetRoom) {
            if (!rMem.objects) {
              log('SCOUT REPORT: Room [' + room.name + '], caching objects...', room);
              room.cacheObjects();
            }
            cMem.scoutList.shift();
            delete cMem.targetRoom;
            delete cMem._move;
          }
          else if (room.name !== cMem.targetRoom)
            creep.moveTo(goToPos, pathing.scoutPathing);
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
};
export const roleUpgrader = {

    run: function(creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI   === undefined) cMem.disableAI   = false;
    if (cMem.rallyPoint  === undefined) cMem.rallyPoint  = 'none';
    if (cMem.upgradeRoom === undefined) cMem.upgradeRoom = room.name;

    if (!cMem.bucket) {

      if (rMem.data.linkRegistry && rMem.data.linkRegistry.destination !== undefined)  cMem.bucket = rMem.data.linkRegistry.destination;
      else if (rMem.settings.containerSettings.inboxes !== undefined) cMem.bucket = rMem.settings.containerSettings.inboxes[0];

      else {

        const nearbyBuckets: Array<StructureContainer | StructureStorage | StructureLink> = room.controller.pos.findInRange(FIND_STRUCTURES, 3, { filter: (i) => i.structureType == STRUCTURE_LINK || i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE });

        if (nearbyBuckets.length > 0) {
          const closestBucket = room.controller.pos.findClosestByRange(nearbyBuckets);
          if (closestBucket) cMem.bucket = closestBucket.id;
        }
      }
    }

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') { //: I HAVE NO RALLY POINT, SO...

        const upgradeRoom = cMem.upgradeRoom;

        if (creep.ticksToLive <= 3) {
          creep.say('☠️');
          if (creep.store.getUsedCapacity() > 0) {
            const mainBucket: StructureContainer | StructureStorage | StructureLink = Game.getObjectById(cMem.bucket);
            if (creep.transfer(mainBucket, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
              creep.moveTo(mainBucket);
          }
        }

        if (cMem.working && creep.store[RESOURCE_ENERGY] == 0) {
          cMem.working = false;
          creep.say('🔼');
        }

        if (!cMem.working && creep.store.getFreeCapacity() == 0) {
          cMem.working = true;
          creep.say('⚡');
        }

        //: IF STANDING ON ROOM EXIT, STEP OFF
        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (creep.store.getUsedCapacity() == 0) { //: I HAVE NO ENERGY, SO...

          if (cMem.bucket) { //: I HAVE NO MAIN BUCKET IN MEMORY, SO...

            const mainBucket = Game.getObjectById(cMem.bucket);

            if (mainBucket) { //: MY MAIN BUCKET IS HERE AND ISN'T EMPTY, SO...

              if (pos.findInRange(FIND_STRUCTURES, 3, { filter: { structureType: STRUCTURE_CONTROLLER } }).length == 0) creep.moveTo(room.controller);

              if (creep.withdraw(mainBucket, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) creep.moveTo(mainBucket, pathing.upgraderPathing);
            }
          }

          else {
            if (rMem.settings.flags.upgradersSeekEnergy) { //: MY MAIN BUCKET EITHER ISN'T HERE OR IT'S EMPTY, LET'S FIND ENERGY ELSEWHERE...

              const tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store[RESOURCE_ENERGY] > 0 });
              if (tombstones.length > 0) {
                const tombstone = pos.findClosestByRange(tombstones);
                if (tombstone) {
                  if (creep.withdraw(tombstone, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                    creep.moveTo(tombstone, pathing.upgraderPathing);
                }
              } else {
                const droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                if (droppedPiles.length > 0) {
                  const closestPile = pos.findClosestByRange(droppedPiles);
                  if (closestPile) {
                    if (creep.pickup(closestPile) === ERR_NOT_IN_RANGE)
                      creep.moveTo(closestPile, pathing.upgraderPathing);
                  }
                } else {
                  const containersWithEnergy = room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE) && i.store[RESOURCE_ENERGY] > 0 });
                  if (containersWithEnergy.length > 0) {
                    const container = pos.findClosestByRange(containersWithEnergy);
                    if (container) {
                      if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                        creep.moveTo(container, pathing.upgraderPathing);
                    }
                  }
                }
              }
            }
          }
        }  else { //: I HAVE ENERGY, LET'S UPGRADE THE CONTROLLER, IF MY BUCKET DOESN'T NEED FIXING FIRST...
          if (cMem.bucket) {
            const mainBucket = Game.getObjectById(cMem.bucket);
            if (mainBucket.hits < mainBucket.hitsMax)
              creep.repair(mainBucket);
          }
          if (creep.upgradeController(room.controller) === ERR_NOT_IN_RANGE)
            creep.moveTo(room.controller, pathing.upgraderPathing);
        }
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    }  else { //: AI IS DISABLED
      if (!Memory.globalSettings.alertDisabled)
        log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.', room);
      creep.say('💤');
    }
  }
}
export const roleWarrior = {

  run: function(creep: Creep) {

    const room:  Room          = creep.room;
    const cMem:  CreepMemory   = creep.memory;
    const rMem:  RoomMemory    = room.memory;
    const pos :  RoomPosition  = creep.pos;

    if (cMem.disableAI    === undefined) cMem.disableAI   = false;
    if (cMem.attackRoom   === undefined) cMem.attackRoom  = rMem.data.attackRoom || room.name;
    if (cMem.rallyPoint   === undefined) cMem.rallyPoint  = 'none';
    if (cMem.customTarget === undefined && rMem.data.customAttackTarget !== undefined)
        cMem.customTarget = rMem.data.customAttackTarget;

    if (!cMem.disableAI) {

      if (cMem.rallyPoint == 'none') {

        if (creep.ticksToLive <= 2)  creep.say('☠️');

        if      (pos.x == 49) creep.move(LEFT   );
        else if (pos.x == 0 ) creep.move(RIGHT  );
        else if (pos.y == 49) creep.move(TOP    );
        else if (pos.y == 0 ) creep.move(BOTTOM );

        if (cMem.customTarget) {
          if (room.name !== cMem.attackRoom)
            creep.moveTo(Game.flags[cMem.attackRoom], pathing.warriorPathing);
          else {
          const cAT: AnyStructure = Game.getObjectById(cMem.customTarget)
            if (creep.dismantle(cAT) == ERR_NOT_IN_RANGE || creep.rangedAttack(cAT) == ERR_NOT_IN_RANGE)
              creep.moveTo(cAT, pathing.warriorPathing);
          }
        } else {
          if (room.name !== cMem.attackRoom) {
            creep.moveTo(Game.flags[cMem.attackRoom], pathing.warriorPathing);
          } else {
              const towers = room.find(FIND_HOSTILE_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });
              const target = pos.findClosestByRange(towers);

            if (target) {
              if (creep.getActiveBodyparts(WORK) > 0) {
                if (creep.dismantle(target) == ERR_NOT_IN_RANGE)
                  creep.moveTo(target, pathing.warriorPathing);
              } else {
                if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
                  creep.moveTo(target, pathing.warriorPathing);
              }
            } else {
              const spawns = room.find(FIND_HOSTILE_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN } });
              const target = pos.findClosestByRange(spawns);

              if (target) {
                const nearbyCreeps = pos.findInRange(FIND_HOSTILE_CREEPS, 1);
                if (nearbyCreeps.length) {
                  if (pos.isNearTo(nearbyCreeps[0]))
                    creep.rangedAttack(nearbyCreeps[ 0 ]);
                }
                if (creep.getActiveBodyparts(WORK) > 0) {
                  if (creep.dismantle(target) == ERR_NOT_IN_RANGE)
                    creep.moveTo(target, pathing.warriorPathing);
                } else {
                  if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
                    creep.moveTo(target, pathing.warriorPathing);
                }
              } else {
                const hostiles = room.find(FIND_HOSTILE_CREEPS);
                const target = pos.findClosestByRange(hostiles);

                if (target) {
                  if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
                    creep.moveTo(target, pathing.warriorPathing);
                } else {
                  const structures = room.find(FIND_HOSTILE_STRUCTURES);
                  const target = pos.findClosestByRange(structures);
                  if (target) {
                    if (creep.getActiveBodyparts(WORK) > 0) {
                      if (creep.dismantle(target) == ERR_NOT_IN_RANGE)
                        creep.moveTo(target, pathing.warriorPathing);
                    } else {
                      if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
                        creep.moveTo(target, pathing.warriorPathing);
                    }
                  } else if (creep.getActiveBodyparts(CLAIM) > 0) {
                    const controller = room.controller;

                    if (creep.rangedAttackController(controller) == ERR_NOT_IN_RANGE)
                      creep.moveTo(controller, pathing.warriorPathing);
                  }
                }
              }
            }
          }
        }
        const musterFlag = cMem.squad + '-muster';
        if (!pos.isNearTo(Game.flags[musterFlag]))
          creep.moveTo(Game.flags[musterFlag], pathing.warriorPathing);
      } else //: I HAVE A RALLY POINT, LET'S BOOGY!
        navRallyPoint(creep);
    } else //: AI DISABLED ALERT
      aiAlert(creep);
  }
}

const cSet = Memory.globalSettings.creepSettings;
export const pathing: { [key: string]: MoveToOpts } = {
  builderPathing: {
    visualizePathStyle: { stroke: "#0000ff", opacity: 0.3, lineStyle: "dotted" },
    reusePath: cSet.builder.reusePathValue,
    ignoreCreeps: cSet.builder.ignoreCreeps
  },
  runnerPathing: {
    visualizePathStyle: { stroke: "#880088", opacity: 0.3, lineStyle: "dotted" },
    reusePath: cSet.runner.reusePathValue,
    ignoreCreeps: cSet.runner.ignoreCreeps
  },
  claimerPathing: {
    visualizePathStyle: { stroke: "#00ffff", opacity: 0.5, lineStyle: "solid" },
    reusePath: cSet.claimer.reusePathValue,
    ignoreCreeps: cSet.claimer.ignoreCreeps
  },
  collectorPathing: {
    visualizePathStyle: { stroke: "#8833dd", opacity: 0.5, lineStyle: "dotted" },
    reusePath: cSet.collector.reusePathValue,
    ignoreCreeps: cSet.collector.ignoreCreeps
  },
  cranePathing: {
    visualizePathStyle: { stroke: "#00ffff", opacity: 0.3, lineStyle: "solid" },
    reusePath: cSet.crane.reusePathValue,
    ignoreCreeps: cSet.crane.ignoreCreeps
  },
  harvesterPathing: {
    visualizePathStyle: { stroke: "#00ff00", opacity: 0.5, lineStyle: "dashed" },
    reusePath: cSet.harvester.reusePathValue,
    ignoreCreeps: cSet.harvester.ignoreCreeps
  },
  healerPathing: {
    visualizePathStyle: { stroke: "#00ff00", opacity: 0.5, lineStyle: "solid" },
    reusePath: cSet.healer.reusePathValue,
    ignoreCreeps: cSet.healer.ignoreCreeps
  },
  invaderPathing: {
    visualizePathStyle: { stroke: "#ff0000", opacity: 0.5, lineStyle: "solid" },
    reusePath: cSet.invader.reusePathValue,
    ignoreCreeps: cSet.invader.ignoreCreeps
  },
  minerPathing: {
    visualizePathStyle: { stroke: "#00ff00", opacity: 0.3, lineStyle: "solid" },
    reusePath: cSet.miner.reusePathValue,
    ignoreCreeps: cSet.miner.ignoreCreeps
  },
  providerPathing: {
    visualizePathStyle: { stroke: "#ff0033", opacity: 0.3, lineStyle: "dotted" },
    reusePath: cSet.provider.reusePathValue,
    ignoreCreeps: cSet.provider.ignoreCreeps
  },
  rangerPathing: {
    visualizePathStyle: { stroke: "#ff0000", opacity: 0.5, lineStyle: "solid" },
    reusePath: cSet.ranger.reusePathValue,
    ignoreCreeps: cSet.ranger.ignoreCreeps
  },
  rebooterPathing: {
    visualizePathStyle: { stroke: "#ffffff", opacity: 0.5, lineStyle: "solid" },
    reusePath: cSet.rebooter.reusePathValue,
    ignoreCreeps: cSet.rebooter.ignoreCreeps
  },
  remoteBuilderPathing: {
    visualizePathStyle: { stroke: "#ffff00", opacity: 0.3, lineStyle: "dotted" },
    reusePath: cSet.remotebuilder.reusePathValue,
    ignoreCreeps: cSet.remotebuilder.ignoreCreeps
  },
  remoteGuardPathing: {
    visualizePathStyle: { stroke: "#ff0000", opacity: 0.3, lineStyle: "dashed" },
    reusePath: cSet.remoteguard.reusePathValue,
    ignoreCreeps: cSet.remoteguard.ignoreCreeps
  },
  remoteHarvesterPathing: {
    visualizePathStyle: { stroke: "#98dd44", opacity: 0.5, lineStyle: "dashed" },
    reusePath: cSet.remoteharvester.reusePathValue,
    ignoreCreeps: cSet.remoteharvester.ignoreCreeps
  },
  remoteLogisticianPathing: {
    visualizePathStyle: { stroke: "#ffffff", opacity: 0.5, lineStyle: "dotted" },
    reusePath: cSet.remotelogistician.reusePathValue,
    ignoreCreeps: cSet.remotelogistician.ignoreCreeps
  },
  remoteRunnerPathing: {
    visualizePathStyle: { stroke: "#880088", opacity: 0.3, lineStyle: "dotted" },
    reusePath: cSet.remoterunner.reusePathValue,
    ignoreCreeps: cSet.remoterunner.ignoreCreeps
  },
  repairerPathing: {
    visualizePathStyle: { stroke: "#ff6600", opacity: 0.3, lineStyle: "dotted" },
    reusePath: cSet.repairer.reusePathValue,
    ignoreCreeps: cSet.repairer.ignoreCreeps
  },
  reserverPathing: {
    visualizePathStyle: { stroke: "#ffffff", opacity: 0.3, lineStyle: "dashed" },
    reusePath: cSet.reserver.reusePathValue,
    ignoreCreeps: cSet.reserver.ignoreCreeps
  },
  scientistPathing: {
    visualizePathStyle: { stroke: "#ffffff", opacity: 0.8, lineStyle: "solid" },
    reusePath: cSet.scientist.reusePathValue,
    ignoreCreeps: cSet.scientist.ignoreCreeps
  },
  scoutPathing: {
    visualizePathStyle: { stroke: "#ff00ff", opacity: 0.5, lineStyle: "solid" },
    reusePath: cSet.scout.reusePathValue,
    ignoreCreeps: cSet.scout.ignoreCreeps
  },
  upgraderPathing: {
    visualizePathStyle: { stroke: "#ffff00", opacity: 0.3, lineStyle: "dotted" },
    reusePath: cSet.upgrader.reusePathValue,
    ignoreCreeps: cSet.upgrader.ignoreCreeps
  },
  warriorPathing: {
    visualizePathStyle: { stroke: "#ff0000", opacity: 0.5, lineStyle: "solid" },
    reusePath: cSet.warrior.reusePathValue,
    ignoreCreeps: cSet.warrior.ignoreCreeps
  },
  rallyPointPathing: {
    visualizePathStyle: { stroke: "#ffffff", opacity: 1.0, lineStyle: "solid" },
    reusePath: Memory.globalSettings.reusePathValue,
    ignoreCreeps: Memory.globalSettings.ignoreCreeps
  }
};

/**
 * This function allows a creep to navigate a series of Game flags, stored in Creep Memory as either a
 * single string, or an array of strings, named rallyPoint. For no navigation, delete it/set it to 'none'.
 * @param {Creep} creep The creep executing the waypoint navigation
 * @returns void;
 */

function navRallyPoint(creep: Creep): void {

  const cMem = creep.memory;
  const pos = creep.pos;

  if (cMem.rallyPoint instanceof Array) {
    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]])) cMem.rallyPoint = 'none';
    else if (!pos.isNearTo(Game.flags[ cMem.rallyPoint[ 0 ] ]))
      creep.moveTo(Game.flags[ cMem.rallyPoint[ 0 ] ], pathing.rallyPointPathing);
    else {
      if (cMem.rallyPoint.length > 1)
        creep.moveTo(Game.flags[cMem.rallyPoint[1]], pathing.rallyPointPathing);
      log('Creep \'' + creep.name + '\' reached rally point \'' + cMem.rallyPoint[0] + '\'', creep.room);
      const nextWaypoint = cMem.rallyPoint.shift();
      if (nextWaypoint === 'undefined') {
        delete cMem.rallyPoint;
        cMem.rallyPoint = 'none';
      }
    }
  } else {
    const rally = Game.flags[cMem.rallyPoint];
    if (pos.isNearTo(rally)) {
      log('Creep \'' + creep.name + '\' reached rally point \'' + cMem.rallyPoint + '\'', creep.room);
      cMem.rallyPoint = 'none';
    }
    else creep.moveTo(rally, pathing.rallyPointPathing);
  }
}

function aiAlert(creep: Creep): void {
  if (!Memory.globalSettings.alertDisabled)
    log('WARNING: Creep ' + creep.name + '\'s AI is disabled.', creep.room);
  creep.say('💤');
  return;
}
