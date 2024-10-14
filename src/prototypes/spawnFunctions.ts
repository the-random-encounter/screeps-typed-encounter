import { max } from "lodash";
import { returnCode, validateRoomName, validateFlagName, log } from "./miscFunctions";

Spawn.prototype.spawnCollector = function (name: string, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false, iteration: number = 0): ReturnCode {

  if (!maxEnergy)
    maxEnergy = this.room.energyCapacityAvailable;

	const baseBody = [MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY];

  while (!this.spawning) {
    const result = this.spawnCreep(baseBody, name, { memory: { role: 'collector', roleForQuota: 'collector', homeRoom: this.room.name, rallyPoint: waypoints } });
    let logMsg = 'Attempting to spawn a new claim builder (home: ' + this.room.name + ')...';

    switch (result) {
      case OK:
        logMsg += '\n... SUCCESS! RESULT CODE: ' + returnCode(result);
        log(logMsg, this.room);
        break;
      case ERR_NAME_EXISTS:
        logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
        log(logMsg, this.room);
        iteration++;
        this.spawnCollector(name + iteration, waypoints, maxEnergy, iteration);
        break;
      case ERR_NOT_ENOUGH_RESOURCES:
        logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
        log(logMsg, this.room);
        this.spawnCollector(name, waypoints, maxEnergy);
        break;
      default:
        break;
    }

    return returnCode(result);
  }

}

Spawn.prototype.spawnHealer = function (creepName: string, targetRoom: RoomName, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false): ReturnCode {


  let x = 1;
  const result: ScreepsReturnCode = this.spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL], creepName, { memory: { role: 'healer', roleForQuota: 'healer', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } })
  switch (result) {
    case ERR_NAME_EXISTS:
      log(this.name + ': ' + returnCode(result), this.room);
      this.spawnHealer(creepName + x, targetRoom, waypoints, maxEnergy);
      break;
    case OK:
      log(this.name + ': ' + returnCode(result), this.room);
      break;
    default:
      log(this.name + ': ' + returnCode(result), this.room);
      break;
  }
  return returnCode(result);
}
Spawn.prototype.spawnBeef = function (creepName: string, targetRoom: RoomName, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false): ReturnCode {

  let x = 1;
  const result: ScreepsReturnCode = this.spawnCreep([ TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE ], creepName, { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } })
  switch (result) {
    case ERR_NAME_EXISTS:
      log(this.name + ': ' + returnCode(result), this.room);
      this.spawnBeef(creepName + x, targetRoom, waypoints, maxEnergy);
      break;
    case OK:
      log(this.name + ': ' + returnCode(result), this.room);
      break;
    default:
      log(this.name + ': ' + returnCode(result), this.room);
      break;
  }
  return returnCode(result);
}


Spawn.prototype.spawnHealer = function (creepName: string, targetRoom: RoomName, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false): ReturnCode {

	const baseBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL];

	const result = this.spawnCreep(baseBody, creepName, { memory: { role: 'healer', roleForQuota: 'healer', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } });
	 log('Spawning warrior (target: ' + targetRoom + ')... RESULT CODE: ' + returnCode(result), this.room);
   return returnCode(result);

}

