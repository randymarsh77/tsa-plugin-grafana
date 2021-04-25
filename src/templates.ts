function parseRange(range: string): string[] {
	const [start, end] = range.split('-').map((x) => parseInt(x));
	return Array.from({ length: end + 1 - start }, (_, i) => i + start).map((x) => `${x}`);
}

function expandSplit(split: string): string[] {
	const parts = split.split(/(\{.*?\})/).filter((x) => x);
	const expansion = parts.reduce<string[]>((acc, v) => {
		const splits = v.startsWith('{') ? parseRange(v.replace('{', '').replace('}', '')) : [v];
		return acc.length === 0 ? splits : acc.flatMap((x) => splits.map((y) => `${x}${y}`));
	}, []);
	return expansion;
}

export function expandTemplate(template: string) {
	// Given a template, expand into all possible values.
	// Template syntax uses [] to indicate an expansion group
	//   , delimited expands individual items
	//   {num-num} should expand an integer range
	const parts = template.split(/(\[.*?\])/).filter((x) => x);
	const expansion = parts.reduce<string[]>((acc, v) => {
		const splits = v.startsWith('[')
			? v.replace('[', '').replace(']', '').split(',').flatMap(expandSplit)
			: [v];
		return acc.length === 0 ? splits : acc.flatMap((x) => splits.map((y) => `${x}${y}`));
	}, []);
	return expansion;
}
