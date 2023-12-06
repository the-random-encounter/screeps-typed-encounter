"use strict";
export function roomDefense(room: Room) {

	let towers: Array<StructureTower> = room.find(FIND_MY_STRUCTURES, { filter: { structureType: STRUCTURE_TOWER } });

	_.forEach(towers, function (tower: StructureTower) {
		if (tower) {
      const topLeft = new RoomPosition(tower.pos.x - 5, tower.pos.y - 5, room.name);

      const tID: Id<StructureTower> = tower.id;
      const hostilesInRoom: Creep[] = tower.room.find(FIND_HOSTILE_CREEPS, { filter: (i) => ((i.pos.x <= 5 && i.pos.y >= 4) || (i.pos.x >= 4 && i.pos.y <= 5)) && i.owner.username !== 'Invader' });

			//const closestHostile: Creep = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (hostilesInRoom.length) {

        console.log(tower.room.link() + 'Owner Name: ' + hostilesInRoom[0].owner.username + ' | ' + hostilesInRoom);
        Game.map.visual.rect(topLeft, 11, 11, { fill: 'transparent', stroke: '#ff0000' });

        const attackHostiles = hostilesInRoom.filter(
          (creep) => {
            if (creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0 || creep.getActiveBodyparts(WORK) > 0) return creep;
          });

        const healHostiles = hostilesInRoom.filter(
          (creep) => {
            if (creep.getActiveBodyparts(HEAL) > 0) return creep;
          });

        if (healHostiles.length) {

          console.log(tower.room.link() + 'Healer Hostiles: ' + healHostiles);
          const closestHealer = tower.pos.findClosestByRange(healHostiles);

          if (closestHealer)
            tower.attack(closestHealer);

        } else if (attackHostiles.length) {

          console.log(tower.room.link() + 'Attack Hostiles: ' + attackHostiles);
          const closestAttacker = tower.pos.findClosestByRange(attackHostiles);

          if (closestAttacker)
            tower.attack(closestAttacker);
        }
      } else {

        const invaderHostiles = tower.room.find(FIND_HOSTILE_CREEPS, { filter: (i) => i.owner.username === 'Invader' });


        if (invaderHostiles.length) {

          console.log(invaderHostiles[ 0 ].owner.username + ' | ' + invaderHostiles);
          Game.map.visual.rect(topLeft, 11, 11, { fill: 'transparent', stroke: '#ff0000' });

          const closestInvader = tower.pos.findClosestByRange(invaderHostiles);

          if (closestInvader)
            tower.attack(closestInvader)

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
									ramparts = tower.room.find(FIND_STRUCTURES, { filter: (i) => ((i.hits <= rampartsMax) && (i.structureType == STRUCTURE_RAMPART)) });
									validTargets = validTargets.concat(ramparts);
								}
								if (tower.room.memory.settings.flags.repairWalls) {
									walls = tower.room.find(FIND_STRUCTURES, { filter: (i) => (i.structureType == STRUCTURE_WALL && (i.hits  <= wallsMax)) })
									validTargets = validTargets.concat(walls);
								}
							}
							const target: AnyStructure = tower.pos.findClosestByRange(validTargets);
							if (target) {
								tower.repair(validTargets[0]);
							}
						}
					}
				}
      }
    }
	});
}
