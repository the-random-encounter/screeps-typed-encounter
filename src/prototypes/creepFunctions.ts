import { validateFlagName, log, returnCode } from './miscFunctions';
import { pathing } from '../roles/roles';
import { result } from 'lodash';
Creep.prototype.findEnergySource = function (): Source {

	let sources: Array<Source> = this.room.find(FIND_SOURCES);

	if (sources.length) {

		let source: Source = _.find(sources, function (s) { return s.pos.getOpenPositions().length == 1 || s.pos.getOpenPositions().length > 0 && !s.room.lookForAtArea(LOOK_CREEPS, s.pos.y - 1, s.pos.x - 1, s.pos.y + 1, s.pos.x + 1, true).length });

		if (source) {
			this.memory.source = source.id;

			return source;
		} else {
			source = _.find(sources, function (s) { return s.pos.getOpenPositions().length == 1 || s.pos.getOpenPositions().length > 0 });
			this.memory.source = source.id
			return source;
		}
	} else {
		return;
	}
}

Creep.prototype.AHS = function (no?: boolean): Source {
	if (no)
		return this.assignHarvestSource(no);
	else
		return this.assignHarvestSource();
}

Creep.prototype.assignHarvestSource = function(noIncrement?: boolean): Source {

	const room: Room = this.room;
	const cMem: CreepMemory = this.memory;
	const rMem: RoomMemory = room.memory;
	const role: CreepRoles = cMem.role;
  const home = Game.rooms[cMem.homeRoom].memory;

	// Confirm the room has had its sources cached
	if (rMem.objects === undefined)	room.cacheObjects();

	// get array of sources available
	let roomSources: Id<Source>[] = [];
	if (role == 'harvester') roomSources = home.objects.sources;
	else if (role == 'remoteharvester') roomSources = home.outposts.aggregateSourceList;

	// in case there is no lastAssigned counter, create it
	if (role == 'harvester') {
		if (home.objects.lastAssigned === undefined) {
			home.objects.lastAssigned = 0;
			console.log(room.link() + 'Creating \'lastAssigned\' memory object.')
		}
	} else if (role == 'remoteharvester') {
		if (home.outposts.aggLastAssigned === undefined) {
			home.outposts.aggLastAssigned = 0;
			console.log(room.link() + 'Creating \'aggLastAssigned\' memory object.');
		}
	}

	// separate last assigned value for contingency condition
	let LA: number;
	if (role == 'harvester') LA = home.objects.lastAssigned;
	else if (role == 'remoteharvester') LA = home.outposts.aggLastAssigned;

	// set nextAssigned to the increment of lastAssigned
	let nextAssigned: number;
	if (role == 'harvester') nextAssigned = home.objects.lastAssigned + 1;
	else if (role == 'remoteharvester') nextAssigned = home.outposts.aggLastAssigned + 1;

	// set nextAssigned to 0 if it has reached the end of sources list
	if (nextAssigned >= roomSources.length)
		nextAssigned = 0;

	// set assigned source to the next assigned room source
	let assignedSource: Source = Game.getObjectById(roomSources[nextAssigned]);

	// set creep memory to match
  if (assignedSource)
	  cMem.source = assignedSource.id;
  else {
    if (role == 'harvester') {
      const sources = Game.rooms[cMem.homeRoom].memory.objects.sources;
      cMem.source = sources[nextAssigned];
    }
    else if (role == 'remoteharvester') {
      const sources = Game.rooms[cMem.homeRoom].memory.outposts.aggregateSourceList;
      cMem.source = sources[nextAssigned];
    }
    assignedSource = Game.getObjectById(cMem.source);
  }


	if (role == 'harvester') home.objects.lastAssigned++;
	else if (role == 'remoteharvester') home.outposts.aggLastAssigned++;

	if (role == 'harvester') {
		if (home.objects.lastAssigned >= roomSources.length)
			home.objects.lastAssigned = 0;
	} else if (role == 'remoteharvester') {
		if (home.outposts.aggLastAssigned >= roomSources.length)
			home.outposts.aggLastAssigned = 0;
	}

	console.log(room.link() + 'Assigned harvester ' + this.name + ' to source #' + (LA + 1) + ' (ID: ' + assignedSource + ') in room ' + assignedSource.room.name);

	if (noIncrement) {
		if (role == 'harvester') home.objects.lastAssigned = LA;
		else if (role == 'remoteharvester') home.outposts.aggLastAssigned = LA;
	}

	return assignedSource;
}

