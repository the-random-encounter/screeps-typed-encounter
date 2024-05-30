const marketFunctions = {

}

global.buyEnergy = function (amountToBuy, maxUnitPrice, maxTransferCost, terminalID = Game.getObjectById(Memory.rooms.E58S51.objects.terminal[0])) {

	const orders = Game.market.getAllOrders(order => order.resourceType == RESOURCE_ENERGY && order.type == ORDER_SELL && order.price <= maxUnitPrice && order.amount <= amountToBuy);

	for (let i = 0; i < orders.length; i++) {
		const transferEnergyCost = Game.market.calcTransactionCost(amount, 'E58S51', orders[i].roomName);

		if (transferEnergyCost < maxTransferCost) {
			Game.market.deal(orders[i].id, amountToBuy, 'E58S51');
			break;
		}
	}
}