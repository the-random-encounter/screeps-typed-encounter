"use strict";
export function roomDefense(room: Room) {

	let towers: Array<StructureTower> = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });

	_.forEach(towers, function (tower: StructureTower) {
		if (tower) {

      Game.map.visual.rect(
        new RoomPosition(tower.pos.x - 5, tower.pos.y - 5, tower.pos.roomName),
        11, 11, { fill: 'transparent', stroke: '#ff0000' });

			const tID: Id<StructureTower> = tower.id;
			const closestHostile: Creep = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);

			if (closestHostile) {
				tower.room.visual.circle(tower.pos, { fill: '#110000', radius: 35, stroke: '#ff0000', opacity: 0.3, lineStyle: 'dashed' });
				tower.attack(closestHostile);
			} else {
				const closestDamagedCreep: Creep = tower.pos.findClosestByRange(FIND_MY_CREEPS, { filter: (creep) => creep.hits < creep.hitsMax });

				if (closestDamagedCreep) {
					tower.heal(closestDamagedCreep);
				} else {
						if (tower.room.memory.settings.flags.towerRepairBasic == true) {

							let ramparts: Array<StructureRampart> = [];
							let walls: Array<StructureWall> = [];
							let validTargets: Array<AnyStructure> = [];

							const rampartsMax: number = tower.room.memory.settings.repairSettings.repairRampartsTo;
							const wallsMax: number = tower.room.memory.settings.repairSettings.repairWallsTo;

							// search for roads, spawns, extensions, or towers under 95%
							let targets: Array<AnyStructure> = tower.room.find(FIND_STRUCTURES, {
								filter: (i) => (i.hits < i.hitsMax) && (i.structureType ==
									STRUCTURE_TOWER || i.structureType == STRUCTURE_SPAWN || i.structureType == STRUCTURE_EXTENSION || i.structureType == STRUCTURE_CONTAINER || i.structureType == STRUCTURE_EXTRACTOR || i.structureType == STRUCTURE_LAB || i.structureType == STRUCTURE_LINK || i.structureType == STRUCTURE_STORAGE || i.structureType == STRUCTURE_TERMINAL)
							});

							validTargets = validTargets.concat(targets);

							let roads: Array<StructureRoad> = tower.room.find(FIND_STRUCTURES, { filter: (i) => (i.hits < i.hitsMax) && (i.hitsMax - i.hits <= 500) && (i.structureType == STRUCTURE_ROAD) });
							validTargets = validTargets.concat(roads);

							if (tower.room.memory.settings.flags.towerRepairDefenses) {
								if (tower.room.memory.settings.flags.repairRamparts) {
									ramparts = tower.room.find(FIND_STRUCTURES, { filter: (i) => ((i.hits / i.hitsMax * 100) < rampartsMax) && (i.structureType == STRUCTURE_RAMPART) });
									validTargets = validTargets.concat(ramparts);
								}

								if (tower.room.memory.settings.flags.repairWalls) {
									walls = tower.room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_WALL && (i.hits / i.hitsMax * 100) < wallsMax) })
									validTargets = validTargets.concat(walls);
								}
							}

							const target: AnyStructure = tower.pos.findClosestByRange(validTargets);
							if (target) {
								tower.room.memory.data.towerLRT = validTargets[0].id;
								tower.repair(validTargets[0]);
							}
						}
					}
				}
			}
		//}
	});
}
