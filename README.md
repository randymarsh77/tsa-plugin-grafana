# tsa-plugin-grafana

Grafana plugin for [tsa](https://github.com/randymarsh77/tsa-cli).

## Installation

```
npm i -g @tsa-tools/cli tsa-plugin-grafana
```

[Obtain your authentication value](#auth).

## Usage

With no configuration
```
tsa --plugin tsa-plugin-grafana --host my.grafana.host.com --auth abc123 --instance [east,west]-web-node[0{1-9},{10-20}] --domain .my.site.com --since 1d
```

Set some defaults to make repeat calls easier
```
tsa config --default plugin=tsa-plugin-grafana
tsa config --alias production=my.grafana.host.com
tsa config --default host=production
tsa config --default domain=.my.site.com
tsa config --default auth=abc123
```

Ah, that is easier
```
tsa --instance awesome-web-node --since 1d
```

Query multiple instances using template expansion
```
tsa --instance [east,west]-web-node[0{1-9},{10-20}]
```

Output looks like
```
wen-node05: Min: 5 Max: 80 Mean: 36.60696517412935
wen-node03: Min: 7 Max: 90 Mean: 39.6407960199005
wen-node04: Min: 8 Max: 99 Mean: 40.99800995024876
```

## Template Expansion

- `[]` indicates a group to expand.
- Within a group, separate expansions by `,`
- Within an expansion, use `{num-num}` to expand an integer range.

#### Examples

Input
```
[one,two,three]-thing[0{1-2},-special]
```

Produces
```
one-thing01
one-thing02
one-thing-special
two-thing01
two-thing02
two-thing-special
three-thing01
three-thing02
three-thing-special
```

## Auth

- Open Dev Tools in a browser and capture network traffic while expanding/changing metrics.
- Look at the Cookie header on a request to query_range. One of the entries should set grafana_session.
- Copy this value and pass it via `--auth`, or, run `tsa config --default auth=value`
