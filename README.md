# Huemul

[![dependency Status](https://img.shields.io/david/devschile/huemul.svg?style=flat-square)](https://david-dm.org/devschile/huemul#info=dependencies)
[![devDependency Status](https://img.shields.io/david/dev/devschile/huemul.svg?style=flat-square)](https://david-dm.org/devschile/huemul#info=devDependencies)
[![Total alerts](https://img.shields.io/lgtm/alerts/g/devschile/huemul.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/devschile/huemul/alerts/)
[![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/devschile/huemul.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/devschile/huemul/context:javascript)

Este un bot basado en [Hubot](https://hubot.github.com/) para [devsChile](http://www.devschile.cl) ([canal en Slack](http://devschile.slack.com)).

Posee todas las funciones básicas de Hubot y varios aportes de [esforzados desarrolladores](https://github.com/devschile/huemul/graphs/contributors) y amantes del _Open Source_.

## ¿Qué comandos sabe?

Para consultar cuáles son las cosas que trae, puedes escribirle públicamente: `@huemul help`; si quieres preguntarle en privado, debes ir a _direct messages_, escribirle a **@huemul** y simplemente decir: `help`. Normalmente es muy rápido, a menos que esté ocupado en otra cosa.

## Contribuir

El repositorio queda abierto para todos los miembros de [devsChile en GitHub](https://github.com/devschile), si quieres agregar alguna función sigue los pasos en [CONTRIBUTING](CONTRIBUTING.md).

---

![huemul-bot](http://www.utalca.cl/medios/utalca2010/saladeprensa/Estudiantes/huemul_2015_utalca.jpg)

## Stickers

Nuestro bot es tan querido que tenemos _swags_ los que están disponibles en [la tienda devsChile](https://tienda.devschile.cl)

![Swags huemul](https://i.imgur.com/aNEtsHa.jpg)

## Deploy en Coolify con Nixpacks

El repositorio incluye `nixpacks.toml` para desplegar con Node 24 y `yarn`.

1.  Crea una nueva **Application** en Coolify desde este repositorio.
2.  Selecciona **Build Pack: Nixpacks**.
3.  Configura el puerto interno en `8080` y asocia tu dominio HTTPS.
4.  Crea un servicio de **MongoDB** en Coolify y usa su URI interna para `MONGODB_URL`.
5.  Carga variables de entorno desde `.env.coolify.example` (al menos las obligatorias).
6.  Despliega.

Nota: el `install` usa Corepack para asegurar Yarn ejecutándose sobre Node 24 dentro de Nixpacks.

### Variables mínimas obligatorias

* `HUBOT_SLACK_TOKEN`
* `MONGODB_URL`
* `NODE_ENV=production`
* `PORT=8080`

Compatibilidad: también puedes usar `HUBOT_MONGODB_URL`; el comando de arranque lo mapea a `MONGODB_URL` si este no existe.