Spawn.prototype.spawnWarrior = function (creepName: string, targetRoom: RoomName, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false): ReturnCode {


	const baseBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK];

	const result = this.spawnCreep(baseBody, creepName, { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } });

  log('Spawning warrior (target: ' + targetRoom + ')... RESULT CODE: ' + returnCode(result), this.room);

  return returnCode(result);
}
Spawn.prototype.spawnNewClaimBuilder = function (targetRoom: RoomName, name: string = 'NewClaimBuilder', maxEnergy?: number, iteration: number = 0): ReturnCode {

  if (!maxEnergy)
    maxEnergy = this.room.energyCapacityAvailable;

  const claimObjective = this.room.memory.data.claimRooms[targetRoom];

	const result = this.spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY], name, { memory: { role: 'builder', roleForQuota: 'unallocated', homeRoom: this.room.name, rallyPoint: claimObjective.waypoints, claimant: true } });

  let logMsg = 'Attempting to spawn a new claim builder (home: ' + targetRoom + ')...';

  switch (result) {
    case OK:
      this.room.memory.data.claimRooms[targetRoom].neededBuilders -= 1;
      logMsg += '\n... SUCCESS! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      break;
    case ERR_NAME_EXISTS:
      logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      iteration++;
      this.spawnNewClaimBuilder(targetRoom, name + iteration, maxEnergy, iteration);
      break;
    case ERR_NOT_ENOUGH_RESOURCES:
      logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      this.spawnNewClaimBuilder(targetRoom, name, maxEnergy);
      break;
    default:
      break;
  }

  return returnCode(result);
}
Spawn.prototype.spawnNewClaimHarvester = function (targetRoom: RoomName, name: string = 'NewClaimHarvester', maxEnergy?: number, iteration: number = 0): ReturnCode {

  if (!maxEnergy)
    maxEnergy = this.room.energyCapacityAvailable;

  const claimObjective = this.room.memory.data.claimRooms[targetRoom];

	const result = this.spawnCreep([CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK], name, { memory: { role: 'harvester', roleForQuota: 'unallocated', homeRoom: this.room.name, rallyPoint: claimObjective.waypoints, claimant: true } });

  let logMsg = 'Attempting to spawn a new claim harvester (home: ' + targetRoom + ')...';

  switch (result) {
    case OK:
      this.room.memory.data.claimRooms[targetRoom].neededBuilders -= 1;
      logMsg += '\n... SUCCESS! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      break;
    case ERR_NAME_EXISTS:
      logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      iteration++;
      this.spawnNewClaimHarvester(targetRoom, name + iteration, maxEnergy, iteration);
      break;
    case ERR_NOT_ENOUGH_RESOURCES:
      logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      this.spawnNewClaimHarvester(targetRoom, name, maxEnergy);
      break;
    default:
      break;
  }

  return returnCode(result);
}
Spawn.prototype.spawnNewClaimHauler = function (targetRoom: RoomName, name: string = 'NewClaimHauler', maxEnergy?: number, iteration: number = 0): ReturnCode {

  if (!maxEnergy)
    maxEnergy = this.room.energyCapacityAvailable;

  const claimObjective = this.room.memory.data.claimRooms[targetRoom];

  const baseBody = this.determineBodyparts('remotelogistician');

  const result = this.spawnCreep(baseBody, name, { memory: { role: 'remotelogistician', roleForQuota: 'unallocated', homeRoom: this.room.name, rallyPoint: claimObjective.waypoints, destRoom: targetRoom, destPos: [claimObjective.logSpot.x, claimObjective.logSpot.y] } });

  let logMsg = 'Attempting to spawn a new claim hauler (home: ' + targetRoom + ')...';

  switch (result) {
    case OK:
      this.room.memory.data.claimRooms[targetRoom].neededBuilders -= 1;
      logMsg += '\n... SUCCESS! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      break;
    case ERR_NAME_EXISTS:
      logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      iteration++;
      this.spawnNewClaimHauler(targetRoom, name + iteration, maxEnergy, iteration);
      break;
    case ERR_NOT_ENOUGH_RESOURCES:
      logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      this.spawnNewClaimHauler(targetRoom, name, maxEnergy);
      break;
    default:
      break;
  }

  return returnCode(result);
}
Spawn.prototype.spawnClaimer = function (claimRoom: RoomName, name: string = 'Claimer', canHaul: boolean = false, maxEnergy?: number, iteration: number = 0): ReturnCode {

  if (!maxEnergy)
    maxEnergy = this.room.energyCapacityAvailable;

	const homeRoom = this.room.name;
  const claimObjective = this.room.memory.data.claimRooms[claimRoom];
  let baseBody: BodyPartConstant[] = [];
  if (canHaul)
    baseBody = [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CLAIM];
  else
    baseBody = [MOVE,CLAIM];

	const result = this.spawnCreep(baseBody, name, { memory: { role: 'claimer', roleForQuota: 'claimer', homeRoom: homeRoom, claimRoom: claimRoom, remoteWaypoints: claimObjective.waypoints } });

  let logMsg = 'Attempting to spawn a new claimer (home: ' + claimRoom + ')...';

  switch (result) {
    case OK:
      this.room.memory.data.claimRooms[claimRoom].neededBuilders -= 1;
      logMsg += '\n... SUCCESS! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      break;
    case ERR_NAME_EXISTS:
      logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      iteration++;
      this.spawnClaimer(claimRoom, name + iteration, canHaul, maxEnergy, iteration);
      break;
    case ERR_NOT_ENOUGH_RESOURCES:
      logMsg += '\n... FAILED! RESULT CODE: ' + returnCode(result);
      log(logMsg, this.room);
      this.spawnClaimer(claimRoom, name, canHaul, maxEnergy);
      break;
    default:
      break;
  }

  return returnCode(result);
}

