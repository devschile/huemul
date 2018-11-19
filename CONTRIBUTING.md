# Contribuir

El repositorio de Huemul queda abierto para todos los miembros de [devsChile en GitHub](https://github.com/devschile).

En la medida que sea posible todo script _complejo_ que se quiera agregar debería ser su propio paquete de npm, ya sea el original o un fork con los cambios en esta organización u otra parte. **Una buena regla es que si tu script tiene dependencias debería ser su propio paquete, sino puede ir en la carpeta de scripts.**

## Pasos:

* Fork a tu cuenta de GitHub y clone este repo en tu local.
* `$ cd ruta/a/huemul`
* `$ npm install` o `$ yarn` (probablemente sea mejor usar `sudo` a menos que uses nodenv o nvm).
* Si estás usando la carpeta de scripts deja tu código en `huemul/scripts`, sino:

--

* `npm install -g yo generator-hubot` para instalar el generador de hubot.
* `yo hubot:script` en la carpeta correspondiente para crear el template para un script.
* Una vez [publicado el paquete en npm](https://gist.github.com/coolaj86/1318304) agrégalo a `external-scripts.json` y `package.json`.

--

* Es necesario tener MongoDB instalado o bien usar `$ docker-compose up -d` para iniciar un contenedor con MongoDB expuesto al puerto 27017 en tu localhost. Para detener el servicio de MongoDB debes ejecutar `$ docker-compose stop`.
* Para probar tus cambios localmente: `$ npm run dev` y activarás a Huemul. Ahora ya podrás invocarlo junto con sus comandos y los que hayas escrito.
* Para enviar tus cambios a Huemul, los pasos son:
  * Haz un [_pull request_](https://github.com/devschile/huemul/pulls) y explica lo que hiciste. Agrega el comando para probarlo en el comentario.
  * Agrega como reviewers a [@leonardo](https://devschile.slack.com/messages/huemul-devs/team/leonardo/), [@hector](https://devschile.slack.com/messages/huemul-devs/team/hector/), [@gmq](https://devschile.slack.com/messages/huemul-devs/team/gmq/) y/o [@jorgeepunan](https://devschile.slack.com/messages/huemul-devs/team/jorgeepunan/).
  * Coméntalo en [Slack devsChile](http://www.devschile.cl) canal [_#huemul-devs_](http://devschile.slack.com/messages/huemul-devs) y será revisado, testeado, linteado y, si pasa los rigurosos análisis, será agregado.
* Para más información sobre _Hubot_ consulta [Hubot Documentation > Scripting](https://hubot.github.com/docs/scripting/).
* **No olvides documentar tu código**.

```
                                 ;;;;;;   ;;;
                                 @@@@@@   @@@
                              ;;;+++@@@;;;+++;;;
                              @@@;;;@@@@@@;;;@@@
                              @@@;;;@@@@@@;;;@@@
                              @@@;;;;;;;;;;;;@@@
                                 @@@;;;@@@;;;;;;@@@
                                 @@@;;;@@@;;;;;;@@@
                                 @@@;;;;;;;;;;;;;;;@@@
                                 @@@;;;;;;;;;;;;;;;@@@
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@;;;;;;;;;;;;;;;@@@@@@
   @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@;;;;;;;;;;;;;;;@@@@@@
@@@......:;;;;;;;;;;;;;;;;;;;;;;;;;;;@@@@@@@@@
@@@......:;;;;;;;;;;;;;;;;;;;;;;;;;;;@@@@@@@@@
   @@@+;;;;;;;;;;;;;;;;;;;;;;;;;;;@@@
   @@@+;;;;;;;;;;;;;;;;;;;;;;;;;;;@@@
   @@@+;;;;;;;;;;;;;;;;;;;;;;;;@@@
   @@@+;;;;;;;;;;;;;;;;;;;;;;;;@@@
      ;@@+;;;;;;@@@@@@@@@;;;;;;@@@
      ;@@+;;;;;;@@@@@@@@@;;;;;;@@@
   @@@+;;;;;;@@@         @@@;;;@@@
   @@@+;;;;;;@@@         @@@;;;@@@
   @@@'..'@@@            @@@...@@@
   @@@'..'@@@            @@@...@@@
      ;@@;                  @@@
      ;@@;                  @@@
```
