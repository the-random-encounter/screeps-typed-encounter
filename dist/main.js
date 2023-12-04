'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const roleBuilder = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
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
                if (creep.pos.x == 49)
                    creep.move(LEFT);
                else if (creep.pos.x == 0)
                    creep.move(RIGHT);
                else if (creep.pos.y == 49)
                    creep.move(TOP);
                else if (creep.pos.y == 0)
                    creep.move(BOTTOM);
                let cSites = room.find(FIND_MY_CONSTRUCTION_SITES);
                if (rMem.settings.flags.sortConSites)
                    cSites = cSites.sort((a, b) => b.progress - a.progress);
                if (creep.store.getUsedCapacity() == 0) {
                    switch (Memory.rooms[cMem.homeRoom].settings.flags.centralStorageLogic) {
                        case true: {
                            const droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                            const containersWithEnergy = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_STORAGE || i.structureType == STRUCTURE_CONTAINER) && i.store[RESOURCE_ENERGY] > 0) });
                            const targets = droppedPiles.concat(containersWithEnergy);
                            let target = pos.findClosestByRange(targets);
                            if (target) {
                                if (creep.pickup(target) == ERR_NOT_IN_RANGE || creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                    creep.moveTo(target, { visualizePathStyle: { stroke: '#0000ff', opacity: 0.3, lineStyle: 'dotted' } });
                                else
                                    creep.withdraw(target, RESOURCE_ENERGY);
                            }
                            break;
                        }
                        default:
                        case false: {
                            let outboxes = [];
                            if (rMem.settings.containerSettings.outboxes.length > 0) {
                                let outboxIDs = rMem.settings.containerSettings.outboxes;
                                for (let i = 0; i < outboxIDs.length; i++) {
                                    const outbox = Game.getObjectById(outboxIDs[i]);
                                    outboxes.push(outbox);
                                }
                            }
                            else {
                                const sources = room.find(FIND_SOURCES);
                                for (let i = 0; i < sources.length; i++) {
                                    const outbox = sources[i].pos.findInRange(FIND_STRUCTURES, 2, { filter: { structureType: STRUCTURE_CONTAINER } });
                                    if (outbox.length > 0)
                                        outboxes.push(outbox[0]);
                                }
                            }
                            if (outboxes.length > 0) {
                                outboxes = outboxes.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]);
                                const closestBox = cSites[0].pos.findClosestByRange(outboxes);
                                if (closestBox.store[RESOURCE_ENERGY] > 0) {
                                    if (creep.withdraw(closestBox, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                        creep.moveTo(closestBox, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' } });
                                }
                                else {
                                    let droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                                    if (droppedPiles.length > 0) {
                                        const target = pos.findClosestByRange(droppedPiles);
                                        if (target) {
                                            if (creep.pickup(target) == ERR_NOT_IN_RANGE)
                                                creep.moveTo(target, { visualizePathStyle: { stroke: '#0000ff', opacity: 0.3, lineStyle: 'dotted' } });
                                        }
                                    }
                                }
                            }
                            else {
                                let droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                                if (droppedPiles.length > 0) {
                                    const target = pos.findClosestByRange(droppedPiles);
                                    if (target) {
                                        if (creep.pickup(target) == ERR_NOT_IN_RANGE)
                                            creep.moveTo(target, { visualizePathStyle: { stroke: '#0000ff', opacity: 0.3, lineStyle: 'dotted' } });
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
                else {
                    let target;
                    if (rMem.settings.flags.closestConSites)
                        target = pos.findClosestByRange(cSites);
                    else
                        target = cSites[0];
                    if (target) {
                        if (creep.build(target) == ERR_NOT_IN_RANGE)
                            creep.moveTo(target, { visualizePathStyle: { stroke: '#0000ff', opacity: 0.5, lineStyle: 'dotted', } });
                    }
                    else {
                        let basics = [];
                        let ramparts = [];
                        let walls = [];
                        let validTargets = [];
                        const rampartsMax = Memory.rooms[cMem.homeRoom].settings.repairSettings.repairRampartsTo;
                        const wallsMax = Memory.rooms[cMem.homeRoom].settings.repairSettings.repairWallsTo;
                        if (Memory.rooms[cMem.homeRoom].settings.flags.repairBasics) {
                            basics = room.find(FIND_STRUCTURES, { filter: (i) => (i.hits < i.hitsMax) && (i.structureType !== STRUCTURE_WALL && i.structureType !== STRUCTURE_RAMPART) });
                            validTargets = validTargets.concat(basics);
                        }
                        if (Memory.rooms[cMem.homeRoom].settings.flags.repairRamparts) {
                            ramparts = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_RAMPART) && ((i.hits / i.hitsMax * 100) <= rampartsMax)) });
                            validTargets = validTargets.concat(ramparts);
                        }
                        if (Memory.rooms[cMem.homeRoom].settings.flags.repairWalls) {
                            walls = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_WALL) && ((i.hits / i.hitsMax * 100) <= wallsMax)) });
                            validTargets = validTargets.concat(walls);
                        }
                        validTargets = validTargets.sort((a, b) => a.hits - b.hits);
                        if (validTargets.length > 0) {
                            if (creep.repair(validTargets[0]) == ERR_NOT_IN_RANGE)
                                creep.moveTo(validTargets[0], { visualizePathStyle: { stroke: '#0000ff', opacity: 0.5, lineStyle: 'dotted' } });
                        }
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'solid', }, ignoreCreeps: true });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'solid', }, ignoreCreeps: true });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'solid', }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleClaimer = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (cMem.claimRoom === undefined) {
            if (rMem.data.claimRoom)
                cMem.claimRoom = rMem.data.claimRoom;
        }
        const workRoom = rMem.data.remoteWorkRoom;
        if (cMem.workRoom === undefined)
            cMem.workRoom = workRoom;
        const remoteLogs = Memory.rooms[cMem.homeRoom].data.remoteLogistics[cMem.workRoom];
        if (cMem.remoteWaypoints === undefined) {
            if (remoteLogs.waypoints.length > 0)
                cMem.remoteWaypoints = remoteLogs.waypoints;
            else
                cMem.remoteWaypoints = 'none';
        }
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (creep.getActiveBodyparts(CARRY) > 0) {
                    const storage = Game.rooms[cMem.homeRoom].storage;
                    if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                        creep.moveTo(storage);
                }
                else {
                    if (cMem.remoteWaypoints !== 'none') {
                        if (cMem.remoteWaypoints.length == 0)
                            cMem.remoteWaypoints = 'none';
                        else if (!pos.isNearTo(Game.flags[cMem.remoteWaypoints[0]]))
                            creep.moveTo(Game.flags[cMem.remoteWaypoints[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        else {
                            if (cMem.remoteWaypoints.length > 1)
                                creep.moveTo(Game.flags[cMem.remoteWaypoints[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                            console.log(creep.name + ': Reached waypoint \'' + cMem.remoteWaypoints[0] + '\'');
                            const nextWaypoint = cMem.remoteWaypoints.shift();
                            console.log(nextWaypoint);
                            if (nextWaypoint === 'undefined') {
                                delete cMem.remoteWaypoints;
                                cMem.remoteWaypoints = 'none';
                            }
                        }
                    }
                    else {
                        if (pos.x == 49)
                            creep.move(LEFT);
                        else if (pos.x == 0)
                            creep.move(RIGHT);
                        else if (pos.y == 49)
                            creep.move(TOP);
                        else if (pos.y == 0)
                            creep.move(BOTTOM);
                        const claimRoom = cMem.claimRoom;
                        if (room.name !== claimRoom) {
                            if (!pos.isNearTo(Game.flags[claimRoom]))
                                creep.moveTo(Game.flags[claimRoom], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        }
                        else {
                            if (creep.claimController(room.controller) == ERR_NOT_IN_RANGE)
                                creep.moveTo(room.controller, { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                            if (!room.controller.sign || room.controller.sign.username !== 'randomencounter')
                                creep.signController(room.controller, 'There\'s no place like 127.0.0.1');
                        }
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleCollector = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                if (creep.ticksToLive <= 2)
                    creep.say('☠️');
                if (cMem.invaderLooter && room.storage) {
                    const tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store.getUsedCapacity() > 0 && !i.creep.my });
                    if (tombstones.length > 0) {
                        const target = pos.findClosestByRange(tombstones);
                        const lootTypes = Object.keys(creep.store);
                        console.log('lootTypes: ' + lootTypes);
                        if (target.store.getUsedCapacity() == 0 && (lootTypes.length <= 1 && lootTypes[0] == 'energy')) {
                            if (cMem.xferGoods !== undefined)
                                delete cMem.xferGoods;
                            delete cMem.invaderLooter;
                        }
                        else if (target.store.getUsedCapacity() > 0) {
                            if (creep.withdraw(target, lootTypes[lootTypes.length - 1]) == ERR_NOT_IN_RANGE)
                                creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' }, ignoreCreeps: true });
                        }
                    }
                    else {
                        delete cMem.xferGoods;
                        delete cMem.invaderLooter;
                    }
                    if (cMem.xferGoods === true && creep.store.getFreeCapacity() > 0) {
                        if (!pos.isNearTo(room.storage))
                            creep.moveTo(room.storage, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' }, ignoreCreeps: true });
                        else {
                            const creepLootTypes = Object.keys(creep.store);
                            console.log('creepLootTypes: ' + creepLootTypes);
                            creep.transfer(room.storage, creepLootTypes[creepLootTypes.length - 1]);
                            if (creep.store.getUsedCapacity() == 0)
                                delete cMem.xferGoods;
                        }
                    }
                    else {
                        if (creep.store.getFreeCapacity() !== 0) {
                            const tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store.getUsedCapacity() > 0 && !i.creep.my });
                            if (tombstones.length > 0) {
                                const target = pos.findClosestByRange(tombstones);
                                if (pos.isNearTo(target)) {
                                    const lootTypes = Object.keys(target.store);
                                    console.log('lootTypes: ' + lootTypes);
                                    creep.withdraw(target, lootTypes[lootTypes.length - 1]);
                                }
                                else
                                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' }, ignoreCreeps: true });
                            }
                            else {
                                const storage = room.storage || pos.findClosestByRange(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_STORAGE } });
                                if (pos.isNearTo(storage)) {
                                    const creepLootTypes = Object.keys(creep.store);
                                    console.log('creepLootTypes: ' + creepLootTypes);
                                    creep.transfer(storage, creepLootTypes[creepLootTypes.length - 1]);
                                    cMem.xferGoods = false;
                                }
                                else
                                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' }, ignoreCreeps: true });
                            }
                            const creepGonnaDie = creep.ticksToLive;
                            const tombsWithStuff = room.find(FIND_TOMBSTONES, { filter: (i) => i.store.getUsedCapacity() > 0 });
                            if (tombsWithStuff.length == 0 || creepGonnaDie < 100)
                                delete cMem.invaderLooter;
                        }
                    }
                }
                else {
                    if (creep.store[RESOURCE_ENERGY] == 0) {
                        let tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store.getUsedCapacity() > 0 && i.creep.my });
                        if (tombstones.length > 0) {
                            const tombstoneItem = Object.keys(tombstones[0].store);
                            if (tombstoneItem.length > 1 || (tombstoneItem.length == 1 && tombstoneItem[0] !== RESOURCE_ENERGY))
                                cMem.tombXfer = true;
                            if (creep.withdraw(tombstones[0], tombstoneItem[0]) == ERR_NOT_IN_RANGE)
                                creep.moveTo(tombstones[0], { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' } });
                        }
                        else {
                            if (room.storage) {
                                let droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                                droppedPiles = droppedPiles.sort((a, b) => b.amount - a.amount);
                                if (droppedPiles.length > 0) {
                                    if (creep.pickup(droppedPiles[0]) == ERR_NOT_IN_RANGE)
                                        creep.moveTo(droppedPiles[0], { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                }
                                else {
                                    if (!cMem.pickup)
                                        cMem.pickup = room.storage.id;
                                    const storage = room.storage;
                                    if (room.storage.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {
                                        if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                            creep.moveTo(storage, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                    }
                                }
                            }
                            else {
                                let outboxes = [];
                                if (rMem.settings.containerSettings.outboxes.length > 0) {
                                    let outboxIDs = rMem.settings.containerSettings.outboxes;
                                    for (let i = 0; i < outboxIDs.length; i++) {
                                        const outbox = Game.getObjectById(outboxIDs[i]);
                                        outboxes.push(outbox);
                                    }
                                }
                                else {
                                    const sources = room.find(FIND_SOURCES);
                                    for (let i = 0; i < sources.length; i++) {
                                        const outbox = sources[i].pos.findInRange(FIND_STRUCTURES, 2, { filter: { structureType: STRUCTURE_CONTAINER } });
                                        if (outbox.length > 0)
                                            outboxes.push(outbox[0]);
                                    }
                                }
                                if (outboxes.length > 0) {
                                    outboxes = outboxes.sort((a, b) => b.store[RESOURCE_ENERGY] - a.store[RESOURCE_ENERGY]);
                                    if (creep.withdraw(outboxes[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                        creep.moveTo(outboxes[0], { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                }
                                else {
                                    let droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                                    droppedPiles = droppedPiles.sort((a, b) => b.amount - a.amount);
                                    if (droppedPiles.length > 0) {
                                        if (creep.pickup(droppedPiles[0]) == ERR_NOT_IN_RANGE)
                                            creep.moveTo(droppedPiles[0], { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                    }
                                }
                            }
                        }
                    }
                    else {
                        const targets = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_SPAWN || i.structureType == STRUCTURE_EXTENSION) && i.store.getFreeCapacity(RESOURCE_ENERGY) > 0) });
                        if (targets.length > 0) {
                            const target = pos.findClosestByRange(targets);
                            if (creep.transfer(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                creep.moveTo(target, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                        }
                        else {
                            let towers = room.find(FIND_MY_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_TOWER && (i.store.getFreeCapacity() !== 0) });
                            if (towers.length > 1)
                                towers = towers.sort((a, b) => a.store[RESOURCE_ENERGY] - b.store[RESOURCE_ENERGY]);
                            if (towers.length > 0) {
                                if (creep.transfer(towers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                    creep.moveTo(towers[0], { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                            }
                        }
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' }, ignoreCreeps: true });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' }, ignoreCreeps: true });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleCrane = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                if (!cMem.link)
                    cMem.link = rMem.data.linkRegistry.central;
                if (!cMem.storage)
                    cMem.storage = rMem.objects.storage;
                if (!cMem.destination && rMem.data.linkRegistry.destination)
                    cMem.destination = rMem.data.linkRegistry.destination;
                if (!cMem.atCraneSpot === undefined)
                    cMem.atCraneSpot = false;
                if (cMem.upgrading == true && creep.store.getUsedCapacity() == 0)
                    cMem.upgrading = false;
                const objLink = Game.getObjectById(cMem.link);
                const objStorage = Game.getObjectById(cMem.storage);
                Game.getObjectById(cMem.terminal);
                const objDestination = Game.getObjectById(cMem.destination);
                let craneSpot = rMem.data.craneSpot;
                if (!cMem.atCraneSpot) {
                    if (pos.x !== craneSpot[0] || pos.y !== craneSpot[1]) {
                        creep.moveTo(new RoomPosition(craneSpot[0], craneSpot[1], room.name));
                    }
                    else {
                        cMem.atCraneSpot = true;
                    }
                }
                if (cMem.atCraneSpot == true) {
                    if (creep.store.getFreeCapacity() == 0 && cMem.dropLink == false) {
                        const resTypes = Object.keys(creep.store);
                        for (let types of resTypes) {
                            if (types !== RESOURCE_ENERGY)
                                creep.transfer(objStorage, types);
                        }
                    }
                    if (cMem.dropLink == true) {
                        creep.transfer(objStorage, RESOURCE_ENERGY);
                        creep.say('🎇');
                        cMem.dropLink = false;
                        cMem.upgrading = false;
                        return;
                    }
                    else if (creep.store[RESOURCE_ENERGY] > 0 && cMem.xferDest == true) {
                        creep.transfer(objLink, RESOURCE_ENERGY);
                        creep.say('🎆');
                        if (objLink.store[RESOURCE_ENERGY] > 700) {
                            cMem.xferDest = false;
                            cMem.upgrading = false;
                            objLink.transferEnergy(objDestination);
                        }
                        return;
                    }
                    else if (creep.store.getFreeCapacity(RESOURCE_ENERGY) == 0 && cMem.upgrading == false) {
                        creep.transfer(objStorage, RESOURCE_ENERGY);
                        creep.say('🎇');
                    }
                    else {
                        if (objLink.store[RESOURCE_ENERGY] >= 30) {
                            if (creep.withdraw(objLink, RESOURCE_ENERGY) == OK) {
                                creep.say('⚡');
                                cMem.dropLink = true;
                                cMem.upgrading = false;
                                return;
                            }
                        }
                        else if ((rMem.settings.flags.craneUpgrades) && (cMem.upgrading == false)) {
                            if (creep.store.getUsedCapacity() == 0) {
                                creep.withdraw(objStorage, RESOURCE_ENERGY);
                                creep.say('⚡');
                                cMem.upgrading = true;
                            }
                            else {
                                creep.upgradeController(room.controller);
                            }
                        }
                        else if (objDestination && objDestination.store.getFreeCapacity(RESOURCE_ENERGY) >= objLink.store.getUsedCapacity(RESOURCE_ENERGY) && objLink.cooldown == 0) {
                            if (creep.store.getFreeCapacity() > 0) {
                                creep.withdraw(objStorage, RESOURCE_ENERGY);
                                creep.say('⚡');
                                cMem.xferDest = true;
                            }
                        }
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleHarvester = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (creep.pos.x == 49)
                    creep.move(LEFT);
                else if (creep.pos.x == 0)
                    creep.move(RIGHT);
                else if (creep.pos.y == 49)
                    creep.move(TOP);
                else if (creep.pos.y == 0)
                    creep.move(BOTTOM);
                if (creep.ticksToLive <= 2) {
                    creep.unloadEnergy();
                    creep.say('☠️');
                }
                if (creep.getActiveBodyparts(CARRY) === 0) {
                    if (!cMem.source)
                        creep.assignHarvestSource();
                    else {
                        const source = Game.getObjectById(cMem.source);
                        if (!pos.isNearTo(source))
                            creep.moveTo(source, { visualizePathStyle: { stroke: '#00ff00', opacity: 0.5, lineStyle: 'dashed' } });
                        else
                            creep.harvestEnergy();
                    }
                }
                else {
                    if (creep.store.getFreeCapacity() == 0 || creep.store.getFreeCapacity() < (creep.getActiveBodyparts(WORK) * 2)) {
                        if (!cMem.bucket) {
                            const containers = pos.findInRange(FIND_STRUCTURES, 3, { filter: { structureType: STRUCTURE_CONTAINER } });
                            if (containers.length > 0) {
                                const target = pos.findClosestByRange(containers);
                                if (!pos.isNearTo(target))
                                    creep.moveTo(target, { visualizePathStyle: { stroke: '#00ff00', opacity: 0.5, lineStyle: 'dashed' } });
                                else {
                                    if (target.hits < target.hitsMax)
                                        creep.repair(target);
                                    else {
                                        creep.unloadEnergy();
                                        creep.harvestEnergy();
                                    }
                                }
                            }
                            else {
                                const nearbySites = pos.findInRange(FIND_CONSTRUCTION_SITES, 2);
                                if (nearbySites.length == 0)
                                    room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
                                else {
                                    const buildersNearby = room.find(FIND_MY_CREEPS, { filter: (i) => i.memory.role == 'remotebuilder' || i.memory.role == 'builder' });
                                    if (buildersNearby.length > 0) {
                                        creep.unloadEnergy();
                                        creep.harvestEnergy();
                                    }
                                    else
                                        creep.build(nearbySites[0]);
                                }
                            }
                        }
                        else {
                            const dropBucket = Game.getObjectById(cMem.bucket);
                            if (dropBucket) {
                                if (pos.isNearTo(dropBucket)) {
                                    creep.unloadEnergy();
                                    creep.harvestEnergy();
                                }
                                else
                                    creep.moveTo(dropBucket, { visualizePathStyle: { stroke: '#00ff00', opacity: 0.5, lineStyle: 'dashed' } });
                            }
                            else {
                                creep.unloadEnergy();
                                creep.harvestEnergy();
                            }
                        }
                    }
                    else
                        creep.harvestEnergy();
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' }, ignoreCreeps: true });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' }, ignoreCreeps: true });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleHealer = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.attackRoom === undefined)
            cMem.attackRoom = room.name;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (cMem.customAttackTarget === undefined)
            cMem.customAttackTarget = 'none';
        if (cMem.squad === undefined)
            cMem.squad = rMem.data.squads[0];
        if (cMem.subTeam === undefined)
            cMem.subTeam = 'healers';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                if (creep.ticksToLive <= 2)
                    creep.say('☠️');
                if (Memory.rooms[cMem.homeRoom].data.attackSignal == true) {
                    const target = pos.findClosestByRange(FIND_MY_CREEPS, { filter: (object) => object.memory.squad == cMem.squad && object.memory.subTeam == 'combatants' });
                    if (target) {
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#00ff00', opacity: 0.5, lineStyle: 'solid' }, ignoreCreeps: true });
                        if (pos.isNearTo(target)) {
                            if (target.hits < target.hitsMax)
                                creep.heal(target);
                        }
                        else {
                            if (target.hits < target.hitsMax)
                                creep.rangedHeal(target);
                            creep.moveTo(target);
                        }
                    }
                    else {
                        const secondaryTarget = pos.findClosestByRange(FIND_MY_CREEPS, { filter: (object) => object.memory.squad == cMem.squad && (object.memory.subTeam == 'combatants' || object.memory.subTeam == 'healers') });
                        if (secondaryTarget) {
                            creep.moveTo(secondaryTarget, { visualizePathStyle: { stroke: '#00ff00', opacity: 0.5, lineStyle: 'solid' }, ignoreCreeps: true });
                            if (pos.isNearTo(secondaryTarget)) {
                                if (secondaryTarget.hits < secondaryTarget.hitsMax)
                                    creep.heal(secondaryTarget);
                            }
                            else {
                                if (secondaryTarget.hits < secondaryTarget.hitsMax)
                                    creep.rangedHeal(secondaryTarget);
                            }
                        }
                    }
                }
                else {
                    const musterFlag = cMem.squad + '-muster';
                    if (!pos.isNearTo(Game.flags[musterFlag]))
                        creep.moveTo(Game.flags[musterFlag], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.5, lineStyle: 'solid' }, ignoreCreeps: true });
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.5, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.5, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ff00', opacity: 0.5, lineStyle: 'solid' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleMiner = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint === 'none') {
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
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
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleProvider = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (cMem.targetRoom === undefined)
            cMem.targetRoom = rMem.data.claimRoom;
        if (cMem.travelling === undefined)
            cMem.travelling = false;
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                if (creep.store.getUsedCapacity() == 0) {
                    const piles = room.find(FIND_DROPPED_RESOURCES);
                    if (piles.length > 0) {
                        const closestPile = pos.findClosestByRange(piles);
                        if (creep.pickup(closestPile) == ERR_NOT_IN_RANGE)
                            creep.moveTo(closestPile, { visualizePathStyle: { stroke: '#ff0033', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                    }
                    else {
                        const tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store.getUsedCapacity() > 0 });
                        if (tombstones.length > 0) {
                            const closestTombstone = pos.findClosestByRange(tombstones);
                            if (creep.withdraw(closestTombstone, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                creep.moveTo(closestTombstone, { visualizePathStyle: { stroke: '#ff0033', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                        }
                        else {
                            const storage = room.storage;
                            if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                creep.moveTo(storage, { visualizePathStyle: { stroke: '#ff0033', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                        }
                    }
                }
                else {
                    if (!cMem.travelling) {
                        cMem.rallyPoint = rMem.data.remoteLogistics[cMem.targetRoom].waypoints;
                        cMem.travelling = true;
                    }
                    else {
                        const logSpot = new RoomPosition(rMem.data.remoteLogistics[cMem.targetRoom].logisticsTarget[0], rMem.data.remoteLogistics[cMem.targetRoom].logisticsTarget[1], rMem.data.remoteLogistics[cMem.targetRoom].roomName);
                        if (pos.isNearTo(logSpot))
                            creep.drop(RESOURCE_ENERGY);
                        else
                            creep.moveTo(logSpot, { visualizePathStyle: { stroke: '#ff0033', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleRanger = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (cMem.attackRoom === undefined)
            cMem.attackRoom = room.name;
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (creep.ticksToLive <= 2)
                    creep.say('☠️');
                if (room.name !== cMem.attackRoom)
                    creep.moveTo(Game.flags.Attack);
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                const hostiles = room.find(FIND_HOSTILE_CREEPS);
                const target = pos.findClosestByRange(hostiles);
                if (target) {
                    if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
                        creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                }
                else {
                    let structures = room.find(FIND_HOSTILE_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });
                    if (!structures)
                        structures = room.find(FIND_HOSTILE_STRUCTURES);
                    const target = pos.findClosestByRange(structures);
                    if (target) {
                        if (creep.rangedAttack(target) == ERR_NOT_IN_RANGE)
                            creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleRebooter = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (creep.pos.x == 49)
                    creep.move(LEFT);
                else if (creep.pos.x == 0)
                    creep.move(RIGHT);
                else if (creep.pos.y == 49)
                    creep.move(TOP);
                else if (creep.pos.y == 0)
                    creep.move(BOTTOM);
                if (creep.ticksToLive <= 2)
                    creep.say('☠️');
                if (creep.store.getFreeCapacity() !== 0)
                    creep.harvestEnergy();
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
                            creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleRemoteBuilder = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        const workRoom = rMem.data.remoteWorkRoom;
        const remoteLogs = Memory.rooms[cMem.homeRoom].data.remoteLogistics[workRoom];
        if (cMem.initialTravelDone === undefined)
            cMem.initialTravelDone = false;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.workRoom === undefined)
            cMem.workRoom = workRoom;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = remoteLogs.waypoints;
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (creep.ticksToLive <= 2)
                    creep.say('☠️');
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                const workPosX = Memory.rooms[cMem.homeRoom].data.remoteLogistics[cMem.workRoom].logisticsTarget[0];
                const workPosY = Memory.rooms[cMem.homeRoom].data.remoteLogistics[cMem.workRoom].logisticsTarget[1];
                const workPos = new RoomPosition(workPosX, workPosY, cMem.workRoom);
                if (room.name !== cMem.workRoom)
                    creep.moveTo(workPos, { visualizePathStyle: { stroke: '#ffff00', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                else {
                    if (creep.store[RESOURCE_ENERGY] == 0)
                        creep.say('🔼');
                    if (creep.store.getFreeCapacity() == 0)
                        creep.say('🏗️');
                    if (creep.store.getUsedCapacity() == 0) {
                        const tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store[RESOURCE_ENERGY] > 0 });
                        if (tombstones.length > 0) {
                            const tombstone = pos.findClosestByRange(tombstones);
                            if (tombstone) {
                                if (creep.withdraw(tombstone, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                                    creep.moveTo(tombstone, { visualizePathStyle: { stroke: '#ffff00', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                            }
                        }
                        else {
                            const droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                            if (droppedPiles.length > 0) {
                                const closestPile = pos.findClosestByRange(droppedPiles);
                                if (closestPile) {
                                    if (creep.pickup(closestPile) === ERR_NOT_IN_RANGE)
                                        creep.moveTo(closestPile, { visualizePathStyle: { stroke: '#ffff00', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                }
                            }
                            else {
                                const containersWithEnergy = room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE) && i.store[RESOURCE_ENERGY] > 0 });
                                if (containersWithEnergy.length > 0) {
                                    const container = pos.findClosestByRange(containersWithEnergy);
                                    if (container) {
                                        if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                                            creep.moveTo(container, { visualizePathStyle: { stroke: '#ffff00', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                    }
                                }
                            }
                        }
                    }
                    else if (creep.store.getUsedCapacity() > 0) {
                        let targets = room.find(FIND_MY_CONSTRUCTION_SITES);
                        if (targets.length) {
                            if (creep.build(targets[0]) == ERR_NOT_IN_RANGE)
                                creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#ffff00', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                        }
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleRemoteGuard = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.outpostRoom === undefined)
            cMem.outpostRoom = Game.rooms[cMem.homeRoom].memory.outposts.roomList[Memory.miscData.outpostCounter];
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        const outpostRoom = cMem.outpostRoom;
        if (!cMem.disableAI) {
            if (creep.ticksToLive <= 2)
                creep.say('☠️');
            if (cMem.rallyPoint == 'none') {
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                if (room.name !== outpostRoom) {
                    creep.moveTo(Game.flags[outpostRoom], { visualizePathStyle: { stroke: '#ff0000', opacity: 0.3, lineStyle: 'solid' }, ignoreCreeps: true });
                }
                else {
                    const hostiles = room.find(FIND_HOSTILE_CREEPS);
                    if (hostiles.length > 0) {
                        const target = pos.findClosestByRange(hostiles);
                        if (creep.attack(target) == ERR_NOT_IN_RANGE)
                            creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.3, lineStyle: 'solid' }, ignoreCreeps: true });
                    }
                    else {
                        if (!pos.isNearTo(Game.flags[outpostRoom]))
                            creep.moveTo(Game.flags[outpostRoom], { visualizePathStyle: { stroke: '#ff0000', opacity: 0.3, lineStyle: 'solid' }, ignoreCreeps: true });
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleRemoteHarvester = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (creep.ticksToLive <= 2)
                    creep.say('☠️');
                else {
                    if (creep.pos.x == 49)
                        creep.move(LEFT);
                    else if (creep.pos.x == 0)
                        creep.move(RIGHT);
                    else if (creep.pos.y == 49)
                        creep.move(TOP);
                    else if (creep.pos.y == 0)
                        creep.move(BOTTOM);
                    if (creep.store.getFreeCapacity() == 0 || creep.store.getFreeCapacity() < (creep.getActiveBodyparts(WORK) * 2)) {
                        const containers = pos.findInRange(FIND_STRUCTURES, 3, { filter: (i) => (i.structureType == STRUCTURE_CONTAINER) });
                        if (containers.length > 0) {
                            const target = pos.findClosestByRange(containers);
                            if (!pos.isNearTo(target))
                                creep.moveTo(target, { visualizePathStyle: { stroke: '#00ff00', opacity: 0.5, lineStyle: 'dashed' } });
                            else {
                                if (target.hits < target.hitsMax)
                                    creep.repair(target);
                                else {
                                    creep.unloadEnergy();
                                    creep.harvestEnergy();
                                }
                            }
                        }
                        else {
                            if (rMem.outpostOfRoom) {
                                const nearbySites = pos.findInRange(FIND_CONSTRUCTION_SITES, 2);
                                if (nearbySites.length == 0)
                                    room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER);
                                else {
                                    const buildersNearby = room.find(FIND_MY_CREEPS, { filter: (i) => i.memory.role == 'remotebuilder' });
                                    if (buildersNearby.length > 0) {
                                        creep.unloadEnergy();
                                        creep.harvestEnergy();
                                    }
                                    else
                                        creep.build(nearbySites[0]);
                                }
                            }
                            else {
                                creep.unloadEnergy();
                                creep.harvestEnergy();
                            }
                        }
                    }
                    else
                        creep.harvestEnergy();
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleRemoteLogistician = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        const workRoom = rMem.data.remoteWorkRoom;
        const remoteLogs = Memory.rooms[cMem.homeRoom].data.remoteLogistics[workRoom];
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = remoteLogs.waypoints;
        if (cMem.destPos === undefined)
            cMem.destPos = remoteLogs.logisticsTarget;
        if (cMem.destRoom === undefined)
            cMem.destRoom = rMem.data.remoteWorkRoom;
        if (cMem.storage === undefined)
            cMem.storage = room.storage.id;
        if (cMem.initialEnergy === undefined)
            cMem.initialEnergy = false;
        if (!cMem.disableAI) {
            if (cMem.initialEnergy == false) {
                const homeStorage = Game.getObjectById(cMem.storage);
                if (homeStorage) {
                    const result = creep.withdraw(homeStorage, RESOURCE_ENERGY);
                    switch (result) {
                        case ERR_NOT_IN_RANGE:
                            creep.moveTo(homeStorage, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.5, lineStyle: 'dotted' }, ignoreCreeps: true });
                            break;
                        case OK:
                            cMem.initialEnergy = true;
                            break;
                    }
                }
            }
            else {
                if (cMem.rallyPoint == 'none') {
                    if (creep.store.getUsedCapacity(RESOURCE_ENERGY) == 0) {
                        if (cMem.customTarget) {
                            const cTarget = Game.getObjectById(cMem.customTarget);
                            if (creep.withdraw(cTarget, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                creep.moveTo(cTarget, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.5, lineStyle: 'dotted' }, ignoreCreeps: true });
                        }
                        else {
                            let droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                            if (droppedPiles.length > 0) {
                                if (cMem.ignorePile) {
                                    const index = droppedPiles.findIndex((i) => { return i.id === cMem.ignorePile; });
                                    droppedPiles.splice(index, 1);
                                }
                                droppedPiles = droppedPiles.sort((a, b) => b.amount - a.amount);
                                if (creep.pickup(droppedPiles[0]) === ERR_NOT_IN_RANGE)
                                    creep.moveTo(droppedPiles[0], { visualizePathStyle: { stroke: '#ffffff', opacity: 0.5, lineStyle: 'dotted' }, ignoreCreeps: true });
                            }
                            else {
                                if (creep.room.name === cMem.homeRoom) {
                                    const homeStorage = Game.getObjectById(cMem.storage);
                                    if (homeStorage) {
                                        if (creep.withdraw(homeStorage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                                            creep.moveTo(homeStorage, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.5, lineStyle: 'dotted' }, ignoreCreeps: true });
                                    }
                                }
                            }
                        }
                    }
                    else {
                        const targetPosition = new RoomPosition(cMem.destPos[0], cMem.destPos[1], cMem.destRoom);
                        if (pos.isEqualTo(targetPosition)) {
                            const workerCreeps = pos.findInRange(FIND_MY_CREEPS, 3, { filter: (i) => i.getActiveBodyparts(WORK) > 0 });
                            if (workerCreeps.length > 0) {
                                const result = creep.transfer(workerCreeps[0], RESOURCE_ENERGY);
                                if (result == ERR_NOT_IN_RANGE) {
                                    creep.moveTo(workerCreeps[0], { visualizePathStyle: { stroke: '#ffffff', opacity: 0.5, lineStyle: 'dotted' } });
                                    creep.transfer(workerCreeps[0], RESOURCE_ENERGY);
                                }
                            }
                            else {
                                const containers = pos.findInRange(FIND_STRUCTURES, 3, { filter: { structureType: STRUCTURE_CONTAINER } });
                                if (containers.length > 0) {
                                    if (creep.transfer(containers[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                        creep.moveTo(containers[0], { visualizePathStyle: { stroke: '#ffffff', opacity: 0.5, lineStyle: 'dotted' }, ignoreCreeps: true });
                                    else {
                                        creep.drop(RESOURCE_ENERGY);
                                        const myPile = pos.findInRange(FIND_DROPPED_RESOURCES, 2);
                                        const pileID = myPile[0].id;
                                        cMem.ignorePile = pileID;
                                    }
                                }
                            }
                        }
                        else
                            creep.moveTo(targetPosition, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.5, lineStyle: 'dotted' }, ignoreCreeps: true });
                    }
                }
                else {
                    if (cMem.rallyPoint instanceof Array) {
                        if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                            cMem.rallyPoint = 'none';
                        else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                            creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        else {
                            if (cMem.rallyPoint.length > 1)
                                creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                            console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                            const nextWaypoint = cMem.rallyPoint.shift();
                            if (nextWaypoint === 'undefined') {
                                delete cMem.rallyPoint;
                                cMem.rallyPoint = 'none';
                            }
                        }
                    }
                    else {
                        const rally = Game.flags[cMem.rallyPoint];
                        if (pos.isNearTo(rally)) {
                            console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                            cMem.rallyPoint = 'none';
                        }
                        else
                            creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                    }
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleRemoteRunner = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (cMem.outpostRoom === undefined)
            cMem.outpostRoom = Game.rooms[cMem.homeRoom].memory.outposts.roomList[Memory.miscData.outpostCounter];
        const homeRoom = Game.rooms[cMem.homeRoom];
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                if (creep.ticksToLive <= 2)
                    creep.say('☠️');
                if (!cMem.pickup) {
                    cMem.pickup = rMem.outposts.aggregateContainerList[rMem.outposts.aggLastContainer];
                    rMem.outposts.aggLastContainer++;
                    if (rMem.outposts.aggLastContainer >= rMem.outposts.aggregateContainerList.length)
                        rMem.outposts.aggLastContainer = 0;
                }
                if (!cMem.dropoff)
                    cMem.dropoff = homeRoom.storage.id;
                if (creep.store[RESOURCE_ENERGY] == 0) {
                    const target = Game.getObjectById(cMem.pickup);
                    if (target) {
                        if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                            creep.moveTo(target, { visualizePathStyle: { stroke: '#880088', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                    }
                    else {
                        if (creep.room.name !== cMem.outpostRoom)
                            creep.moveTo(Game.flags[cMem.outpostRoom], { visualizePathStyle: { stroke: '#880088', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                    }
                }
                if (creep.store.getUsedCapacity() !== 0) {
                    const target = Game.getObjectById(cMem.dropoff);
                    if (target) {
                        if (pos.isNearTo(target)) {
                            if (target.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                                creep.transfer(target, RESOURCE_ENERGY);
                        }
                        else {
                            const roadUnderCreep = room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_ROAD && i.pos.x == pos.x && i.pos.y == pos.y && i.hits !== i.hitsMax) });
                            if (roadUnderCreep.length > 0)
                                creep.repair(roadUnderCreep[0]);
                            else
                                creep.moveTo(target, { visualizePathStyle: { stroke: '#880088', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                        }
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleRepairer = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (creep.pos.x == 49)
                    creep.move(LEFT);
                else if (creep.pos.x == 0)
                    creep.move(RIGHT);
                else if (creep.pos.y == 49)
                    creep.move(TOP);
                else if (creep.pos.y == 0)
                    creep.move(BOTTOM);
                if (creep.ticksToLive <= 2)
                    creep.say('☠️');
                if (creep.store.getUsedCapacity() == 0) {
                    switch (rMem.settings.flags.centralStorageLogic) {
                        case true: {
                            const target = pos.findClosestByRange(FIND_MY_STRUCTURES, {
                                filter: (i) => i.structureType == STRUCTURE_STORAGE &&
                                    i.store[RESOURCE_ENERGY] > 0
                            });
                            if (target) {
                                if (creep.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff6600', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
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
                                        creep.moveTo(tombstone, { visualizePathStyle: { stroke: '#ff6600', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                }
                            }
                            else {
                                const droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                                if (droppedPiles.length > 0) {
                                    const closestPile = pos.findClosestByRange(droppedPiles);
                                    if (closestPile) {
                                        if (creep.pickup(closestPile) === ERR_NOT_IN_RANGE)
                                            creep.moveTo(closestPile, { visualizePathStyle: { stroke: '#ff6600', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                    }
                                }
                                else {
                                    const containersWithEnergy = room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE) && i.store[RESOURCE_ENERGY] > 0 });
                                    if (containersWithEnergy.length > 0) {
                                        const container = pos.findClosestByRange(containersWithEnergy);
                                        if (container) {
                                            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                                                creep.moveTo(container, { visualizePathStyle: { stroke: '#ff6600', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                        }
                                    }
                                }
                            }
                            break;
                        }
                    }
                }
                else {
                    const tower = pos.findClosestByRange(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_TOWER && (i.store[RESOURCE_ENERGY] <= 800) });
                    if (tower) {
                        if (creep.transfer(tower, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                            creep.moveTo(tower, { visualizePathStyle: { stroke: '#ff6600', opacity: 0.3, lineStyle: 'solid' }, ignoreCreeps: true });
                    }
                    else {
                        let basics = [];
                        let ramparts = [];
                        let walls = [];
                        let validTargets = [];
                        const rampartsMax = Memory.rooms[cMem.homeRoom].settings.repairSettings.repairRampartsTo;
                        const wallsMax = Memory.rooms[cMem.homeRoom].settings.repairSettings.repairWallsTo;
                        if (Memory.rooms[cMem.homeRoom].settings.flags.repairBasics) {
                            basics = room.find(FIND_STRUCTURES, {
                                filter: (i) => (i.hits < i.hitsMax) && (i.structureType !== STRUCTURE_WALL && i.structureType !== STRUCTURE_RAMPART)
                            });
                            validTargets = validTargets.concat(basics);
                        }
                        if (Memory.rooms[cMem.homeRoom].settings.flags.repairRamparts) {
                            ramparts = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_RAMPART) && ((i.hits / i.hitsMax * 100) <= rampartsMax)) });
                            validTargets = validTargets.concat(ramparts);
                        }
                        if (Memory.rooms[cMem.homeRoom].settings.flags.repairWalls) {
                            walls = room.find(FIND_STRUCTURES, { filter: (i) => ((i.structureType == STRUCTURE_WALL) && ((i.hits / i.hitsMax * 100) <= wallsMax)) });
                            validTargets = validTargets.concat(walls);
                        }
                        const target = pos.findClosestByRange(validTargets);
                        if (target) {
                            if (creep.repair(target) == ERR_NOT_IN_RANGE)
                                creep.moveTo(target, { visualizePathStyle: { stroke: '#ff6600', lineStyle: 'dashed', opacity: 0.3 }, ignoreCreeps: true });
                        }
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    const rally = Game.flags[cMem.rallyPoint[0]];
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(rally))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(rally))
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        const nextRally = Game.flags[cMem.rallyPoint[1]];
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(nextRally, { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleReserver = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.homeRoom === undefined)
            cMem.homeRoom = room.name;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (cMem.targetRoom === undefined) {
            cMem.targetRoom = Game.rooms[cMem.homeRoom].memory.outposts.roomList[Memory.miscData.outpostCounter];
            Memory.miscData.outpostCounter++;
            if (Memory.miscData.outpostCounter >= Game.rooms[cMem.homeRoom].memory.outposts.roomList.length)
                Memory.miscData.outpostCounter = 0;
        }
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                if (room.name == cMem.targetRoom) {
                    if (!rMem.objects)
                        room.cacheObjects();
                    if (Game.rooms[room.name].controller.owner === undefined) {
                        if (creep.reserveController(room.controller) == ERR_NOT_IN_RANGE)
                            creep.moveTo(room.controller, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.3 } });
                    }
                    else if (typeof Game.rooms[room.name].controller.owner === 'object') {
                        if (Game.rooms[room.name].controller.owner.username !== 'randomencounter') {
                            if (creep.attackController(room.controller) == ERR_NOT_IN_RANGE)
                                creep.moveTo(room.controller, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.3 } });
                        }
                    }
                    if (!room.controller.sign)
                        creep.signController(room.controller, 'There\'s no place like 127.0.0.1');
                }
                else {
                    if (Game.flags[cMem.targetRoom])
                        creep.moveTo(Game.flags[cMem.targetRoom], { visualizePathStyle: { stroke: '#ffffff', opacity: 0.3 } });
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleRunner = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                if (creep.ticksToLive <= 2)
                    creep.say('☠️');
                if (!cMem.pickup && !cMem.dropoff)
                    creep.assignLogisticalPair();
                if (cMem.cargo === undefined)
                    cMem.cargo = 'energy';
                if (cMem.dropoff == 'none')
                    if (room.storage)
                        cMem.dropoff = room.storage.id;
                if (creep.store[RESOURCE_ENERGY] == 0 || creep.store[cMem.cargo] == 0) {
                    if (cMem.pickup == 'none') {
                        let piles = creep.room.find(FIND_DROPPED_RESOURCES);
                        piles = piles.sort((a, b) => b.amount - a.amount);
                        if (piles.length > 0) {
                            if (creep.pickup(piles[0]) == ERR_NOT_IN_RANGE)
                                creep.moveTo(piles[0], { visualizePathStyle: { stroke: '#880088', opacity: 0.3, lineStyle: 'dotted' } });
                        }
                    }
                    else {
                        const target = Game.getObjectById(cMem.pickup);
                        if (target) {
                            if (creep.withdraw(target, cMem.cargo) == ERR_NOT_IN_RANGE)
                                creep.moveTo(target, { visualizePathStyle: { stroke: '#880088', opacity: 0.3, lineStyle: 'dotted' } });
                        }
                    }
                }
                else {
                    const target = Game.getObjectById(cMem.dropoff);
                    if (target) {
                        if (pos.isNearTo(target)) {
                            if (target.store.getFreeCapacity(RESOURCE_ENERGY) > 0)
                                creep.transfer(target, RESOURCE_ENERGY);
                        }
                        else {
                            if (creep.getActiveBodyparts(WORK) > 0) {
                                const roadUnderCreep = room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_ROAD && i.pos.x == pos.x && i.pos.y == pos.y && i.hits !== i.hitsMax) });
                                pos.findClosestByRange(roadUnderCreep);
                                if (roadUnderCreep.length > 0)
                                    creep.repair(roadUnderCreep[0]);
                                else
                                    creep.moveTo(target, { visualizePathStyle: { stroke: '#880088', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                            }
                            else
                                creep.moveTo(target, { visualizePathStyle: { stroke: '#880088', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                        }
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleScientist = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                if (!rMem.objects.labs)
                    room.cacheObjects();
                if (!rMem.settings.labSettings)
                    room.initRoom();
                if (creep) {
                    if (rMem.objects && rMem.objects.labs) {
                        let reagentLab1;
                        let reagentLab2;
                        let reactionLab1;
                        const storage = Game.getObjectById(rMem.objects.storage);
                        const baseReg1 = rMem.settings.labSettings.reagentOne;
                        const baseReg2 = rMem.settings.labSettings.reagentTwo;
                        rMem.settings.labSettings.boostCompound;
                        const outputChem = room.calcLabReaction();
                        if (rMem.objects.labs[0])
                            reagentLab1 = Game.getObjectById(rMem.objects.labs[0]);
                        if (rMem.objects.labs[1])
                            reagentLab2 = Game.getObjectById(rMem.objects.labs[1]);
                        if (rMem.objects.labs[2])
                            reactionLab1 = Game.getObjectById(rMem.objects.labs[2]);
                        if (reagentLab1.store[RESOURCE_ENERGY] < 2000) {
                            if (creep.store[RESOURCE_ENERGY] == 0) {
                                if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.8, lineStyle: 'solid' } });
                            }
                        }
                        else if (reagentLab2.store[RESOURCE_ENERGY] < 2000) {
                            if (creep.store[RESOURCE_ENERGY] == 0) {
                                if (creep.withdraw(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.8, lineStyle: 'solid' } });
                            }
                        }
                        else if (rMem.settings.flags.doScience) {
                            if (reagentLab1.store[baseReg1] < 3000) {
                                if (creep.store[baseReg1] == 0) {
                                    if (creep.withdraw(storage, baseReg1) == ERR_NOT_IN_RANGE)
                                        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.8, lineStyle: 'solid' } });
                                }
                            }
                            else if (reagentLab2.store[baseReg2] < 3000) {
                                if (creep.store[baseReg2] == 0) {
                                    if (creep.withdraw(storage, baseReg2) == ERR_NOT_IN_RANGE)
                                        creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.8, lineStyle: 'solid' } });
                                }
                            }
                            else
                                reactionLab1.runReaction(reagentLab1, reagentLab2);
                            if (reactionLab1.store[outputChem] > 0) {
                                if (creep.withdraw(reactionLab1, outputChem) == ERR_NOT_IN_RANGE)
                                    creep.moveTo(reactionLab1, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.8, lineStyle: 'solid' } });
                            }
                            else {
                                if (creep.transfer(storage, outputChem) == ERR_NOT_IN_RANGE)
                                    creep.moveTo(storage, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.8, lineStyle: 'solid' } });
                            }
                        }
                    }
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleScout = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.homeRoom === undefined)
            cMem.homeRoom = room.name;
        if (cMem.scoutList === undefined)
            cMem.scoutList = [];
        if (cMem.compiledList === undefined)
            cMem.compiledList = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                let scoutArray = [];
                for (let i = 0; i < Memory.colonies.registry[cMem.homeRoom].exitRooms.length; i++) {
                    const theRoom = Memory.colonies.registry[cMem.homeRoom].exitRooms[i];
                    scoutArray.push(theRoom);
                }
                cMem.scoutList = scoutArray;
                cMem.compiledList = true;
                if (cMem.compiledList) {
                    if (cMem.targetRoom === undefined)
                        cMem.targetRoom = cMem.scoutList[0];
                    let goToPos = new RoomPosition(25, 25, cMem.targetRoom);
                    if (cMem.scoutList.length > 0 && room.name == cMem.targetRoom) {
                        if (!rMem.objects) {
                            console.log('SCOUT REPORT: Room [' + room.name + '], caching objects...');
                            room.cacheObjects();
                        }
                        cMem.scoutList.shift();
                        delete cMem.targetRoom;
                        delete cMem._move;
                    }
                    else if (room.name !== cMem.targetRoom)
                        creep.moveTo(goToPos, { visualizePathStyle: { stroke: '#ff00ff', opacity: 0.5, lineStyle: 'solid' }, ignoreCreeps: true });
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleUpgrader = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (cMem.upgradeRoom === undefined)
            cMem.upgradeRoom = room.name;
        if (!cMem.bucket) {
            if (rMem.data.linkRegistry && rMem.data.linkRegistry.destination !== undefined)
                cMem.bucket = rMem.data.linkRegistry.destination;
            else if (rMem.settings.containerSettings.inboxes !== undefined)
                cMem.bucket = rMem.settings.containerSettings.inboxes[0];
            else {
                const nearbyBuckets = room.controller.pos.findInRange(FIND_STRUCTURES, 3, { filter: (i) => i.structureType == STRUCTURE_LINK || i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE });
                if (nearbyBuckets.length > 0) {
                    const closestBucket = room.controller.pos.findClosestByRange(nearbyBuckets);
                    if (closestBucket)
                        cMem.bucket = closestBucket.id;
                }
            }
        }
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                cMem.upgradeRoom;
                if (creep.ticksToLive <= 3) {
                    creep.say('☠️');
                    if (creep.store.getUsedCapacity() > 0) {
                        const mainBucket = Game.getObjectById(cMem.bucket);
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
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                else if (pos.y == 49)
                    creep.move(TOP);
                if (creep.store.getUsedCapacity() == 0) {
                    if (cMem.bucket) {
                        const mainBucket = Game.getObjectById(cMem.bucket);
                        if (mainBucket) {
                            if (pos.findInRange(FIND_STRUCTURES, 2, { filter: { structureType: STRUCTURE_CONTROLLER } }).length == 0)
                                creep.moveTo(room.controller);
                            if (creep.withdraw(mainBucket, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE)
                                creep.moveTo(mainBucket, { visualizePathStyle: { stroke: '#ffff00', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                        }
                    }
                    else {
                        if (rMem.settings.flags.upgradersSeekEnergy) {
                            const tombstones = room.find(FIND_TOMBSTONES, { filter: (i) => i.store[RESOURCE_ENERGY] > 0 });
                            if (tombstones.length > 0) {
                                const tombstone = pos.findClosestByRange(tombstones);
                                if (tombstone) {
                                    if (creep.withdraw(tombstone, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                                        creep.moveTo(tombstone, { visualizePathStyle: { stroke: '#ff6600', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                }
                            }
                            else {
                                const droppedPiles = room.find(FIND_DROPPED_RESOURCES);
                                if (droppedPiles.length > 0) {
                                    const closestPile = pos.findClosestByRange(droppedPiles);
                                    if (closestPile) {
                                        if (creep.pickup(closestPile) === ERR_NOT_IN_RANGE)
                                            creep.moveTo(closestPile, { visualizePathStyle: { stroke: '#ff6600', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                    }
                                }
                                else {
                                    const containersWithEnergy = room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE) && i.store[RESOURCE_ENERGY] > 0 });
                                    if (containersWithEnergy.length > 0) {
                                        const container = pos.findClosestByRange(containersWithEnergy);
                                        if (container) {
                                            if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE)
                                                creep.moveTo(container, { visualizePathStyle: { stroke: '#ff6600', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    if (cMem.bucket) {
                        const mainBucket = Game.getObjectById(cMem.bucket);
                        if (mainBucket.hits < mainBucket.hitsMax)
                            creep.repair(mainBucket);
                    }
                    if (creep.upgradeController(room.controller) == ERR_NOT_IN_RANGE)
                        creep.moveTo(room.controller, { visualizePathStyle: { stroke: '#ffff00', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#00ff00', opacity: 0.3, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#00ffff', opacity: 0.3, lineStyle: 'dotted' }, ignoreCreeps: true });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};
const roleWarrior = {
    run: function (creep) {
        const room = creep.room;
        const cMem = creep.memory;
        const rMem = room.memory;
        const pos = creep.pos;
        if (cMem.disableAI === undefined)
            cMem.disableAI = false;
        if (cMem.attackRoom === undefined)
            cMem.attackRoom = rMem.data.attackRoom || room.name;
        if (cMem.rallyPoint === undefined)
            cMem.rallyPoint = 'none';
        if (cMem.customTarget === undefined && rMem.data.customAttackTarget !== undefined)
            cMem.customTarget = rMem.data.customAttackTarget;
        if (cMem.squad === undefined)
            cMem.squad = rMem.data.squads[0];
        if (cMem.subTeam === undefined)
            cMem.subTeam = 'combatants';
        if (!cMem.disableAI) {
            if (cMem.rallyPoint == 'none') {
                if (creep.ticksToLive <= 2)
                    creep.say('☠️');
                if (pos.x == 49)
                    creep.move(LEFT);
                else if (pos.x == 0)
                    creep.move(RIGHT);
                else if (pos.y == 49)
                    creep.move(TOP);
                else if (pos.y == 0)
                    creep.move(BOTTOM);
                if (Memory.rooms[cMem.homeRoom].data.attackSignal == true) {
                    if (cMem.customTarget !== undefined) {
                        const cAT = Game.getObjectById(cMem.customTarget);
                        if (creep.getActiveBodyparts(WORK) > 0) {
                            if (creep.dismantle(cAT) == ERR_NOT_IN_RANGE)
                                creep.moveTo(cAT, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                        }
                        else {
                            if (creep.attack(cAT) == ERR_NOT_IN_RANGE)
                                creep.moveTo(cAT, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                        }
                    }
                    else {
                        if (room.name !== cMem.attackRoom) {
                            creep.moveTo(Game.flags[cMem.attackRoom], { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                        }
                        else {
                            const hostiles = room.find(FIND_HOSTILE_CREEPS);
                            const target = pos.findClosestByRange(hostiles);
                            if (target) {
                                if (creep.attack(target) == ERR_NOT_IN_RANGE)
                                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                            }
                            else {
                                const towers = room.find(FIND_HOSTILE_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });
                                const target = pos.findClosestByRange(towers);
                                if (target) {
                                    if (creep.getActiveBodyparts(WORK) > 0) {
                                        if (creep.dismantle(target) == ERR_NOT_IN_RANGE)
                                            creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                                    }
                                    else {
                                        if (creep.attack(target) == ERR_NOT_IN_RANGE)
                                            creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                                    }
                                }
                                else {
                                    const spawns = room.find(FIND_HOSTILE_STRUCTURES, { filter: { structureType: STRUCTURE_SPAWN } });
                                    const target = pos.findClosestByRange(spawns);
                                    if (target) {
                                        if (creep.getActiveBodyparts(WORK) > 0) {
                                            if (creep.dismantle(target) == ERR_NOT_IN_RANGE)
                                                creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                                        }
                                        else {
                                            if (creep.attack(target) == ERR_NOT_IN_RANGE)
                                                creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                                        }
                                    }
                                    else {
                                        const structures = room.find(FIND_HOSTILE_STRUCTURES);
                                        const target = pos.findClosestByRange(structures);
                                        if (target) {
                                            if (creep.getActiveBodyparts(WORK) > 0) {
                                                if (creep.dismantle(target) == ERR_NOT_IN_RANGE)
                                                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                                            }
                                            else {
                                                if (creep.attack(target) == ERR_NOT_IN_RANGE)
                                                    creep.moveTo(target, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                                            }
                                        }
                                        else if (creep.getActiveBodyparts(CLAIM) > 0) {
                                            const controller = room.controller;
                                            if (creep.attackController(controller) == ERR_NOT_IN_RANGE)
                                                creep.moveTo(controller, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                const musterFlag = cMem.squad + '-muster';
                if (!pos.isNearTo(Game.flags[musterFlag]))
                    creep.moveTo(Game.flags[musterFlag], { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
            }
            else {
                if (cMem.rallyPoint instanceof Array) {
                    if (cMem.rallyPoint.length == 1 && pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        cMem.rallyPoint = 'none';
                    else if (!pos.isNearTo(Game.flags[cMem.rallyPoint[0]]))
                        creep.moveTo(Game.flags[cMem.rallyPoint[0]], { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                    else {
                        if (cMem.rallyPoint.length > 1)
                            creep.moveTo(Game.flags[cMem.rallyPoint[1]], { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint[0] + '\'');
                        const nextWaypoint = cMem.rallyPoint.shift();
                        if (nextWaypoint === 'undefined') {
                            delete cMem.rallyPoint;
                            cMem.rallyPoint = 'none';
                        }
                    }
                }
                else {
                    const rally = Game.flags[cMem.rallyPoint];
                    if (pos.isNearTo(rally)) {
                        console.log(creep.name + ': Reached rally point \'' + cMem.rallyPoint + '\'');
                        cMem.rallyPoint = 'none';
                    }
                    else
                        creep.moveTo(rally, { visualizePathStyle: { stroke: '#ff0000', opacity: 0.5, lineStyle: 'solid' } });
                }
            }
        }
        else {
            if (!Memory.globalSettings.alertDisabled)
                console.log('[' + room.name + ']: WARNING: Creep ' + creep.name + '\'s AI is disabled.');
            creep.say('💤');
        }
    }
};

function roomDefense(room) {
    let towers = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });
    _.forEach(towers, function (tower) {
        if (tower) {
            tower.id;
            const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
            if (closestHostile) {
                tower.room.visual.circle(tower.pos, { fill: '#110000', radius: 35, stroke: '#ff0000', opacity: 0.3, lineStyle: 'dashed' });
                tower.attack(closestHostile);
            }
            else {
                const closestDamagedCreep = tower.pos.findClosestByRange(FIND_MY_CREEPS, {
                    filter: (creep) => creep.hits < creep.hitsMax
                });
                if (closestDamagedCreep) {
                    tower.heal(closestDamagedCreep);
                }
                else {
                    if (tower.room.memory.settings.flags.towerRepairBasic == true) {
                        let ramparts = [];
                        let walls = [];
                        let validTargets = [];
                        const rampartsMax = tower.room.memory.settings.repairSettings.repairRampartsTo;
                        const wallsMax = tower.room.memory.settings.repairSettings.repairWallsTo;
                        let targets = tower.room.find(FIND_STRUCTURES, {
                            filter: (i) => (i.hits < i.hitsMax) && (i.structureType ==
                                STRUCTURE_TOWER || i.structureType == STRUCTURE_SPAWN || i.structureType == STRUCTURE_EXTENSION || i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_EXTRACTOR || i.structureType == STRUCTURE_LAB || i.structureType == STRUCTURE_LINK || i.structureType == STRUCTURE_STORAGE || i.structureType == STRUCTURE_TERMINAL)
                        });
                        validTargets = validTargets.concat(targets);
                        let roads = tower.room.find(FIND_STRUCTURES, { filter: (i) => (i.hits < i.hitsMax) && (i.hitsMax - i.hits <= 500) && (i.structureType == STRUCTURE_ROAD) });
                        validTargets = validTargets.concat(roads);
                        if (tower.room.memory.settings.flags.towerRepairDefenses) {
                            if (tower.room.memory.settings.flags.repairRamparts) {
                                ramparts = tower.room.find(FIND_STRUCTURES, { filter: (i) => ((i.hits / i.hitsMax * 100) < rampartsMax) && (i.structureType == STRUCTURE_RAMPART) });
                                validTargets = validTargets.concat(ramparts);
                            }
                            if (tower.room.memory.settings.flags.repairWalls) {
                                walls = tower.room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_WALL && (i.hits / i.hitsMax * 100) < wallsMax) });
                                validTargets = validTargets.concat(walls);
                            }
                        }
                        const target = tower.pos.findClosestByRange(validTargets);
                        if (target) {
                            tower.room.memory.data.towerLRT = validTargets[0].id;
                            tower.repair(validTargets[0]);
                        }
                    }
                }
            }
        }
    });
}

function calcTickTime(tickSamples = 1000) {
    let millis = Date.now();
    if (typeof Memory.time == "undefined")
        Memory.time = {};
    if (typeof Memory.time.lastTickMillis == "undefined")
        Memory.time.lastTickMillis = millis - 1010;
    if (typeof Memory.time.lastTickTime == "undefined")
        Memory.time.lastTickTime = 1.01;
    if (typeof Memory.time.tickTimeCount == "undefined")
        Memory.time.tickTimeCount = 0;
    if (typeof Memory.time.tickTimeTotal == "undefined")
        Memory.time.tickTimeTotal = 0;
    let lastTickMillis = Number(Memory.time.lastTickMillis);
    let tickTimeCount = Number(Memory.time.tickTimeCount);
    let tickTimeTotal = Number(Memory.time.tickTimeTotal);
    if (tickTimeCount >= (tickSamples - 1)) {
        tickTimeTotal += millis - lastTickMillis;
        tickTimeCount++;
        let tickTime = (tickTimeTotal / tickTimeCount) / 1000;
        console.log("Calculated tickTime as", tickTime, "from", tickTimeCount, "samples.");
        Memory.time.lastTickTime = tickTime;
        Memory.time.tickTimeTotal = millis - lastTickMillis;
        Memory.time.tickTimeCount = 1;
        Memory.time.lastTickMillis = millis;
    }
    else {
        global.tickTime = Number(Memory.time.lastTickTime);
        tickTimeTotal += millis - lastTickMillis;
        Memory.time.tickTimeTotal = tickTimeTotal;
        tickTimeCount++;
        Memory.time.tickTimeCount = tickTimeCount;
        Memory.time.lastTickMillis = millis;
    }
    return 'Done';
}
function visualRCProgress(controllerID) {
    let lvlColor;
    if (typeof controllerID === 'string')
        controllerID = Game.getObjectById(controllerID);
    switch (controllerID.level) {
        case 1:
            lvlColor = '#00a000';
            break;
        case 2:
            lvlColor = '#40ff00';
            break;
        case 3:
            lvlColor = '#22dddd';
            break;
        case 4:
            lvlColor = '#00ffaa';
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
    let cont = controllerID;
    if (Memory.miscData.rooms[cont.room.name] === undefined)
        Memory.miscData.rooms[cont.room.name] = {};
    if (Memory.miscData.rooms[cont.room.name].controllerPPTArray === undefined)
        Memory.miscData.rooms[cont.room.name].controllerPPTArray = [];
    if (Memory.miscData.rooms[cont.room.name].controllerProgress === undefined)
        Memory.miscData.rooms[cont.room.name].controllerProgress = 0;
    if (Memory.miscData.rooms[cont.room.name].controllerPPTArray.length > 20) {
        const array = Memory.miscData.rooms[cont.room.name].controllerPPTArray;
        let sum = array.reduce(add, 0);
        let arrayLen = array.length;
        function add(accumulator, a) { return accumulator + a; }
        const avg = parseInt((sum / arrayLen).toFixed(2));
        Memory.miscData.rooms[cont.room.name].controllerPPTArray = [];
        Memory.miscData.rooms[cont.room.name].controllerPPTArray.push(avg);
    }
    const progress = cont.progress;
    let progressLastTick;
    if (Memory.miscData.rooms[cont.room.name].controllerProgress !== 0)
        progressLastTick = progress - Memory.miscData.rooms[cont.room.name].controllerProgress;
    else
        progressLastTick = 0;
    if (!(progressLastTick == 0 && Memory.miscData.rooms[cont.room.name].controllerPPTArray.length == 0))
        Memory.miscData.rooms[cont.room.name].controllerPPTArray.push(progressLastTick);
    Memory.miscData.rooms[cont.room.name].controllerProgress = progress;
    let sum = Memory.miscData.rooms[cont.room.name].controllerPPTArray.reduce(add, 0);
    let arrayLen = Memory.miscData.rooms[cont.room.name].controllerPPTArray.length;
    function add(accumulator, a) { return accumulator + a; }
    const avgProgressPerTick = parseInt((sum / arrayLen).toFixed(2));
    const progressRemaining = cont.progressTotal - cont.progress;
    const ticksRemaining = parseInt((progressRemaining / avgProgressPerTick).toFixed(0));
    const currentTickDuration = Memory.time.lastTickTime.toFixed(2);
    const secondsRemaining = ticksRemaining * currentTickDuration;
    let days = Math.floor(secondsRemaining / (3600 * 24));
    let hours = Math.floor(secondsRemaining % (3600 * 24) / 3600);
    let minutes = Math.floor(secondsRemaining % 3600 / 60);
    let seconds = Math.floor(secondsRemaining % 60);
    const alignment = cont.room.memory.settings.visualSettings.progressInfo.alignment;
    const fontSize = cont.room.memory.settings.visualSettings.progressInfo.fontSize;
    const stroke = cont.room.memory.settings.visualSettings.progressInfo.stroke;
    const xOffset = cont.room.memory.settings.visualSettings.progressInfo.xOffset;
    const yOffsetFactor = cont.room.memory.settings.visualSettings.progressInfo.yOffsetFactor;
    cont.room.visual.text(('L' + cont.level + ' - ' + ((cont.progress / cont.progressTotal) * 100).toFixed(2)) + '%', cont.pos.x + xOffset, cont.pos.y - (yOffsetFactor * 2), { align: alignment, opacity: 0.8, color: lvlColor, font: fontSize, stroke: stroke });
    cont.room.visual.text((cont.progress + '/' + cont.progressTotal) + ' - Avg: +' + avgProgressPerTick, cont.pos.x + xOffset, cont.pos.y - yOffsetFactor, { align: alignment, opacity: 0.8, color: lvlColor, font: fontSize - .1, stroke: stroke });
    cont.room.visual.text(days + 'd ' + hours + 'h ' + minutes + 'm ' + seconds + 's (' + ticksRemaining + ' ticks)', cont.pos.x + xOffset, cont.pos.y, { align: alignment, opacity: 0.8, color: lvlColor, font: fontSize - .1, stroke: stroke });
}
Object.assign(exports, {
    POLYBLUEDOTTED3: {
        stroke: '#0000ff',
        strokeWidth: 0.1,
        lineStyle: 'dashed'
    }
});
function createRoomFlag(room) {
    let flagX;
    let flagY;
    if (Game.rooms[room] !== undefined && Game.rooms[room].controller !== undefined) {
        flagX = Game.rooms[room].controller.pos.x;
        flagY = Game.rooms[room].controller.pos.y;
    }
    else {
        flagX = 25;
        flagY = 25;
    }
    const flag = Game.rooms[room].createFlag(flagX, flagY, Game.rooms[room].name, randomColor(), randomColor());
    switch (flag) {
        default:
            console.log('Flag succesfully created.');
            return flag;
        case ERR_NAME_EXISTS:
            console.log('Error: Name exists.');
            return null;
        case ERR_INVALID_ARGS:
            console.log('Error: The location or the name is incorrect.');
            return null;
    }
}
function randomInt(min = 1, max = 100) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}
function randomColor() {
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
function validateRoomName(roomName) {
    let pattern = /^[EW]([1-9]|[1-5]\d|60)[NS]([1-9]|[1-5]\d|60)$/;
    return pattern.test(roomName);
}
function validateFlagName(input) {
    const gameFlags = Object.keys(Game.flags);
    const numFlags = gameFlags.length;
    let noMatch = false;
    if (input instanceof Array) {
        for (let i = 0; i < input.length; i++) {
            let matched = validateFlagName(input[i]);
            if (matched)
                continue;
            else {
                console.log('Provided flag name of \'' + input[i] + '\' at index ' + i + ' is not an existent flag.');
                return false;
            }
        }
    }
    else if (typeof input === 'string') {
        for (let i = 0; i <= numFlags; i++) {
            if (input == gameFlags[i])
                return true;
            else {
                noMatch = true;
                continue;
            }
        }
        if (noMatch)
            return false;
    }
    else {
        console.log('Input parameter to validate must be an array of flag names, or a single flag name.');
        return null;
    }
}
function calcPath(startPos, endPos) {
    let goal = { pos: endPos, range: 1 };
    let ret = PathFinder.search(startPos, goal, {
        plainCost: 2,
        swampCost: 10,
        roomCallback: function (roomName) {
            let room = Game.rooms[roomName];
            if (!room)
                return;
            let costs = new PathFinder.CostMatrix;
            room.find(FIND_STRUCTURES).forEach(function (struct) {
                if (struct.structureType === STRUCTURE_ROAD) {
                    costs.set(struct.pos.x, struct.pos.y, 1);
                }
                else if (struct.structureType !== STRUCTURE_CONTAINER &&
                    (struct.structureType !== STRUCTURE_RAMPART ||
                        !struct.my)) {
                    costs.set(struct.pos.x, struct.pos.y, 255);
                }
            });
            return costs;
        }
    });
    const returnObj = {
        path: ret.path,
        length: ret.path.length
    };
    return returnObj;
}

var sourceMapGenerator = {};

var base64Vlq = {};

var base64$1 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var intToCharMap = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'.split('');

/**
 * Encode an integer in the range of 0 to 63 to a single base 64 digit.
 */
base64$1.encode = function (number) {
  if (0 <= number && number < intToCharMap.length) {
    return intToCharMap[number];
  }
  throw new TypeError("Must be between 0 and 63: " + number);
};

/**
 * Decode a single base 64 character code digit to an integer. Returns -1 on
 * failure.
 */
base64$1.decode = function (charCode) {
  var bigA = 65;     // 'A'
  var bigZ = 90;     // 'Z'

  var littleA = 97;  // 'a'
  var littleZ = 122; // 'z'

  var zero = 48;     // '0'
  var nine = 57;     // '9'

  var plus = 43;     // '+'
  var slash = 47;    // '/'

  var littleOffset = 26;
  var numberOffset = 52;

  // 0 - 25: ABCDEFGHIJKLMNOPQRSTUVWXYZ
  if (bigA <= charCode && charCode <= bigZ) {
    return (charCode - bigA);
  }

  // 26 - 51: abcdefghijklmnopqrstuvwxyz
  if (littleA <= charCode && charCode <= littleZ) {
    return (charCode - littleA + littleOffset);
  }

  // 52 - 61: 0123456789
  if (zero <= charCode && charCode <= nine) {
    return (charCode - zero + numberOffset);
  }

  // 62: +
  if (charCode == plus) {
    return 62;
  }

  // 63: /
  if (charCode == slash) {
    return 63;
  }

  // Invalid base64 digit.
  return -1;
};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 *
 * Based on the Base 64 VLQ implementation in Closure Compiler:
 * https://code.google.com/p/closure-compiler/source/browse/trunk/src/com/google/debugging/sourcemap/Base64VLQ.java
 *
 * Copyright 2011 The Closure Compiler Authors. All rights reserved.
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *  * Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 *  * Redistributions in binary form must reproduce the above
 *    copyright notice, this list of conditions and the following
 *    disclaimer in the documentation and/or other materials provided
 *    with the distribution.
 *  * Neither the name of Google Inc. nor the names of its
 *    contributors may be used to endorse or promote products derived
 *    from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

var base64 = base64$1;

// A single base 64 digit can contain 6 bits of data. For the base 64 variable
// length quantities we use in the source map spec, the first bit is the sign,
// the next four bits are the actual value, and the 6th bit is the
// continuation bit. The continuation bit tells us whether there are more
// digits in this value following this digit.
//
//   Continuation
//   |    Sign
//   |    |
//   V    V
//   101011

var VLQ_BASE_SHIFT = 5;

// binary: 100000
var VLQ_BASE = 1 << VLQ_BASE_SHIFT;

// binary: 011111
var VLQ_BASE_MASK = VLQ_BASE - 1;

// binary: 100000
var VLQ_CONTINUATION_BIT = VLQ_BASE;

/**
 * Converts from a two-complement value to a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   1 becomes 2 (10 binary), -1 becomes 3 (11 binary)
 *   2 becomes 4 (100 binary), -2 becomes 5 (101 binary)
 */
function toVLQSigned(aValue) {
  return aValue < 0
    ? ((-aValue) << 1) + 1
    : (aValue << 1) + 0;
}

/**
 * Converts to a two-complement value from a value where the sign bit is
 * placed in the least significant bit.  For example, as decimals:
 *   2 (10 binary) becomes 1, 3 (11 binary) becomes -1
 *   4 (100 binary) becomes 2, 5 (101 binary) becomes -2
 */
function fromVLQSigned(aValue) {
  var isNegative = (aValue & 1) === 1;
  var shifted = aValue >> 1;
  return isNegative
    ? -shifted
    : shifted;
}

/**
 * Returns the base 64 VLQ encoded value.
 */
base64Vlq.encode = function base64VLQ_encode(aValue) {
  var encoded = "";
  var digit;

  var vlq = toVLQSigned(aValue);

  do {
    digit = vlq & VLQ_BASE_MASK;
    vlq >>>= VLQ_BASE_SHIFT;
    if (vlq > 0) {
      // There are still more digits in this value, so we must make sure the
      // continuation bit is marked.
      digit |= VLQ_CONTINUATION_BIT;
    }
    encoded += base64.encode(digit);
  } while (vlq > 0);

  return encoded;
};

/**
 * Decodes the next base 64 VLQ value from the given string and returns the
 * value and the rest of the string via the out parameter.
 */
base64Vlq.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
  var strLen = aStr.length;
  var result = 0;
  var shift = 0;
  var continuation, digit;

  do {
    if (aIndex >= strLen) {
      throw new Error("Expected more digits in base 64 VLQ value.");
    }

    digit = base64.decode(aStr.charCodeAt(aIndex++));
    if (digit === -1) {
      throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
    }

    continuation = !!(digit & VLQ_CONTINUATION_BIT);
    digit &= VLQ_BASE_MASK;
    result = result + (digit << shift);
    shift += VLQ_BASE_SHIFT;
  } while (continuation);

  aOutParam.value = fromVLQSigned(result);
  aOutParam.rest = aIndex;
};

var util$5 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

(function (exports) {
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is a helper function for getting values from parameter/options
 * objects.
 *
 * @param args The object we are extracting values from
 * @param name The name of the property we are getting.
 * @param defaultValue An optional value to return if the property is missing
 * from the object. If this is not specified and the property is missing, an
 * error will be thrown.
 */
function getArg(aArgs, aName, aDefaultValue) {
  if (aName in aArgs) {
    return aArgs[aName];
  } else if (arguments.length === 3) {
    return aDefaultValue;
  } else {
    throw new Error('"' + aName + '" is a required argument.');
  }
}
exports.getArg = getArg;

var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
var dataUrlRegexp = /^data:.+\,.+$/;

function urlParse(aUrl) {
  var match = aUrl.match(urlRegexp);
  if (!match) {
    return null;
  }
  return {
    scheme: match[1],
    auth: match[2],
    host: match[3],
    port: match[4],
    path: match[5]
  };
}
exports.urlParse = urlParse;

function urlGenerate(aParsedUrl) {
  var url = '';
  if (aParsedUrl.scheme) {
    url += aParsedUrl.scheme + ':';
  }
  url += '//';
  if (aParsedUrl.auth) {
    url += aParsedUrl.auth + '@';
  }
  if (aParsedUrl.host) {
    url += aParsedUrl.host;
  }
  if (aParsedUrl.port) {
    url += ":" + aParsedUrl.port;
  }
  if (aParsedUrl.path) {
    url += aParsedUrl.path;
  }
  return url;
}
exports.urlGenerate = urlGenerate;

/**
 * Normalizes a path, or the path portion of a URL:
 *
 * - Replaces consecutive slashes with one slash.
 * - Removes unnecessary '.' parts.
 * - Removes unnecessary '<dir>/..' parts.
 *
 * Based on code in the Node.js 'path' core module.
 *
 * @param aPath The path or url to normalize.
 */
function normalize(aPath) {
  var path = aPath;
  var url = urlParse(aPath);
  if (url) {
    if (!url.path) {
      return aPath;
    }
    path = url.path;
  }
  var isAbsolute = exports.isAbsolute(path);

  var parts = path.split(/\/+/);
  for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
    part = parts[i];
    if (part === '.') {
      parts.splice(i, 1);
    } else if (part === '..') {
      up++;
    } else if (up > 0) {
      if (part === '') {
        // The first part is blank if the path is absolute. Trying to go
        // above the root is a no-op. Therefore we can remove all '..' parts
        // directly after the root.
        parts.splice(i + 1, up);
        up = 0;
      } else {
        parts.splice(i, 2);
        up--;
      }
    }
  }
  path = parts.join('/');

  if (path === '') {
    path = isAbsolute ? '/' : '.';
  }

  if (url) {
    url.path = path;
    return urlGenerate(url);
  }
  return path;
}
exports.normalize = normalize;

/**
 * Joins two paths/URLs.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be joined with the root.
 *
 * - If aPath is a URL or a data URI, aPath is returned, unless aPath is a
 *   scheme-relative URL: Then the scheme of aRoot, if any, is prepended
 *   first.
 * - Otherwise aPath is a path. If aRoot is a URL, then its path portion
 *   is updated with the result and aRoot is returned. Otherwise the result
 *   is returned.
 *   - If aPath is absolute, the result is aPath.
 *   - Otherwise the two paths are joined with a slash.
 * - Joining for example 'http://' and 'www.example.com' is also supported.
 */
function join(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }
  if (aPath === "") {
    aPath = ".";
  }
  var aPathUrl = urlParse(aPath);
  var aRootUrl = urlParse(aRoot);
  if (aRootUrl) {
    aRoot = aRootUrl.path || '/';
  }

  // `join(foo, '//www.example.org')`
  if (aPathUrl && !aPathUrl.scheme) {
    if (aRootUrl) {
      aPathUrl.scheme = aRootUrl.scheme;
    }
    return urlGenerate(aPathUrl);
  }

  if (aPathUrl || aPath.match(dataUrlRegexp)) {
    return aPath;
  }

  // `join('http://', 'www.example.com')`
  if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
    aRootUrl.host = aPath;
    return urlGenerate(aRootUrl);
  }

  var joined = aPath.charAt(0) === '/'
    ? aPath
    : normalize(aRoot.replace(/\/+$/, '') + '/' + aPath);

  if (aRootUrl) {
    aRootUrl.path = joined;
    return urlGenerate(aRootUrl);
  }
  return joined;
}
exports.join = join;

exports.isAbsolute = function (aPath) {
  return aPath.charAt(0) === '/' || urlRegexp.test(aPath);
};

/**
 * Make a path relative to a URL or another path.
 *
 * @param aRoot The root path or URL.
 * @param aPath The path or URL to be made relative to aRoot.
 */
function relative(aRoot, aPath) {
  if (aRoot === "") {
    aRoot = ".";
  }

  aRoot = aRoot.replace(/\/$/, '');

  // It is possible for the path to be above the root. In this case, simply
  // checking whether the root is a prefix of the path won't work. Instead, we
  // need to remove components from the root one by one, until either we find
  // a prefix that fits, or we run out of components to remove.
  var level = 0;
  while (aPath.indexOf(aRoot + '/') !== 0) {
    var index = aRoot.lastIndexOf("/");
    if (index < 0) {
      return aPath;
    }

    // If the only part of the root that is left is the scheme (i.e. http://,
    // file:///, etc.), one or more slashes (/), or simply nothing at all, we
    // have exhausted all components, so the path is not relative to the root.
    aRoot = aRoot.slice(0, index);
    if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
      return aPath;
    }

    ++level;
  }

  // Make sure we add a "../" for each component we removed from the root.
  return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
}
exports.relative = relative;

var supportsNullProto = (function () {
  var obj = Object.create(null);
  return !('__proto__' in obj);
}());

function identity (s) {
  return s;
}

/**
 * Because behavior goes wacky when you set `__proto__` on objects, we
 * have to prefix all the strings in our set with an arbitrary character.
 *
 * See https://github.com/mozilla/source-map/pull/31 and
 * https://github.com/mozilla/source-map/issues/30
 *
 * @param String aStr
 */
function toSetString(aStr) {
  if (isProtoString(aStr)) {
    return '$' + aStr;
  }

  return aStr;
}
exports.toSetString = supportsNullProto ? identity : toSetString;

function fromSetString(aStr) {
  if (isProtoString(aStr)) {
    return aStr.slice(1);
  }

  return aStr;
}
exports.fromSetString = supportsNullProto ? identity : fromSetString;

function isProtoString(s) {
  if (!s) {
    return false;
  }

  var length = s.length;

  if (length < 9 /* "__proto__".length */) {
    return false;
  }

  if (s.charCodeAt(length - 1) !== 95  /* '_' */ ||
      s.charCodeAt(length - 2) !== 95  /* '_' */ ||
      s.charCodeAt(length - 3) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 4) !== 116 /* 't' */ ||
      s.charCodeAt(length - 5) !== 111 /* 'o' */ ||
      s.charCodeAt(length - 6) !== 114 /* 'r' */ ||
      s.charCodeAt(length - 7) !== 112 /* 'p' */ ||
      s.charCodeAt(length - 8) !== 95  /* '_' */ ||
      s.charCodeAt(length - 9) !== 95  /* '_' */) {
    return false;
  }

  for (var i = length - 10; i >= 0; i--) {
    if (s.charCodeAt(i) !== 36 /* '$' */) {
      return false;
    }
  }

  return true;
}

/**
 * Comparator between two mappings where the original positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same original source/line/column, but different generated
 * line and column the same. Useful when searching for a mapping with a
 * stubbed out mapping.
 */
function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
  var cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0 || onlyCompareOriginal) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByOriginalPositions = compareByOriginalPositions;

/**
 * Comparator between two mappings with deflated source and name indices where
 * the generated positions are compared.
 *
 * Optionally pass in `true` as `onlyCompareGenerated` to consider two
 * mappings with the same generated line and column, but different
 * source/name/original line and column the same. Useful when searching for a
 * mapping with a stubbed out mapping.
 */
function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0 || onlyCompareGenerated) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;

function strcmp(aStr1, aStr2) {
  if (aStr1 === aStr2) {
    return 0;
  }

  if (aStr1 === null) {
    return 1; // aStr2 !== null
  }

  if (aStr2 === null) {
    return -1; // aStr1 !== null
  }

  if (aStr1 > aStr2) {
    return 1;
  }

  return -1;
}

/**
 * Comparator between two mappings with inflated source and name strings where
 * the generated positions are compared.
 */
function compareByGeneratedPositionsInflated(mappingA, mappingB) {
  var cmp = mappingA.generatedLine - mappingB.generatedLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.generatedColumn - mappingB.generatedColumn;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = strcmp(mappingA.source, mappingB.source);
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalLine - mappingB.originalLine;
  if (cmp !== 0) {
    return cmp;
  }

  cmp = mappingA.originalColumn - mappingB.originalColumn;
  if (cmp !== 0) {
    return cmp;
  }

  return strcmp(mappingA.name, mappingB.name);
}
exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;

/**
 * Strip any JSON XSSI avoidance prefix from the string (as documented
 * in the source maps specification), and then parse the string as
 * JSON.
 */
function parseSourceMapInput(str) {
  return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ''));
}
exports.parseSourceMapInput = parseSourceMapInput;

/**
 * Compute the URL of a source given the the source root, the source's
 * URL, and the source map's URL.
 */
function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
  sourceURL = sourceURL || '';

  if (sourceRoot) {
    // This follows what Chrome does.
    if (sourceRoot[sourceRoot.length - 1] !== '/' && sourceURL[0] !== '/') {
      sourceRoot += '/';
    }
    // The spec says:
    //   Line 4: An optional source root, useful for relocating source
    //   files on a server or removing repeated values in the
    //   “sources” entry.  This value is prepended to the individual
    //   entries in the “source” field.
    sourceURL = sourceRoot + sourceURL;
  }

  // Historically, SourceMapConsumer did not take the sourceMapURL as
  // a parameter.  This mode is still somewhat supported, which is why
  // this code block is conditional.  However, it's preferable to pass
  // the source map URL to SourceMapConsumer, so that this function
  // can implement the source URL resolution algorithm as outlined in
  // the spec.  This block is basically the equivalent of:
  //    new URL(sourceURL, sourceMapURL).toString()
  // ... except it avoids using URL, which wasn't available in the
  // older releases of node still supported by this library.
  //
  // The spec says:
  //   If the sources are not absolute URLs after prepending of the
  //   “sourceRoot”, the sources are resolved relative to the
  //   SourceMap (like resolving script src in a html document).
  if (sourceMapURL) {
    var parsed = urlParse(sourceMapURL);
    if (!parsed) {
      throw new Error("sourceMapURL could not be parsed");
    }
    if (parsed.path) {
      // Strip the last path component, but keep the "/".
      var index = parsed.path.lastIndexOf('/');
      if (index >= 0) {
        parsed.path = parsed.path.substring(0, index + 1);
      }
    }
    sourceURL = join(urlGenerate(parsed), sourceURL);
  }

  return normalize(sourceURL);
}
exports.computeSourceURL = computeSourceURL;
}(util$5));

var arraySet = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util$4 = util$5;
var has = Object.prototype.hasOwnProperty;
var hasNativeMap = typeof Map !== "undefined";

/**
 * A data structure which is a combination of an array and a set. Adding a new
 * member is O(1), testing for membership is O(1), and finding the index of an
 * element is O(1). Removing elements from the set is not supported. Only
 * strings are supported for membership.
 */
function ArraySet$2() {
  this._array = [];
  this._set = hasNativeMap ? new Map() : Object.create(null);
}

/**
 * Static method for creating ArraySet instances from an existing array.
 */
ArraySet$2.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
  var set = new ArraySet$2();
  for (var i = 0, len = aArray.length; i < len; i++) {
    set.add(aArray[i], aAllowDuplicates);
  }
  return set;
};

/**
 * Return how many unique items are in this ArraySet. If duplicates have been
 * added, than those do not count towards the size.
 *
 * @returns Number
 */
ArraySet$2.prototype.size = function ArraySet_size() {
  return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
};

/**
 * Add the given string to this set.
 *
 * @param String aStr
 */
ArraySet$2.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
  var sStr = hasNativeMap ? aStr : util$4.toSetString(aStr);
  var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
  var idx = this._array.length;
  if (!isDuplicate || aAllowDuplicates) {
    this._array.push(aStr);
  }
  if (!isDuplicate) {
    if (hasNativeMap) {
      this._set.set(aStr, idx);
    } else {
      this._set[sStr] = idx;
    }
  }
};

/**
 * Is the given string a member of this set?
 *
 * @param String aStr
 */
ArraySet$2.prototype.has = function ArraySet_has(aStr) {
  if (hasNativeMap) {
    return this._set.has(aStr);
  } else {
    var sStr = util$4.toSetString(aStr);
    return has.call(this._set, sStr);
  }
};

/**
 * What is the index of the given string in the array?
 *
 * @param String aStr
 */
ArraySet$2.prototype.indexOf = function ArraySet_indexOf(aStr) {
  if (hasNativeMap) {
    var idx = this._set.get(aStr);
    if (idx >= 0) {
        return idx;
    }
  } else {
    var sStr = util$4.toSetString(aStr);
    if (has.call(this._set, sStr)) {
      return this._set[sStr];
    }
  }

  throw new Error('"' + aStr + '" is not in the set.');
};

/**
 * What is the element at the given index?
 *
 * @param Number aIdx
 */
ArraySet$2.prototype.at = function ArraySet_at(aIdx) {
  if (aIdx >= 0 && aIdx < this._array.length) {
    return this._array[aIdx];
  }
  throw new Error('No element indexed by ' + aIdx);
};

/**
 * Returns the array representation of this set (which has the proper indices
 * indicated by indexOf). Note that this is a copy of the internal array used
 * for storing the members so that no one can mess with internal state.
 */
ArraySet$2.prototype.toArray = function ArraySet_toArray() {
  return this._array.slice();
};

arraySet.ArraySet = ArraySet$2;

var mappingList = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2014 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util$3 = util$5;

/**
 * Determine whether mappingB is after mappingA with respect to generated
 * position.
 */
function generatedPositionAfter(mappingA, mappingB) {
  // Optimized for most common case
  var lineA = mappingA.generatedLine;
  var lineB = mappingB.generatedLine;
  var columnA = mappingA.generatedColumn;
  var columnB = mappingB.generatedColumn;
  return lineB > lineA || lineB == lineA && columnB >= columnA ||
         util$3.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
}

/**
 * A data structure to provide a sorted view of accumulated mappings in a
 * performance conscious manner. It trades a neglibable overhead in general
 * case for a large speedup in case of mappings being added in order.
 */
function MappingList$1() {
  this._array = [];
  this._sorted = true;
  // Serves as infimum
  this._last = {generatedLine: -1, generatedColumn: 0};
}

/**
 * Iterate through internal items. This method takes the same arguments that
 * `Array.prototype.forEach` takes.
 *
 * NOTE: The order of the mappings is NOT guaranteed.
 */
MappingList$1.prototype.unsortedForEach =
  function MappingList_forEach(aCallback, aThisArg) {
    this._array.forEach(aCallback, aThisArg);
  };

/**
 * Add the given source mapping.
 *
 * @param Object aMapping
 */
MappingList$1.prototype.add = function MappingList_add(aMapping) {
  if (generatedPositionAfter(this._last, aMapping)) {
    this._last = aMapping;
    this._array.push(aMapping);
  } else {
    this._sorted = false;
    this._array.push(aMapping);
  }
};

/**
 * Returns the flat, sorted array of mappings. The mappings are sorted by
 * generated position.
 *
 * WARNING: This method returns internal data without copying, for
 * performance. The return value must NOT be mutated, and should be treated as
 * an immutable borrow. If you want to take ownership, you must make your own
 * copy.
 */
MappingList$1.prototype.toArray = function MappingList_toArray() {
  if (!this._sorted) {
    this._array.sort(util$3.compareByGeneratedPositionsInflated);
    this._sorted = true;
  }
  return this._array;
};

mappingList.MappingList = MappingList$1;

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var base64VLQ$1 = base64Vlq;
var util$2 = util$5;
var ArraySet$1 = arraySet.ArraySet;
var MappingList = mappingList.MappingList;

/**
 * An instance of the SourceMapGenerator represents a source map which is
 * being built incrementally. You may pass an object with the following
 * properties:
 *
 *   - file: The filename of the generated source.
 *   - sourceRoot: A root for all relative URLs in this source map.
 */
function SourceMapGenerator$1(aArgs) {
  if (!aArgs) {
    aArgs = {};
  }
  this._file = util$2.getArg(aArgs, 'file', null);
  this._sourceRoot = util$2.getArg(aArgs, 'sourceRoot', null);
  this._skipValidation = util$2.getArg(aArgs, 'skipValidation', false);
  this._sources = new ArraySet$1();
  this._names = new ArraySet$1();
  this._mappings = new MappingList();
  this._sourcesContents = null;
}

SourceMapGenerator$1.prototype._version = 3;

/**
 * Creates a new SourceMapGenerator based on a SourceMapConsumer
 *
 * @param aSourceMapConsumer The SourceMap.
 */
SourceMapGenerator$1.fromSourceMap =
  function SourceMapGenerator_fromSourceMap(aSourceMapConsumer) {
    var sourceRoot = aSourceMapConsumer.sourceRoot;
    var generator = new SourceMapGenerator$1({
      file: aSourceMapConsumer.file,
      sourceRoot: sourceRoot
    });
    aSourceMapConsumer.eachMapping(function (mapping) {
      var newMapping = {
        generated: {
          line: mapping.generatedLine,
          column: mapping.generatedColumn
        }
      };

      if (mapping.source != null) {
        newMapping.source = mapping.source;
        if (sourceRoot != null) {
          newMapping.source = util$2.relative(sourceRoot, newMapping.source);
        }

        newMapping.original = {
          line: mapping.originalLine,
          column: mapping.originalColumn
        };

        if (mapping.name != null) {
          newMapping.name = mapping.name;
        }
      }

      generator.addMapping(newMapping);
    });
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var sourceRelative = sourceFile;
      if (sourceRoot !== null) {
        sourceRelative = util$2.relative(sourceRoot, sourceFile);
      }

      if (!generator._sources.has(sourceRelative)) {
        generator._sources.add(sourceRelative);
      }

      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        generator.setSourceContent(sourceFile, content);
      }
    });
    return generator;
  };

/**
 * Add a single mapping from original source line and column to the generated
 * source's line and column for this source map being created. The mapping
 * object should have the following properties:
 *
 *   - generated: An object with the generated line and column positions.
 *   - original: An object with the original line and column positions.
 *   - source: The original source file (relative to the sourceRoot).
 *   - name: An optional original token name for this mapping.
 */
SourceMapGenerator$1.prototype.addMapping =
  function SourceMapGenerator_addMapping(aArgs) {
    var generated = util$2.getArg(aArgs, 'generated');
    var original = util$2.getArg(aArgs, 'original', null);
    var source = util$2.getArg(aArgs, 'source', null);
    var name = util$2.getArg(aArgs, 'name', null);

    if (!this._skipValidation) {
      this._validateMapping(generated, original, source, name);
    }

    if (source != null) {
      source = String(source);
      if (!this._sources.has(source)) {
        this._sources.add(source);
      }
    }

    if (name != null) {
      name = String(name);
      if (!this._names.has(name)) {
        this._names.add(name);
      }
    }

    this._mappings.add({
      generatedLine: generated.line,
      generatedColumn: generated.column,
      originalLine: original != null && original.line,
      originalColumn: original != null && original.column,
      source: source,
      name: name
    });
  };

/**
 * Set the source content for a source file.
 */
SourceMapGenerator$1.prototype.setSourceContent =
  function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
    var source = aSourceFile;
    if (this._sourceRoot != null) {
      source = util$2.relative(this._sourceRoot, source);
    }

    if (aSourceContent != null) {
      // Add the source content to the _sourcesContents map.
      // Create a new _sourcesContents map if the property is null.
      if (!this._sourcesContents) {
        this._sourcesContents = Object.create(null);
      }
      this._sourcesContents[util$2.toSetString(source)] = aSourceContent;
    } else if (this._sourcesContents) {
      // Remove the source file from the _sourcesContents map.
      // If the _sourcesContents map is empty, set the property to null.
      delete this._sourcesContents[util$2.toSetString(source)];
      if (Object.keys(this._sourcesContents).length === 0) {
        this._sourcesContents = null;
      }
    }
  };

/**
 * Applies the mappings of a sub-source-map for a specific source file to the
 * source map being generated. Each mapping to the supplied source file is
 * rewritten using the supplied source map. Note: The resolution for the
 * resulting mappings is the minimium of this map and the supplied map.
 *
 * @param aSourceMapConsumer The source map to be applied.
 * @param aSourceFile Optional. The filename of the source file.
 *        If omitted, SourceMapConsumer's file property will be used.
 * @param aSourceMapPath Optional. The dirname of the path to the source map
 *        to be applied. If relative, it is relative to the SourceMapConsumer.
 *        This parameter is needed when the two source maps aren't in the same
 *        directory, and the source map to be applied contains relative source
 *        paths. If so, those relative source paths need to be rewritten
 *        relative to the SourceMapGenerator.
 */
SourceMapGenerator$1.prototype.applySourceMap =
  function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
    var sourceFile = aSourceFile;
    // If aSourceFile is omitted, we will use the file property of the SourceMap
    if (aSourceFile == null) {
      if (aSourceMapConsumer.file == null) {
        throw new Error(
          'SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, ' +
          'or the source map\'s "file" property. Both were omitted.'
        );
      }
      sourceFile = aSourceMapConsumer.file;
    }
    var sourceRoot = this._sourceRoot;
    // Make "sourceFile" relative if an absolute Url is passed.
    if (sourceRoot != null) {
      sourceFile = util$2.relative(sourceRoot, sourceFile);
    }
    // Applying the SourceMap can add and remove items from the sources and
    // the names array.
    var newSources = new ArraySet$1();
    var newNames = new ArraySet$1();

    // Find mappings for the "sourceFile"
    this._mappings.unsortedForEach(function (mapping) {
      if (mapping.source === sourceFile && mapping.originalLine != null) {
        // Check if it can be mapped by the source map, then update the mapping.
        var original = aSourceMapConsumer.originalPositionFor({
          line: mapping.originalLine,
          column: mapping.originalColumn
        });
        if (original.source != null) {
          // Copy mapping
          mapping.source = original.source;
          if (aSourceMapPath != null) {
            mapping.source = util$2.join(aSourceMapPath, mapping.source);
          }
          if (sourceRoot != null) {
            mapping.source = util$2.relative(sourceRoot, mapping.source);
          }
          mapping.originalLine = original.line;
          mapping.originalColumn = original.column;
          if (original.name != null) {
            mapping.name = original.name;
          }
        }
      }

      var source = mapping.source;
      if (source != null && !newSources.has(source)) {
        newSources.add(source);
      }

      var name = mapping.name;
      if (name != null && !newNames.has(name)) {
        newNames.add(name);
      }

    }, this);
    this._sources = newSources;
    this._names = newNames;

    // Copy sourcesContents of applied map.
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aSourceMapPath != null) {
          sourceFile = util$2.join(aSourceMapPath, sourceFile);
        }
        if (sourceRoot != null) {
          sourceFile = util$2.relative(sourceRoot, sourceFile);
        }
        this.setSourceContent(sourceFile, content);
      }
    }, this);
  };

/**
 * A mapping can have one of the three levels of data:
 *
 *   1. Just the generated position.
 *   2. The Generated position, original position, and original source.
 *   3. Generated and original position, original source, as well as a name
 *      token.
 *
 * To maintain consistency, we validate that any new mapping being added falls
 * in to one of these categories.
 */
SourceMapGenerator$1.prototype._validateMapping =
  function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource,
                                              aName) {
    // When aOriginal is truthy but has empty values for .line and .column,
    // it is most likely a programmer error. In this case we throw a very
    // specific error message to try to guide them the right way.
    // For example: https://github.com/Polymer/polymer-bundler/pull/519
    if (aOriginal && typeof aOriginal.line !== 'number' && typeof aOriginal.column !== 'number') {
        throw new Error(
            'original.line and original.column are not numbers -- you probably meant to omit ' +
            'the original mapping entirely and only map the generated position. If so, pass ' +
            'null for the original mapping instead of an object with empty or null values.'
        );
    }

    if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
        && aGenerated.line > 0 && aGenerated.column >= 0
        && !aOriginal && !aSource && !aName) {
      // Case 1.
      return;
    }
    else if (aGenerated && 'line' in aGenerated && 'column' in aGenerated
             && aOriginal && 'line' in aOriginal && 'column' in aOriginal
             && aGenerated.line > 0 && aGenerated.column >= 0
             && aOriginal.line > 0 && aOriginal.column >= 0
             && aSource) {
      // Cases 2 and 3.
      return;
    }
    else {
      throw new Error('Invalid mapping: ' + JSON.stringify({
        generated: aGenerated,
        source: aSource,
        original: aOriginal,
        name: aName
      }));
    }
  };

/**
 * Serialize the accumulated mappings in to the stream of base 64 VLQs
 * specified by the source map format.
 */
SourceMapGenerator$1.prototype._serializeMappings =
  function SourceMapGenerator_serializeMappings() {
    var previousGeneratedColumn = 0;
    var previousGeneratedLine = 1;
    var previousOriginalColumn = 0;
    var previousOriginalLine = 0;
    var previousName = 0;
    var previousSource = 0;
    var result = '';
    var next;
    var mapping;
    var nameIdx;
    var sourceIdx;

    var mappings = this._mappings.toArray();
    for (var i = 0, len = mappings.length; i < len; i++) {
      mapping = mappings[i];
      next = '';

      if (mapping.generatedLine !== previousGeneratedLine) {
        previousGeneratedColumn = 0;
        while (mapping.generatedLine !== previousGeneratedLine) {
          next += ';';
          previousGeneratedLine++;
        }
      }
      else {
        if (i > 0) {
          if (!util$2.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
            continue;
          }
          next += ',';
        }
      }

      next += base64VLQ$1.encode(mapping.generatedColumn
                                 - previousGeneratedColumn);
      previousGeneratedColumn = mapping.generatedColumn;

      if (mapping.source != null) {
        sourceIdx = this._sources.indexOf(mapping.source);
        next += base64VLQ$1.encode(sourceIdx - previousSource);
        previousSource = sourceIdx;

        // lines are stored 0-based in SourceMap spec version 3
        next += base64VLQ$1.encode(mapping.originalLine - 1
                                   - previousOriginalLine);
        previousOriginalLine = mapping.originalLine - 1;

        next += base64VLQ$1.encode(mapping.originalColumn
                                   - previousOriginalColumn);
        previousOriginalColumn = mapping.originalColumn;

        if (mapping.name != null) {
          nameIdx = this._names.indexOf(mapping.name);
          next += base64VLQ$1.encode(nameIdx - previousName);
          previousName = nameIdx;
        }
      }

      result += next;
    }

    return result;
  };

SourceMapGenerator$1.prototype._generateSourcesContent =
  function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
    return aSources.map(function (source) {
      if (!this._sourcesContents) {
        return null;
      }
      if (aSourceRoot != null) {
        source = util$2.relative(aSourceRoot, source);
      }
      var key = util$2.toSetString(source);
      return Object.prototype.hasOwnProperty.call(this._sourcesContents, key)
        ? this._sourcesContents[key]
        : null;
    }, this);
  };

/**
 * Externalize the source map.
 */
SourceMapGenerator$1.prototype.toJSON =
  function SourceMapGenerator_toJSON() {
    var map = {
      version: this._version,
      sources: this._sources.toArray(),
      names: this._names.toArray(),
      mappings: this._serializeMappings()
    };
    if (this._file != null) {
      map.file = this._file;
    }
    if (this._sourceRoot != null) {
      map.sourceRoot = this._sourceRoot;
    }
    if (this._sourcesContents) {
      map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
    }

    return map;
  };

/**
 * Render the source map being generated to a string.
 */
SourceMapGenerator$1.prototype.toString =
  function SourceMapGenerator_toString() {
    return JSON.stringify(this.toJSON());
  };

sourceMapGenerator.SourceMapGenerator = SourceMapGenerator$1;

var sourceMapConsumer = {};

var binarySearch$1 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

(function (exports) {
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

exports.GREATEST_LOWER_BOUND = 1;
exports.LEAST_UPPER_BOUND = 2;

/**
 * Recursive implementation of binary search.
 *
 * @param aLow Indices here and lower do not contain the needle.
 * @param aHigh Indices here and higher do not contain the needle.
 * @param aNeedle The element being searched for.
 * @param aHaystack The non-empty array being searched.
 * @param aCompare Function which takes two elements and returns -1, 0, or 1.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 */
function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
  // This function terminates when one of the following is true:
  //
  //   1. We find the exact element we are looking for.
  //
  //   2. We did not find the exact element, but we can return the index of
  //      the next-closest element.
  //
  //   3. We did not find the exact element, and there is no next-closest
  //      element than the one we are searching for, so we return -1.
  var mid = Math.floor((aHigh - aLow) / 2) + aLow;
  var cmp = aCompare(aNeedle, aHaystack[mid], true);
  if (cmp === 0) {
    // Found the element we are looking for.
    return mid;
  }
  else if (cmp > 0) {
    // Our needle is greater than aHaystack[mid].
    if (aHigh - mid > 1) {
      // The element is in the upper half.
      return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
    }

    // The exact needle element was not found in this haystack. Determine if
    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return aHigh < aHaystack.length ? aHigh : -1;
    } else {
      return mid;
    }
  }
  else {
    // Our needle is less than aHaystack[mid].
    if (mid - aLow > 1) {
      // The element is in the lower half.
      return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
    }

    // we are in termination case (3) or (2) and return the appropriate thing.
    if (aBias == exports.LEAST_UPPER_BOUND) {
      return mid;
    } else {
      return aLow < 0 ? -1 : aLow;
    }
  }
}

/**
 * This is an implementation of binary search which will always try and return
 * the index of the closest element if there is no exact hit. This is because
 * mappings between original and generated line/col pairs are single points,
 * and there is an implicit region between each of them, so a miss just means
 * that you aren't on the very start of a region.
 *
 * @param aNeedle The element you are looking for.
 * @param aHaystack The array that is being searched.
 * @param aCompare A function which takes the needle and an element in the
 *     array and returns -1, 0, or 1 depending on whether the needle is less
 *     than, equal to, or greater than the element, respectively.
 * @param aBias Either 'binarySearch.GREATEST_LOWER_BOUND' or
 *     'binarySearch.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'binarySearch.GREATEST_LOWER_BOUND'.
 */
exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
  if (aHaystack.length === 0) {
    return -1;
  }

  var index = recursiveSearch(-1, aHaystack.length, aNeedle, aHaystack,
                              aCompare, aBias || exports.GREATEST_LOWER_BOUND);
  if (index < 0) {
    return -1;
  }

  // We have found either the exact element, or the next-closest element than
  // the one we are searching for. However, there may be more than one such
  // element. Make sure we always return the smallest of these.
  while (index - 1 >= 0) {
    if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
      break;
    }
    --index;
  }

  return index;
};
}(binarySearch$1));

var quickSort$1 = {};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 * @param {Number} p
 *        Start index of the array
 * @param {Number} r
 *        End index of the array
 */
function doQuickSort(ary, comparator, p, r) {
  // If our lower bound is less than our upper bound, we (1) partition the
  // array into two pieces and (2) recurse on each half. If it is not, this is
  // the empty array and our base case.

  if (p < r) {
    // (1) Partitioning.
    //
    // The partitioning chooses a pivot between `p` and `r` and moves all
    // elements that are less than or equal to the pivot to the before it, and
    // all the elements that are greater than it after it. The effect is that
    // once partition is done, the pivot is in the exact place it will be when
    // the array is put in sorted order, and it will not need to be moved
    // again. This runs in O(n) time.

    // Always choose a random pivot so that an input array which is reverse
    // sorted does not cause O(n^2) running time.
    var pivotIndex = randomIntInRange(p, r);
    var i = p - 1;

    swap(ary, pivotIndex, r);
    var pivot = ary[r];

    // Immediately after `j` is incremented in this loop, the following hold
    // true:
    //
    //   * Every element in `ary[p .. i]` is less than or equal to the pivot.
    //
    //   * Every element in `ary[i+1 .. j-1]` is greater than the pivot.
    for (var j = p; j < r; j++) {
      if (comparator(ary[j], pivot) <= 0) {
        i += 1;
        swap(ary, i, j);
      }
    }

    swap(ary, i + 1, j);
    var q = i + 1;

    // (2) Recurse on each half.

    doQuickSort(ary, comparator, p, q - 1);
    doQuickSort(ary, comparator, q + 1, r);
  }
}

/**
 * Sort the given array in-place with the given comparator function.
 *
 * @param {Array} ary
 *        An array to sort.
 * @param {function} comparator
 *        Function to use to compare two items.
 */
quickSort$1.quickSort = function (ary, comparator) {
  doQuickSort(ary, comparator, 0, ary.length - 1);
};

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var util$1 = util$5;
var binarySearch = binarySearch$1;
var ArraySet = arraySet.ArraySet;
var base64VLQ = base64Vlq;
var quickSort = quickSort$1.quickSort;

function SourceMapConsumer$1(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util$1.parseSourceMapInput(aSourceMap);
  }

  return sourceMap.sections != null
    ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL)
    : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
}

SourceMapConsumer$1.fromSourceMap = function(aSourceMap, aSourceMapURL) {
  return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
};

/**
 * The version of the source mapping spec that we are consuming.
 */
SourceMapConsumer$1.prototype._version = 3;

// `__generatedMappings` and `__originalMappings` are arrays that hold the
// parsed mapping coordinates from the source map's "mappings" attribute. They
// are lazily instantiated, accessed via the `_generatedMappings` and
// `_originalMappings` getters respectively, and we only parse the mappings
// and create these arrays once queried for a source location. We jump through
// these hoops because there can be many thousands of mappings, and parsing
// them is expensive, so we only want to do it if we must.
//
// Each object in the arrays is of the form:
//
//     {
//       generatedLine: The line number in the generated code,
//       generatedColumn: The column number in the generated code,
//       source: The path to the original source file that generated this
//               chunk of code,
//       originalLine: The line number in the original source that
//                     corresponds to this chunk of generated code,
//       originalColumn: The column number in the original source that
//                       corresponds to this chunk of generated code,
//       name: The name of the original symbol which generated this chunk of
//             code.
//     }
//
// All properties except for `generatedLine` and `generatedColumn` can be
// `null`.
//
// `_generatedMappings` is ordered by the generated positions.
//
// `_originalMappings` is ordered by the original positions.

SourceMapConsumer$1.prototype.__generatedMappings = null;
Object.defineProperty(SourceMapConsumer$1.prototype, '_generatedMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__generatedMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__generatedMappings;
  }
});

SourceMapConsumer$1.prototype.__originalMappings = null;
Object.defineProperty(SourceMapConsumer$1.prototype, '_originalMappings', {
  configurable: true,
  enumerable: true,
  get: function () {
    if (!this.__originalMappings) {
      this._parseMappings(this._mappings, this.sourceRoot);
    }

    return this.__originalMappings;
  }
});

SourceMapConsumer$1.prototype._charIsMappingSeparator =
  function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
    var c = aStr.charAt(index);
    return c === ";" || c === ",";
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
SourceMapConsumer$1.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    throw new Error("Subclasses must implement _parseMappings");
  };

SourceMapConsumer$1.GENERATED_ORDER = 1;
SourceMapConsumer$1.ORIGINAL_ORDER = 2;

SourceMapConsumer$1.GREATEST_LOWER_BOUND = 1;
SourceMapConsumer$1.LEAST_UPPER_BOUND = 2;

/**
 * Iterate over each mapping between an original source/line/column and a
 * generated line/column in this source map.
 *
 * @param Function aCallback
 *        The function that is called with each mapping.
 * @param Object aContext
 *        Optional. If specified, this object will be the value of `this` every
 *        time that `aCallback` is called.
 * @param aOrder
 *        Either `SourceMapConsumer.GENERATED_ORDER` or
 *        `SourceMapConsumer.ORIGINAL_ORDER`. Specifies whether you want to
 *        iterate over the mappings sorted by the generated file's line/column
 *        order or the original's source/line/column order, respectively. Defaults to
 *        `SourceMapConsumer.GENERATED_ORDER`.
 */
SourceMapConsumer$1.prototype.eachMapping =
  function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
    var context = aContext || null;
    var order = aOrder || SourceMapConsumer$1.GENERATED_ORDER;

    var mappings;
    switch (order) {
    case SourceMapConsumer$1.GENERATED_ORDER:
      mappings = this._generatedMappings;
      break;
    case SourceMapConsumer$1.ORIGINAL_ORDER:
      mappings = this._originalMappings;
      break;
    default:
      throw new Error("Unknown order of iteration.");
    }

    var sourceRoot = this.sourceRoot;
    mappings.map(function (mapping) {
      var source = mapping.source === null ? null : this._sources.at(mapping.source);
      source = util$1.computeSourceURL(sourceRoot, source, this._sourceMapURL);
      return {
        source: source,
        generatedLine: mapping.generatedLine,
        generatedColumn: mapping.generatedColumn,
        originalLine: mapping.originalLine,
        originalColumn: mapping.originalColumn,
        name: mapping.name === null ? null : this._names.at(mapping.name)
      };
    }, this).forEach(aCallback, context);
  };

/**
 * Returns all generated line and column information for the original source,
 * line, and column provided. If no column is provided, returns all mappings
 * corresponding to a either the line we are searching for or the next
 * closest line that has any mappings. Otherwise, returns all mappings
 * corresponding to the given line and either the column we are searching for
 * or the next closest column that has any offsets.
 *
 * The only argument is an object with the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number is 1-based.
 *   - column: Optional. the column number in the original source.
 *    The column number is 0-based.
 *
 * and an array of objects is returned, each with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *    line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *    The column number is 0-based.
 */
SourceMapConsumer$1.prototype.allGeneratedPositionsFor =
  function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
    var line = util$1.getArg(aArgs, 'line');

    // When there is no exact match, BasicSourceMapConsumer.prototype._findMapping
    // returns the index of the closest mapping less than the needle. By
    // setting needle.originalColumn to 0, we thus find the last mapping for
    // the given line, provided such a mapping exists.
    var needle = {
      source: util$1.getArg(aArgs, 'source'),
      originalLine: line,
      originalColumn: util$1.getArg(aArgs, 'column', 0)
    };

    needle.source = this._findSourceIndex(needle.source);
    if (needle.source < 0) {
      return [];
    }

    var mappings = [];

    var index = this._findMapping(needle,
                                  this._originalMappings,
                                  "originalLine",
                                  "originalColumn",
                                  util$1.compareByOriginalPositions,
                                  binarySearch.LEAST_UPPER_BOUND);
    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (aArgs.column === undefined) {
        var originalLine = mapping.originalLine;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we found. Since
        // mappings are sorted, this is guaranteed to find all mappings for
        // the line we found.
        while (mapping && mapping.originalLine === originalLine) {
          mappings.push({
            line: util$1.getArg(mapping, 'generatedLine', null),
            column: util$1.getArg(mapping, 'generatedColumn', null),
            lastColumn: util$1.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      } else {
        var originalColumn = mapping.originalColumn;

        // Iterate until either we run out of mappings, or we run into
        // a mapping for a different line than the one we were searching for.
        // Since mappings are sorted, this is guaranteed to find all mappings for
        // the line we are searching for.
        while (mapping &&
               mapping.originalLine === line &&
               mapping.originalColumn == originalColumn) {
          mappings.push({
            line: util$1.getArg(mapping, 'generatedLine', null),
            column: util$1.getArg(mapping, 'generatedColumn', null),
            lastColumn: util$1.getArg(mapping, 'lastGeneratedColumn', null)
          });

          mapping = this._originalMappings[++index];
        }
      }
    }

    return mappings;
  };

sourceMapConsumer.SourceMapConsumer = SourceMapConsumer$1;

/**
 * A BasicSourceMapConsumer instance represents a parsed source map which we can
 * query for information about the original file positions by giving it a file
 * position in the generated source.
 *
 * The first parameter is the raw source map (either as a JSON string, or
 * already parsed to an object). According to the spec, source maps have the
 * following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - sources: An array of URLs to the original source files.
 *   - names: An array of identifiers which can be referrenced by individual mappings.
 *   - sourceRoot: Optional. The URL root from which all sources are relative.
 *   - sourcesContent: Optional. An array of contents of the original source files.
 *   - mappings: A string of base64 VLQs which contain the actual mappings.
 *   - file: Optional. The generated file this source map is associated with.
 *
 * Here is an example source map, taken from the source map spec[0]:
 *
 *     {
 *       version : 3,
 *       file: "out.js",
 *       sourceRoot : "",
 *       sources: ["foo.js", "bar.js"],
 *       names: ["src", "maps", "are", "fun"],
 *       mappings: "AA,AB;;ABCDE;"
 *     }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?pli=1#
 */
function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util$1.parseSourceMapInput(aSourceMap);
  }

  var version = util$1.getArg(sourceMap, 'version');
  var sources = util$1.getArg(sourceMap, 'sources');
  // Sass 3.3 leaves out the 'names' array, so we deviate from the spec (which
  // requires the array) to play nice here.
  var names = util$1.getArg(sourceMap, 'names', []);
  var sourceRoot = util$1.getArg(sourceMap, 'sourceRoot', null);
  var sourcesContent = util$1.getArg(sourceMap, 'sourcesContent', null);
  var mappings = util$1.getArg(sourceMap, 'mappings');
  var file = util$1.getArg(sourceMap, 'file', null);

  // Once again, Sass deviates from the spec and supplies the version as a
  // string rather than a number, so we use loose equality checking here.
  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  if (sourceRoot) {
    sourceRoot = util$1.normalize(sourceRoot);
  }

  sources = sources
    .map(String)
    // Some source maps produce relative source paths like "./foo.js" instead of
    // "foo.js".  Normalize these first so that future comparisons will succeed.
    // See bugzil.la/1090768.
    .map(util$1.normalize)
    // Always ensure that absolute sources are internally stored relative to
    // the source root, if the source root is absolute. Not doing this would
    // be particularly problematic when the source root is a prefix of the
    // source (valid, but why??). See github issue #199 and bugzil.la/1188982.
    .map(function (source) {
      return sourceRoot && util$1.isAbsolute(sourceRoot) && util$1.isAbsolute(source)
        ? util$1.relative(sourceRoot, source)
        : source;
    });

  // Pass `true` below to allow duplicate names and sources. While source maps
  // are intended to be compressed and deduplicated, the TypeScript compiler
  // sometimes generates source maps with duplicates in them. See Github issue
  // #72 and bugzil.la/889492.
  this._names = ArraySet.fromArray(names.map(String), true);
  this._sources = ArraySet.fromArray(sources, true);

  this._absoluteSources = this._sources.toArray().map(function (s) {
    return util$1.computeSourceURL(sourceRoot, s, aSourceMapURL);
  });

  this.sourceRoot = sourceRoot;
  this.sourcesContent = sourcesContent;
  this._mappings = mappings;
  this._sourceMapURL = aSourceMapURL;
  this.file = file;
}

BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer$1.prototype);
BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer$1;

/**
 * Utility function to find the index of a source.  Returns -1 if not
 * found.
 */
BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
  var relativeSource = aSource;
  if (this.sourceRoot != null) {
    relativeSource = util$1.relative(this.sourceRoot, relativeSource);
  }

  if (this._sources.has(relativeSource)) {
    return this._sources.indexOf(relativeSource);
  }

  // Maybe aSource is an absolute URL as returned by |sources|.  In
  // this case we can't simply undo the transform.
  var i;
  for (i = 0; i < this._absoluteSources.length; ++i) {
    if (this._absoluteSources[i] == aSource) {
      return i;
    }
  }

  return -1;
};

/**
 * Create a BasicSourceMapConsumer from a SourceMapGenerator.
 *
 * @param SourceMapGenerator aSourceMap
 *        The source map that will be consumed.
 * @param String aSourceMapURL
 *        The URL at which the source map can be found (optional)
 * @returns BasicSourceMapConsumer
 */
BasicSourceMapConsumer.fromSourceMap =
  function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
    var smc = Object.create(BasicSourceMapConsumer.prototype);

    var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
    var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
    smc.sourceRoot = aSourceMap._sourceRoot;
    smc.sourcesContent = aSourceMap._generateSourcesContent(smc._sources.toArray(),
                                                            smc.sourceRoot);
    smc.file = aSourceMap._file;
    smc._sourceMapURL = aSourceMapURL;
    smc._absoluteSources = smc._sources.toArray().map(function (s) {
      return util$1.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
    });

    // Because we are modifying the entries (by converting string sources and
    // names to indices into the sources and names ArraySets), we have to make
    // a copy of the entry or else bad things happen. Shared mutable state
    // strikes again! See github issue #191.

    var generatedMappings = aSourceMap._mappings.toArray().slice();
    var destGeneratedMappings = smc.__generatedMappings = [];
    var destOriginalMappings = smc.__originalMappings = [];

    for (var i = 0, length = generatedMappings.length; i < length; i++) {
      var srcMapping = generatedMappings[i];
      var destMapping = new Mapping;
      destMapping.generatedLine = srcMapping.generatedLine;
      destMapping.generatedColumn = srcMapping.generatedColumn;

      if (srcMapping.source) {
        destMapping.source = sources.indexOf(srcMapping.source);
        destMapping.originalLine = srcMapping.originalLine;
        destMapping.originalColumn = srcMapping.originalColumn;

        if (srcMapping.name) {
          destMapping.name = names.indexOf(srcMapping.name);
        }

        destOriginalMappings.push(destMapping);
      }

      destGeneratedMappings.push(destMapping);
    }

    quickSort(smc.__originalMappings, util$1.compareByOriginalPositions);

    return smc;
  };

/**
 * The version of the source mapping spec that we are consuming.
 */
BasicSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(BasicSourceMapConsumer.prototype, 'sources', {
  get: function () {
    return this._absoluteSources.slice();
  }
});

/**
 * Provide the JIT with a nice shape / hidden class.
 */
function Mapping() {
  this.generatedLine = 0;
  this.generatedColumn = 0;
  this.source = null;
  this.originalLine = null;
  this.originalColumn = null;
  this.name = null;
}

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
BasicSourceMapConsumer.prototype._parseMappings =
  function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    var generatedLine = 1;
    var previousGeneratedColumn = 0;
    var previousOriginalLine = 0;
    var previousOriginalColumn = 0;
    var previousSource = 0;
    var previousName = 0;
    var length = aStr.length;
    var index = 0;
    var cachedSegments = {};
    var temp = {};
    var originalMappings = [];
    var generatedMappings = [];
    var mapping, str, segment, end, value;

    while (index < length) {
      if (aStr.charAt(index) === ';') {
        generatedLine++;
        index++;
        previousGeneratedColumn = 0;
      }
      else if (aStr.charAt(index) === ',') {
        index++;
      }
      else {
        mapping = new Mapping();
        mapping.generatedLine = generatedLine;

        // Because each offset is encoded relative to the previous one,
        // many segments often have the same encoding. We can exploit this
        // fact by caching the parsed variable length fields of each segment,
        // allowing us to avoid a second parse if we encounter the same
        // segment again.
        for (end = index; end < length; end++) {
          if (this._charIsMappingSeparator(aStr, end)) {
            break;
          }
        }
        str = aStr.slice(index, end);

        segment = cachedSegments[str];
        if (segment) {
          index += str.length;
        } else {
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }

          if (segment.length === 2) {
            throw new Error('Found a source, but no line and column');
          }

          if (segment.length === 3) {
            throw new Error('Found a source and line, but no column');
          }

          cachedSegments[str] = segment;
        }

        // Generated column.
        mapping.generatedColumn = previousGeneratedColumn + segment[0];
        previousGeneratedColumn = mapping.generatedColumn;

        if (segment.length > 1) {
          // Original source.
          mapping.source = previousSource + segment[1];
          previousSource += segment[1];

          // Original line.
          mapping.originalLine = previousOriginalLine + segment[2];
          previousOriginalLine = mapping.originalLine;
          // Lines are stored 0-based
          mapping.originalLine += 1;

          // Original column.
          mapping.originalColumn = previousOriginalColumn + segment[3];
          previousOriginalColumn = mapping.originalColumn;

          if (segment.length > 4) {
            // Original name.
            mapping.name = previousName + segment[4];
            previousName += segment[4];
          }
        }

        generatedMappings.push(mapping);
        if (typeof mapping.originalLine === 'number') {
          originalMappings.push(mapping);
        }
      }
    }

    quickSort(generatedMappings, util$1.compareByGeneratedPositionsDeflated);
    this.__generatedMappings = generatedMappings;

    quickSort(originalMappings, util$1.compareByOriginalPositions);
    this.__originalMappings = originalMappings;
  };

/**
 * Find the mapping that best matches the hypothetical "needle" mapping that
 * we are searching for in the given "haystack" of mappings.
 */
BasicSourceMapConsumer.prototype._findMapping =
  function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName,
                                         aColumnName, aComparator, aBias) {
    // To return the position we are searching for, we must first find the
    // mapping for the given position and then return the opposite position it
    // points to. Because the mappings are sorted, we can use binary search to
    // find the best mapping.

    if (aNeedle[aLineName] <= 0) {
      throw new TypeError('Line must be greater than or equal to 1, got '
                          + aNeedle[aLineName]);
    }
    if (aNeedle[aColumnName] < 0) {
      throw new TypeError('Column must be greater than or equal to 0, got '
                          + aNeedle[aColumnName]);
    }

    return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
  };

/**
 * Compute the last column for each generated mapping. The last column is
 * inclusive.
 */
BasicSourceMapConsumer.prototype.computeColumnSpans =
  function SourceMapConsumer_computeColumnSpans() {
    for (var index = 0; index < this._generatedMappings.length; ++index) {
      var mapping = this._generatedMappings[index];

      // Mappings do not contain a field for the last generated columnt. We
      // can come up with an optimistic estimate, however, by assuming that
      // mappings are contiguous (i.e. given two consecutive mappings, the
      // first mapping ends where the second one starts).
      if (index + 1 < this._generatedMappings.length) {
        var nextMapping = this._generatedMappings[index + 1];

        if (mapping.generatedLine === nextMapping.generatedLine) {
          mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
          continue;
        }
      }

      // The last mapping for each line spans the entire line.
      mapping.lastGeneratedColumn = Infinity;
    }
  };

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
BasicSourceMapConsumer.prototype.originalPositionFor =
  function SourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util$1.getArg(aArgs, 'line'),
      generatedColumn: util$1.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._generatedMappings,
      "generatedLine",
      "generatedColumn",
      util$1.compareByGeneratedPositionsDeflated,
      util$1.getArg(aArgs, 'bias', SourceMapConsumer$1.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._generatedMappings[index];

      if (mapping.generatedLine === needle.generatedLine) {
        var source = util$1.getArg(mapping, 'source', null);
        if (source !== null) {
          source = this._sources.at(source);
          source = util$1.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
        }
        var name = util$1.getArg(mapping, 'name', null);
        if (name !== null) {
          name = this._names.at(name);
        }
        return {
          source: source,
          line: util$1.getArg(mapping, 'originalLine', null),
          column: util$1.getArg(mapping, 'originalColumn', null),
          name: name
        };
      }
    }

    return {
      source: null,
      line: null,
      column: null,
      name: null
    };
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
BasicSourceMapConsumer.prototype.hasContentsOfAllSources =
  function BasicSourceMapConsumer_hasContentsOfAllSources() {
    if (!this.sourcesContent) {
      return false;
    }
    return this.sourcesContent.length >= this._sources.size() &&
      !this.sourcesContent.some(function (sc) { return sc == null; });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
BasicSourceMapConsumer.prototype.sourceContentFor =
  function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    if (!this.sourcesContent) {
      return null;
    }

    var index = this._findSourceIndex(aSource);
    if (index >= 0) {
      return this.sourcesContent[index];
    }

    var relativeSource = aSource;
    if (this.sourceRoot != null) {
      relativeSource = util$1.relative(this.sourceRoot, relativeSource);
    }

    var url;
    if (this.sourceRoot != null
        && (url = util$1.urlParse(this.sourceRoot))) {
      // XXX: file:// URIs and absolute paths lead to unexpected behavior for
      // many users. We can help them out when they expect file:// URIs to
      // behave like it would if they were running a local HTTP server. See
      // https://bugzilla.mozilla.org/show_bug.cgi?id=885597.
      var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
      if (url.scheme == "file"
          && this._sources.has(fileUriAbsPath)) {
        return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)]
      }

      if ((!url.path || url.path == "/")
          && this._sources.has("/" + relativeSource)) {
        return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
      }
    }

    // This function is used recursively from
    // IndexedSourceMapConsumer.prototype.sourceContentFor. In that case, we
    // don't want to throw if we can't find the source - we just want to
    // return null, so we provide a flag to exit gracefully.
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + relativeSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *   - bias: Either 'SourceMapConsumer.GREATEST_LOWER_BOUND' or
 *     'SourceMapConsumer.LEAST_UPPER_BOUND'. Specifies whether to return the
 *     closest element that is smaller than or greater than the one we are
 *     searching for, respectively, if the exact element cannot be found.
 *     Defaults to 'SourceMapConsumer.GREATEST_LOWER_BOUND'.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
BasicSourceMapConsumer.prototype.generatedPositionFor =
  function SourceMapConsumer_generatedPositionFor(aArgs) {
    var source = util$1.getArg(aArgs, 'source');
    source = this._findSourceIndex(source);
    if (source < 0) {
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    }

    var needle = {
      source: source,
      originalLine: util$1.getArg(aArgs, 'line'),
      originalColumn: util$1.getArg(aArgs, 'column')
    };

    var index = this._findMapping(
      needle,
      this._originalMappings,
      "originalLine",
      "originalColumn",
      util$1.compareByOriginalPositions,
      util$1.getArg(aArgs, 'bias', SourceMapConsumer$1.GREATEST_LOWER_BOUND)
    );

    if (index >= 0) {
      var mapping = this._originalMappings[index];

      if (mapping.source === needle.source) {
        return {
          line: util$1.getArg(mapping, 'generatedLine', null),
          column: util$1.getArg(mapping, 'generatedColumn', null),
          lastColumn: util$1.getArg(mapping, 'lastGeneratedColumn', null)
        };
      }
    }

    return {
      line: null,
      column: null,
      lastColumn: null
    };
  };

sourceMapConsumer.BasicSourceMapConsumer = BasicSourceMapConsumer;

/**
 * An IndexedSourceMapConsumer instance represents a parsed source map which
 * we can query for information. It differs from BasicSourceMapConsumer in
 * that it takes "indexed" source maps (i.e. ones with a "sections" field) as
 * input.
 *
 * The first parameter is a raw source map (either as a JSON string, or already
 * parsed to an object). According to the spec for indexed source maps, they
 * have the following attributes:
 *
 *   - version: Which version of the source map spec this map is following.
 *   - file: Optional. The generated file this source map is associated with.
 *   - sections: A list of section definitions.
 *
 * Each value under the "sections" field has two fields:
 *   - offset: The offset into the original specified at which this section
 *       begins to apply, defined as an object with a "line" and "column"
 *       field.
 *   - map: A source map definition. This source map could also be indexed,
 *       but doesn't have to be.
 *
 * Instead of the "map" field, it's also possible to have a "url" field
 * specifying a URL to retrieve a source map from, but that's currently
 * unsupported.
 *
 * Here's an example source map, taken from the source map spec[0], but
 * modified to omit a section which uses the "url" field.
 *
 *  {
 *    version : 3,
 *    file: "app.js",
 *    sections: [{
 *      offset: {line:100, column:10},
 *      map: {
 *        version : 3,
 *        file: "section.js",
 *        sources: ["foo.js", "bar.js"],
 *        names: ["src", "maps", "are", "fun"],
 *        mappings: "AAAA,E;;ABCDE;"
 *      }
 *    }],
 *  }
 *
 * The second parameter, if given, is a string whose value is the URL
 * at which the source map was found.  This URL is used to compute the
 * sources array.
 *
 * [0]: https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit#heading=h.535es3xeprgt
 */
function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
  var sourceMap = aSourceMap;
  if (typeof aSourceMap === 'string') {
    sourceMap = util$1.parseSourceMapInput(aSourceMap);
  }

  var version = util$1.getArg(sourceMap, 'version');
  var sections = util$1.getArg(sourceMap, 'sections');

  if (version != this._version) {
    throw new Error('Unsupported version: ' + version);
  }

  this._sources = new ArraySet();
  this._names = new ArraySet();

  var lastOffset = {
    line: -1,
    column: 0
  };
  this._sections = sections.map(function (s) {
    if (s.url) {
      // The url field will require support for asynchronicity.
      // See https://github.com/mozilla/source-map/issues/16
      throw new Error('Support for url field in sections not implemented.');
    }
    var offset = util$1.getArg(s, 'offset');
    var offsetLine = util$1.getArg(offset, 'line');
    var offsetColumn = util$1.getArg(offset, 'column');

    if (offsetLine < lastOffset.line ||
        (offsetLine === lastOffset.line && offsetColumn < lastOffset.column)) {
      throw new Error('Section offsets must be ordered and non-overlapping.');
    }
    lastOffset = offset;

    return {
      generatedOffset: {
        // The offset fields are 0-based, but we use 1-based indices when
        // encoding/decoding from VLQ.
        generatedLine: offsetLine + 1,
        generatedColumn: offsetColumn + 1
      },
      consumer: new SourceMapConsumer$1(util$1.getArg(s, 'map'), aSourceMapURL)
    }
  });
}

IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer$1.prototype);
IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer$1;

/**
 * The version of the source mapping spec that we are consuming.
 */
IndexedSourceMapConsumer.prototype._version = 3;

/**
 * The list of original sources.
 */
Object.defineProperty(IndexedSourceMapConsumer.prototype, 'sources', {
  get: function () {
    var sources = [];
    for (var i = 0; i < this._sections.length; i++) {
      for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
        sources.push(this._sections[i].consumer.sources[j]);
      }
    }
    return sources;
  }
});

/**
 * Returns the original source, line, and column information for the generated
 * source's line and column positions provided. The only argument is an object
 * with the following properties:
 *
 *   - line: The line number in the generated source.  The line number
 *     is 1-based.
 *   - column: The column number in the generated source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - source: The original source file, or null.
 *   - line: The line number in the original source, or null.  The
 *     line number is 1-based.
 *   - column: The column number in the original source, or null.  The
 *     column number is 0-based.
 *   - name: The original identifier, or null.
 */
IndexedSourceMapConsumer.prototype.originalPositionFor =
  function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
    var needle = {
      generatedLine: util$1.getArg(aArgs, 'line'),
      generatedColumn: util$1.getArg(aArgs, 'column')
    };

    // Find the section containing the generated position we're trying to map
    // to an original position.
    var sectionIndex = binarySearch.search(needle, this._sections,
      function(needle, section) {
        var cmp = needle.generatedLine - section.generatedOffset.generatedLine;
        if (cmp) {
          return cmp;
        }

        return (needle.generatedColumn -
                section.generatedOffset.generatedColumn);
      });
    var section = this._sections[sectionIndex];

    if (!section) {
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    }

    return section.consumer.originalPositionFor({
      line: needle.generatedLine -
        (section.generatedOffset.generatedLine - 1),
      column: needle.generatedColumn -
        (section.generatedOffset.generatedLine === needle.generatedLine
         ? section.generatedOffset.generatedColumn - 1
         : 0),
      bias: aArgs.bias
    });
  };

/**
 * Return true if we have the source content for every source in the source
 * map, false otherwise.
 */
IndexedSourceMapConsumer.prototype.hasContentsOfAllSources =
  function IndexedSourceMapConsumer_hasContentsOfAllSources() {
    return this._sections.every(function (s) {
      return s.consumer.hasContentsOfAllSources();
    });
  };

/**
 * Returns the original source content. The only argument is the url of the
 * original source file. Returns null if no original source content is
 * available.
 */
IndexedSourceMapConsumer.prototype.sourceContentFor =
  function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      var content = section.consumer.sourceContentFor(aSource, true);
      if (content) {
        return content;
      }
    }
    if (nullOnMissing) {
      return null;
    }
    else {
      throw new Error('"' + aSource + '" is not in the SourceMap.');
    }
  };

/**
 * Returns the generated line and column information for the original source,
 * line, and column positions provided. The only argument is an object with
 * the following properties:
 *
 *   - source: The filename of the original source.
 *   - line: The line number in the original source.  The line number
 *     is 1-based.
 *   - column: The column number in the original source.  The column
 *     number is 0-based.
 *
 * and an object is returned with the following properties:
 *
 *   - line: The line number in the generated source, or null.  The
 *     line number is 1-based. 
 *   - column: The column number in the generated source, or null.
 *     The column number is 0-based.
 */
IndexedSourceMapConsumer.prototype.generatedPositionFor =
  function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];

      // Only consider this section if the requested source is in the list of
      // sources of the consumer.
      if (section.consumer._findSourceIndex(util$1.getArg(aArgs, 'source')) === -1) {
        continue;
      }
      var generatedPosition = section.consumer.generatedPositionFor(aArgs);
      if (generatedPosition) {
        var ret = {
          line: generatedPosition.line +
            (section.generatedOffset.generatedLine - 1),
          column: generatedPosition.column +
            (section.generatedOffset.generatedLine === generatedPosition.line
             ? section.generatedOffset.generatedColumn - 1
             : 0)
        };
        return ret;
      }
    }

    return {
      line: null,
      column: null
    };
  };

/**
 * Parse the mappings in a string in to a data structure which we can easily
 * query (the ordered arrays in the `this.__generatedMappings` and
 * `this.__originalMappings` properties).
 */
IndexedSourceMapConsumer.prototype._parseMappings =
  function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
    this.__generatedMappings = [];
    this.__originalMappings = [];
    for (var i = 0; i < this._sections.length; i++) {
      var section = this._sections[i];
      var sectionMappings = section.consumer._generatedMappings;
      for (var j = 0; j < sectionMappings.length; j++) {
        var mapping = sectionMappings[j];

        var source = section.consumer._sources.at(mapping.source);
        source = util$1.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
        this._sources.add(source);
        source = this._sources.indexOf(source);

        var name = null;
        if (mapping.name) {
          name = section.consumer._names.at(mapping.name);
          this._names.add(name);
          name = this._names.indexOf(name);
        }

        // The mappings coming from the consumer for the section have
        // generated positions relative to the start of the section, so we
        // need to offset them to be relative to the start of the concatenated
        // generated file.
        var adjustedMapping = {
          source: source,
          generatedLine: mapping.generatedLine +
            (section.generatedOffset.generatedLine - 1),
          generatedColumn: mapping.generatedColumn +
            (section.generatedOffset.generatedLine === mapping.generatedLine
            ? section.generatedOffset.generatedColumn - 1
            : 0),
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: name
        };

        this.__generatedMappings.push(adjustedMapping);
        if (typeof adjustedMapping.originalLine === 'number') {
          this.__originalMappings.push(adjustedMapping);
        }
      }
    }

    quickSort(this.__generatedMappings, util$1.compareByGeneratedPositionsDeflated);
    quickSort(this.__originalMappings, util$1.compareByOriginalPositions);
  };

sourceMapConsumer.IndexedSourceMapConsumer = IndexedSourceMapConsumer;

/* -*- Mode: js; js-indent-level: 2; -*- */

/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

var SourceMapGenerator = sourceMapGenerator.SourceMapGenerator;
var util = util$5;

// Matches a Windows-style `\r\n` newline or a `\n` newline used by all other
// operating systems these days (capturing the result).
var REGEX_NEWLINE = /(\r?\n)/;

// Newline character code for charCodeAt() comparisons
var NEWLINE_CODE = 10;

// Private symbol for identifying `SourceNode`s when multiple versions of
// the source-map library are loaded. This MUST NOT CHANGE across
// versions!
var isSourceNode = "$$$isSourceNode$$$";

/**
 * SourceNodes provide a way to abstract over interpolating/concatenating
 * snippets of generated JavaScript source code while maintaining the line and
 * column information associated with the original source code.
 *
 * @param aLine The original line number.
 * @param aColumn The original column number.
 * @param aSource The original source's filename.
 * @param aChunks Optional. An array of strings which are snippets of
 *        generated JS, or other SourceNodes.
 * @param aName The original identifier.
 */
function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
  this.children = [];
  this.sourceContents = {};
  this.line = aLine == null ? null : aLine;
  this.column = aColumn == null ? null : aColumn;
  this.source = aSource == null ? null : aSource;
  this.name = aName == null ? null : aName;
  this[isSourceNode] = true;
  if (aChunks != null) this.add(aChunks);
}

/**
 * Creates a SourceNode from generated code and a SourceMapConsumer.
 *
 * @param aGeneratedCode The generated code
 * @param aSourceMapConsumer The SourceMap for the generated code
 * @param aRelativePath Optional. The path that relative sources in the
 *        SourceMapConsumer should be relative to.
 */
SourceNode.fromStringWithSourceMap =
  function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
    // The SourceNode we want to fill with the generated code
    // and the SourceMap
    var node = new SourceNode();

    // All even indices of this array are one line of the generated code,
    // while all odd indices are the newlines between two adjacent lines
    // (since `REGEX_NEWLINE` captures its match).
    // Processed fragments are accessed by calling `shiftNextLine`.
    var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
    var remainingLinesIndex = 0;
    var shiftNextLine = function() {
      var lineContents = getNextLine();
      // The last line of a file might not have a newline.
      var newLine = getNextLine() || "";
      return lineContents + newLine;

      function getNextLine() {
        return remainingLinesIndex < remainingLines.length ?
            remainingLines[remainingLinesIndex++] : undefined;
      }
    };

    // We need to remember the position of "remainingLines"
    var lastGeneratedLine = 1, lastGeneratedColumn = 0;

    // The generate SourceNodes we need a code range.
    // To extract it current and last mapping is used.
    // Here we store the last mapping.
    var lastMapping = null;

    aSourceMapConsumer.eachMapping(function (mapping) {
      if (lastMapping !== null) {
        // We add the code from "lastMapping" to "mapping":
        // First check if there is a new line in between.
        if (lastGeneratedLine < mapping.generatedLine) {
          // Associate first line with "lastMapping"
          addMappingWithCode(lastMapping, shiftNextLine());
          lastGeneratedLine++;
          lastGeneratedColumn = 0;
          // The remaining code is added without mapping
        } else {
          // There is no new line in between.
          // Associate the code between "lastGeneratedColumn" and
          // "mapping.generatedColumn" with "lastMapping"
          var nextLine = remainingLines[remainingLinesIndex] || '';
          var code = nextLine.substr(0, mapping.generatedColumn -
                                        lastGeneratedColumn);
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn -
                                              lastGeneratedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
          addMappingWithCode(lastMapping, code);
          // No more remaining code, continue
          lastMapping = mapping;
          return;
        }
      }
      // We add the generated code until the first mapping
      // to the SourceNode without any mapping.
      // Each line is added as separate string.
      while (lastGeneratedLine < mapping.generatedLine) {
        node.add(shiftNextLine());
        lastGeneratedLine++;
      }
      if (lastGeneratedColumn < mapping.generatedColumn) {
        var nextLine = remainingLines[remainingLinesIndex] || '';
        node.add(nextLine.substr(0, mapping.generatedColumn));
        remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
        lastGeneratedColumn = mapping.generatedColumn;
      }
      lastMapping = mapping;
    }, this);
    // We have processed all mappings.
    if (remainingLinesIndex < remainingLines.length) {
      if (lastMapping) {
        // Associate the remaining code in the current line with "lastMapping"
        addMappingWithCode(lastMapping, shiftNextLine());
      }
      // and add the remaining lines without any mapping
      node.add(remainingLines.splice(remainingLinesIndex).join(""));
    }

    // Copy sourcesContent into SourceNode
    aSourceMapConsumer.sources.forEach(function (sourceFile) {
      var content = aSourceMapConsumer.sourceContentFor(sourceFile);
      if (content != null) {
        if (aRelativePath != null) {
          sourceFile = util.join(aRelativePath, sourceFile);
        }
        node.setSourceContent(sourceFile, content);
      }
    });

    return node;

    function addMappingWithCode(mapping, code) {
      if (mapping === null || mapping.source === undefined) {
        node.add(code);
      } else {
        var source = aRelativePath
          ? util.join(aRelativePath, mapping.source)
          : mapping.source;
        node.add(new SourceNode(mapping.originalLine,
                                mapping.originalColumn,
                                source,
                                code,
                                mapping.name));
      }
    }
  };

/**
 * Add a chunk of generated JS to this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.add = function SourceNode_add(aChunk) {
  if (Array.isArray(aChunk)) {
    aChunk.forEach(function (chunk) {
      this.add(chunk);
    }, this);
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    if (aChunk) {
      this.children.push(aChunk);
    }
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Add a chunk of generated JS to the beginning of this source node.
 *
 * @param aChunk A string snippet of generated JS code, another instance of
 *        SourceNode, or an array where each member is one of those things.
 */
SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
  if (Array.isArray(aChunk)) {
    for (var i = aChunk.length-1; i >= 0; i--) {
      this.prepend(aChunk[i]);
    }
  }
  else if (aChunk[isSourceNode] || typeof aChunk === "string") {
    this.children.unshift(aChunk);
  }
  else {
    throw new TypeError(
      "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
    );
  }
  return this;
};

/**
 * Walk over the tree of JS snippets in this node and its children. The
 * walking function is called once for each snippet of JS and is passed that
 * snippet and the its original associated source's line/column location.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walk = function SourceNode_walk(aFn) {
  var chunk;
  for (var i = 0, len = this.children.length; i < len; i++) {
    chunk = this.children[i];
    if (chunk[isSourceNode]) {
      chunk.walk(aFn);
    }
    else {
      if (chunk !== '') {
        aFn(chunk, { source: this.source,
                     line: this.line,
                     column: this.column,
                     name: this.name });
      }
    }
  }
};

/**
 * Like `String.prototype.join` except for SourceNodes. Inserts `aStr` between
 * each of `this.children`.
 *
 * @param aSep The separator.
 */
SourceNode.prototype.join = function SourceNode_join(aSep) {
  var newChildren;
  var i;
  var len = this.children.length;
  if (len > 0) {
    newChildren = [];
    for (i = 0; i < len-1; i++) {
      newChildren.push(this.children[i]);
      newChildren.push(aSep);
    }
    newChildren.push(this.children[i]);
    this.children = newChildren;
  }
  return this;
};

/**
 * Call String.prototype.replace on the very right-most source snippet. Useful
 * for trimming whitespace from the end of a source node, etc.
 *
 * @param aPattern The pattern to replace.
 * @param aReplacement The thing to replace the pattern with.
 */
SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
  var lastChild = this.children[this.children.length - 1];
  if (lastChild[isSourceNode]) {
    lastChild.replaceRight(aPattern, aReplacement);
  }
  else if (typeof lastChild === 'string') {
    this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
  }
  else {
    this.children.push(''.replace(aPattern, aReplacement));
  }
  return this;
};

/**
 * Set the source content for a source file. This will be added to the SourceMapGenerator
 * in the sourcesContent field.
 *
 * @param aSourceFile The filename of the source file
 * @param aSourceContent The content of the source file
 */
SourceNode.prototype.setSourceContent =
  function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
    this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
  };

/**
 * Walk over the tree of SourceNodes. The walking function is called for each
 * source file content and is passed the filename and source content.
 *
 * @param aFn The traversal function.
 */
SourceNode.prototype.walkSourceContents =
  function SourceNode_walkSourceContents(aFn) {
    for (var i = 0, len = this.children.length; i < len; i++) {
      if (this.children[i][isSourceNode]) {
        this.children[i].walkSourceContents(aFn);
      }
    }

    var sources = Object.keys(this.sourceContents);
    for (var i = 0, len = sources.length; i < len; i++) {
      aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
    }
  };

/**
 * Return the string representation of this source node. Walks over the tree
 * and concatenates all the various snippets together to one string.
 */
SourceNode.prototype.toString = function SourceNode_toString() {
  var str = "";
  this.walk(function (chunk) {
    str += chunk;
  });
  return str;
};

/**
 * Returns the string representation of this source node along with a source
 * map.
 */
SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
  var generated = {
    code: "",
    line: 1,
    column: 0
  };
  var map = new SourceMapGenerator(aArgs);
  var sourceMappingActive = false;
  var lastOriginalSource = null;
  var lastOriginalLine = null;
  var lastOriginalColumn = null;
  var lastOriginalName = null;
  this.walk(function (chunk, original) {
    generated.code += chunk;
    if (original.source !== null
        && original.line !== null
        && original.column !== null) {
      if(lastOriginalSource !== original.source
         || lastOriginalLine !== original.line
         || lastOriginalColumn !== original.column
         || lastOriginalName !== original.name) {
        map.addMapping({
          source: original.source,
          original: {
            line: original.line,
            column: original.column
          },
          generated: {
            line: generated.line,
            column: generated.column
          },
          name: original.name
        });
      }
      lastOriginalSource = original.source;
      lastOriginalLine = original.line;
      lastOriginalColumn = original.column;
      lastOriginalName = original.name;
      sourceMappingActive = true;
    } else if (sourceMappingActive) {
      map.addMapping({
        generated: {
          line: generated.line,
          column: generated.column
        }
      });
      lastOriginalSource = null;
      sourceMappingActive = false;
    }
    for (var idx = 0, length = chunk.length; idx < length; idx++) {
      if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
        generated.line++;
        generated.column = 0;
        // Mappings end at eol
        if (idx + 1 === length) {
          lastOriginalSource = null;
          sourceMappingActive = false;
        } else if (sourceMappingActive) {
          map.addMapping({
            source: original.source,
            original: {
              line: original.line,
              column: original.column
            },
            generated: {
              line: generated.line,
              column: generated.column
            },
            name: original.name
          });
        }
      } else {
        generated.column++;
      }
    }
  });
  this.walkSourceContents(function (sourceFile, sourceContent) {
    map.setSourceContent(sourceFile, sourceContent);
  });

  return { code: generated.code, map: map };
};

/*
 * Copyright 2009-2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE.txt or:
 * http://opensource.org/licenses/BSD-3-Clause
 */
var SourceMapConsumer = sourceMapConsumer.SourceMapConsumer;

class ErrorMapper {
    static get consumer() {
        if (this._consumer == null) {
            this._consumer = new SourceMapConsumer(require("main.js.map"));
        }
        return this._consumer;
    }
    static sourceMappedStackTrace(error) {
        const stack = error instanceof Error ? error.stack : error;
        if (Object.prototype.hasOwnProperty.call(this.cache, stack)) {
            return this.cache[stack];
        }
        const re = /^\s+at\s+(.+?\s+)?\(?([0-z._\-\\\/]+):(\d+):(\d+)\)?$/gm;
        let match;
        let outStack = error.toString();
        while ((match = re.exec(stack))) {
            if (match[2] === "main") {
                const pos = this.consumer.originalPositionFor({
                    column: parseInt(match[4], 10),
                    line: parseInt(match[3], 10)
                });
                if (pos.line != null) {
                    if (pos.name) {
                        outStack += `\n    at ${pos.name} (${pos.source}:${pos.line}:${pos.column})`;
                    }
                    else {
                        if (match[1]) {
                            outStack += `\n    at ${match[1]} (${pos.source}:${pos.line}:${pos.column})`;
                        }
                        else {
                            outStack += `\n    at ${pos.source}:${pos.line}:${pos.column}`;
                        }
                    }
                }
                else {
                    break;
                }
            }
            else {
                break;
            }
        }
        this.cache[stack] = outStack;
        return outStack;
    }
    static wrapLoop(loop) {
        return () => {
            try {
                loop();
            }
            catch (e) {
                if (e instanceof Error) {
                    if ("sim" in Game.rooms) {
                        const message = `Source maps don't work in the simulator - displaying original error`;
                        console.log(`<span style='color:red'>${message}<br>${_.escape(e.stack)}</span>`);
                    }
                    else {
                        console.log(`<span style='color:red'>${_.escape(this.sourceMappedStackTrace(e))}</span>`);
                    }
                }
                else {
                    throw e;
                }
            }
        };
    }
}
ErrorMapper.cache = {};

Creep.prototype.findEnergySource = function () {
    let sources = this.room.find(FIND_SOURCES);
    if (sources.length) {
        let source = _.find(sources, function (s) { return s.pos.getOpenPositions().length == 1 || s.pos.getOpenPositions().length > 0 && !s.room.lookForAtArea(LOOK_CREEPS, s.pos.y - 1, s.pos.x - 1, s.pos.y + 1, s.pos.x + 1, true).length; });
        if (source) {
            this.memory.source = source.id;
            return source;
        }
        else {
            source = _.find(sources, function (s) { return s.pos.getOpenPositions().length == 1 || s.pos.getOpenPositions().length > 0; });
            this.memory.source = source.id;
            return source;
        }
    }
    else {
        return false;
    }
};
Creep.prototype.assignHarvestSource = function (noIncrement) {
    const room = this.room;
    const role = this.memory.role;
    if (room.memory.objects === undefined)
        room.cacheObjects();
    let roomSources;
    if (role == 'harvester')
        roomSources = room.memory.objects.sources;
    else if (role == 'remoteharvester')
        roomSources = room.memory.outposts.aggregateSourceList;
    if (role == 'harvester') {
        if (room.memory.objects.lastAssigned === undefined) {
            room.memory.objects.lastAssigned = 0;
            console.log('Creating \'lastAssigned\' memory object.');
        }
    }
    else if (role == 'remoteharvester') {
        if (room.memory.outposts.aggLastAssigned === undefined) {
            room.memory.outposts.aggLastAssigned = 0;
            console.log('Creating \'aggLastAssigned\' memory object.');
        }
    }
    let LA;
    if (role == 'harvester')
        LA = room.memory.objects.lastAssigned;
    else if (role == 'remoteharvester')
        LA = room.memory.outposts.aggLastAssigned;
    let nextAssigned;
    if (role == 'harvester')
        nextAssigned = room.memory.objects.lastAssigned + 1;
    else if (role == 'remoteharvester')
        nextAssigned = room.memory.outposts.aggLastAssigned + 1;
    if (nextAssigned >= roomSources.length)
        nextAssigned = 0;
    let assignedSource = roomSources[nextAssigned];
    this.memory.source = assignedSource;
    if (role == 'harvester')
        room.memory.objects.lastAssigned++;
    else if (role == 'remoteharvester')
        room.memory.outposts.aggLastAssigned++;
    if (role == 'harvester') {
        if (room.memory.objects.lastAssigned >= roomSources.length)
            room.memory.objects.lastAssigned = 0;
    }
    else if (role == 'remoteharvester') {
        if (room.memory.outposts.aggLastAssigned >= roomSources.length)
            room.memory.outposts.aggLastAssigned = 0;
    }
    console.log(room.link() + ': Assigned harvester ' + this.name + ' to source #' + (LA + 1) + ' (ID: ' + assignedSource + ') in room ' + this.room.name);
    if (noIncrement) {
        if (role == 'harvester')
            room.memory.objects.lastAssigned = LA;
        else if (role == 'remoteharvester')
            room.memory.outposts.aggLastAssigned = LA;
    }
    return assignedSource;
};
Creep.prototype.assignRemoteHarvestSource = function (noIncrement = false) {
    const homeOutposts = Game.rooms[this.memory.homeRoom].memory.outposts;
    const roomSources = homeOutposts.aggregateSourceList;
    if (homeOutposts.aggLastAssigned === undefined)
        homeOutposts.aggLastAssigned = 0;
    let lastAss = homeOutposts.aggLastAssigned;
    let nextAss = lastAss + 1;
    if (nextAss >= roomSources.length)
        nextAss = 0;
    let assignedSource = roomSources[nextAss];
    this.memory.source = assignedSource;
    homeOutposts.aggLastAssigned = nextAss;
    if (noIncrement)
        homeOutposts.aggLastAssigned = lastAss;
    console.log(this.room.link() + ': Assigned remote harvester ' + this.name + ' to remote source #' + (nextAss + 1) + ' (ID: ' + assignedSource + ')');
    return assignedSource;
};
Creep.prototype.unloadEnergy = function () {
    if (this.spawning)
        return;
    if (this.memory.bucket) {
        const target = Game.getObjectById(this.memory.bucket);
        if (target.hits == target.hitsMax) {
            this.say('⛏️');
            this.transfer(target, RESOURCE_ENERGY);
        }
        else {
            this.say('🔧');
            this.repair(target);
        }
        return;
    }
    else {
        const sourceTarget = Game.getObjectById(this.memory.source);
        const sourceContainers = sourceTarget.pos.findInRange(FIND_STRUCTURES, 3, { filter: (obj) => (obj.structureType == STRUCTURE_LINK || obj.structureType == STRUCTURE_STORAGE || obj.structureType == STRUCTURE_CONTAINER) });
        const nearbyObj = sourceContainers[0];
        if (!nearbyObj) {
            if (this.drop(RESOURCE_ENERGY) === OK) {
                this.say('🗑️');
                console.log(this.name + ' dropped.');
            }
            return;
        }
        else {
            this.memory.bucket = nearbyObj.id;
            if (nearbyObj.hits == nearbyObj.hitsMax) {
                if (this.pos.isNearTo(nearbyObj)) {
                    this.say('⛏️');
                    this.transfer(nearbyObj, RESOURCE_ENERGY);
                }
                else
                    this.moveTo(nearbyObj);
            }
            else {
                this.say('🔧');
                this.repair(nearbyObj);
            }
            return;
        }
    }
};
Creep.prototype.harvestEnergy = function () {
    if (!this.memory.source)
        this.assignHarvestSource();
    const storedSource = Game.getObjectById(this.memory.source);
    if (storedSource) {
        if (this.pos.isNearTo(storedSource)) {
            if (storedSource.energy == 0) {
                if (this.store.getUsedCapacity() > 0) {
                    this.unloadEnergy();
                    this.harvest(storedSource);
                }
                else
                    this.say('🚬');
            }
            else
                this.harvest(storedSource);
        }
        else
            this.moveTo(storedSource, { visualizePathStyle: { stroke: '#ffaa00', lineStyle: 'dashed', opacity: 0.5 }, ignoreCreeps: true });
    }
};
Creep.prototype.getDroppedResource = function (pileID) {
    if (pileID === undefined)
        pileID = this.pos.findClosestByRange(FIND_DROPPED_RESOURCES).id;
    if (pileID) {
        const target = Game.getObjectById(pileID);
        if (target) {
            if (this.pickup(target) == ERR_NOT_IN_RANGE)
                this.moveTo(target);
        }
    }
};
Creep.prototype.pickupClosestEnergy = function () {
    const droppedPiles = this.room.find(FIND_DROPPED_RESOURCES);
    if (droppedPiles.length > 0) {
        const target = this.pos.findClosestByRange(droppedPiles);
        if (target) {
            if (this.pickup(target) == ERR_NOT_IN_RANGE)
                this.moveTo(target);
        }
    }
    else {
        const containersWithEnergy = this.room.find(FIND_STRUCTURES, {
            filter: (obj) => (obj.structureType == STRUCTURE_CONTAINER || obj.structureType == STRUCTURE_STORAGE) && obj.store[RESOURCE_ENERGY] > 0
        });
        const target = this.pos.findClosestByRange(containersWithEnergy);
        if (target) {
            if (this.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.moveTo(target);
            }
        }
    }
};
Creep.prototype.unloadMineral = function () {
    const mineral = Object.keys(this.store);
    if (this.memory.bucket) {
        const target = Game.getObjectById(this.memory.bucket);
        if (this.pos.isNearTo(target))
            this.transfer(target, mineral[0]);
        else
            this.moveTo(target);
        return;
    }
    else {
        const nearbyObj = this.pos.findInRange(FIND_STRUCTURES, 2, { filter: (obj) => (obj.structureType == STRUCTURE_STORAGE || obj.structureType == STRUCTURE_CONTAINER) });
        if (nearbyObj.length == 0) {
            if (this.drop(mineral[0]) === OK)
                console.log(this.name + ' dropped ' + mineral + '.');
            return;
        }
        else {
            const target = nearbyObj[0];
            this.memory.bucket = target.id;
            if (this.pos.isNearTo(target))
                this.transfer(target, mineral[0]);
            else
                this.moveTo(target);
            return;
        }
    }
};
Creep.prototype.harvestMineral = function () {
    let storedMineral = Game.getObjectById(this.memory.mineral);
    if (!storedMineral) {
        delete this.memory.mineral;
        const foundMineral = this.room.find(FIND_MINERALS);
        storedMineral = foundMineral[0];
        this.memory.mineral = foundMineral[0].id;
    }
    if (storedMineral) {
        if (this.pos.isNearTo(storedMineral)) {
            if (storedMineral.mineralAmount == 0 && this.store.getUsedCapacity() > 0) {
                this.unloadMineral();
            }
            this.harvest(storedMineral);
        }
        else {
            this.moveTo(storedMineral, { visualizePathStyle: { stroke: '#ff00ff' }, ignoreCreeps: true });
        }
    }
};
Creep.prototype.moveBySerializedPath = function (serializedPath) {
    const path = Room.deserializePath(serializedPath);
    this.moveByPath(path);
};
Creep.prototype.recursivePathMove = function (serializedPath, stepNum = 0) {
    const path = Room.deserializePath(serializedPath);
    if (this.move(path[stepNum].direction) == OK)
        stepNum++;
    if (stepNum < serializedPath.length)
        return this.recursivePathMove(serializedPath, stepNum);
};
Creep.prototype.disable = function () {
    this.memory.disableAI = true;
    return true;
};
Creep.prototype.enable = function () {
    this.memory.disableAI = false;
    return false;
};
Creep.prototype.getBoost = function (compound, sourceLabID, numParts = 1) {
    if (compound) {
        if (sourceLabID) {
            const sourceLab = Game.getObjectById(sourceLabID);
            if (sourceLab) {
                if (sourceLab.boostCreep(this, numParts) == ERR_NOT_IN_RANGE)
                    this.moveTo(sourceLab, { visualizePathStyle: { stroke: '#ffffff', opacity: 0.5, lineStyle: 'solid' } });
                else
                    return true;
            }
        }
    }
};
Creep.prototype.assignOutbox = function (noIncrement) {
    const room = this.room;
    const LA = room.memory.settings.containerSettings.lastOutbox;
    if (!room.memory.settings)
        room.initSettings();
    if (!room.memory.objects)
        room.cacheObjects();
    const roomOutboxes = room.memory.settings.containerSettings.outboxes;
    if (room.memory.settings.containerSettings.lastOutbox == undefined) {
        room.memory.settings.containerSettings.lastOutbox = 0;
        console.log('Creating \'lastOutbox\' memory setting.');
    }
    let nextOutbox = room.memory.settings.containerSettings.lastOutbox + 1;
    if (nextOutbox >= roomOutboxes.length)
        nextOutbox = 0;
    let assignedOutbox = roomOutboxes[nextOutbox];
    this.memory.pickup = assignedOutbox;
    room.memory.settings.containerSettings.lastOutbox += 1;
    if (room.memory.settings.containerSettings.lastOutbox >= roomOutboxes.length)
        room.memory.settings.containerSettings.lastOutbox = 0;
    console.log('Assigned ' + this.memory.role + ' ' + this.name + ' to outbox ID ' + assignedOutbox);
    if (noIncrement)
        room.memory.settings.containerSettings.lastOutbox = LA;
    return assignedOutbox;
};
Creep.prototype.assignInbox = function (noIncrement) {
    const room = this.room;
    const LA = room.memory.settings.containerSettings.lastInbox;
    if (!room.memory.settings)
        room.initSettings();
    if (!room.memory.objects)
        room.cacheObjects();
    const roomInboxes = room.memory.settings.containerSettings.inboxes;
    if (room.memory.settings.containerSettings.lastInbox == undefined) {
        room.memory.settings.containerSettings.lastInbox = 0;
        console.log('Creating \'lastInbox\' memory setting.');
    }
    let nextInbox = room.memory.settings.containerSettings.lastInbox + 1;
    if (nextInbox >= roomInboxes.length)
        nextInbox = 0;
    let assignedInbox = roomInboxes[nextInbox];
    this.memory.dropoff = assignedInbox;
    room.memory.settings.containerSettings.lastInbox += 1;
    if (room.memory.settings.containerSettings.lastInbox >= roomInboxes.length)
        room.memory.settings.containerSettings.lastInbox = 0;
    console.log(room.link() + ': Assigned ' + this.memory.role + ' ' + this.name + ' to inbox ID ' + assignedInbox);
    if (noIncrement)
        room.memory.settings.containerSettings.lastInbox = LA;
    return assignedInbox;
};
Creep.prototype.assignLogisticalPair = function (logParam) {
    if (!this.room.memory.data)
        this.room.initSettings();
    if (this.room.memory.data.logisticalPairs === undefined)
        this.room.registerLogisticalPairs();
    if (this.room.memory.data.pairCounter === undefined)
        this.room.memory.data.pairCounter = 0;
    const chosenPair = this.room.memory.data.logisticalPairs[logParam];
    if (!chosenPair) {
        console.log(this.room.link() + 'You supplied a logistical pair index value that does not exist. Recheck available options.');
        return false;
    }
    else {
        this.memory.pickup = chosenPair.source;
        this.memory.dropoff = chosenPair.destination;
        this.memory.cargo = chosenPair.resource;
        this.memory.pathLength = chosenPair.distance;
        console.log(this.room.link() + ': Assigned pair (PICKUP: ' + chosenPair.source + ') | (DROPOFF: ' + chosenPair.destination + ') | (CARGO: ' + chosenPair.resource + ') | (LOCALITY: ' + chosenPair.locality + ')');
        return true;
    }
};
Creep.prototype.assignLogisticalPair = function () {
    if (!this.room.memory.data)
        this.room.initSettings();
    if (this.room.memory.data.logisticalPairs === undefined)
        this.room.registerLogisticalPairs();
    if (this.room.memory.data.pairCounter === undefined)
        this.room.memory.data.pairCounter = 0;
    const assignedPair = this.room.memory.data.logisticalPairs[this.room.memory.data.pairCounter];
    this.room.memory.data.pairCounter += 1;
    if (this.room.memory.data.pairCounter >= this.room.memory.data.logisticalPairs.length)
        this.room.memory.data.pairCounter = 0;
    if (this.room.memory.data.logisticalPairs.length == 0) {
        console.log(this.room.link() + 'No pairs available to assign. Set \'none\'.');
        return false;
    }
    else if (!assignedPair) {
        console.log('No pairs to assign.');
        return false;
    }
    else if (assignedPair) {
        this.memory.pickup = assignedPair.source;
        this.memory.dropoff = assignedPair.destination;
        this.memory.cargo = assignedPair.resource;
        this.memory.pathLength = assignedPair.distance;
        console.log(this.room.link() + ': Assigned pair (PICKUP: ' + assignedPair.source + ') | (DROPOFF: ' + assignedPair.destination + ') | (CARGO: ' + assignedPair.resource + ') | (LOCALITY: ' + assignedPair.locality + ')');
        return true;
    }
    else {
        console.log(this.room.link() + ': Unable to assign pair for creep \'' + this.name + '\'.');
        return false;
    }
};
Creep.prototype.navigateWaypoints = function (waypoints) {
    if (waypoints instanceof Array !== true)
        return 'The passed parameter was not an array. Pass an array containing the list of waypoints (flag names) sorted in navigation order.';
    else {
        if (!validateFlagName(waypoints))
            return 'Input waypoints contained an invalid room name';
    }
};

Room.prototype.clearPPT = function () { this.clearRCLCounter(); };
Room.prototype.enableCSL = function () { this.enableCentralStorageLogic(); };
Room.prototype.disableCSL = function () { this.disableCentralStorageLogic(); };
Room.prototype.toggleCSL = function () { this.toggleCentralStorageLogic(); };
Room.prototype.setAttackRoom = function (roomName) { this.memory.data.attackRoom = roomName; };
Room.prototype.setCustomAttackTarget = function (attackTarget) { this.memory.data.customAttackTarget = attackTarget; };
Room.prototype.getInboxes = function () { return this.memory.settings.containerSettings.inboxes; };
Room.prototype.getOutboxes = function () { return this.memory.settings.containerSettings.outboxes; };
Room.prototype.setQuota = function (roleTarget, newTarget) { this.setTarget(roleTarget, newTarget); };
Room.prototype.cacheObjects = function () {
    let storageArray = [];
    const sources = this.find(FIND_SOURCES);
    const minerals = this.find(FIND_MINERALS);
    const deposits = this.find(FIND_DEPOSITS);
    const allStructures = this.find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_CONTROLLER || i.structureType == STRUCTURE_SPAWN || i.structureType == STRUCTURE_EXTENSION || i.structureType == STRUCTURE_TOWER || i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE || i.structureType == STRUCTURE_RAMPART || i.structureType == STRUCTURE_LINK || i.structureType == STRUCTURE_EXTRACTOR || i.structureType == STRUCTURE_LAB || i.structureType == STRUCTURE_TERMINAL || i.structureType == STRUCTURE_FACTORY || i.structureType == STRUCTURE_OBSERVER || i.structureType == STRUCTURE_NUKER || i.structureType == STRUCTURE_POWER_SPAWN });
    const controller = _.filter(allStructures, { structureType: STRUCTURE_CONTROLLER });
    const spawns = _.filter(allStructures, { structureType: STRUCTURE_SPAWN });
    const extensions = _.filter(allStructures, { structureType: STRUCTURE_EXTENSION });
    const towers = _.filter(allStructures, { structureType: STRUCTURE_TOWER });
    const containers = _.filter(allStructures, { structureType: STRUCTURE_CONTAINER });
    const storage = _.filter(allStructures, { structureType: STRUCTURE_STORAGE });
    const ramparts = _.filter(allStructures, { structureType: STRUCTURE_RAMPART });
    const links = _.filter(allStructures, { structureType: STRUCTURE_LINK });
    const extractor = _.filter(allStructures, { structureType: STRUCTURE_EXTRACTOR });
    const labs = _.filter(allStructures, { structureType: STRUCTURE_LAB });
    const terminal = _.filter(allStructures, { structureType: STRUCTURE_TERMINAL });
    const factory = _.filter(allStructures, { structureType: STRUCTURE_FACTORY });
    const observer = _.filter(allStructures, { structureType: STRUCTURE_OBSERVER });
    const powerspawn = _.filter(allStructures, { structureType: STRUCTURE_POWER_SPAWN });
    const nuker = _.filter(allStructures, { structureType: STRUCTURE_NUKER });
    if (!this.memory.objects)
        this.memory.objects = {};
    console.log(this.link() + ': Caching room objects...');
    if (sources) {
        for (let i = 0; i < sources.length; i++)
            storageArray.push(sources[i].id);
        if (storageArray.length) {
            this.memory.objects.sources = storageArray;
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached ' + storageArray.length + ' sources.');
            else
                console.log(this.link() + ': Cached 1 source.');
        }
        storageArray = [];
    }
    if (minerals) {
        for (let i = 0; i < minerals.length; i++)
            storageArray.push(minerals[i].id);
        if (storageArray.length) {
            this.memory.objects.mineral = storageArray[0];
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached ' + storageArray.length + ' minerals.');
            else
                console.log(this.link() + ': Cached 1 mineral.');
        }
        storageArray = [];
    }
    if (deposits) {
        for (let i = 0; i < deposits.length; i++)
            storageArray.push(deposits[i].id);
        if (storageArray.length) {
            this.memory.objects.deposit = storageArray[0];
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached ' + storageArray.length + ' deposits.');
            else
                console.log(this.link() + ': Cached 1 deposit.');
        }
        storageArray = [];
    }
    if (controller) {
        for (let i = 0; i < controller.length; i++)
            storageArray.push(controller[i].id);
        if (storageArray.length) {
            this.memory.objects.controller = storageArray[0];
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached ' + storageArray.length + ' controllers.');
            else
                console.log(this.link() + ': Cached 1 controller.');
        }
        storageArray = [];
    }
    if (spawns) {
        for (let i = 0; i < spawns.length; i++)
            storageArray.push(spawns[i].id);
        if (storageArray.length) {
            this.memory.objects.spawns = storageArray;
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached ' + storageArray.length + ' spawns.');
            else
                console.log(this.link() + ': Cached 1 spawn.');
        }
        storageArray = [];
    }
    if (extensions) {
        for (let i = 0; i < extensions.length; i++)
            storageArray.push(extensions[i].id);
        if (storageArray.length) {
            this.memory.objects.extensions = storageArray;
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached ' + storageArray.length + ' extensions.');
            else
                console.log(this.link() + ': Cached 1 extension.');
        }
        storageArray = [];
    }
    if (towers) {
        for (let i = 0; i < towers.length; i++)
            storageArray.push(towers[i].id);
        if (storageArray.length) {
            this.memory.objects.towers = storageArray;
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached ' + storageArray.length + ' towers.');
            else
                console.log(this.link() + ': Cached 1 tower.');
        }
        storageArray = [];
    }
    if (containers) {
        for (let i = 0; i < containers.length; i++)
            storageArray.push(containers[i].id);
        if (storageArray.length) {
            this.memory.objects.containers = storageArray;
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached ' + storageArray.length + ' containers.');
            else
                console.log(this.link() + ': Cached 1 container.');
        }
        storageArray = [];
    }
    if (storage) {
        for (let i = 0; i < storage.length; i++)
            storageArray.push(storage[i].id);
        if (storageArray.length) {
            this.memory.objects.storage = storageArray[0];
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached 1 storage.');
        }
        storageArray = [];
    }
    if (ramparts) {
        for (let i = 0; i < ramparts.length; i++)
            storageArray.push(ramparts[i].id);
        if (storageArray.length) {
            this.memory.objects.ramparts = storageArray;
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached ' + storageArray.length + ' ramparts.');
            else
                console.log(this.link() + ': Cached 1 rampart.');
        }
        storageArray = [];
    }
    if (links) {
        for (let i = 0; i < links.length; i++)
            storageArray.push(links[i].id);
        if (storageArray.length) {
            this.memory.objects.links = storageArray;
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached ' + storageArray.length + ' links.');
            else
                console.log(this.link() + ': Cached 1 link.');
        }
        storageArray = [];
    }
    if (extractor) {
        for (let i = 0; i < extractor.length; i++)
            storageArray.push(extractor[i].id);
        if (storageArray.length) {
            this.memory.objects.extractor = storageArray[0];
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached 1 extractor.');
        }
        storageArray = [];
    }
    if (labs) {
        for (let i = 0; i < labs.length; i++)
            storageArray.push(labs[i].id);
        if (storageArray.length) {
            this.memory.objects.labs = storageArray;
            if (storageArray.length > 1)
                console.log(this.link() + ': Cached ' + storageArray.length + ' labs.');
            else
                console.log(this.link() + ': Cached 1 lab.');
        }
        storageArray = [];
    }
    if (terminal) {
        for (let i = 0; i < terminal.length; i++)
            storageArray.push(terminal[i].id);
        if (storageArray.length) {
            this.memory.objects.terminal = storageArray[0];
            if (storageArray.length >= 1)
                console.log(this.link() + ': Cached 1 terminal.');
        }
        storageArray = [];
    }
    if (factory) {
        for (let i = 0; i < factory.length; i++)
            storageArray.push(factory[i].id);
        if (storageArray.length) {
            this.memory.objects.factory = storageArray[0];
            if (storageArray.length >= 1)
                console.log(this.link() + ': Cached 1 factory.');
        }
        storageArray = [];
    }
    if (observer) {
        for (let i = 0; i < observer.length; i++)
            storageArray.push(observer[i].id);
        if (storageArray.length) {
            this.memory.objects.observer = storageArray[0];
            if (storageArray.length >= 1)
                console.log(this.link() + ': Cached 1 observer.');
        }
        storageArray = [];
    }
    if (powerspawn) {
        for (let i = 0; i < powerspawn.length; i++)
            storageArray.push(powerspawn[i].id);
        if (storageArray.length) {
            this.memory.objects.powerSpawn = storageArray[0];
            if (storageArray.length >= 1)
                console.log(this.link() + ': Cached 1 power spawn.');
        }
        storageArray = [];
    }
    if (nuker) {
        for (let i = 0; i < nuker.length; i++)
            storageArray.push(nuker[i].id);
        if (storageArray.length) {
            this.memory.objects.nuker = storageArray[0];
            if (storageArray.length >= 1)
                console.log(this.link() + ': Cached 1 nuker.');
        }
        storageArray = [];
    }
    console.log(this.link() + ': Caching objects for room \'' + this.name + '\' completed.');
    return true;
};
Room.prototype.initTargets = function (array) {
    this.memory.targets = {};
};
Room.prototype.setTarget = function (roleTarget, newTarget) {
    const oldTarget = this.memory.targets[roleTarget];
    this.memory.targets[roleTarget] = newTarget;
    console.log(this.link() + ': Set role \'' + roleTarget + '\' target to ' + newTarget + ' (was ' + oldTarget + ').');
    return;
};
Room.prototype.sendEnergy = function () {
    const linkToLocal = Game.getObjectById(this.memory.objects.links[0]);
    const linkFromLocal = Game.getObjectById(this.memory.objects.links[1]);
    if (linkFromLocal.cooldown === 0) {
        linkFromLocal.transferEnergy(linkToLocal);
        console.log(this.link() + ': Transferring energy.');
        return;
    }
    else {
        console.log(this.link() + ': On cooldown, ' + linkFromLocal.cooldown + ' ticks remaining.');
        return;
    }
};
Room.prototype.initRoom = function () {
    if (!this.memory.objects)
        this.memory.objects = {};
    if (!this.memory.settings)
        this.memory.settings = { containerSettings: {}, labSettings: {}, repairSettings: {}, visualSettings: {}, flags: {} };
    if (!this.memory.paths)
        this.memory.paths = {};
    if (this.memory.objects.lastAssigned === undefined)
        this.memory.objects.lastAssigned = 0;
    if (!this.memory.data)
        this.memory.data = {};
    if (!this.memory.data.remoteLogistics)
        this.memory.data.remoteLogistics = {};
    if (!this.memory.data.combatObjectives)
        this.memory.data.combatObjectives = {};
    this.cacheObjects();
    this.initFlags();
    this.initSettings();
    if (this.controller && this.controller.my)
        this.initTargets();
};
Room.prototype.initTargets = function (targetArray = false) {
    if (!targetArray) {
        if (!this.memory.targets)
            this.memory.targets = {};
        this.memory.targets.harvester = 2;
        this.memory.targets.collector = 2;
        this.memory.targets.runner = 0;
        this.memory.targets.builder = 2;
        this.memory.targets.upgrader = 1;
        this.memory.targets.repairer = 0;
        this.memory.targets.crane = 0;
        this.memory.targets.miner = 0;
        this.memory.targets.scientist = 0;
        this.memory.targets.ranger = 0;
        this.memory.targets.warrior = 0;
        this.memory.targets.healer = 0;
        this.memory.targets.rebooter = 0;
        this.memory.targets.reserver = 0;
        this.memory.targets.remotelogistician = 0;
        this.memory.targets.remoteharvester = 0;
        this.memory.targets.remoterunner = 0;
        this.memory.targets.remotebuilder = 0;
        this.memory.targets.remoteguard = 0;
        this.memory.targets.claimer = 0;
        this.memory.targets.provider = 0;
        this.memory.targets.invader = 0;
        return;
    }
    else {
        if (targetArray.length < 18)
            return 'Not enough array indices provided.';
        this.memory.targets.harvester = targetArray[0];
        this.memory.targets.collector = targetArray[1];
        this.memory.targets.runner = targetArray[2];
        this.memory.targets.builder = targetArray[3];
        this.memory.targets.upgrader = targetArray[4];
        this.memory.targets.repairer = targetArray[5];
        this.memory.targets.ranger = targetArray[6];
        this.memory.targets.warrior = targetArray[7];
        this.memory.targets.healer = targetArray[8];
        this.memory.targets.rebooter = targetArray[9];
        this.memory.targets.reserver = targetArray[10];
        this.memory.targets.remoteharvester = targetArray[11];
        this.memory.targets.remoterunner = targetArray[12];
        this.memory.targets.remotebuilder = targetArray[13];
        this.memory.targets.remoteguard = targetArray[14];
        this.memory.targets.crane = targetArray[15];
        this.memory.targets.miner = targetArray[16];
        this.memory.targets.scientist = targetArray[17];
        return;
    }
};
Room.prototype.initFlags = function () {
    if (!this.memory.settings.flags)
        this.memory.settings.flags = {};
    if (this.memory.settings.flags.craneUpgrades === undefined)
        this.memory.settings.flags.craneUpgrades = false;
    if (this.memory.settings.flags.repairRamparts === undefined)
        this.memory.settings.flags.repairRamparts = false;
    if (this.memory.settings.flags.repairWalls === undefined)
        this.memory.settings.flags.repairWalls = false;
    if (this.memory.settings.flags.centralStorageLogic === undefined)
        this.memory.settings.flags.centralStorageLogic = false;
    if (this.memory.settings.flags.runnersDoMinerals === undefined)
        this.memory.settings.flags.runnersDoMinerals = false;
    if (this.memory.settings.flags.towerRepairBasic === undefined)
        this.memory.settings.flags.towerRepairBasic = false;
    if (this.memory.settings.flags.towerRepairDefenses === undefined)
        this.memory.settings.flags.towerRepairDefenses = false;
    if (this.memory.settings.flags.runnersDoPiles === undefined)
        this.memory.settings.flags.runnersDoPiles = false;
    if (this.memory.settings.flags.harvestersFixAdjacent === undefined)
        this.memory.settings.flags.harvestersFixAdjacent = false;
    if (this.memory.settings.flags.repairBasics === undefined)
        this.memory.settings.flags.repairBasics = false;
    if (this.memory.settings.flags.upgradersSeekEnergy === undefined)
        this.memory.settings.flags.upgradersSeekEnergy = false;
    if (this.memory.settings.flags.sortConSites === undefined)
        this.memory.settings.flags.sortConSites = false;
    if (this.memory.settings.flags.closestConSites === undefined)
        this.memory.settings.flags.closestConSites = false;
    console.log(this.link() + ': Room flags initialized: craneUpgrades(' + this.memory.settings.flags.craneUpgrades + ') centralStorageLogic(' + this.memory.settings.flags.centralStorageLogic + ') repairRamparts(' + this.memory.settings.flags.repairRamparts + ') repairWalls(' + this.memory.settings.flags.repairWalls + ') runnersDoMinerals(' + this.memory.settings.flags.runnersDoMinerals + ') towerRepairBasic(' + this.memory.settings.flags.towerRepairBasic + ') towerRepairDefenses(' + this.memory.settings.flags.towerRepairDefenses + ') runnersDoPiles(' + this.memory.settings.flags.runnersDoPiles + ') harvestersFixAdjacent(' + this.memory.settings.flags.harvestersFixAdjacent + ') repairBasics(' + this.memory.settings.flags.repairBasics + ') upgradersSeekEnergy(' + this.memory.settings.flags.upgradersSeekEnergy + ')');
    return;
};
Room.prototype.setRoomFlags = function (flags) {
    const flag1 = flags[0];
    const flag2 = flags[1];
    const flag3 = flags[2];
    const flag4 = flags[3];
    const flag5 = flags[4];
    const flag6 = flags[5];
    const flag7 = flags[6];
    const flag8 = flags[7];
    const flag9 = flags[8];
    const flag10 = flags[9];
    const flag11 = flags[10];
    if (flag1)
        this.memory.settings.flags.craneUpgrades = flag1;
    if (flag2)
        this.memory.settings.flags.repairRamparts = flag2;
    if (flag3)
        this.memory.settings.flags.repairWalls = flag3;
    if (flag4)
        this.memory.settings.flags.centralStorageLogic = flag4;
    if (flag5)
        this.memory.settings.flags.runnersDoMinerals = flag5;
    if (flag6)
        this.memory.settings.flags.towerRepairBasic = flag6;
    if (flag7)
        this.memory.settings.flags.towerRepairDefenses = flag7;
    if (flag8)
        this.memory.settings.flags.runnersDoPiles = flag8;
    if (flag9)
        this.memory.settings.flags.harvestersFixAdjacent = flag9;
    if (flag10)
        this.memory.settings.flags.repairBasics = flag10;
    if (flag11)
        this.memory.settings.flags.upgradersSeekEnergy = flag11;
    console.log(this.link() + ': Room flags set: centralStorageLogic(' + this.memory.settings.flags.centralStorageLogic + ') repairRamparts(' + this.memory.settings.flags.repairRamparts + ') repairWalls(' + this.memory.settings.flags.repairWalls + ') runnersDoMinerals(' + this.memory.settings.flags.runnersDoMinerals + ') towerRepairBasic(' + this.memory.settings.flags.towerRepairBasic + ') towerRepairDefenses(' + this.memory.settings.flags.towerRepairDefenses + ') runnersDoPiles(' + this.memory.settings.flags.runnersDoPiles + ') harvestersFixAdjacent(' + this.memory.settings.flags.harvestersFixAdjacent + ') repairBasics(' + this.memory.settings.flags.repairBasics + ') upgradersSeekEnergy(' + this.memory.settings.flags.upgradersSeekEnergy + ')');
    return;
};
Room.prototype.initSettings = function () {
    if (!this.memory.settings)
        this.memory.settings = { containerSettings: {}, labSettings: {}, repairSettings: {}, visualSettings: {}, flags: {} };
    if (!this.memory.data)
        this.memory.data = {};
    if (!this.memory.settings.flags)
        this.memory.settings.flags = {};
    if (!this.memory.settings.repairSettings)
        this.memory.settings.repairSettings = {};
    if (!this.memory.settings.labSettings)
        this.memory.settings.labSettings = {};
    if (!this.memory.settings.visualSettings)
        this.memory.settings.visualSettings = {};
    if (!this.memory.settings.containerSettings)
        this.memory.settings.containerSettings = {};
    if (!this.memory.settings.visualSettings.spawnInfo)
        this.memory.settings.visualSettings.spawnInfo = {};
    if (!this.memory.settings.visualSettings.roomFlags)
        this.memory.settings.visualSettings.roomFlags = {};
    if (this.memory.settings.repairSettings.repairRampartsTo === undefined)
        this.memory.settings.repairSettings.repairRampartsTo = 1;
    if (this.memory.settings.repairSettings.repairWallsTo === undefined)
        this.memory.settings.repairSettings.repairWallsTo = 1;
    if (!this.memory.settings.visualSettings.spawnInfo.alignment)
        this.memory.settings.visualSettings.spawnInfo.alignment = 'right';
    if (!this.memory.settings.visualSettings.spawnInfo.color)
        this.memory.settings.visualSettings.spawnInfo.color = '#ffffff';
    if (!this.memory.settings.visualSettings.spawnInfo.fontSize)
        this.memory.settings.visualSettings.spawnInfo.fontSize = 0.4;
    if (!this.memory.settings.visualSettings.roomFlags.displayCoords)
        this.memory.settings.visualSettings.roomFlags.displayCoords = [0, 49];
    if (!this.memory.settings.visualSettings.roomFlags.color)
        this.memory.settings.visualSettings.roomFlags.color = '#ff0033';
    if (!this.memory.settings.visualSettings.roomFlags.fontSize)
        this.memory.settings.visualSettings.roomFlags.fontSize = 0.4;
    if (!this.memory.settings.visualSettings.progressInfo)
        this.memory.settings.visualSettings.progressInfo = {};
    if (!this.memory.settings.visualSettings.progressInfo.alignment)
        this.memory.settings.visualSettings.progressInfo.alignment = 'left';
    if (!this.memory.settings.visualSettings.progressInfo.xOffset)
        this.memory.settings.visualSettings.progressInfo.xOffset = 1;
    if (!this.memory.settings.visualSettings.progressInfo.yOffsetFactor)
        this.memory.settings.visualSettings.progressInfo.yOffsetFactor = 0.6;
    if (!this.memory.settings.visualSettings.progressInfo.stroke)
        this.memory.settings.visualSettings.progressInfo.stroke = '#000000';
    if (!this.memory.settings.visualSettings.progressInfo.fontSize)
        this.memory.settings.visualSettings.progressInfo.fontSize = 0.6;
    if (!this.memory.settings.containerSettings.inboxes)
        this.memory.settings.containerSettings.inboxes = [];
    if (!this.memory.settings.containerSettings.outboxes)
        this.memory.settings.containerSettings.outboxes = [];
    if (this.memory.settings.containerSettings.lastInbox === undefined)
        this.memory.settings.containerSettings.lastInbox = 0;
    if (this.memory.settings.containerSettings.lastOutbox === undefined)
        this.memory.settings.containerSettings.lastOutbox = 0;
    if (this.memory.data.logisticalPairs === undefined)
        this.memory.data.logisticalPairs = [];
    if (this.memory.data.pairCounter === undefined)
        this.memory.data.pairCounter = 0;
    console.log(this.link() + ': Room settings initialized.');
    return;
};
Room.prototype.registerLogisticalPairs = function () {
    let energyOutboxes = [];
    let energyInbox;
    let sources = this.find(FIND_SOURCES);
    let logisticalPairs = [];
    let minerals = this.find(FIND_MINERALS);
    let mineralOutbox;
    let extractorBuilt = false;
    let linkDrops = this.find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_LINK && ((i.pos.x <= 4 || i.pos.x >= 45) || (i.pos.y <= 4 || i.pos.y >= 45)) });
    if (this.memory.objects.extractor !== undefined) {
        extractorBuilt = true;
        Game.getObjectById(this.memory.objects.extractor);
    }
    if (minerals) {
        const mineralOutboxArray = minerals[0].pos.findInRange(FIND_STRUCTURES, 3, { filter: { structureType: STRUCTURE_CONTAINER } });
        if (mineralOutboxArray.length > 0)
            mineralOutbox = mineralOutboxArray[0].id;
    }
    this.controller.pos.findInRange(FIND_STRUCTURES, 5, { filter: { structureType: STRUCTURE_CONTAINER } });
    if (energyInbox.length > 0)
        ;
    let storage;
    if (this.storage)
        storage = this.storage.id;
    let roomOutboxes = this.memory.settings.containerSettings.outboxes || [];
    let roomInboxes = this.memory.settings.containerSettings.inboxes || [];
    for (let i = 0; i < sources.length; i++) {
        let sourceBox = sources[i].pos.findInRange(FIND_STRUCTURES, 3, { filter: { structureType: STRUCTURE_CONTAINER } });
        if (sourceBox.length > 0)
            energyOutboxes.push(sourceBox[0].id);
    }
    if (energyOutboxes.length == 0 && !energyInbox)
        this.memory.data.noPairs = true;
    else {
        if (this.memory.data.noPairs)
            delete this.memory.data.noPairs;
    }
    for (let i = 0; i < energyOutboxes.length; i++) {
        if (!roomOutboxes.includes(energyOutboxes[i]))
            roomOutboxes.push(energyOutboxes[i]);
        this.setOutbox(energyOutboxes[i]);
    }
    if (!roomInboxes.includes(energyInbox))
        roomInboxes.push(energyInbox);
    this.memory.settings.containerSettings.inboxes = roomInboxes;
    if (this.storage) {
        for (let i = 0; i < energyOutboxes.length; i++) {
            const onePair = { source: energyOutboxes[i], destination: storage, resource: 'energy', locality: 'local', descriptor: 'source to storage' };
            if (onePair.source && onePair.destination)
                logisticalPairs.push(onePair);
            else
                console.log('Malformed Pair: ' + onePair);
        }
        if (this.memory.outposts) {
            const remoteContainers = this.memory.outposts.aggregateContainerList;
            for (let i = 0; i < remoteContainers.length; i++) {
                if (linkDrops.length > 0) {
                    for (let j = 0; j < linkDrops.length; j++) {
                        const remotePair = { source: remoteContainers[i], destination: linkDrops[j].id, resource: 'energy', locality: 'remote', descriptor: 'source to homelink' };
                        if (remotePair.source && remotePair.destination)
                            logisticalPairs.push(remotePair);
                        else
                            console.log('Malformed Pair: ' + remotePair);
                    }
                }
                else {
                    const remotePair = { source: remoteContainers[i], destination: storage, resource: 'energy', locality: 'remote', descriptor: 'source to storage' };
                    if (remotePair.source && remotePair.destination)
                        logisticalPairs.push(remotePair);
                    else
                        console.log('Malformed Pair: ' + remotePair);
                }
            }
        }
        if (energyInbox.length > 0) ;
        if (extractorBuilt && typeof mineralOutbox === 'string') {
            console.log('mineralOutbox: ' + mineralOutbox);
            console.log('storage: ' + storage);
            const minType = minerals[0].mineralType;
            const onePair = { source: mineralOutbox, destination: storage, resource: minType, locality: 'local', descriptor: 'extractor to storage' };
            if (onePair.source && onePair.destination)
                logisticalPairs.push(onePair);
            else
                console.log('Malformed Pair: ' + onePair);
        }
    }
    else {
        for (let i = 0; i < energyOutboxes.length; i++) {
            const onePair = { source: energyOutboxes[i], destination: energyInbox, resource: 'energy', locality: 'local', descriptor: 'source to upgrader' };
            if (onePair.source && onePair.destination)
                logisticalPairs.push(onePair);
            else
                console.log('Malformed Pair: ' + onePair);
        }
    }
    let pairReport = '';
    if (!this.memory.data)
        this.memory.data = {};
    if (!this.memory.data.logisticalPairs)
        this.memory.data.logisticalPairs = [];
    if (!this.memory.data.pairCounter)
        this.memory.data.pairCounter = 0;
    if (logisticalPairs.length > 1) {
        pairReport = '------------------------------------------------- ' + this.link() + ': REGISTERED LOGISTICAL PAIRS --------------------------------------------------\n';
        for (let i = 0; i < logisticalPairs.length; i++)
            pairReport += ' PAIR #' + (i + 1) + ': OUTBOX> ' + logisticalPairs[i].source + ' | INBOX> ' + logisticalPairs[i].destination + ' | CARGO> ' + logisticalPairs[i].resource + ' | LOCALITY> ' + logisticalPairs[i].locality + ' | TYPE> ' + logisticalPairs[i].descriptor + '\n';
    }
    else
        pairReport = 'No pairs available to register properly.';
    this.memory.data.logisticalPairs = logisticalPairs;
    if (this.memory.data.pairPaths) {
        delete this.memory.data.pairPaths;
        this.memory.data.pairPaths = [];
    }
    if (!this.memory.data.pairPaths)
        this.memory.data.pairPaths = [];
    for (let i = 0; i < logisticalPairs.length; i++) {
        const pair = logisticalPairs[i];
        const startPos = Game.getObjectById(pair.source);
        const endPos = Game.getObjectById(pair.destination);
        let pathObj = calcPath(startPos.pos, endPos.pos);
        let pathLen = pathObj.length;
        this.memory.data.logisticalPairs[i].distance = pathLen;
    }
    this.setTarget('runner', this.memory.data.logisticalPairs.length);
    return pairReport;
};
Room.prototype.setRepairRampartsTo = function (percentMax) {
    if (percentMax === undefined || percentMax < 0 || percentMax > 100)
        return 'Requires a value 0-100.';
    this.memory.settings.repairSettings.repairRampartsTo = percentMax;
    return 'Ramparts will now repair to ' + this.memory.settings.repairSettings.repairRampartsTo + '% max.';
};
Room.prototype.setRepairWallsTo = function (percentMax) {
    if (percentMax === undefined || percentMax < 0 || percentMax > 100)
        return 'Requires a value 0-100.';
    this.memory.settings.repairSettings.repairWallsTo = percentMax;
    return 'Walls will now repair to ' + this.memory.settings.repairSettings.repairWallsTo + '% max.';
};
Room.prototype.setRoomSettings = function (repairToArray, labSettingsArray) {
    const rampartsPercent = repairToArray[0];
    const wallsPercent = repairToArray[1];
    if (rampartsPercent)
        this.memory.settings.repairSettings.repairRampartsTo = rampartsPercent;
    if (wallsPercent)
        this.memory.settings.repairSettings.repairWallsTo = wallsPercent;
    console.log(this.link() + ': Room settings set: repairRampartsTo(' + this.memory.settings.repairSettings.repairRampartsTo + ') repairWallsTo(' + this.memory.settings.repairSettings.repairWallsTo + ')');
    return;
};
Room.prototype.setInbox = function (boxID) {
    let inboxMem = [];
    let outboxes = this.memory.settings.containerSettings.outboxes;
    if (this.memory.settings.containerSettings.inboxes !== undefined)
        inboxMem = inboxMem.concat(this.memory.settings.containerSettings.inboxes);
    if (inboxMem.includes(boxID))
        return 'This container ID is already in the inbox list.';
    else if (outboxes.includes(boxID))
        return 'This container ID is already set as an outbox.';
    else {
        inboxMem.push(boxID);
        this.memory.settings.containerSettings.inboxes = inboxMem;
        return true;
    }
};
Room.prototype.setOutbox = function (boxID) {
    let outboxMem = [];
    let inboxes = this.memory.settings.containerSettings.inboxes;
    outboxMem = outboxMem.concat(this.memory.settings.containerSettings.outboxes);
    if (outboxMem.includes(boxID))
        return 'This container ID is already in the outbox list.';
    else if (inboxes.includes(boxID))
        return 'This container ID is already set as an inbox.';
    else {
        outboxMem.push(boxID);
        this.memory.settings.containerSettings.outboxes = outboxMem;
        return true;
    }
};
Room.prototype.checkInbox = function (boxID) {
    const inboxes = this.getInboxes();
    if (inboxes.includes(boxID))
        return true;
    else
        return false;
};
Room.prototype.checkOutbox = function (boxID) {
    const outboxes = this.getOutboxes();
    if (outboxes.length > 0 && outboxes.includes(boxID))
        return true;
    else
        return false;
};
Room.prototype.enableFlag = function (flag, initIfNull = false) {
    if (this.memory.settings.flags[flag] === undefined && initIfNull === false) {
        console.log('The specified flag does not exist: ' + flag);
        return false;
    }
    if (initIfNull) {
        this.memory.settings.flags[flag] = true;
        return true;
    }
};
Room.prototype.disableFlag = function (flag, initIfNull = false) {
    if (this.memory.settings.flags[flag] === undefined && initIfNull === false) {
        console.log('The specified flag does not exist: ' + flag);
        return false;
    }
    if (initIfNull) {
        this.memory.settings.flags[flag] = false;
        return false;
    }
};
Room.prototype.toggleFlag = function (flag, initIfNull = false, defaultValue) {
    if (this.memory.settings.flags[flag] !== undefined) {
        const logicState = this.memory.settings.flags[flag];
        if (logicState) {
            this.memory.settings.flags[flag] = false;
            return false;
        }
        if (!logicState) {
            this.memory.settings.flags[flag] = true;
            return true;
        }
    }
    else {
        if (initIfNull) {
            this.memory.settings.flags[flag] = defaultValue || false;
            return this.memory.settings.flags[flag];
        }
        else {
            return 'The specified flag does not exist: ' + flag;
        }
    }
};
Room.prototype.clearRCLCounter = function () {
    Memory.miscData.rooms[this.name].controllerPPTArray = [];
    console.log(this.link() + ': Progress Per Tick array successfully cleared.');
    return;
};
Room.prototype.enableCentralStorageLogic = function () {
    this.memory.settings.flags.centralStorageLogic = true;
    return true;
};
Room.prototype.disableCentralStorageLogic = function () {
    this.memory.settings.flags.centralStorageLogic = false;
    return false;
};
Room.prototype.toggleCentralStorageLogic = function () {
    const logicState = this.memory.settings.flags.centralStorageLogic;
    if (logicState) {
        this.memory.settings.flags.centralStorageLogic = false;
        return false;
    }
    if (!logicState) {
        this.memory.settings.flags.centralStorageLogic = true;
        return true;
    }
};
Room.prototype.enableCraneUpgrades = function () {
    this.memory.settings.flags.craneUpgrades = true;
    return true;
};
Room.prototype.disableCraneUpgrades = function () {
    this.memory.settings.flags.craneUpgrades = false;
    return false;
};
Room.prototype.toggleCraneUpgrades = function () {
    const logicState = this.memory.settings.flags.craneUpgrades;
    if (logicState) {
        this.memory.settings.flags.craneUpgrades = false;
        return false;
    }
    if (!logicState) {
        this.memory.settings.flags.craneUpgrades = true;
        return true;
    }
};
Room.prototype.enableBoostCreeps = function (dontScience = false) {
    if (this.memory.settings.flags.doScience && !dontScience)
        return 'Cannot enable \'boostCreeps\' flag when \'doScience\' is set to true. (Provide boolean arg "true" in parameters to allow disabling of this flag.';
    if (!this.memory.settings.flags.doScience || dontScience) {
        this.memory.settings.flags.boostCreeps = true;
        return true;
    }
};
Room.prototype.disableBoostCreeps = function () {
    this.memory.settings.flags.boostCreeps = false;
    return false;
};
Room.prototype.toggleBoostCreeps = function (dontScience = false) {
    const logicState = this.memory.settings.flags.boostCreeps;
    const doScienceState = this.memory.settings.flags.doScience;
    if (!logicState && doScienceState && !dontScience)
        return 'Cannot enable \'boostCreeps\' flag when \'doScience\' is set to true. (Provide boolean arg "true" in parameters to allow disabling of this flag.';
    if (logicState) {
        this.memory.settings.flags.boostCreeps = false;
        return false;
    }
    if (!logicState) {
        if ((doScienceState || !doScienceState) && dontScience)
            this.memory.settings.flags.doScience = false;
        this.memory.settings.flags.boostCreeps = true;
        return true;
    }
};
Room.prototype.enableDoScience = function () {
    this.memory.settings.flags.doScience = true;
    return true;
};
Room.prototype.disableDoScience = function () {
    this.memory.settings.flags.doScience = false;
    return false;
};
Room.prototype.toggleDoScience = function () {
    const logicState = this.memory.settings.flags.doScience;
    if (logicState) {
        this.memory.settings.flags.doScience = false;
        return false;
    }
    if (!logicState) {
        this.memory.settings.flags.doScience = true;
        return true;
    }
};
Room.prototype.enableTowerRepairBasic = function () {
    this.memory.settings.flags.towerRepairBasic = true;
    return true;
};
Room.prototype.disableTowerRepairBasic = function () {
    this.memory.settings.flags.towerRepairBasic = false;
    return false;
};
Room.prototype.toggleTowerRepairBasic = function () {
    const logicState = this.memory.settings.flags.towerRepairBasic;
    if (logicState) {
        this.memory.settings.flags.towerRepairBasic = false;
        return false;
    }
    if (!logicState) {
        this.memory.settings.flags.towerRepairBasic = true;
        return true;
    }
};
Room.prototype.enableTowerRepairDefenses = function () {
    this.memory.settings.flags.towerRepairDefenses = true;
    return true;
};
Room.prototype.disableTowerRepairDefenses = function () {
    this.memory.settings.flags.towerRepairDefenses = false;
    return false;
};
Room.prototype.toggleTowerRepairDefenses = function () {
    const logicState = this.memory.settings.flags.towerRepairDefenses;
    if (logicState) {
        this.memory.settings.flags.towerRepairDefenses = false;
        return false;
    }
    if (!logicState) {
        this.memory.settings.flags.towerRepairDefenses = true;
        return true;
    }
};
Room.prototype.enableRunnersDoMinerals = function () {
    this.memory.settings.flags.runnersDoMinerals = true;
    return true;
};
Room.prototype.disableRunnersDoMinerals = function () {
    this.memory.settings.flags.runnersDoMinerals = false;
    return false;
};
Room.prototype.toggleRunnersDoMinerals = function () {
    const logicState = this.memory.settings.flags.runnersDoMinerals;
    if (logicState) {
        this.memory.settings.flags.runnersDoMinerals = false;
        return false;
    }
    if (!logicState) {
        this.memory.settings.flags.runnersDoMinerals = true;
        return true;
    }
};
Room.prototype.enableRepairWalls = function () {
    this.memory.settings.flags.repairWalls = true;
    return true;
};
Room.prototype.disableRepairWalls = function () {
    this.memory.settings.flags.repairWalls = false;
    return false;
};
Room.prototype.toggleRepairWalls = function () {
    const logicState = this.memory.settings.flags.repairWalls;
    if (logicState) {
        this.memory.settings.flags.repairWalls = false;
        return false;
    }
    if (!logicState) {
        this.memory.settings.flags.repairWalls = true;
        return true;
    }
};
Room.prototype.enableRepairRamparts = function () {
    this.memory.settings.flags.repairRamparts = true;
    return true;
};
Room.prototype.disableRepairRamparts = function () {
    this.memory.settings.flags.repairRamparts = false;
    return false;
};
Room.prototype.toggleRepairRamparts = function () {
    const logicState = this.memory.settings.flags.repairRamparts;
    if (logicState) {
        this.memory.settings.flags.repairRamparts = false;
        return false;
    }
    if (!logicState) {
        this.memory.settings.flags.repairRamparts = true;
        return true;
    }
};
Room.prototype.enableRepairBasics = function () {
    this.memory.settings.flags.repairBasics = true;
    return true;
};
Room.prototype.disableRepairBasics = function () {
    this.memory.settings.flags.repairBasics = false;
    return false;
};
Room.prototype.toggleRepairBasics = function () {
    const logicState = this.memory.settings.flags.repairBasics;
    if (logicState) {
        this.memory.settings.flags.repairBasics = false;
        return false;
    }
    if (!logicState) {
        this.memory.settings.flags.repairBasics = true;
        return true;
    }
};
Room.prototype.enableSortConSites = function () {
    this.memory.settings.flags.sortConSites = true;
    return true;
};
Room.prototype.disableSortConSites = function () {
    this.memory.settings.flags.sortConSites = false;
    return false;
};
Room.prototype.toggleSortConSites = function () {
    const logicState = this.memory.settings.flags.sortConSites;
    if (logicState) {
        this.memory.settings.flags.sortConSites = false;
        return false;
    }
    if (!logicState) {
        this.memory.settings.flags.sortConSites = true;
        return true;
    }
};
Room.prototype.calcLabReaction = function () {
    const baseReg1 = this.memory.settings.labSettings.reagentOne;
    const baseReg2 = this.memory.settings.labSettings.reagentTwo;
    let outputChem;
    if (baseReg1 === RESOURCE_OXYGEN || baseReg2 === RESOURCE_OXYGEN) {
        if (baseReg1 === RESOURCE_HYDROGEN || baseReg2 === RESOURCE_HYDROGEN)
            outputChem = RESOURCE_HYDROXIDE;
        else if (baseReg1 === RESOURCE_UTRIUM || baseReg2 === RESOURCE_UTRIUM)
            outputChem = RESOURCE_UTRIUM_OXIDE;
        else if (baseReg1 === RESOURCE_KEANIUM || baseReg2 === RESOURCE_KEANIUM)
            outputChem = RESOURCE_KEANIUM_OXIDE;
        else if (baseReg1 === RESOURCE_LEMERGIUM || baseReg2 === RESOURCE_LEMERGIUM)
            outputChem = RESOURCE_LEMERGIUM_OXIDE;
        else if (baseReg1 === RESOURCE_ZYNTHIUM || baseReg2 === RESOURCE_ZYNTHIUM)
            outputChem = RESOURCE_ZYNTHIUM_OXIDE;
        else if (baseReg1 === RESOURCE_GHODIUM || baseReg2 === RESOURCE_GHODIUM)
            outputChem = RESOURCE_GHODIUM_OXIDE;
    }
    else if (baseReg1 === RESOURCE_HYDROGEN || baseReg2 === RESOURCE_HYDROGEN) {
        if (baseReg1 === RESOURCE_UTRIUM || baseReg2 === RESOURCE_UTRIUM)
            outputChem = RESOURCE_UTRIUM_HYDRIDE;
        else if (baseReg1 === RESOURCE_KEANIUM || baseReg2 === RESOURCE_KEANIUM)
            outputChem = RESOURCE_KEANIUM_HYDRIDE;
        else if (baseReg1 === RESOURCE_LEMERGIUM || baseReg2 === RESOURCE_LEMERGIUM)
            outputChem = RESOURCE_LEMERGIUM_HYDRIDE;
        else if (baseReg1 === RESOURCE_ZYNTHIUM || baseReg2 === RESOURCE_ZYNTHIUM)
            outputChem = RESOURCE_ZYNTHIUM_HYDRIDE;
        else if (baseReg1 === RESOURCE_GHODIUM || baseReg2 === RESOURCE_GHODIUM)
            outputChem = RESOURCE_GHODIUM_HYDRIDE;
    }
    else if (baseReg1 === RESOURCE_ZYNTHIUM || baseReg2 === RESOURCE_ZYNTHIUM) {
        if (baseReg1 === RESOURCE_KEANIUM || baseReg2 === RESOURCE_KEANIUM)
            outputChem = RESOURCE_ZYNTHIUM_KEANITE;
    }
    else if (baseReg1 === RESOURCE_UTRIUM || baseReg2 === RESOURCE_UTRIUM) {
        if (baseReg1 === RESOURCE_LEMERGIUM || baseReg2 === RESOURCE_LEMERGIUM)
            outputChem = RESOURCE_UTRIUM_LEMERGITE;
    }
    else if (baseReg1 === RESOURCE_ZYNTHIUM_KEANITE || baseReg2 === RESOURCE_ZYNTHIUM_KEANITE) {
        if (baseReg1 === RESOURCE_UTRIUM_LEMERGITE || baseReg2 === RESOURCE_UTRIUM_LEMERGITE)
            outputChem = RESOURCE_GHODIUM;
    }
    else if (baseReg1 === RESOURCE_HYDROXIDE || baseReg2 === RESOURCE_HYDROXIDE) {
        if (baseReg1 === RESOURCE_UTRIUM_HYDRIDE || baseReg2 === RESOURCE_UTRIUM_HYDRIDE)
            outputChem = RESOURCE_UTRIUM_ACID;
        if (baseReg1 === RESOURCE_UTRIUM_OXIDE || baseReg2 === RESOURCE_UTRIUM_OXIDE)
            outputChem = RESOURCE_UTRIUM_ALKALIDE;
        if (baseReg1 === RESOURCE_KEANIUM_HYDRIDE || baseReg2 === RESOURCE_KEANIUM_HYDRIDE)
            outputChem = RESOURCE_KEANIUM_ACID;
        if (baseReg1 === RESOURCE_KEANIUM_OXIDE || baseReg2 === RESOURCE_KEANIUM_OXIDE)
            outputChem = RESOURCE_KEANIUM_ALKALIDE;
        if (baseReg1 === RESOURCE_LEMERGIUM_HYDRIDE || baseReg2 === RESOURCE_LEMERGIUM_HYDRIDE)
            outputChem = RESOURCE_LEMERGIUM_ACID;
        if (baseReg1 === RESOURCE_LEMERGIUM_OXIDE || baseReg2 === RESOURCE_LEMERGIUM_OXIDE)
            outputChem = RESOURCE_LEMERGIUM_ALKALIDE;
        if (baseReg1 === RESOURCE_ZYNTHIUM_HYDRIDE || baseReg2 === RESOURCE_ZYNTHIUM_HYDRIDE)
            outputChem = RESOURCE_ZYNTHIUM_ACID;
        if (baseReg1 === RESOURCE_ZYNTHIUM_OXIDE || baseReg2 === RESOURCE_ZYNTHIUM_OXIDE)
            outputChem = RESOURCE_ZYNTHIUM_ALKALIDE;
        if (baseReg1 === RESOURCE_GHODIUM_HYDRIDE || baseReg2 === RESOURCE_GHODIUM_HYDRIDE)
            outputChem = RESOURCE_GHODIUM_ACID;
        if (baseReg1 === RESOURCE_GHODIUM_OXIDE || baseReg2 === RESOURCE_GHODIUM_OXIDE)
            outputChem = RESOURCE_GHODIUM_ALKALIDE;
    }
    else if (baseReg1 === RESOURCE_CATALYST || baseReg2 === RESOURCE_CATALYST) {
        if (baseReg1 === RESOURCE_UTRIUM_ACID || baseReg2 == RESOURCE_UTRIUM_ACID)
            outputChem = RESOURCE_CATALYZED_UTRIUM_ACID;
        if (baseReg1 === RESOURCE_UTRIUM_ALKALIDE || baseReg2 == RESOURCE_UTRIUM_ALKALIDE)
            outputChem = RESOURCE_CATALYZED_UTRIUM_ALKALIDE;
        if (baseReg1 === RESOURCE_KEANIUM_ACID || baseReg2 == RESOURCE_KEANIUM_ACID)
            outputChem = RESOURCE_CATALYZED_KEANIUM_ACID;
        if (baseReg1 === RESOURCE_KEANIUM_ALKALIDE || baseReg2 == RESOURCE_KEANIUM_ALKALIDE)
            outputChem = RESOURCE_CATALYZED_KEANIUM_ALKALIDE;
        if (baseReg1 === RESOURCE_LEMERGIUM_ACID || baseReg2 == RESOURCE_LEMERGIUM_ACID)
            outputChem = RESOURCE_CATALYZED_LEMERGIUM_ACID;
        if (baseReg1 === RESOURCE_LEMERGIUM_ALKALIDE || baseReg2 == RESOURCE_LEMERGIUM_ALKALIDE)
            outputChem = RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE;
        if (baseReg1 === RESOURCE_ZYNTHIUM_ACID || baseReg2 == RESOURCE_ZYNTHIUM_ACID)
            outputChem = RESOURCE_CATALYZED_ZYNTHIUM_ACID;
        if (baseReg1 === RESOURCE_ZYNTHIUM_ALKALIDE || baseReg2 == RESOURCE_ZYNTHIUM_ALKALIDE)
            outputChem = RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE;
        if (baseReg1 === RESOURCE_GHODIUM_ACID || baseReg2 == RESOURCE_GHODIUM_ACID)
            outputChem = RESOURCE_CATALYZED_GHODIUM_ACID;
        if (baseReg1 === RESOURCE_GHODIUM_ALKALIDE || baseReg2 == RESOURCE_GHODIUM_ALKALIDE)
            outputChem = RESOURCE_CATALYZED_GHODIUM_ALKALIDE;
    }
    return outputChem;
};
Room.prototype.setSquad = function (squadName) {
    if (this.memory.data.squads === undefined)
        this.memory.data.squads = [];
    const squads = this.memory.data.squads;
    if (squads.find((s) => s === squadName)) {
        const index = squads.indexOf(squadName);
        console.log(this.link() + ': Squad #' + (index + 1) + ' (' + squadName + ') already exists.');
        return squadName;
    }
    else {
        let squads = this.memory.data.squads;
        squads.push(squadName);
        this.memory.data.squads = squads;
        console.log(this.link() + ': Squad #' + squads.length + ' set as \'' + squadName + '\'.');
        return squadName;
    }
};
Room.prototype.setMusterPoint = function (squadName, posArray, roomName = false) {
    if (!roomName)
        roomName = this.name;
    else {
        const isValid = validateRoomName(roomName);
        if (!isValid)
            return 'Invalid room name.';
    }
    const squads = this.memory.data.squads;
    const squadIndex = squads.indexOf(squadName);
    if (this.memory.data.squads[squadIndex] === undefined)
        this.memory.data.squads.push(squadName);
    const musterPos = new RoomPosition(posArray[0], posArray[1], roomName);
    this.createFlag(musterPos, squadName + '-muster', randomColor(), randomColor());
    console.log(this.link() + ': Created muster point for squad \'' + squadName + '\' with name of \'' + squadName + '-muster\' at x=' + posArray[0] + ', y=' + posArray[1] + ' in room ' + roomName + '.');
    return true;
};
Room.prototype.registerOutpost = function (roomName) {
    if (!this.memory.outposts)
        this.memory.outposts = {};
    if (!this.memory.outposts.roomList)
        this.memory.outposts.roomList = [];
    if (!this.memory.outposts.registry)
        this.memory.outposts.registry = {};
    if (!this.memory.outposts.aggregateSourceList)
        this.memory.outposts.aggregateSourceList = [];
    if (!this.memory.outposts.aggLastAssigned)
        this.memory.outposts.aggLastAssigned = 0;
    let currentOutpostList = this.memory.outposts.roomList;
    let exits;
    let outpostRoomName;
    let outpostDirection;
    if (typeof roomName === 'number') {
        exits = Game.map.describeExits(this.name);
        outpostRoomName = exits[roomName.toString()];
        switch (roomName) {
            case 1:
                outpostDirection = TOP;
                break;
            case 3:
                outpostDirection = RIGHT;
                break;
            case 5:
                outpostDirection = BOTTOM;
                break;
            case 7:
                outpostDirection = LEFT;
                break;
            default:
                console.log(this.link() + ': You did not specify a valid room name or direction (numeric or string).');
                return;
        }
    }
    else if (typeof roomName === 'string') {
        exits = Game.map.describeExits(roomName);
        switch (roomName) {
            case 'north':
                outpostDirection = TOP;
                break;
            case 'east':
                outpostDirection = RIGHT;
                break;
            case 'south':
                outpostDirection = BOTTOM;
                break;
            case 'west':
                outpostDirection = LEFT;
                break;
            default:
                if (Game.map.describeExits(roomName) === null) {
                    console.log(this.link() + ': You did not specify a valid room name or direction (numeric or string).');
                    return;
                }
        }
    }
    else {
        console.log(this.link() + ': You must provide a valid room name or direction (numeric or string). Other data types are not supported.');
        return;
    }
    if (currentOutpostList.includes(outpostRoomName)) {
        console.log(this.link() + ': This outpost is already registered.');
        return;
    }
    const homeRoomName = this.name;
    const newOutpost = {
        name: outpostRoomName,
        homeRoom: homeRoomName,
        controller: Game.rooms[outpostRoomName].memory.objects.controller || null,
        sources: Game.rooms[outpostRoomName].memory.objects.sources || null,
        mineral: Game.rooms[outpostRoomName].memory.objects.mineral || null,
        containers: Game.rooms[outpostRoomName].memory.objects.containers || null,
        lastAssigned: 0,
        direction: outpostDirection,
        rallyPoint: createRoomFlag(outpostRoomName)
    };
    this.memory.outposts.aggregateSourceList = this.memory.outposts.aggregateSourceList.concat(newOutpost.sources);
    if (Memory.rooms[outpostRoomName].objects.containers !== undefined && Memory.rooms[outpostRoomName].objects.containers.length > 0) {
        this.memory.outposts.aggregateContainerList = this.memory.outposts.aggregateContainerList.concat(newOutpost.containers);
    }
    this.memory.outposts.registry[outpostRoomName] = newOutpost;
    Memory.rooms[outpostRoomName].outpostOfRoom = this.name;
    currentOutpostList.push(outpostRoomName);
    this.memory.outposts.roomList = currentOutpostList;
    console.log(this.link() + ': Outpost at ' + outpostRoomName + ' successfully registered.');
    return;
};
Room.prototype.registerOutpostContainers = function (outpostName) {
    if (typeof outpostName === 'string') {
        Game.rooms[outpostName].cacheObjects();
        if (Game.rooms[outpostName].memory.objects.containers !== undefined && Game.rooms[outpostName].memory.objects.containers.length > 0) {
            const outpostContainerArray = Game.rooms[outpostName].memory.objects.containers;
            if (this.memory.outposts.aggregateContainerList === undefined)
                this.memory.outposts.aggregateContainerList = [];
            if (this.memory.outposts.aggLastContainer === undefined)
                this.memory.outposts.aggLastContainer = 0;
            let aggContainerList = this.memory.outposts.aggregateContainerList;
            for (let i = 0; i < outpostContainerArray.length; i++) {
                if (aggContainerList.includes(outpostContainerArray[i]))
                    continue;
                else
                    aggContainerList.push(outpostContainerArray[i]);
            }
            this.memory.outposts.aggregateContainerList = aggContainerList;
            const sourceListLen = this.memory.outposts.aggregateSourceList.length;
            return 'New aggregate container list now includes ' + aggContainerList.length + ' items, for ' + sourceListLen + ' sources.';
        }
    }
    else if (typeof outpostName === 'undefined') {
        this.cacheObjects();
        if (this.memory.objects.containers !== undefined && this.memory.objects.containers.length > 0) {
            const homeRoomName = this.memory.outpostOfRoom;
            const outpostContainerArray = this.memory.objects.containers;
            if (Game.rooms[homeRoomName].memory.outposts.aggregateContainerList === undefined)
                Game.rooms[homeRoomName].memory.outposts.aggregateContainerList = [];
            if (Game.rooms[homeRoomName].memory.outposts.aggLastContainer === undefined)
                Game.rooms[homeRoomName].memory.outposts.aggLastContainer = 0;
            let aggContainerList = Game.rooms[homeRoomName].memory.outposts.aggregateContainerList;
            for (let i = 0; i < outpostContainerArray.length; i++) {
                if (aggContainerList.includes(outpostContainerArray[i]))
                    continue;
                else
                    aggContainerList.push(outpostContainerArray[i]);
            }
            Game.rooms[homeRoomName].memory.outposts.aggregateContainerList = aggContainerList;
            const sourceListLen = Game.rooms[homeRoomName].memory.outposts.aggregateSourceList.length;
            return 'New aggregate container list now includes ' + aggContainerList.length + ' items, for ' + sourceListLen + ' sources.';
        }
    }
    else {
        return 'Invalid parameter specified. Either include the home room\'s outpost room name room name as a string, or call from the outpost room itself.';
    }
};
Room.prototype.calcOutpostPotential = function () {
    Object.keys(Game.map.describeExits(this.name));
    Object.values(Game.map.describeExits(this.name));
};
Room.prototype.registerLinks = function () {
    if (this.memory.data === undefined)
        this.memory.data = {};
    if (this.memory.objects.links === undefined)
        this.cacheObjects();
    if (this.memory.data.linkRegistry === undefined)
        this.memory.data.linkRegistry = {};
    if (this.memory.objects.links) {
        this.memory.objects.links.length;
        let linkCentral;
        let linkSource1;
        let linkSource2;
        let linkDestination;
        let linkRemotes;
        const storage = this.storage;
        const source1 = Game.getObjectById(this.memory.objects.sources[0]);
        const source2 = Game.getObjectById(this.memory.objects.sources[1]);
        const controller = this.controller;
        linkCentral = storage.pos.findInRange(FIND_MY_STRUCTURES, 3, { filter: { structureType: STRUCTURE_LINK } });
        linkSource1 = source1.pos.findInRange(FIND_MY_STRUCTURES, 3, { filter: { structureType: STRUCTURE_LINK } });
        linkSource2 = source2.pos.findInRange(FIND_MY_STRUCTURES, 3, { filter: { structureType: STRUCTURE_LINK } });
        linkDestination = controller.pos.findInRange(FIND_MY_STRUCTURES, 3, { filter: { structureType: STRUCTURE_LINK } });
        linkRemotes = this.find(FIND_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_LINK && ((i.pos.x <= 4 || i.pos.x >= 45) && (i.pos.y <= 4 || i.pos.y >= 45)) });
        let linkReport = this.link() + ': LINK REGISTRATION REPORT:-------------------###';
        if (linkCentral.length > 0) {
            this.memory.data.linkRegistry.central = linkCentral[0].id;
            linkReport += '\n CENTRAL LINK: REGISTERED';
        }
        if (linkSource1.length > 0) {
            this.memory.data.linkRegistry.sourceOne = linkSource1[0].id;
            linkReport += '\n SOURCE ONE LINK: REGISTERED';
        }
        if (linkSource2.length > 0) {
            this.memory.data.linkRegistry.sourceTwo = linkSource2[0].id;
            linkReport += '\n SOURCE TWO LINK: REGISTERED';
        }
        if (linkDestination.length > 0) {
            this.memory.data.linkRegistry.destination = linkDestination[0].id;
            linkReport += '\n CONTROLLER LINK: REGISTERED';
        }
        if (linkRemotes.length > 0) {
            let remoteIDs = [];
            for (let i = 0; i < linkRemotes.length; i++) {
                remoteIDs.push(linkRemotes[i].id);
            }
            this.memory.data.linkRegistry.remotes = remoteIDs;
        }
        console.log(linkReport);
        return linkReport;
    }
};
Room.prototype.registerInvaderGroup = function (rallyPoint, targetRoom, groupSize = 2, groupRoles = ['melee', 'healer']) {
    if (Game.rooms[targetRoom])
        this.memory.data.attackRoom = targetRoom;
    else {
        console.log(this.link() + ': Invalid targetRoom specified. Please provide a valid room name.');
        return;
    }
};
Room.prototype.setCraneSpot = function (posX, posY) {
    this.memory.data.craneSpot = [posX, posY];
    console.log(this.link() + ': Set craneSpot to ' + posX + ', ' + posY + '.');
};
Room.prototype.setRemoteTargets = function (roomName, roomXY, waypoints = false, rbCount = 0, rlCount = 0, claimRoom = false, override = false) {
    if (override && this.memory.data.remoteWorkRoom !== roomName)
        return 'Current remoteWorkRoom already exists and override flag is not set.';
    if (this.memory.data.remoteLogistics === undefined)
        this.memory.data.remoteLogistics = {};
    if (this.memory.data.remoteLogistics[roomName] === undefined)
        this.memory.data.remoteLogistics[roomName] = { roomName: roomName, desiredBuilderCount: rbCount, desiredLogisticianCount: rlCount, logisticsTarget: roomXY };
    const homeRoomMem = this.memory.data.remoteLogistics[roomName];
    let report = '>> REMOTE LOGISTICS REPORT (' + roomName + ')-----------------';
    if (roomXY instanceof Array) {
        if (typeof roomXY[0] === 'number' && typeof roomXY[1] === 'number') {
            report += '\n>> LOGISTICS TARGET: X|' + roomXY[0] + ' Y|' + roomXY[1];
        }
    }
    if (claimRoom) {
        this.memory.data.claimRoom = roomName;
    }
    this.memory.data.remoteWorkRoom = roomName;
    report += '\n>>>> DESIRED BUILDER COUNT: ' + rbCount;
    report += '\n>>>> DESIRED LOGISTICIAN COUNT: ' + rlCount;
    if (waypoints) {
        homeRoomMem.waypoints = waypoints;
        report += '\n>>>> WAYPOINTS: ' + waypoints;
    }
    console.log(report);
};
Room.prototype.link = function () {
    return `<a href="#!/room/${Game.shard.name}/${this.name}">[${this.name}]</a>`;
};
Room.prototype.findRemoteLinks = function () {
    const northBox = this.lookForAtArea(LOOK_STRUCTURES, 0, 0, 5, 49, true);
    const southBox = this.lookForAtArea(LOOK_STRUCTURES, 44, 0, 49, 49, true);
    const westBox = this.lookForAtArea(LOOK_STRUCTURES, 0, 0, 49, 5, true);
    const eastBox = this.lookForAtArea(LOOK_STRUCTURES, 0, 44, 49, 49, true);
    _.filter(northBox, (s) => s.structure.structureType == STRUCTURE_LINK);
    _.filter(southBox, (s) => s.structure.structureType == STRUCTURE_LINK);
    _.filter(westBox, (s) => s.structure.structureType == STRUCTURE_LINK);
    _.filter(eastBox, (s) => s.structure.structureType == STRUCTURE_LINK);
    let aggregateResults = [];
    aggregateResults = aggregateResults.concat(northBox);
    aggregateResults = aggregateResults.concat(southBox);
    aggregateResults = aggregateResults.concat(westBox);
    aggregateResults = aggregateResults.concat(eastBox);
    console.log(JSON.stringify(aggregateResults));
};

RoomPosition.prototype.getNearbyPositions = function () {
    var positions = [];
    let startX = this.x - 1 || 1;
    let startY = this.y - 1 || 1;
    for (let x = startX; x <= this.x + 1 && x < 49; x++) {
        for (let y = startY; y <= this.y + 1 && y < 49; y++) {
            if (x !== this.x || y !== this.y) {
                positions.push(new RoomPosition(x, y, this.roomName));
            }
        }
    }
    return positions;
};
RoomPosition.prototype.getOpenPositions = function () {
    let nearbyPositions = this.getNearbyPositions();
    const terrain = Game.map.getRoomTerrain(this.roomName);
    let walkablePositions = _.filter(nearbyPositions, function (pos) {
        return terrain.get(pos.x, pos.y) !== TERRAIN_MASK_WALL;
    });
    let freePositions = _.filter(walkablePositions, function (pos) {
        return !pos.lookFor(LOOK_CREEPS).length;
    });
    return freePositions;
};
RoomPosition.prototype.link = function () {
    return `<a href="#!/room/${Game.shard.name}/${this.roomName}">[${this.roomName} ${this.x},${this.y}]</a>`;
};

Spawn.prototype.spawnDismantler = function (maxEnergy = false) {
    Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK], 'RAWRR', { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: 'W13N34', rallyPoint: 'W13N33', customAttackTarget: '6050a493210d07b5d7fd9247' } });
    Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK], 'RBguy', { memory: { role: 'remotebuilder', roleForQuota: 'remotebuilder', homeRoom: 'W13N34', rallyPoint: 'W13N33', workRoom: 'W13N33' } });
};
Spawn.prototype.spawnWarrior = function (creepName, targetRoom, waypoints = 'none', maxEnergy = false) {
    if (!validateRoomName(targetRoom))
        return 'Invalid roomname provided.';
    if (!validateFlagName(waypoints))
        return 'Invalid waypoints provided.';
    const baseBody = [MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK];
    const result = this.spawnCreep(baseBody, creepName, { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } });
    return this.room.link() + 'Spawning warrior (target: ' + targetRoom + ')... RESULT CODE: ' + result;
};
Spawn.prototype.spawnHarvester = function (targetRoom, name) {
    const result = this.spawnCreep([CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK], name, { memory: { role: 'harvester', roleForQuota: 'harvester', homeRoom: targetRoom, rallyPoint: targetRoom } });
    return '[' + this.room.name + ']: Spawning harvester (home: ' + targetRoom + ')... RESULT CODE: ' + result;
};
Spawn.prototype.spawnClaimer = function (claimRoom) {
    const homeRoom = this.room.name;
    this.spawnCreep([MOVE, CLAIM], 'Claimer', { memory: { role: 'claimer', roleForQuota: 'claimer', homeRoom: homeRoom, claimRoom: claimRoom } });
    return '[' + this.room.name + ']: Spawning claimer (home: ' + homeRoom + ') (claim: ' + claimRoom + ')';
};
Spawn.prototype.determineBodyparts = function (creepRole, maxEnergy) {
    switch (creepRole) {
        case 'reserver':
            break;
        case 'rebooter':
            break;
        case 'harvester':
            break;
        case 'upgrader':
            break;
        case 'builder':
            break;
        case 'collector':
            break;
        case 'repairer':
            break;
        case 'ranger':
            break;
        case 'warrior':
            break;
        case 'runner':
            const maxCarryCost = Math.ceil(maxEnergy / 3 * 2);
            const maxMoveCost = Math.floor(maxEnergy / 3);
            let currCarryCost = 0;
            let currMoveCost = 0;
            const locality = this.room.memory.data.logisticalPairs[this.room.memory.data.pairCounter].locality;
            const pathLen = this.room.memory.data.logisticalPairs[this.room.memory.data.pairCounter].distance;
            const carryParts = (Math.ceil(Math.ceil(pathLen / 5) * 5) * 2 / 5) + 1;
            const moveParts = Math.ceil(carryParts / 2);
            let bodyArray = [];
            for (let i = carryParts; i > 0; i--) {
                if (currCarryCost < maxCarryCost) {
                    bodyArray.push(CARRY);
                    currCarryCost += 50;
                }
            }
            for (let i = moveParts; i > 0; i--) {
                if (currMoveCost < maxMoveCost) {
                    bodyArray.push(MOVE);
                    currMoveCost += 50;
                }
            }
            const partCost = currCarryCost + currMoveCost;
            if (locality == 'remote') {
                let isEven = carryParts % 2;
                if (isEven == 0) {
                    if (maxEnergy - partCost >= 150) {
                        bodyArray.push(WORK);
                        bodyArray.push(MOVE);
                    }
                }
                else {
                    if (maxEnergy - partCost >= 100)
                        bodyArray.push(WORK);
                }
            }
            return bodyArray;
    }
};

const spawnVariants = {
    'harvester200': [MOVE, WORK],
    'harvester300': [MOVE, WORK, WORK],
    'harvester400': [MOVE, WORK, WORK, WORK],
    'harvester500': [MOVE, WORK, WORK, WORK, WORK],
    'harvester600': [MOVE, WORK, WORK, WORK, WORK, WORK],
    'harvester750': [MOVE, WORK, WORK, WORK, WORK, WORK, WORK],
    'harvester950': [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK],
    'collector100': [CARRY, MOVE],
    'collector300': [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    'collector400': [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE],
    'collector500': [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    'collector800': [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE],
    'collector1000': [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    'upgrader300': [CARRY, MOVE, WORK, WORK],
    'upgrader400': [CARRY, CARRY, CARRY, MOVE, MOVE, WORK, WORK],
    'upgrader500': [CARRY, MOVE, WORK, WORK, WORK, WORK],
    'upgrader550': [CARRY, MOVE, MOVE, WORK, WORK, WORK, WORK],
    'upgrader700': [CARRY, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK],
    'upgrader900': [CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK],
    'builder300': [CARRY, CARRY, MOVE, MOVE, WORK,],
    'builder350': [CARRY, CARRY, MOVE, MOVE, MOVE, WORK],
    'builder500': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, WORK, WORK],
    'builder800': [CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK],
    'builder1000': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK],
    'builder1100': [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK],
    'builder1600': [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK],
    'repairer300': [CARRY, MOVE, WORK, WORK],
    'repairer500': [CARRY, CARRY, MOVE, MOVE, WORK, WORK, WORK],
    'repairer800': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK],
    'repairer1000': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK],
    'repairer1400': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK],
    'runner300': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    'runner500': [CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE],
    'runner800': [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    'crane300': [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE],
    'crane500': [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE],
    'crane800': [CARRY, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, MOVE, MOVE],
    'warrior520': [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK],
    'warrior1400': [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK, ATTACK],
    'healer1200': [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, HEAL, HEAL, HEAL],
    'remoteGuard700': [TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, ATTACK, ATTACK, ATTACK, ATTACK],
    'remoteLogistician1200': [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE],
    'remoteLogistician1500': [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE]
};
let availableVariants = {
    'harvester': [],
    'collector': [],
    'upgrader': [],
    'builder': [],
    'repairer': [],
    'runner': [],
    'warrior': [],
    'crane': [],
    'remoteGuard': [],
    'remoteLogistician': []
};
let builderCount = 1;
let collectorCount = 1;
let craneCount = 1;
let harvesterCount = 1;
let healerCount = 1;
let minerCount = 1;
let rangerCount = 1;
let rebooterCount = 1;
let repairerCount = 1;
let reserverCount = 1;
let runnerCount = 1;
let scientistCount = 1;
let scoutCount = 1;
let upgraderCount = 1;
let warriorCount = 1;
let remoteBuilderCount = 1;
let remoteGuardCount = 1;
let remoteHarvesterCount = 1;
let remoteLogisticianCount = 1;
let remoteRunnerCount = 1;
let tickCount = 0;
let newName = '';
let harvesterDying = false;
let runnerDying = false;
let reserverDying = false;
let collectorDying = false;
let remoteHarvesterDying = false;
let remoteGuardDying = false;
Memory.miscData = {
    'containerCounter': 0,
    'outpostRoomCounter': 0,
    'outpostSourceCounter': 0,
    'outpostCounter': 0,
    'rooms': {
        'W5N43': {}
    }
};
const colonies = { colonyList: [], registry: {} };
Memory.colonies = colonies;
const loop = ErrorMapper.wrapLoop(() => {
    if (typeof Memory.colonies === undefined)
        Memory.colonies = {};
    if (typeof Memory.colonies.colonyList === undefined)
        Memory.colonies.colonyList = [];
    if (Memory.globalSettings === undefined) {
        Memory.globalSettings = {};
        Memory.globalSettings.consoleSpawnInterval = 10;
    }
    calcTickTime();
    if (Game.shard.name === 'shard3') {
        if (Game.cpu.bucket == 10000) {
            Game.cpu.generatePixel();
            console.log('CPU Bucket at limit, generating pixel...');
        }
    }
    for (let name in Memory.creeps) {
        if (!Game.creeps[name]) {
            const role = Memory.creeps[name].role;
            delete Memory.creeps[name];
            console.log('Clearing nonexistent creep memory: ', name);
            switch (role) {
                case 'builder':
                    builderCount = 1;
                    break;
                case 'claimer':
                    break;
                case 'collector':
                    collectorCount = 1;
                    break;
                case 'crane':
                    craneCount = 1;
                    break;
                case 'harvester':
                    harvesterCount = 1;
                    break;
                case 'healer':
                    healerCount = 1;
                    break;
                case 'invader':
                    break;
                case 'miner':
                    minerCount = 1;
                    break;
                case 'provider':
                    break;
                case 'ranger':
                    rangerCount = 1;
                    break;
                case 'rebooter':
                    rebooterCount = 1;
                    break;
                case 'repairer':
                    repairerCount = 1;
                    break;
                case 'reserver':
                    reserverCount = 1;
                    break;
                case 'runner':
                    runnerCount = 1;
                    break;
                case 'scientist':
                    scientistCount = 1;
                    break;
                case 'scout':
                    scoutCount = 1;
                    break;
                case 'upgrader':
                    upgraderCount = 1;
                    break;
                case 'warrior':
                    warriorCount = 1;
                    break;
                case 'remotebuilder':
                    remoteBuilderCount = 1;
                    break;
                case 'remoteguard':
                    remoteGuardCount = 1;
                    break;
                case 'remoteharvester':
                    remoteHarvesterCount = 1;
                    break;
                case 'remotelogistician':
                    remoteLogisticianCount = 1;
                    break;
                case 'remoterunner':
                    remoteRunnerCount = 1;
                    break;
            }
        }
    }
    _.forEach(Game.rooms, function (room) {
        const rMem = room.memory;
        if (!rMem.objects) {
            console.log('[' + room.name + ']: No room objects in memory. Caching.');
            room.cacheObjects();
        }
        if (!rMem.settings) {
            room.initSettings();
            room.initFlags();
        }
        if (Memory.miscData.rooms[room.name] === undefined)
            Memory.miscData.rooms[room.name] = {};
        const cSites = room.find(FIND_CONSTRUCTION_SITES, { filter: (i) => i.structureType !== STRUCTURE_ROAD });
        const numCSitesPrevious = rMem.data.numCSites || 0;
        rMem.data.numCSites = cSites.length;
        const numCSites = rMem.data.numCSites;
        if (numCSites < numCSitesPrevious)
            room.cacheObjects();
        if (room && room.controller && room.controller.my) {
            rMem.data;
            rMem.objects;
            rMem.settings;
            rMem.settings.flags;
            Memory.colonies;
            if (tickCount > 0 && tickCount % 1000 == 0) {
                console.log('MAIN LOOP, CACHING OBJECTS EVERY 1000 TICKS --- Tick#: ' + tickCount);
                room.cacheObjects();
                tickCount = 0;
            }
            if (Memory.colonies.registry[room.name] === undefined) {
                Memory.colonies.registry[room.name] = {};
                let colonyListArray = Memory.colonies.colonyList || [];
                console.log(colonyListArray);
                colonyListArray.push(room.name);
                Memory.colonies.colonyList = colonyListArray;
                Memory.colonies.registry[room.name].ID = Memory.colonies.colonyList.length;
                Memory.colonies.registry[room.name].level = room.controller.level;
                Memory.colonies.registry[room.name].spawns = [];
                Memory.colonies.registry[room.name].exitDirs = Object.keys(Game.map.describeExits(room.name));
                Memory.colonies.registry[room.name].exitRooms = Object.values(Game.map.describeExits(room.name));
                Memory.colonies.registry[room.name].outposts = {};
            }
            if (room.controller.level !== Memory.colonies.registry[room.name].level)
                Memory.colonies.registry[room.name].level = room.controller.level;
            const roomSpawns = room.find(FIND_MY_SPAWNS);
            let roomSpawnsNames = [];
            for (let i = 0; i < roomSpawns.length; i++)
                roomSpawnsNames.push(roomSpawns[i].name);
            if (Memory.colonies.registry[room.name].spawns.length < roomSpawnsNames.length)
                Memory.colonies.registry[room.name].spawns = roomSpawnsNames;
            if (!rMem.data.upgraderBucket) {
                const upgraderBucket = room.controller.pos.findInRange(FIND_STRUCTURES, 5, { filter: (i) => i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_STORAGE || i.structureType == STRUCTURE_LINK });
                if (upgraderBucket.length > 0)
                    rMem.data.upgraderBucket = upgraderBucket[0].id;
            }
            const roomName = room.name;
            if (rMem.objects === undefined)
                room.cacheObjects();
            if (!rMem.settings)
                room.initSettings();
            if (!rMem.settings.flags)
                room.initFlags();
            if (!rMem.targets)
                room.initTargets();
            const spawn = Game.getObjectById(rMem.objects.spawns[0]);
            roomDefense(room);
            let harvesterTarget = _.get(room.memory, ['targets', 'harvester'], 2);
            let collectorTarget = _.get(room.memory, ['targets', 'collector'], 2);
            let upgraderTarget = _.get(room.memory, ['targets', 'upgrader'], 2);
            let builderTarget = _.get(room.memory, ['targets', 'builder'], 2);
            let repairerTarget = _.get(room.memory, ['targets', 'repairer'], 1);
            let runnerTarget = _.get(room.memory, ['targets', 'runner'], 3);
            let rebooterTarget = _.get(room.memory, ['targets', 'rebooter'], 0);
            let reserverTarget = _.get(room.memory, ['targets', 'reserver'], 0);
            let rangerTarget = _.get(room.memory, ['targets', 'ranger'], 0);
            let warriorTarget = _.get(room.memory, ['targets', 'warrior'], 0);
            let healerTarget = _.get(room.memory, ['targets', 'healer'], 0);
            let craneTarget = _.get(room.memory, ['targets', 'crane'], 0);
            let minerTarget = _.get(room.memory, ['targets', 'miner'], 0);
            let scientistTarget = _.get(room.memory, ['targets', 'scientist'], 0);
            let scoutTarget = _.get(room.memory, ['targets', 'scout'], 0);
            let remoteHarvesterTarget;
            if (rMem.outposts)
                remoteHarvesterTarget = rMem.outposts.aggregateSourceList.length;
            else
                remoteHarvesterTarget = _.get(room.memory, ['targets', 'remoteharvester'], 1);
            let remoteRunnerTarget = _.get(room.memory, ['targets', 'remoterunner'], 1);
            let remoteBuilderTarget = _.get(room.memory, ['targets', 'remotebuilder'], 1);
            let remoteGuardTarget = _.get(room.memory, ['targets', 'remoteguard'], 1);
            let remoteLogisticianTarget = _.get(room.memory, ['targets', 'remotelogistician'], 1);
            let harvesters = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'harvester' && creep.memory.homeRoom == roomName);
            let collectors = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'collector' && creep.memory.homeRoom == roomName);
            let upgraders = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'upgrader' && creep.memory.homeRoom == roomName);
            let builders = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'builder' && creep.memory.homeRoom == roomName);
            let repairers = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'repairer' && creep.memory.homeRoom == roomName);
            let runners = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'runner' && creep.memory.homeRoom == roomName);
            let rebooters = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'rebooter' && creep.memory.homeRoom == roomName);
            let reservers = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'reserver' && creep.memory.homeRoom == roomName);
            let rangers = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'ranger' && creep.memory.homeRoom == roomName);
            let warriors = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'warrior' && creep.memory.homeRoom == roomName);
            let healers = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'healer' && creep.memory.homeRoom == roomName);
            let cranes = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'crane' && creep.memory.homeRoom == roomName);
            let miners = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'miner' && creep.memory.homeRoom == roomName);
            let scientists = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'scientist' && creep.memory.homeRoom == roomName);
            let scouts = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'scout' && creep.memory.homeRoom == roomName);
            let remoteHarvesters = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remoteharvester' && creep.memory.homeRoom == roomName);
            let remoteRunners = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remoterunner' && creep.memory.homeRoom == roomName);
            let remoteBuilders = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remotebuilder' && creep.memory.homeRoom == roomName);
            let remoteGuards = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remoteguard' && creep.memory.homeRoom == roomName);
            let remoteLogisticians = _.filter(Game.creeps, (creep) => creep.memory.roleForQuota == 'remotelogistician' && creep.memory.homeRoom == roomName);
            let sites = room.find(FIND_CONSTRUCTION_SITES);
            let invaderLooterAnnounced = false;
            if (invaderLooterAnnounced == false) {
                const hostiles = room.find(FIND_HOSTILE_CREEPS);
                if (hostiles.length > 0) {
                    const hostileOwner = hostiles[0].owner.username;
                    const creepName = hostiles[0].name;
                    console.log(hostileOwner + ': -----------------HOSTILE CREEPS PRESENT----------------- ' + creepName);
                    room.visual.rect(0, 0, 50, 50, { fill: '#440000', stroke: '#ff0000', opacity: 0.5, strokeWidth: 0.2 });
                    if (collectors.length) {
                        for (let i = 0; i < collectors.length; i++) {
                            if (collectors[i].ticksToLive > 300) {
                                collectors[i].memory.invaderLooter = true;
                                console.log(collectors[i] + ' is now the invader looter');
                                invaderLooterAnnounced = true;
                                break;
                            }
                        }
                    }
                }
                else
                    invaderLooterAnnounced = false;
            }
            const tickInterval = Memory.globalSettings.consoleSpawnInterval;
            const energy = ' NRG: ' + room.energyAvailable + '/' + room.energyCapacityAvailable + '(' + (room.energyAvailable / room.energyCapacityAvailable * 100).toFixed(0) + '%) ';
            const hInfo = (harvesterTarget) ? '| H:' + harvesters.length + '(' + harvesterTarget + ') ' : '';
            const cInfo = (collectorTarget) ? '| C:' + collectors.length + '(' + collectorTarget + ') ' : '';
            const uInfo = (upgraderTarget) ? '| U:' + upgraders.length + '(' + upgraderTarget + ') ' : '';
            const bInfo = (builderTarget) ? '| B:' + builders.length + '(' + builderTarget + ') ' : '';
            const rInfo = (runnerTarget) ? '| Rn:' + runners.length + '(' + runnerTarget + ') ' : '';
            const rpInfo = (repairerTarget) ? '| Rp:' + repairers.length + '(' + repairerTarget + ') ' : '';
            const cnInfo = (craneTarget) ? '| Cn:' + cranes.length + '(' + craneTarget + ') ' : '';
            const rtInfo = (rebooterTarget) ? '| Rb:' + rebooters.length + '(' + rebooterTarget + ') ' : '';
            const rvInfo = (reserverTarget) ? '| Rv:' + reservers.length + '(' + reserverTarget + ') ' : '';
            const rngInfo = (rangerTarget) ? '| Rng:' + rangers.length + '(' + rangerTarget + ') ' : '';
            const warInfo = (warriorTarget) ? '| War:' + warriors.length + '(' + warriorTarget + ') ' : '';
            const hlrInfo = (healerTarget) ? '| Hlr:' + healers.length + '(' + healerTarget + ') ' : '';
            const rhInfo = (remoteHarvesterTarget) ? '| RH:' + remoteHarvesters.length + '(' + remoteHarvesterTarget + ') ' : '';
            const rrInfo = (remoteRunnerTarget) ? '| RR:' + remoteRunners.length + '(' + remoteRunnerTarget + ') ' : '';
            const rbInfo = (remoteBuilderTarget) ? '| RB:' + remoteBuilders.length + '(' + remoteBuilderTarget + ') ' : '';
            const rgInfo = (remoteGuardTarget) ? '| RG:' + remoteGuards.length + '(' + remoteGuardTarget + ')' : '';
            if (tickInterval !== 0 && tickCount % tickInterval) {
                console.log(room.link() + energy + hInfo + cInfo + uInfo + bInfo + rInfo + rpInfo + cnInfo + rtInfo + rvInfo + rngInfo + warInfo + hlrInfo + rhInfo + rrInfo + rbInfo + rgInfo);
            }
            const rmFlgs = rMem.settings.flags;
            const rmVis = rMem.settings.visualSettings;
            if (rmVis.spawnInfo === undefined)
                room.initSettings();
            const alignment = rmVis.spawnInfo.alignment;
            const spawnColor = rmVis.spawnInfo.color;
            const spawnFont = rmVis.spawnInfo.fontSize || 0.5;
            let spawnX = 49;
            if (alignment == 'left')
                spawnX = 0;
            room.visual.rect(41.75, 44.5, 7.5, 4.75, { fill: '#555555', stroke: '#aaaaaa', opacity: 0.3, strokeWidth: 0.2 });
            room.visual.text('H:' + harvesters.length + '(' + harvesterTarget + ') | C:' + collectors.length + '(' + collectorTarget + ') | U:' + upgraders.length + '(' + upgraderTarget + ') | B:' + builders.length + '(' + builderTarget + ') | Cn:' + cranes.length + '(' + craneTarget + ')', spawnX, 49, { align: alignment, color: spawnColor, font: spawnFont });
            room.visual.text('RH:' + remoteHarvesters.length + '(' + remoteHarvesterTarget + ') | RR:' + remoteRunners.length + '(' + remoteRunnerTarget + ') | RB:' + remoteBuilders.length + '(' + remoteBuilderTarget + ') | RG:' + remoteGuards.length + '(' + remoteGuardTarget + ')', spawnX, 48, { align: alignment, color: spawnColor, font: spawnFont });
            room.visual.text('Rn:' + runners.length + '(' + runnerTarget + ') | Rp:' + repairers.length + '(' + repairerTarget + ') | Rb:' + rebooters.length + '(' + rebooterTarget + ') | Rv:' + reservers.length + '(' + reserverTarget + ')', spawnX, 47, { align: alignment, color: spawnColor, font: spawnFont });
            room.visual.text('Rng:' + rangers.length + '(' + rangerTarget + ') | War:' + warriors.length + '(' + warriorTarget + ') | Hlr:' + healers.length + '(' + healerTarget + ')', spawnX, 46, { align: alignment, color: spawnColor, font: spawnFont });
            room.visual.text('Energy: ' + room.energyAvailable + '(' + room.energyCapacityAvailable + ')', spawnX, 45, { align: alignment, color: spawnColor, font: spawnFont });
            room.visual.rect(41.75, 0, 7.5, 4.75, { fill: '#555555', stroke: '#aaaaaa', opacity: 0.3, strokeWidth: 0.2 });
            room.visual.text('H:' + harvesters.length + '(' + harvesterTarget + ') | C:' + collectors.length + '(' + collectorTarget + ') | U:' + upgraders.length + '(' + upgraderTarget + ') | B:' + builders.length + '(' + builderTarget + ') | Cn:' + cranes.length + '(' + craneTarget + ')', spawnX, 0.5, { align: alignment, color: spawnColor, font: spawnFont });
            room.visual.text('RH:' + remoteHarvesters.length + '(' + remoteHarvesterTarget + ') | RR:' + remoteRunners.length + '(' + remoteRunnerTarget + ') | RB:' + remoteBuilders.length + '(' + remoteBuilderTarget + ') | RG:' + remoteGuards.length + '(' + remoteGuardTarget + ')', spawnX, 1.5, { align: alignment, color: spawnColor, font: spawnFont });
            room.visual.text('Rn:' + runners.length + '(' + runnerTarget + ') | Rp:' + repairers.length + '(' + repairerTarget + ') | Rb:' + rebooters.length + '(' + rebooterTarget + ') | Rv:' + reservers.length + '(' + reserverTarget + ')', spawnX, 2.5, { align: alignment, color: spawnColor, font: spawnFont });
            room.visual.text('Rng:' + rangers.length + '(' + rangerTarget + ') | War:' + warriors.length + '(' + warriorTarget + ') | Hlr:' + healers.length + '(' + healerTarget + ')', spawnX, 3.5, { align: alignment, color: spawnColor, font: spawnFont });
            room.visual.text('Energy: ' + room.energyAvailable + '(' + room.energyCapacityAvailable + ')', spawnX, 4.5, { align: alignment, color: spawnColor, font: spawnFont });
            const xCoord = rmVis.roomFlags.displayCoords[0];
            const yCoord = rmVis.roomFlags.displayCoords[1];
            const displayColor = rmVis.roomFlags.color;
            const fontSize = rmVis.roomFlags.fontSize || 0.4;
            room.visual.rect(xCoord - 0.15, yCoord - 1.2, 13, 1.35, { fill: '#770000', stroke: '#aa0000', opacity: 0.3, strokeWidth: 0.1 });
            room.visual.text('CSL(' + rmFlgs.centralStorageLogic + ')  SCS(' + rmFlgs.sortConSites + ')  CCS(' + rmFlgs.closestConSites + ')  CU(' + rmFlgs.craneUpgrades + ')   HFA(' + rmFlgs.harvestersFixAdjacent + ')     RDM(' + rmFlgs.runnersDoMinerals + ')', xCoord, (yCoord - 0.6), { align: 'left', font: fontSize, color: displayColor });
            room.visual.text('RDP(' + rmFlgs.runnersDoPiles + ')   RB(' + rmFlgs.repairBasics + ')   RR(' + rmFlgs.repairRamparts + ')    RW(' + rmFlgs.repairWalls + ')   TRB(' + rmFlgs.towerRepairBasic + ')   TRD(' + rmFlgs.towerRepairDefenses + ')', xCoord, yCoord - 0.1, { align: 'left', font: fontSize, color: displayColor });
            let creepCount = 0;
            if (Memory.creeps) {
                creepCount = Object.keys(Memory.creeps).length;
                if (creepCount < 2)
                    room.energyAvailable;
                else
                    room.energyCapacityAvailable;
            }
            if (room.energyCapacityAvailable == 300) {
                availableVariants.harvester = spawnVariants.harvester300;
                availableVariants.collector = spawnVariants.collector100;
                availableVariants.upgrader = spawnVariants.upgrader300;
                availableVariants.builder = spawnVariants.builder300;
                availableVariants.repairer = spawnVariants.repairer300;
                availableVariants.runner = spawnVariants.runner300;
                availableVariants.crane = spawnVariants.crane300;
            }
            else if (room.energyCapacityAvailable <= 400) {
                availableVariants.harvester = spawnVariants.harvester400;
                availableVariants.collector = spawnVariants.collector300;
                availableVariants.upgrader = spawnVariants.upgrader400;
                availableVariants.builder = spawnVariants.builder350;
                availableVariants.repairer = spawnVariants.repairer300;
                availableVariants.runner = spawnVariants.runner300;
                availableVariants.crane = spawnVariants.crane300;
            }
            else if (room.energyCapacityAvailable <= 500) {
                availableVariants.harvester = spawnVariants.harvester400;
                availableVariants.collector = spawnVariants.collector300;
                availableVariants.upgrader = spawnVariants.upgrader400;
                availableVariants.builder = spawnVariants.builder350;
                availableVariants.repairer = spawnVariants.repairer300;
                availableVariants.runner = spawnVariants.runner300;
                availableVariants.crane = spawnVariants.crane300;
            }
            else if (room.energyCapacityAvailable <= 600) {
                availableVariants.harvester = spawnVariants.harvester600;
                availableVariants.collector = spawnVariants.collector500;
                availableVariants.upgrader = spawnVariants.upgrader550;
                availableVariants.builder = spawnVariants.builder500;
                availableVariants.repairer = spawnVariants.repairer500;
                availableVariants.runner = spawnVariants.runner300;
                availableVariants.warrior = spawnVariants.warrior520;
                availableVariants.crane = spawnVariants.crane500;
            }
            else if (room.energyCapacityAvailable <= 1000) {
                availableVariants.harvester = spawnVariants.harvester600;
                availableVariants.collector = spawnVariants.collector500;
                availableVariants.upgrader = spawnVariants.upgrader700;
                availableVariants.builder = spawnVariants.builder800;
                availableVariants.repairer = spawnVariants.repairer800;
                availableVariants.runner = spawnVariants.runner300;
                availableVariants.crane = spawnVariants.crane500;
                availableVariants.remoteGuard = spawnVariants.remoteGuard700;
            }
            else if (room.energyCapacityAvailable <= 1300) {
                availableVariants.harvester = spawnVariants.harvester600;
                availableVariants.collector = spawnVariants.collector500;
                availableVariants.upgrader = spawnVariants.upgrader700;
                availableVariants.builder = spawnVariants.builder1000;
                availableVariants.repairer = spawnVariants.repairer1000;
                availableVariants.runner = spawnVariants.runner300;
                availableVariants.crane = spawnVariants.crane500;
                availableVariants.remoteGuard = spawnVariants.remoteGuard700;
                availableVariants.remoteLogistician = spawnVariants.remoteLogistician1200;
            }
            else if (room.energyCapacityAvailable > 1600) {
                availableVariants.harvester = spawnVariants.harvester600;
                availableVariants.collector = spawnVariants.collector500;
                availableVariants.upgrader = spawnVariants.upgrader900;
                availableVariants.builder = spawnVariants.builder1100;
                availableVariants.repairer = spawnVariants.repairer1000;
                availableVariants.runner = spawnVariants.runner300;
                availableVariants.crane = spawnVariants.crane500;
                availableVariants.remoteGuard = spawnVariants.remoteGuard700;
                availableVariants.remoteLogistician = spawnVariants.remoteLogistician1500;
                availableVariants.warrior = spawnVariants.warrior1400;
                availableVariants.healer = spawnVariants.healer1200;
            }
            if (rMem.settings.flags.craneUpgrades == true)
                availableVariants.crane = spawnVariants.crane800;
            if (Game.shard.ptr)
                availableVariants.builder = spawnVariants.builder300;
            if (room.storage) {
                if (room.energyAvailable <= 300 && room.storage.store[RESOURCE_ENERGY] <= 1000 && creepCount <= 1)
                    ;
            }
            if (collectors.length == 0) {
                if (room.energyAvailable < 500)
                    availableVariants.collector = spawnVariants.collector300;
            }
            if (harvesters.length >= 2 && harvesters[0].getActiveBodyparts(WORK) >= 5) {
                if (harvesters[0].memory.source == harvesters[1].memory.source) {
                    if (harvesters[0].ticksToLive > harvesters[1].ticksToLive) {
                        harvesters[1].assignHarvestSource(true);
                        console.log('[' + room.name + ']: Reassigned ' + harvesters[1].name + '\'s source due to conflict.');
                    }
                    if (harvesters[1].ticksToLive > harvesters[0].ticksToLive) {
                        harvesters[0].assignHarvestSource(true);
                        console.log('[' + room.name + ']: Reassigned ' + harvesters[0].name + '\'s source due to conflict.');
                    }
                }
            }
            for (let i = 0; i < harvesters.length; i++) {
                harvesterDying = false;
                if (harvesters[i].ticksToLive <= 50) {
                    harvesterDying = true;
                    break;
                }
            }
            for (let i = 0; i < runners.length; i++) {
                runnerDying = false;
                if (runners[i].ticksToLive <= 20) {
                    runnerDying = true;
                    break;
                }
            }
            for (let i = 0; i < reservers.length; i++) {
                reserverDying = false;
                if (reservers[i].ticksToLive <= 90) {
                    reserverDying = true;
                    break;
                }
            }
            for (let i = 0; i < remoteHarvesters.length; i++) {
                remoteHarvesterDying = false;
                if (remoteHarvesters[i].ticksToLive <= 110) {
                    remoteHarvesterDying = true;
                    break;
                }
            }
            for (let i = 0; i < collectors.length; i++) {
                collectorDying = false;
                if (collectors[i].ticksToLive <= 30) {
                    collectorDying = true;
                    break;
                }
            }
            for (let i = 0; i < remoteGuards.length; i++) {
                remoteGuardDying = false;
                if (remoteGuards[i].ticksToLive <= 110) {
                    remoteGuardDying = true;
                    break;
                }
            }
            for (let i = 0; i < miners.length; i++) {
                if (miners[i].ticksToLive <= 60) {
                    break;
                }
            }
            const colIndex = Memory.colonies.colonyList.indexOf(room.name);
            const colonyNum = colIndex + 1;
            const colonyName = 'Col' + colonyNum;
            let readySpawn = spawn;
            if (rMem.objects.spawns && rMem.objects.spawns.length > 0) {
                for (let i = 0; i < rMem.objects.spawns.length; i++) {
                    const thisSpawn = Game.getObjectById(rMem.objects.spawns[i]);
                    if (thisSpawn.spawning)
                        continue;
                    else
                        readySpawn = thisSpawn;
                }
            }
            if (rMem.objects.spawns.length > 0) {
                const numCreeps = Object.keys(Game.creeps).length;
                if (numCreeps == 0 && room.energyAvailable <= 300 && (!room.storage || (room.storage && room.storage.store[RESOURCE_ENERGY] < 500)) && room.controller.level > 1) {
                    newName = colonyName + '_Rb' + rebooterCount;
                    while (readySpawn.spawnCreep([WORK, WORK, MOVE], newName, { memory: { role: 'rebooter', roleForQuota: 'rebooter', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                        rebooterCount++;
                        newName = colonyName + '_Rb' + rebooterCount;
                    }
                }
                else if (numCreeps <= 1 && room.energyAvailable <= 300 && room.storage && room.storage.store[RESOURCE_ENERGY] >= 500) {
                    const result = readySpawn.spawnCreep([CARRY, MOVE], 'Collie the Emergency Collector Creep', { memory: { role: 'collector', roleForQuota: 'collector', homeRoom: roomName } });
                    switch (result) {
                        case OK:
                        case ERR_BUSY:
                        case ERR_NOT_ENOUGH_ENERGY:
                        case ERR_INVALID_ARGS:
                        case ERR_RCL_NOT_ENOUGH:
                            break;
                        case ERR_NAME_EXISTS:
                            readySpawn.spawnCreep([CARRY, MOVE], 'Collie the Emergency Collector Back-up Creep', { memory: { role: 'collector', roleForQuota: 'collector', homeRoom: roomName } });
                            break;
                    }
                }
                else {
                    if ((harvesters.length < harvesterTarget) || (harvesters.length <= harvesterTarget && harvesterDying && harvesterTarget !== 0)) {
                        newName = colonyName + '_H' + harvesterCount;
                        while (readySpawn.spawnCreep(availableVariants.harvester, newName, { memory: { role: 'harvester', roleForQuota: 'harvester', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                            harvesterCount++;
                            newName = colonyName + '_H' + harvesterCount;
                        }
                    }
                    else if ((collectors.length < collectorTarget) || (collectors.length <= collectorTarget && collectorDying && collectorTarget !== 0)) {
                        newName = colonyName + '_C' + collectorCount;
                        while (readySpawn.spawnCreep(availableVariants.collector, newName, { memory: { role: 'collector', roleForQuota: 'collector', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                            collectorCount++;
                            newName = colonyName + '_C' + collectorCount;
                        }
                    }
                    else {
                        if ((runners.length < runnerTarget) || (runners.length <= runnerTarget && runnerDying && runnerTarget !== 0)) {
                            newName = colonyName + '_Rn' + runnerCount;
                            if (room.controller.level >= 4 && room.storage) {
                                while (readySpawn.spawnCreep(readySpawn.determineBodyparts('runner', room.energyCapacityAvailable), newName, { memory: { role: 'runner', roleForQuota: 'runner', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                    runnerCount++;
                                    newName = colonyName + '_Rn' + runnerCount;
                                }
                            }
                            else {
                                while (readySpawn.spawnCreep(availableVariants.runner, newName, { memory: { role: 'runner', roleForQuota: 'runner', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                    runnerCount++;
                                    newName = colonyName + '_Rn' + runnerCount;
                                }
                            }
                        }
                        else if (upgraders.length < upgraderTarget) {
                            newName = colonyName + '_U' + upgraderCount;
                            while (readySpawn.spawnCreep(availableVariants.upgrader, newName, { memory: { role: 'upgrader', roleForQuota: 'upgrader', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                upgraderCount++;
                                newName = colonyName + '_U' + upgraderCount;
                            }
                        }
                        else if (sites.length > 0 && builders.length < builderTarget) {
                            newName = colonyName + '_B' + builderCount;
                            while (readySpawn.spawnCreep(availableVariants.builder, newName, { memory: { role: 'builder', roleForQuota: 'builder', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                builderCount++;
                                newName = colonyName + '_B' + builderCount;
                            }
                        }
                        else if (repairers.length < repairerTarget) {
                            newName = colonyName + '_Rp' + repairerCount;
                            while (readySpawn.spawnCreep(availableVariants.repairer, newName, { memory: { role: 'repairer', roleForQuota: 'repairer', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                repairerCount++;
                                newName = colonyName + '_Rp' + repairerCount;
                            }
                        }
                        else if (cranes.length < craneTarget) {
                            newName = colonyName + '_Cn' + craneCount;
                            while (readySpawn.spawnCreep(availableVariants.crane, newName, { memory: { role: 'crane', roleForQuota: 'crane', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                craneCount++;
                                newName = colonyName + '_Cn' + craneCount;
                            }
                        }
                        else if (miners.length < minerTarget && rMem.objects.extractor) {
                            newName = colonyName + '_M' + minerCount;
                            while (readySpawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, CARRY, MOVE, MOVE, MOVE], newName, { memory: { role: 'miner', roleForQuota: 'miner', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                minerCount++;
                                newName = colonyName + '_M' + minerCount;
                            }
                        }
                        else if ((scientists.length < scientistTarget && rMem.objects.labs)) {
                            newName = colonyName + '_S' + scientistCount;
                            while (readySpawn.spawnCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY], newName, { memory: { role: 'scientist', roleForQuota: 'scientist', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                scientistCount++;
                                newName = colonyName + '_S' + scientistCount;
                            }
                        }
                        else if ((reservers.length < reserverTarget) || (reservers.length <= reserverTarget && reserverDying && reserverTarget !== 0)) {
                            newName = colonyName + '_Rv' + reserverCount;
                            while (readySpawn.spawnCreep([MOVE, MOVE, CLAIM, CLAIM], newName, { memory: { role: 'reserver', roleForQuota: 'reserver', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                reserverCount++;
                                newName = colonyName + '_Rv' + reserverCount;
                            }
                        }
                        else if ((remoteHarvesters.length < remoteHarvesterTarget) || (remoteHarvesters.length <= remoteHarvesterTarget && remoteHarvesterDying && remoteHarvesterTarget !== 0)) {
                            newName = colonyName + '_RH' + remoteHarvesterCount;
                            while (readySpawn.spawnCreep([CARRY, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK], newName, { memory: { role: 'remoteharvester', roleForQuota: 'remoteharvester', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                remoteHarvesterCount++;
                                newName = colonyName + '_RH' + remoteHarvesterCount;
                            }
                        }
                        else if (remoteRunners.length < remoteRunnerTarget) {
                            newName = colonyName + '_RR' + remoteRunnerCount;
                            while (readySpawn.spawnCreep([CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, WORK], newName, { memory: { role: 'remoterunner', roleForQuota: 'remoterunner', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                remoteRunnerCount++;
                                newName = colonyName + '_RR' + remoteRunnerCount;
                            }
                        }
                        else if (remoteBuilders.length < remoteBuilderTarget) {
                            newName = colonyName + '_RB' + remoteBuilderCount;
                            while (readySpawn.spawnCreep([WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE], newName, { memory: { role: 'remotebuilder', roleForQuota: 'remotebuilder', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                remoteBuilderCount++;
                                newName = colonyName + '_RB' + remoteBuilderCount;
                            }
                        }
                        else if ((remoteGuards.length < remoteGuardTarget) || (remoteGuards.length <= remoteGuardTarget && remoteGuardDying && remoteGuardTarget !== 0)) {
                            newName = colonyName + '_RG' + remoteGuardCount;
                            while (readySpawn.spawnCreep(availableVariants.remoteGuard, newName, { memory: { role: 'remoteguard', roleForQuota: 'remoteguard', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                remoteGuardCount++;
                                newName = colonyName + '_RG' + remoteGuardCount;
                            }
                        }
                        else if (remoteLogisticians.length < remoteLogisticianTarget) {
                            newName = colonyName + '_RL' + remoteLogisticianCount;
                            while (readySpawn.spawnCreep(availableVariants.remoteLogistician, newName, { memory: { role: 'remotelogistician', roleForQuota: 'remotelogistician', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                remoteLogisticianCount++;
                                newName = colonyName + '_RL' + remoteLogisticianCount;
                            }
                        }
                        else {
                            if (rangers.length < rangerTarget) {
                                newName = colonyName + '_Rng' + rangerCount;
                                while (readySpawn.spawnCreep([TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE], newName, { memory: { role: 'ranger', roleForQuota: 'ranger', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                    rangerCount++;
                                    newName = colonyName + '_Rng' + rangerCount;
                                }
                            }
                            else if (warriors.length < warriorTarget) {
                                newName = colonyName + '_War' + warriorCount;
                                while (readySpawn.spawnCreep(availableVariants.warrior, newName, { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                    warriorCount++;
                                    newName = colonyName + '_War' + warriorCount;
                                }
                            }
                            else if (healers.length < healerTarget) {
                                newName = colonyName + '_Hlr' + healerCount;
                                while (readySpawn.spawnCreep(availableVariants.healer, newName, { memory: { role: 'healer', roleForQuota: 'healer', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                    healerCount++;
                                    newName = colonyName + '_Hlr' + healerCount;
                                }
                            }
                            else if (scouts.length < scoutTarget) {
                                newName = colonyName + '_Sct' + scoutCount;
                                while (readySpawn.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE], newName, { memory: { role: 'scout', roleForQuota: 'scout', homeRoom: roomName } }) == ERR_NAME_EXISTS) {
                                    scoutCount++;
                                    newName = colonyName + '_Sct' + scoutCount;
                                }
                            }
                        }
                    }
                }
                for (let i = 0; i < rMem.objects.spawns.length; i++) {
                    let spawnObjects = [];
                    for (let j = 0; j < rMem.objects.spawns.length; j++)
                        spawnObjects.push(Game.getObjectById(rMem.objects.spawns[j]));
                    if (spawnObjects[i].spawning) {
                        let spawningCreep = Game.creeps[spawnObjects[i].spawning.name];
                        if (Memory.miscData.rooms[room.name].spawnAnnounced) {
                            console.log(spawnObjects[i].room.link() + ': Spawning new creep: ' + spawningCreep.memory.role + ' (' + spawningCreep.name + ')');
                            Memory.miscData.rooms[room.name].spawnAnnounced = true;
                        }
                        spawnObjects[i].room.visual.text(spawningCreep.memory.role + ' - ' + spawnObjects[i].spawning.remainingTime + '/' + spawnObjects[i].spawning.needTime, spawnObjects[i].pos.x, spawnObjects[i].pos.y + 1.25, { stroke: '#111111', color: '#ff00ff', align: 'center', opacity: 0.8, font: 0.4 });
                    }
                    else {
                        Memory.miscData.rooms[room.name].spawnAnnounced = false;
                    }
                }
                if (room.controller.level >= 1)
                    visualRCProgress(room.controller);
                room.visual.text('Energy: ' + room.energyAvailable
                    + '/' + room.energyCapacityAvailable, readySpawn.pos.x, readySpawn.pos.y - 1, { align: 'center', opacity: 0.8, color: '#00dddd', stroke: '#000000', font: 0.4 });
                if (room.storage) {
                    room.visual.text(' Storage: ' + room.storage.store[RESOURCE_ENERGY], room.storage.pos.x, room.storage.pos.y - 1, { align: 'center', opacity: 0.8, font: 0.4, stroke: '#000000', color: '#ffff00' });
                }
            }
        }
    });
    for (let name in Game.creeps) {
        let creep = Game.creeps[name];
        switch (creep.memory.role) {
            case 'reserver':
                roleReserver.run(creep);
                break;
            case 'rebooter':
                roleRebooter.run(creep);
                break;
            case 'harvester':
                roleHarvester.run(creep);
                break;
            case 'upgrader':
                roleUpgrader.run(creep);
                break;
            case 'builder':
                roleBuilder.run(creep);
                break;
            case 'collector':
                roleCollector.run(creep);
                break;
            case 'repairer':
                roleRepairer.run(creep);
                break;
            case 'ranger':
                roleRanger.run(creep);
                break;
            case 'warrior':
                roleWarrior.run(creep);
                break;
            case 'runner':
                roleRunner.run(creep);
                break;
            case 'healer':
                roleHealer.run(creep);
                break;
            case 'remotelogistician':
                roleRemoteLogistician.run(creep);
                break;
            case 'remoteharvester':
                roleRemoteHarvester.run(creep);
                break;
            case 'remoterunner':
                roleRemoteRunner.run(creep);
                break;
            case 'remotebuilder':
                roleRemoteBuilder.run(creep);
                break;
            case 'remoteguard':
                roleRemoteGuard.run(creep);
                break;
            case 'crane':
                roleCrane.run(creep);
                break;
            case 'miner':
                roleMiner.run(creep);
                break;
            case 'scientist':
                roleScientist.run(creep);
                break;
            case 'claimer':
                roleClaimer.run(creep);
                break;
            case 'provider':
                roleProvider.run(creep);
                break;
            case 'scout':
                roleScout.run(creep);
                break;
        }
    }
    tickCount++;
});

exports.loop = loop;
//# sourceMappingURL=main.js.map
