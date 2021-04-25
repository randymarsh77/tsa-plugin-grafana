import axios from 'axios';
import { IPluginWithOptions } from '@simple-cli/base';
import { ILabeledTimeSeriesData, ITSAPluginArgs, TSAPluginResult } from '@tsa-tools/cli';
import { expandTemplate } from './templates';

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

function buildQuery(instances: string[], domain: string) {
	const escapedDomain = domain.replace(/\./g, '\\\\.');
	const nodes = instances.map((x) => `${x}${escapedDomain}`).join('|');
	const query = `cpucap_cur_usage_percentage{instance=~"${nodes}",job=~".*@cmon.*"} / cpucap_limit_percentage{instance=~"${nodes}"} * 100`;
	return encodeURIComponent(query);
}

function validateGrafanaOptionsOrFail({ host, instance, domain, auth }: IGrafanaOptions) {
	if (!auth) {
		console.error('You must provide a grafana_session cookie.');
		console.info(
			'Open Dev Tools in a browser and capture network traffic while expanding/changing metrics.'
		);
		console.info(
			'Look at the Cookie header on a request to query_range. One of the entries should set grafana_session.'
		);
		console.info(
			'Copy this value and pass it via `--auth`, or, run `tsa config --default auth=value`'
		);
		process.exit(1);
	}

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
		const seriesData = response.data.data.result as any[];
		if (!seriesData || seriesData.length === 0) {
			console.log('No data for specified time frame.');
			process.exit(0);
		}

		const data = seriesData.reduce<ILabeledTimeSeriesData>((acc, x) => {
			const { values, metric } = x;
			const label = metric.instance.replace(domain, '');
			const series = values.map(([ts, v]: string[]) => [new Date(ts), parseInt(v, 10)]);
			acc[label] = series;
			return acc;
		}, {});
		return { data };
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
