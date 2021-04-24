# tsa-plugin-grafana

Grafana plugin for [tsa](https://github.com/randymarsh77/tsa-cli).

## Usage

With no configuration
```
tsa --plugin tsa-plugin-grafana --host cool.site.com --nodes web-node-number* --since 1d --stat cpu --metric max
```

Set some defaults to make repeat calls easier
```
tsa config --default plugin=tsa-plugin-grafana
tsa config --alias production=cool.site.com
tsa config --default host=production
```

Ah, that is easier
```
tsa --nodes web-node-number* --since 1d --stat cpu --metric max
```

Do you do a thing a lot?
```
tsa config --alias max-cpu='--nodes web-node-number* --stat cpu --metric max'
```

Even easier
```
tsa max-cpu --since 1d
```
