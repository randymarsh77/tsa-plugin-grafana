import axios from 'axios';
import { IPluginWithOptions } from '@simple-cli/base';
import { ITSAPluginArgs, TSAPluginResult } from '@tsa-tools/cli';

const definitions = [
	{
		name: 'host',
		type: String,
		description: 'The host domain of Grafana.',
	},
	{
		name: 'instance',
		type: String,
		description: 'The name of the instance.',
	},
	{
		name: 'domain',
		type: String,
		description: 'The domain of the instance.',
	},
	{
		name: 'auth',
		type: String,
		descripton: 'grafana_session token',
	},
];

interface IGrafanaOptions {
	host: string;
	instance: string;
	domain: string;
	auth: string;
}

function buildQuery(instance: string, domain: string) {
	const query = `cpucap_cur_usage_percentage{instance=~"${instance}${domain}",job=~".*@cmon.*"} / cpucap_limit_percentage{instance=~"${instance}${domain}"} * 100`;
	return encodeURIComponent(query);
}

const execute = async (
	{ start, end, step }: ITSAPluginArgs,
	{ host, instance, domain, auth }: IGrafanaOptions
) => {
	const arg = buildQuery(instance, domain);
	const range = `&start=${start}&end=${end}&step=${step}`;
	const path = `api/datasources/proxy/1/api/v1/query_range?query=${arg}${range}`;
	const url = `https://${host}/${path}`;

	try {
		const response = await axios.get(url, {
			headers: {
				Cookie: `grafana_session=${auth}`,
			},
		});
		const data = response.data.data.result[0].values.map(([ts, v]: string[]) => [
			new Date(ts),
			parseInt(v, 10),
		]);
		return data;
	} catch (error) {
		console.error(error);
		process.exit(1);
	}
};

const plugin: IPluginWithOptions<IGrafanaOptions, ITSAPluginArgs, TSAPluginResult> = {
	definitions,
	execute,
};

export default plugin;
