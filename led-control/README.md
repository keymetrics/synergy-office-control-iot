# led-control
App controlling led strips on RPi

- Production: `leds.local`
- Development: `localhost:3000`

## Install
```
git clone git@github.com:keymetrics/led-control.git && cd led-control && yarn
```

## Deploy
```
pm2 deploy production
```

## Example
```
curl -XPOST http://leds.local/color/0000FF
```

## Color
```http
POST /color/:color
```

## Tick
```http
POST /tick/:color
```

## Led
```http
POST /led/:number/:color
```

## Mods
### Follow
```http
POST /follow
```

### Sequence
```http
POST /sequence
```
