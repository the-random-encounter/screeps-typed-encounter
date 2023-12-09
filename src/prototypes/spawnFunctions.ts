import { max } from "lodash";
import { returnCode, validateRoomName, validateFlagName, log } from "./miscFunctions";

Spawn.prototype.spawnDismantler = function (maxEnergy: number | false = false) {

	Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK], 'RAWRR', { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: 'W13N34', rallyPoint: 'W13N33', customAttackTarget: '6050a493210d07b5d7fd9247' } })

	Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK], 'RBguy', {memory: {role: 'remotebuilder', roleForQuota: 'remotebuilder', homeRoom: 'W13N34', rallyPoint: 'W13N33', workRoom: 'W13N33'}})
}

Spawn.prototype.spawnHealer = function (creepName: string, targetRoom: RoomName, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false): ScreepsReturnCode {


  let x = 1;
  const result: ScreepsReturnCode = this.spawnCreep([MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL], creepName, { memory: { role: 'healer', roleForQuota: 'healer', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } })
  switch (result) {
    case ERR_NAME_EXISTS:
      log(this.name + ': ' + returnCode(result), this.room);
      this.spawnHealer(creepName + x, targetRoom, waypoints, maxEnergy);
      return ERR_NAME_EXISTS;
    case OK:
      log(this.name + ': ' + returnCode(result), this.room);
      return OK;
    default:
      log(this.name + ': ' + returnCode(result), this.room);
      return result;
  }
}
Spawn.prototype.spawnBeef = function (creepName: string, targetRoom: RoomName, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false): ScreepsReturnCode {

  let x = 1;
  const result: ScreepsReturnCode = this.spawnCreep([ TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE ], creepName, { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } })
  switch (result) {
    case ERR_NAME_EXISTS:
      log(this.name + ': ' + returnCode(result), this.room);
      this.spawnBeef(creepName + x, targetRoom, waypoints, maxEnergy);
      return ERR_NAME_EXISTS;
    case OK:
      log(this.name + ': ' + returnCode(result), this.room);
      return OK;
    default:
      log(this.name + ': ' + returnCode(result), this.room);
      return result;
  }
}


Spawn.prototype.spawnHealer = function (creepName: string, targetRoom: RoomName, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false): ScreepsReturnCode {

	const baseBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,HEAL,HEAL,HEAL,HEAL,HEAL,HEAL];

	const result = this.spawnCreep(baseBody, creepName, { memory: { role: 'healer', roleForQuota: 'healer', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } });
	 log('Spawning warrior (target: ' + targetRoom + ')... RESULT CODE: ' + returnCode(result), this.room);
   return result;

}

Spawn.prototype.spawnWarrior = function (creepName: string, targetRoom: RoomName, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false): ScreepsReturnCode {


	const baseBody = [TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,TOUGH,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK];

	const result = this.spawnCreep(baseBody, creepName, { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } });
	log('Spawning warrior (target: ' + targetRoom + ')... RESULT CODE: ' + returnCode(result), this.room);
  return result;
}

Spawn.prototype.spawnHarvester = function (targetRoom: RoomName, name: string) {
	const result = this.spawnCreep([CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK], name, { memory: { role: 'harvester', roleForQuota: 'harvester', homeRoom: targetRoom, rallyPoint: targetRoom } });
	log('Spawning harvester (home: ' + targetRoom + ')... RESULT CODE: ' + returnCode(result), this.room);
  return result;
}
Spawn.prototype.spawnClaimer = function (claimRoom: RoomName) {

	const homeRoom = this.room.name;

	this.spawnCreep([MOVE, CLAIM], 'Claimer', { memory: { role: 'claimer', roleForQuota: 'claimer', homeRoom: homeRoom, claimRoom: claimRoom } });

	return '[' + this.room.name + ']: Spawning claimer (home: ' + homeRoom + ') (claim: ' + claimRoom + ')';
}
Spawn.prototype.determineBodyparts = function (creepRole: CreepRoles, maxEnergy: number) {

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
      try {
        const maxCarryCost: number = Math.round((maxEnergy / 3) * 2 / 50) * 50;
        const maxMoveCost: number = Math.ceil(maxEnergy / 3 / 50) * 50;
        let maxCarryParts: number = Math.floor(maxCarryCost / 50);
        let maxMoveParts: number = Math.floor(maxMoveCost / 50);

        const locality  : string = this.room.memory.data.logisticalPairs[ this.room.memory.data.pairCounter ].locality;
        const pathLen   : number = this.room.memory.data.logisticalPairs[ this.room.memory.data.pairCounter ].distance;
        const carryParts: number = Math.ceil(pathLen / 5) * 2;
        const moveParts : number = Math.ceil(carryParts / 2);
        let   carryArray: BodyPartConstant[] = [];
        let   moveArray : BodyPartConstant[] = [];
        if (locality == 'remote') {
          maxCarryParts = maxCarryParts;
          maxMoveParts  = maxMoveParts;
        }

        if (maxCarryParts > carryParts) maxCarryParts = carryParts;
        if (maxMoveParts  > moveParts ) maxMoveParts  = moveParts;
        log('pathLength: ' + pathLen, this.room);

        for (let i = 0; i < maxCarryParts; i++) carryArray.push(CARRY);


        for (let i = 0; i < maxMoveParts; i++)  moveArray.push(MOVE);

        let currCarryCost : number  = carryArray.length * 50;
        let currMoveCost  : number  = moveArray .length * 50;
        let partCost      : number  = currCarryCost + currMoveCost;

        if (maxEnergy - partCost >= 50) carryArray.push(CARRY);
        if (maxEnergy - partCost >= 100 && carryArray.length % 2 == 1) moveArray.push(MOVE);

        currCarryCost = carryArray.length * 50;
        currMoveCost  = moveArray .length * 50;
        partCost      = currCarryCost + currMoveCost;

        let bodyArray : BodyPartConstant[] = carryArray.concat(moveArray);
        let finalCost: number = bodyArray.length * 50;

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
        let finalCarry: number, finalMove: number, finalWork: number;

        _.forEach(bodyArray, (part: BodyPartConstant) => {
          if (part === CARRY) finalCarry++;
          else if (part === MOVE) finalMove++;
          else if (part === WORK) finalWork++;
        });

        log(bodyArray, this.room);
        log('carryParts: ' + finalCarry + ' maxCarryParts: ' + maxCarryParts + ' | moveParts: ' + finalMove + ' maxMoveParts: ' + maxMoveParts, this.room);
        if (finalWork)
          log('carryCost: ' + finalCarry * 50 + ' maxCarryCost: ' + maxCarryCost + ' | moveCost: ' + finalMove * 50 + ' maxMoveCost: ' + maxMoveCost + 'workParts: ' + finalWork + ' workCost: ' + finalWork * 100 + ' finalCost: ' + finalCost, this.room);
        else
          log('carryCost: ' + finalCarry * 50 + ' maxCarryCost: ' + maxCarryCost + ' | moveCost: ' + finalMove * 50 + ' maxMoveCost: ' + maxMoveCost + ' finalCost: ' + finalCost, this.room);

        return bodyArray;
      } catch (e: any) {
        log(e, this.room);
        log(e.stack, this.room);
      }
      break;
		case 'healer':

			break;
		case 'remotelogistician':

			break;
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
