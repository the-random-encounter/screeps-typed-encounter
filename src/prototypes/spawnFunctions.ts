import { validateRoomName, validateFlagName } from "./miscFunctions";

Spawn.prototype.spawnDismantler = function (maxEnergy: number | false = false) {

	Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK], 'RAWRR', { memory: { role: 'warrior', roleForQuota: 'warrior', homeRoom: 'W13N34', rallyPoint: 'W13N33', customAttackTarget: '6050a493210d07b5d7fd9247' } })

	Game.spawns.Spawn1.spawnCreep([MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, WORK, WORK, WORK, WORK, WORK, WORK], 'RBguy', {memory: {role: 'remotebuilder', roleForQuota: 'remotebuilder', homeRoom: 'W13N34', rallyPoint: 'W13N33', workRoom: 'W13N33'}})
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

			const maxCarryCost: number = Math.ceil(maxEnergy / 3 * 2);
			const maxMoveCost: number = Math.floor(maxEnergy / 3);
			const maxCarryParts: number = maxCarryCost / 50;
			const maxMoveParts: number = maxMoveCost / 50;

			let currCarryCost: number = 0;
			let currMoveCost: number = 0;
			//let segmentCost = _.sum(segment, s => BODYPART_COST[s]);
			const locality: string = this.room.memory.data.logisticalPairs[this.room.memory.data.pairCounter].locality;
			const pathLen: number = this.room.memory.data.logisticalPairs[this.room.memory.data.pairCounter].distance;
			const carryParts: number = (Math.ceil(Math.ceil(pathLen / 5) * 5) * 2 / 5) + 1;
			const moveParts: number = Math.ceil(carryParts / 2);

			let bodyArray: Array<BodyPartConstant> = [];
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

			const partCost: number = currCarryCost + currMoveCost;

			if (locality == 'remote') {
				let isEven = carryParts % 2;
				if (isEven == 0) {
					if (maxEnergy - partCost >= 150) {
						bodyArray.push(WORK);
						bodyArray.push(MOVE);
					}
				} else {
					if (maxEnergy - partCost >= 100)
						bodyArray.push(WORK);
					}
			}
			return bodyArray;

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