Creep.prototype.assignRemoteHarvestSource = function(noIncrement?: boolean): Source {

	const homeOutposts: Outposts = Game.rooms[this.memory.homeRoom].memory.outposts;
	const roomSources: Id<Source>[] = homeOutposts.aggregateSourceList;

	if (homeOutposts.aggLastAssigned === undefined)	homeOutposts.aggLastAssigned = 0;

	let lastAss: number = homeOutposts.aggLastAssigned;
	let nextAss: number = lastAss + 1;

	if (nextAss >= roomSources.length) nextAss = 0;

	const assignedSource: Source = Game.getObjectById(roomSources[nextAss]);
	this.memory.source = assignedSource.id;

	homeOutposts.aggLastAssigned = nextAss;

	if (noIncrement) homeOutposts.aggLastAssigned = lastAss;

	console.log(this.room.link() + 'Assigned remote harvester ' + this.name + ' to remote source #' + (nextAss + 1) + ' (ID: ' + assignedSource + ')');

	return assignedSource;
}

Creep.prototype.unloadEnergy = function(): void {

	if (this.spawning) return;

	if (this.memory.bucket) {
		const target: StructureContainer | StructureStorage | StructureLink = Game.getObjectById(this.memory.bucket);

		if (target.hits == target.hitsMax) {
			this.say('⛏️');
			this.transfer(target, RESOURCE_ENERGY);
		}
		else {
			this.say('🔧');
			this.repair(target);
		}
		return;
	} else {
		const sourceTarget: Source = Game.getObjectById(this.memory.source);
		const sourceContainers: Array<StructureLink | StructureStorage | StructureContainer> = sourceTarget.pos.findInRange(FIND_STRUCTURES, 3, { filter: (obj) => (obj.structureType == STRUCTURE_LINK || obj.structureType == STRUCTURE_STORAGE || obj.structureType == STRUCTURE_CONTAINER)/* && obj.pos.isNearTo(this)*/ });
		const nearbyObj: StructureLink | StructureContainer | StructureStorage = sourceContainers[0];

		if (!nearbyObj) {
			if (this.drop(RESOURCE_ENERGY) === OK) {
				this.say('🗑️');
				console.log(this.room.link() + 'Harvester \'' + this.name + '\' dropped energy.');
			}
			return;
		} else {
			this.memory.bucket = nearbyObj.id;
			if (nearbyObj.hits == nearbyObj.hitsMax) {
				if (this.pos.isNearTo(nearbyObj)) {
					this.say('⛏️');
					this.transfer(nearbyObj, RESOURCE_ENERGY);
				} else
					this.moveTo(nearbyObj);
			}
			else {
				this.say('🔧');
				this.repair(nearbyObj);
			}
			return;
		}
	}
}

Creep.prototype.harvestEnergy = function(): void {

	const storedSource = (this.memory.source !== undefined) ? Game.getObjectById(this.memory.source) : this.assignHarvestSource();

	if (storedSource) {
		if (this.pos.isNearTo(storedSource)) {
			if (storedSource.energy == 0) {
				if (this.store.getUsedCapacity() > 0) {
					this.unloadEnergy();
					this.harvest(storedSource);
				} else this.say('🚬');
			} else this.harvest(storedSource);
		} else {
      if (this.room.name === storedSource.room.name)
        this.moveTo(storedSource, pathing.harvesterPathing);
      else
        this.moveTo(Game.flags[storedSource.room.name]);
    }
	}
}