Spawn.prototype.spawnUpgrader = function (creepRole: CreepRoles, maxEnergy?: number): ReturnCode {
/*
	const roomEnergy = this.room.energyCapacityAvailable;
	const roomName = this.room.name;
	let bodyArray: BodyPartConstant[] = [];

	if (roomEnergy <= 300)
		bodyArray = [ CARRY, CARRY, MOVE , WORK ];
	else if (roomEnergy <= 350)
  	bodyArray = [ CARRY, MOVE , MOVE , WORK , WORK ];
  else if (roomEnergy <= 400)
		bodyArray = [ CARRY, CARRY, MOVE , MOVE , WORK , WORK ];
	else if (roomEnergy <= 500)
  	bodyArray = [ CARRY, MOVE , WORK , WORK , WORK , WORK ];
  else if (roomEnergy <= 550)
		bodyArray = [ CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , WORK , WORK ];
  else if (roomEnergy <= 700)
		bodyArray = [ CARRY, MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK ];
  else if (roomEnergy <= 900)
		bodyArray = [ CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK , WORK  ];
  else if (roomEnergy < 1400)
		bodyArray = [ CARRY, CARRY, MOVE , MOVE , WORK , WORK , WORK , WORK , WORK , WORK , WORK ];
	else if (roomEnergy >= 1400)
		bodyArray = [ CARRY, CARRY, CARRY, MOVE , MOVE , MOVE , MOVE , MOVE , WORK , WORK , WORK , WORK , WORK , WORK , WORK , WORK , WORK , WORK ];

	let spawnAttemptCount = 1;
	let newName = 'OnDemand_U' + spawnAttemptCount;

	log(this.name + `: Spawning Upgrader with ${roomEnergy} energy capacity.`);

	let result: ScreepsReturnCode = this.spawnCreep(bodyArray, newName, {memory: { role: 'upgrader', roleForQuota: 'upgrader', homeRoom: roomName } });

	while (result == ERR_NAME_EXISTS) {
		spawnAttemptCount++;
		newName = 'OnDemand_U' + spawnAttemptCount;
		result = this.spawnCreep(bodyArray, newName, {memory: { role: 'upgrader', roleForQuota: 'upgrader', homeRoom: roomName } });
	}
*/
	return //result;
}
Spawn.prototype.determineBodyparts = function (creepRole: CreepRoles, maxEnergy?: number ) {

  if (!maxEnergy)
    maxEnergy = this.room.energyCapacityAvailable;

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
		case 'filler': {
      const maxCarryCost  : number = Math.round((maxEnergy    / 3) * 2   / 50) * 50;
      const maxMoveCost   : number = Math.ceil (maxEnergy     / 3  / 50) * 50;
      let   maxCarryParts : number = Math.floor(maxCarryCost  / 50);
      let   maxMoveParts  : number = Math.floor(maxMoveCost   / 50);
      let   carryArray    : BodyPartConstant[] = [];
      let   moveArray     : BodyPartConstant[] = [];

      for (let i = 0; i < maxCarryParts; i++) carryArray.push(CARRY);
      for (let i = 0; i < maxMoveParts ; i++) moveArray .push(MOVE );

      const bodyArray: BodyPartConstant[] = moveArray.concat(carryArray);
      return bodyArray;
    }
    case 'collector':

      break;
		case 'repairer':

			break;
		case 'ranger':

			break;
		case 'warrior':

			break;
    case 'runner': {
      const maxCarryCost: number = Math.round((maxEnergy    / 3) * 2   / 50) * 50;
      const maxMoveCost : number = Math.ceil (maxEnergy     / 3  / 50) * 50;
      let maxCarryParts : number = Math.floor(maxCarryCost  / 50);
      let maxMoveParts  : number = Math.floor(maxMoveCost   / 50);

      const locality    : string = this.room.memory.data.logisticalPairs[ this.room.memory.data.pairCounter ].locality;
      const pathLen     : number = this.room.memory.data.logisticalPairs[ this.room.memory.data.pairCounter ].distance;
      const carryParts  : number = Math.ceil(pathLen    / 5) * 2;
      const moveParts   : number = Math.ceil(carryParts / 2);
      let   carryArray  : BodyPartConstant[] = [];
      let   moveArray   : BodyPartConstant[] = [];

      if (maxCarryParts > carryParts) maxCarryParts = carryParts;
      if (maxMoveParts  > moveParts ) maxMoveParts  = moveParts;

      for (let i = 0; i < maxCarryParts; i++) carryArray.push(CARRY);
      for (let i = 0; i < maxMoveParts ; i++) moveArray .push(MOVE );

      let currCarryCost : number  = carryArray.length * 50;
      let currMoveCost  : number  = moveArray .length * 50;
      let partCost      : number  = currCarryCost + currMoveCost;

      if (maxEnergy - partCost >= 50) carryArray.push(CARRY);
      if (maxEnergy - partCost >= 100 && carryArray.length % 2 == 1) moveArray.push(MOVE);

      currCarryCost = carryArray.length * 50;
      currMoveCost  = moveArray .length * 50;
      partCost      = currCarryCost + currMoveCost;

      let bodyArray : BodyPartConstant[] = carryArray.concat(moveArray);
      let finalCost : number             = bodyArray.length * 50;

      if (locality == 'remote') {
        let isEven = carryArray.length % 2;
        if (isEven) {
          if (maxEnergy - partCost >= 150) {
            bodyArray.push(WORK);
            bodyArray.push(MOVE);
            finalCost += 150
          } else if (maxEnergy - partCost >= 50) {
            bodyArray.shift();
            bodyArray.push(WORK);
            finalCost += 50
          } else {
            bodyArray.pop();
            bodyArray.shift();
            bodyArray.push(WORK);
          }
        } else {
          if (maxEnergy - partCost >= 100) {
            bodyArray.push(WORK);
            finalCost += 100;
          }
          else if (maxEnergy - partCost >= 50) {
            bodyArray.shift();
            bodyArray.push(WORK);
            finalCost += 50;
          }
        }
      }
      let finalCarry: number = 0;
      let finalMove : number = 0;
      let finalWork : number = 0;;

      _.forEach(bodyArray, (part: BodyPartConstant) => {
        if      (part === CARRY)  finalCarry++;
        else if (part === MOVE)   finalMove++;
        else if (part === WORK)   finalWork++;
      });

      //log('pathLength: ' + pathLen + ' | ' + bodyArray.toString(), this.room);
      //log('carryParts: ' + finalCarry + ' maxCarryParts: ' + maxCarryParts + ' | moveParts: ' + finalMove + ' maxMoveParts: ' + maxMoveParts, this.room);
      //if (finalWork)
        //log('carryCost: ' + finalCarry * 50 + ' maxCarryCost: ' + maxCarryCost + ' | moveCost: ' + finalMove * 50 + ' maxMoveCost: ' + maxMoveCost + 'workParts: ' + finalWork + ' workCost: ' + finalWork * 100 + ' finalCost: ' + finalCost, this.room);
      //else
      //  log('carryCost: ' + finalCarry * 50 + ' maxCarryCost: ' + maxCarryCost + ' | moveCost: ' + finalMove * 50 + ' maxMoveCost: ' + maxMoveCost + ' finalCost: ' + finalCost, this.room);

      return bodyArray;
    }
		case 'healer':

			break;
		case 'remotelogistician': {
      const maxCarryCost  : number = Math.round((maxEnergy    / 3) * 2   / 50) * 50;
      const maxMoveCost   : number = Math.ceil (maxEnergy     / 3  / 50) * 50;
      let   maxCarryParts : number = Math.floor(maxCarryCost  / 50);
      let   maxMoveParts  : number = Math.floor(maxMoveCost   / 50);
      let   carryArray    : BodyPartConstant[] = [];
      let   moveArray     : BodyPartConstant[] = [];

      for (let i = 0; i < maxCarryParts; i++) carryArray.push(CARRY);
      for (let i = 0; i < maxMoveParts ; i++) moveArray .push(MOVE );

      const bodyArray: BodyPartConstant[] = moveArray.concat(carryArray);
      return bodyArray;
    }
		case 'remoteharvester':

			break;
		case 'remoterunner':

			break;
		case 'remotebuilder':

			break;
		case 'remoteguard':

			break;
		case 'crane':

			break;
		case 'miner':

			break;
		case 'scientist':

			break;
		case 'claimer':

			break;
		case 'provider':

			break;
		case 'scout':

			break;
	}
}
