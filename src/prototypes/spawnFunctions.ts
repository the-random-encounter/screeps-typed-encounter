import { max } from "lodash";
import { validateRoomName, validateFlagName } from "./miscFunctions";

Spawn.prototype.spawnDismantler = function (maxEnergy: number | false = false) {

	Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK], 'RAWRR', { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: 'W13N34', rallyPoint: 'W13N33', customAttackTarget: '6050a493210d07b5d7fd9247' } })

	Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK], 'RBguy', {memory: {role: 'remotebuilder', roleForQuota: 'remotebuilder', homeRoom: 'W13N34', rallyPoint: 'W13N33', workRoom: 'W13N33'}})
}

Spawn.prototype.spawnHealer = function (creepName: string, targetRoom: RoomName, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false): ScreepsReturnCode {


  let x = 1;
  const result: ScreepsReturnCode = this.spawnCreep([ MOVE, MOVE, MOVE, MOVE, HEAL, HEAL, HEAL, HEAL ], creepName, { memory: { role: 'healer', roleForQuota: 'healer', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } })
  switch (result) {
    case ERR_NAME_EXISTS:
      console.log(this.room.link() + this.name + ': ' + result);
      this.spawnHealer(creepName + x, targetRoom, waypoints, maxEnergy);
      return ERR_NAME_EXISTS;
    case OK:
      console.log(this.room.link() + this.name + ': ' + result);
      return OK;
    default:
      console.log(this.room.link() + this.name + ': ' + result);
      return result;
  }
}
Spawn.prototype.spawnBeef = function (creepName: string, targetRoom: RoomName, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false): ScreepsReturnCode {

  let x = 1;
  const result: ScreepsReturnCode = this.spawnCreep([ TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, TOUGH, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE ], creepName, { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } })
  switch (result) {
    case ERR_NAME_EXISTS:
      console.log(this.room.link() + this.name + ': ' + result);
      this.spawnBeef(creepName + x, targetRoom, waypoints, maxEnergy);
      return ERR_NAME_EXISTS;
    case OK:
      console.log(this.room.link() + this.name + ': ' + result);
      return OK;
    default:
      console.log(this.room.link() + this.name + ': ' + result);
      return result;
  }
}
Spawn.prototype.spawnWarrior = function (creepName: string, targetRoom: RoomName, waypoints: string | string[] | 'none' = 'none', maxEnergy: number | false = false) {

	if (!validateRoomName(targetRoom)) return 'Invalid roomname provided.';
	if (!validateFlagName(waypoints)) return 'Invalid waypoints provided.';

	const baseBody = [MOVE,MOVE,MOVE,MOVE,MOVE,ATTACK,ATTACK,ATTACK,ATTACK,ATTACK];

	const result = this.spawnCreep(baseBody, creepName, { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: this.room.name, attackRoom: targetRoom, rallyPoint: waypoints } });
	return this.room.link() + 'Spawning warrior (target: ' + targetRoom + ')... RESULT CODE: ' + result;
}

Spawn.prototype.spawnHarvester = function (targetRoom: RoomName, name: string) {
	const result = this.spawnCreep([CARRY, MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK], name, { memory: { role: 'harvester', roleForQuota: 'harvester', homeRoom: targetRoom, rallyPoint: targetRoom } });
	return '[' + this.room.name + ']: Spawning harvester (home: ' + targetRoom + ')... RESULT CODE: ' + result;
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
        //console.log('pathLength: ' + pathLen);

        for (let i = 0; i < maxCarryParts; i++) carryArray.push(CARRY);


        for (let i = 0; i < maxMoveParts; i++)  moveArray.push(MOVE);

        const currCarryCost : number  = carryArray.length * 50;
        const currMoveCost  : number  = moveArray.length  * 50;
        const partCost: number = currCarryCost + currMoveCost;
        if (maxEnergy - partCost >= 50) carryArray.push(CARRY);
        if (maxEnergy - partCost >= 100 && carryArray.length % 2 == 1) moveArray.push(MOVE);


        let bodyArray : BodyPartConstant[] = carryArray.concat(moveArray);


        /*if (locality == 'remote') {
          let isEven = carryArray.length % 2;
          if (isEven == 0) {
            if (maxEnergy - partCost >= 150) {
              bodyArray.push(WORK);
              bodyArray.push(MOVE);
            } else if (maxEnergy - partCost >= 100) {
              bodyArray.shift();
              bodyArray.push(WORK);
            } else {
              bodyArray.pop();
              bodyArray.shift();
              bodyArray.push(WORK);
            }
          } else {
            if (maxEnergy - partCost >= 100)
              bodyArray.push(WORK);
            else if (maxEnergy - partCost >= 50) {
              bodyArray.shift();
              bodyArray.push(WORK);
            }
            else
              bodyArray.push(WORK);
          }
        }*/
        //console.log(bodyArray);
        //console.log('carryParts: ' + carryArray.length + ' maxCarryParts: ' + maxCarryParts + ' | moveParts: ' + moveArray.length + ' maxMoveParts: ' + maxMoveParts);
        //console.log('carryCost: ' + carryArray.length * 50 + ' maxCarryCost: ' + maxCarryCost + ' | moveCost: ' + moveArray.length * 50 + ' maxMoveCost: ' + maxMoveCost);
        return bodyArray;
      } catch (e: any) {
        console.log(e);
        console.log(e.stack);
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