Creep.prototype.getDroppedResource = function(pileID: Id<Resource>): void {

	if (pileID === undefined)
		pileID = this.pos.findClosestByRange(FIND_DROPPED_RESOURCES).id;

	if (pileID) {
		const target = Game.getObjectById(pileID);
		if (target) {
			if (this.pickup(target) == ERR_NOT_IN_RANGE)
				this.moveTo(target);
		}
	}
}

Creep.prototype.pickupClosestEnergy = function(): void {

	const droppedPiles: Array<Resource> = this.room.find(FIND_DROPPED_RESOURCES);

	if (droppedPiles.length > 0) {
		const target = this.pos.findClosestByRange(droppedPiles);
		if (target) {
			if (this.pickup(target) == ERR_NOT_IN_RANGE)
				this.moveTo(target);
		}
	} else {
		const containersWithEnergy: Array<StructureContainer | StructureStorage> = this.room.find(FIND_STRUCTURES, {
		filter: (obj) => (obj.structureType == STRUCTURE_CONTAINER || obj.structureType == STRUCTURE_STORAGE) && obj.store[RESOURCE_ENERGY] > 0
		});

		const target = this.pos.findClosestByRange(containersWithEnergy);
		if (target) {
			if (this.withdraw(target, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
				this.moveTo(target);
			}
		}
	}
}

Creep.prototype.unloadMineral = function (): void {

	const mineral: ResourceConstant[] = Object.keys(this.store) as ResourceConstant[];

	if (this.memory.bucket) {
		const target = Game.getObjectById(this.memory.bucket);
		if (this.pos.isNearTo(target))
			this.transfer(target, mineral[0]);
		else
			this.moveTo(target);
		return;
	} else {
		const nearbyObj: Array<StructureStorage | StructureContainer> = this.pos.findInRange(FIND_STRUCTURES, 2,{ filter: (obj) => (obj.structureType == STRUCTURE_STORAGE || obj.structureType == STRUCTURE_CONTAINER)});

		if (nearbyObj.length == 0) {
			if (this.drop(mineral[0]) === OK)
				console.log(this.room.link() + 'Harvester \'' + this.name + '\' dropped ' + mineral + '.');
			return;
		} else {
			const target = nearbyObj[0];
			this.memory.bucket = target.id;
			if (this.pos.isNearTo(target))
			this.transfer(target, mineral[0]);
		else
			this.moveTo(target);
			return;
		}
	}
}

Creep.prototype.harvestMineral = function(): void {

	let storedMineral = Game.getObjectById(this.memory.mineral);

	if (!storedMineral) {
		delete this.memory.mineral;
		const foundMineral: Mineral<MineralConstant>[] = this.room.find(FIND_MINERALS);
		storedMineral = foundMineral[0];
		this.memory.mineral = foundMineral[0].id;
	}

	if (storedMineral) {
		if (this.pos.isNearTo(storedMineral)) {
			if (storedMineral.mineralAmount == 0 && this.store.getUsedCapacity() > 0) {
				this.unloadMineral();
			}
			this.harvest(storedMineral);
		} else {
			this.moveTo(storedMineral, pathing.minerPathing);
		}
	}
}

Creep.prototype.moveBySerializedPath = function(serializedPath: string): void {

	const path: PathStep[] = Room.deserializePath(serializedPath);
	this.moveByPath(path);
}

Creep.prototype.recursivePathMove = function(serializedPath: string, stepNum: number = 0): void {

	const path: PathStep[] = Room.deserializePath(serializedPath);

	if (this.move(path[stepNum].direction) == OK)
		stepNum++;

	if (stepNum < serializedPath.length)
		return this.recursivePathMove(serializedPath, stepNum);
}

Creep.prototype.disable = function(): true {
  this.memory.disableAI = true;
  console.log(this.room.link() + 'Creep \'' + this.name + '\' is now disabled');
	return this.memory.disableAI;
}

Creep.prototype.enable = function(): false {
  this.memory.disableAI = false;
  console.log(this.room.link() + 'Creep \'' + this.name + '\' is now enabled.');
	return this.memory.disableAI;
}

Creep.prototype.getBoost = function (compound: MineralCompoundConstant, sourceLabID: Id<StructureLab>, numParts: number = 1): boolean {
	if (compound) {
		if (sourceLabID) {
			const sourceLab = Game.getObjectById(sourceLabID);

			if (sourceLab) {
				const result = sourceLab.boostCreep(this, numParts)
				switch (result) {
					case ERR_NOT_IN_RANGE:
						this.moveTo(sourceLab, pathing.scientistPathing);
						break;
					case OK:
						return true;
					default:
						return false;
				}
			}
		}
	}
}

Creep.prototype.assignOutbox = function(noIncrement?: boolean): StructureContainer {

	const room: Room = this.room;
	const LA: number = room.memory.settings.containerSettings.lastOutbox;

	if (!room.memory.settings)
		room.initSettings();

	if (!room.memory.objects)
		room.cacheObjects();

	const roomOutboxes: Id<StructureContainer>[] = room.memory.settings.containerSettings.outboxes;

	if (room.memory.settings.containerSettings.lastOutbox == undefined) {
		room.memory.settings.containerSettings.lastOutbox = 0;
		console.log(room.link() + 'Creating \'lastOutbox\' memory setting.')
	}

	let nextOutbox: number = room.memory.settings.containerSettings.lastOutbox + 1;

	if (nextOutbox >= roomOutboxes.length)
		nextOutbox = 0;

	let assignedOutbox: StructureContainer = Game.getObjectById(roomOutboxes[nextOutbox]);

	this.memory.pickup = assignedOutbox.id;

	room.memory.settings.containerSettings.lastOutbox += 1;

	if (room.memory.settings.containerSettings.lastOutbox >= roomOutboxes.length)
		room.memory.settings.containerSettings.lastOutbox = 0;

	console.log(room.link() + 'Assigned ' + this.memory.role + ' ' + this.name + ' to outbox ID ' + assignedOutbox)

	if (noIncrement)
		room.memory.settings.containerSettings.lastOutbox = LA;

	return assignedOutbox;

}

Creep.prototype.assignInbox = function(noIncrement?: boolean): StructureContainer {

	const room: Room = this.room;
	const LA: number = room.memory.settings.containerSettings.lastInbox;

	if (!room.memory.settings)
		room.initSettings();

	if (!room.memory.objects)
		room.cacheObjects();

	const roomInboxes: Id<StructureContainer>[] = room.memory.settings.containerSettings.inboxes;

	if (room.memory.settings.containerSettings.lastInbox == undefined) {
		room.memory.settings.containerSettings.lastInbox = 0;
		console.log(room.link() + 'Creating \'lastInbox\' memory setting.')
	}

	let nextInbox: number = room.memory.settings.containerSettings.lastInbox + 1;

	if (nextInbox >= roomInboxes.length)
		nextInbox = 0;

	let assignedInbox: StructureContainer = Game.getObjectById(roomInboxes[nextInbox]);

	this.memory.dropoff = assignedInbox.id;

	room.memory.settings.containerSettings.lastInbox += 1;

	if (room.memory.settings.containerSettings.lastInbox >= roomInboxes.length)
		room.memory.settings.containerSettings.lastInbox = 0;

	console.log(room.link() + 'Assigned ' + this.memory.role + ' ' + this.name + ' to inbox ID ' + assignedInbox)

	if (noIncrement)
		room.memory.settings.containerSettings.lastInbox = LA;

	return assignedInbox;

}

Creep.prototype.assignLogisticalPair = function(logParam?: number): boolean {

	if (!this.room.memory.data)	this.room.initSettings();
	if (this.room.memory.data.logisticalPairs === undefined) this.room.registerLogisticalPairs();
	if (this.room.memory.data.pairCounter === undefined) this.room.memory.data.pairCounter = 0;

	const chosenPair: LogisticsPair = this.room.memory.data.logisticalPairs[logParam];

	if (!chosenPair) {
		console.log(this.room.link() + 'You supplied a logistical pair index value that does not exist. Recheck available options.');
		return false;
	} else {
		this.memory.pickup = chosenPair.source;
		this.memory.dropoff = chosenPair.destination;
		this.memory.cargo = chosenPair.resource;
		this.memory.pathLength = chosenPair.distance;
		console.log(this.room.link() + 'Assigned pair (PICKUP: ' + chosenPair.source + ') | (DROPOFF: ' + chosenPair.destination + ') | (CARGO: ' + chosenPair.resource + ') | (LOCALITY: ' + chosenPair.locality + ')');
		return true;
	}
}

Creep.prototype.assignLogisticalPair = function(): boolean {

  try {
    if (!this.room.memory.data) this.room.initSettings();
    if (this.room.memory.data.logisticalPairs === undefined) this.room.registerLogisticalPairs();
    if (this.room.memory.data.pairCounter === undefined) this.room.memory.data.pairCounter = 0;

    const assignedPair: LogisticsPair = this.room.memory.data.logisticalPairs[ this.room.memory.data.pairCounter ];

    this.room.memory.data.pairCounter += 1;

    if (this.room.memory.data.pairCounter >= this.room.memory.data.logisticalPairs.length)
      this.room.memory.data.pairCounter = 0;

    if (this.room.memory.data.logisticalPairs.length == 0) {
      console.log(this.room.link() + 'No pairs available to assign. Set \'none\'.');
      return false;
    } else if (!assignedPair) {
      console.log(this.room.link() + 'No pairs to assign.');
      return false;
    }
    else if (assignedPair) {
      this.memory.pickup = assignedPair.source;
      this.memory.dropoff = assignedPair.destination;
      this.memory.cargo = assignedPair.resource;
      this.memory.pathLength = assignedPair.distance;
      this.memory.locality = assignedPair.locality;
			if (assignedPair.descriptor === 'storage to upgrader')
				this.memory.limiter = true;
			else
				this.memory.limiter = false;

      console.log(this.room.link() + 'Assigned pair (PICKUP: ' + assignedPair.source + ') | (DROPOFF: ' + assignedPair.destination + ') | (CARGO: ' + assignedPair.resource + ') | (LOCALITY: ' + assignedPair.locality + ')');
      return true;
    } else {
      console.log(this.room.link() + 'Unable to assign pair for creep \'' + this.name + '\'.');
      return false;
    }
  } catch (e: any) {
    console.log(e);
    console.log(e.stack);
  }
}


Creep.prototype.navigateWaypoints = function (waypoints: string | string[]): void {
	if (waypoints instanceof Array !== true) {
    console.log(this.room.link() + 'The passed parameter was not an array. Pass an array containing the list of waypoints (flag names) sorted in navigation order.');
		return;
	}
	else {
		if (!validateFlagName(waypoints)) {
			console.log(this.room.link() + 'Input waypoints contained an invalid room name');
			return;
		}
	}
}

Creep.prototype.targetPile = function (pileID: Id<Resource>): void {
  this.memory.targetPile = pileID;
  return;
}

Creep.prototype.advGet = function (target: Source | Id<Source> | Mineral | Id<Mineral> | Deposit | Id<Deposit> | AnyStoreStructure | Resource | Tombstone | Ruin | Id<AnyStoreStructure> | Id<Resource> | Id<Tombstone> | Id<Ruin>): ScreepsReturnCode {

	if (typeof target === 'string') {
		target = Game.getObjectById(target);

		if (!target) return ERR_INVALID_TARGET;
	}

	if (target instanceof Resource) {
		if (this.pickup(target) === ERR_NOT_IN_RANGE) {
			this.moveTo(target, pathing);
		} else return OK;
	} else if (target instanceof Source || target instanceof Mineral || target instanceof Deposit) {
		if (this.harvest(target) === ERR_NOT_IN_RANGE) {
	  	this.moveTo(target, pathing);
		} else return OK;
	} else {
    if (this.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      this.moveTo(target, pathing);
    } else if (this.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_ENOUGH_RESOURCES) {
      const targetResources = Object.keys(target.store) as ResourceConstant[];
      if (this.withdraw(target, targetResources[0]) === ERR_NOT_IN_RANGE) {
        this.moveTo(target, pathing);
      } else return OK;
    }
  }
}

Creep.prototype.advGet = function (target: Source | Id<Source> | Mineral | Id<Mineral> | Deposit | Id<Deposit> | AnyStoreStructure | Resource | Tombstone | Ruin | Id<AnyStoreStructure> | Id<Resource> | Id<Tombstone> | Id<Ruin>, pathing?: MoveToOpts, resource?: ResourceConstant, canTravel?: boolean): ScreepsReturnCode {

	if (canTravel === undefined)
		canTravel = true;

	if (typeof target === 'string') {
		target = Game.getObjectById(target);

		if (!target) return ERR_INVALID_TARGET;
	}

	if (!resource) {
		if (target instanceof Structure || target instanceof Tombstone || target instanceof Ruin) {
			const targetResources = Object.keys(target.store) as ResourceConstant[];
			resource = targetResources[0];
		} else if (target instanceof Resource) {
			resource = target.resourceType;
		} else {
			return ERR_INVALID_ARGS;
		}
	}

	if (target instanceof Resource) {
		if (this.pickup(target) === ERR_NOT_IN_RANGE) {
			if (canTravel)
				this.moveTo(target, pathing);
			else
				return ERR_NOT_IN_RANGE;
		} else return OK;
	} else if (target instanceof Source || target instanceof Mineral || target instanceof Deposit) {
		if (this.harvest(target) === ERR_NOT_IN_RANGE) {
			if (canTravel)
				this.moveTo(target, pathing);
			else
				return ERR_NOT_IN_RANGE;
		} else return OK;
	} else {
		if (this.withdraw(target, resource) === ERR_NOT_IN_RANGE) {
			if (canTravel)
				this.moveTo(target, pathing);
			else
				return ERR_NOT_IN_RANGE;
		} else return OK;
	}
}

Creep.prototype.advGive = function(target: Creep | AnyStoreStructure | Id<AnyStoreStructure>, pathing?: MoveToOpts, resource?: ResourceConstant, canTravel?: boolean): ScreepsReturnCode {

	if (canTravel === undefined)
		canTravel = true;

	if (typeof target === 'string') {
		target = Game.getObjectById(target);

		if (!target) return ERR_INVALID_TARGET;
	}

	if (!resource) {
		const targetResources = Object.keys(this.store) as ResourceConstant[];
		resource = targetResources[0];
	} else {
		return ERR_INVALID_ARGS;
	}

	if (this.transfer(target, resource) === ERR_NOT_IN_RANGE) {
		if (canTravel)
			this.moveTo(target, pathing);
		else
			return ERR_NOT_IN_RANGE;
	} else return OK;
}


Creep.prototype.getBoost = function(): boolean {
	const labs: StructureLab[] = this.room.find(FIND_MY_STRUCTURES, { filter: (i) => i.structureType == STRUCTURE_LAB && i.store[RESOURCE_ENERGY] > 0 });

	if (labs && labs.length > 0) {
		const nearestLab: StructureLab = this.pos.findClosestByRange(labs);

		while (!this.pos.isNearTo(nearestLab))
			this.moveTo(nearestLab);

		const result = nearestLab.boostCreep(this);

		if (result === OK) {
			log(`Successfully boosted this '${this.name}'.`, this.room);
			return true;
		}
		else {
			log(`Failed to boost this '${this.name}'. Error Code: ${returnCode(result)}`, this.room);
			return false;
		}
	}
}
