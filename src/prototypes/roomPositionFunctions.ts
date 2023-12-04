// Will find room positions of creeps and organize them into an array
RoomPosition.prototype.getNearbyPositions = function() {
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
}

RoomPosition.prototype.getOpenPositions = function() {
	let nearbyPositions = this.getNearbyPositions();

	const terrain = Game.map.getRoomTerrain(this.roomName);

	let walkablePositions = _.filter(nearbyPositions, function(pos) {
		return terrain.get(pos.x, pos.y) !== TERRAIN_MASK_WALL;
	});

	let freePositions = _.filter(walkablePositions, function(pos) {
		return !pos.lookFor(LOOK_CREEPS).length;
	});

	return freePositions;
}

RoomPosition.prototype.getNumOpenPositions = function (): number {
	const freePos = this.getOpenPositions();
	return freePos.length;
}

RoomPosition.prototype.link = function () {
    return `<a href="#!/room/${Game.shard.name}/${this.roomName}">[${this.roomName} ${this.x},${this.y}]</a>`;
};
