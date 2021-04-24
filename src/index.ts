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

function expandTemplate(template: string) {
	// Given a template, expand into all possible values.
	// Template syntax uses [] to indicate an expansion group
	// , delimited expands individual items
	// TODO: num-num should expand an integer range
	const parts = template.split(/(\[.*?\])/).filter((x) => x);
	const expansion = parts.reduce<string[]>((acc, v) => {
		const splits = v.startsWith('[') ? v.replace('[', '').replace(']', '').split(',') : [v];
		return acc.length === 0 ? splits : acc.flatMap((x) => splits.map((y) => `${x}${y}`));
	}, []);
	return expansion;
}

function buildQuery(instances: string[], domain: string) {
	const escapedDomain = domain.replace(/\./g, '\\\\.');
	const nodes = instances.map((x) => `${x}${escapedDomain}`).join('|');
	const query = `cpucap_cur_usage_percentage{instance=~"${nodes}",job=~".*@cmon.*"} / cpucap_limit_percentage{instance=~"${nodes}"} * 100`;
	return encodeURIComponent(query);
}

function validateGrafanaOptionsOrFail({ host, instance, domain, auth }: IGrafanaOptions) {
	if (!host) {
		console.error('You must provide a valid host. e.g. --host my.grafana.host.com');
		process.exit(1);
	}

	if (!instance) {
		console.error('You must provide a valid instance. e.g. --instance my-web-node');
		process.exit(1);
	}

	if (!domain) {
		console.error('You must provide a valid domain. e.g. --domain .my.company.io');
		process.exit(1);
	}
}

const execute = async ({ start, end, step }: ITSAPluginArgs, grafanaOptions: IGrafanaOptions) => {
	validateGrafanaOptionsOrFail(grafanaOptions);

	const { host, instance, domain, auth } = grafanaOptions;
	const arg = buildQuery(expandTemplate(instance), domain);
	const startSeconds = Math.round(start / 1000);
	const endSeconds = Math.round(end / 1000);
	const stepSeconds = Math.round(step / 1000);
	const range = `&start=${startSeconds}&end=${endSeconds}&step=${stepSeconds}`;
	const path = `api/datasources/proxy/1/api/v1/query_range?query=${arg}${range}`;
	const url = `https://${host}/${path}`;

	try {
		const response = await axios.get(url, {
			headers: {
				Cookie: `grafana_session=${auth}`,
			},
		});
		const seriesData = response.data.data.result;
		if (!seriesData || seriesData.length === 0) {
			console.log('No data for specified time frame.');
			process.exit(0);
		}

		const data = seriesData.flatMap((x: any) =>
			x.values.map(([ts, v]: string[]) => [new Date(ts), parseInt(v, 10)])
		);
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
