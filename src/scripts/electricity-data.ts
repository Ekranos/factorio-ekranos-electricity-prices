export type ElectricityData = {
	readonly totalWatts: number,
	readonly flowData: FlowData
};

export type FlowData = Record<defines.flow_precision_index, number>;

export type Timescale = {
	readonly name: string;
	readonly ticks: number;
	readonly flowPrecisionIndex: defines.flow_precision_index;
}

export const Timescales: Timescale[] = [
	{name: "5s", ticks: 60 * 5, flowPrecisionIndex: defines.flow_precision_index.five_seconds},
	{name: "1m", ticks: 60 * 60, flowPrecisionIndex: defines.flow_precision_index.one_minute},
	{name: "10m", ticks: 60 * 60 * 10, flowPrecisionIndex: defines.flow_precision_index.ten_minutes},
	{name: "1h", ticks: 60 * 60 * 60, flowPrecisionIndex: defines.flow_precision_index.one_hour},
	{name: "10h", ticks: 60 * 60 * 60 * 10, flowPrecisionIndex: defines.flow_precision_index.ten_hours},
	{name: "50h", ticks: 60 * 60 * 60 * 50, flowPrecisionIndex: defines.flow_precision_index.fifty_hours},
	{name: "250h", ticks: 60 * 60 * 60 * 250, flowPrecisionIndex: defines.flow_precision_index.two_hundred_fifty_hours},
	{name: "1000h", ticks: 60 * 60 * 60 * 1000, flowPrecisionIndex: defines.flow_precision_index.one_thousand_hours}
]

function getNetworkData(pole: LuaEntity, player: LuaPlayer): ElectricityData {
	const stats = pole.electric_network_statistics;

	const total = Object.values(stats.input_counts).reduce((a, b) => a + b, 0);
	const flow: Record<defines.flow_precision_index, number> = {};

	for (let flowKey of Timescales.map(x => x.flowPrecisionIndex)) {
		for (let inputKey in stats.input_counts) {
			const count = stats.get_flow_count({
				name: inputKey,
				input: true,
				precision_index: flowKey
			});

			if (flow[flowKey] === undefined) {
				flow[flowKey] = 0;
			}

			flow[flowKey] += count;
		}
	}

	return {
		totalWatts: total,
		flowData: flow
	};
}

export function getElectricityData(player: LuaPlayer): ElectricityData {
	const force = player.force as LuaForce;
	const surface = player.surface;

	// TODO: Do this over multiple ticks to avoid lag spikes.
	const poles = surface.find_entities_filtered({
		force,
		type: "electric-pole"
	});

	const flowData: FlowData = {};
	let totalWatts = 0;

	const checkedNetworks = new Set<number>();

	for (const pole of poles) {
		const networkId = pole.electric_network_id;
		if (networkId === undefined) continue;
		if (checkedNetworks.has(networkId)) continue;

		checkedNetworks.add(networkId);

		const data = getNetworkData(pole, player);
		totalWatts += data.totalWatts;

		for (let flowKey in data.flowData) {
			if (flowData[flowKey] === undefined) {
				flowData[flowKey] = 0;
			}

			flowData[flowKey] += data.flowData[flowKey];
		}
	}

	return {flowData, totalWatts};
}
