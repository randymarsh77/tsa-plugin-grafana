# @tsa/cli

Grafana plugin for [tsa]().

## Usage

```
// With no configuration
tsa --plugin tsa-plugin-grafana --host cool.site.com --nodes web-node-number* --since 1d --stat cpu --metric max

// Set some defaults to make repeat calls easier
tsa config --profile --default plugin=grafana
tsa config --profile grafana --alias production=cool.site.com
tsa config --profile grafana --default host=production

// Ah, that is easier
tsa --nodes web-node-number* --since 1d --stat cpu --metric max

// Do you do a thing a lot?
tsa config --profile grafana --alias max-cpu='--nodes web-node-number* --stat cpu --metric max'

// Even easier
tsa max-cpu --since 1d
```
