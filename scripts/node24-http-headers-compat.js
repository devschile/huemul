// Description:
//   Compatibility shim for legacy connect/express middleware on Node 24+
//
// Commands:
//   None
//
// Author:
//   @huemul

const http = require('node:http')

const majorNodeVersion = Number.parseInt(process.versions.node.split('.')[0], 10)
const responsePrototype = http.ServerResponse && http.ServerResponse.prototype

if (majorNodeVersion >= 24 && responsePrototype) {
  const headersDescriptor = Object.getOwnPropertyDescriptor(responsePrototype, '_headers')

  if (!headersDescriptor) {
    Object.defineProperty(responsePrototype, '_headers', {
      configurable: true,
      enumerable: false,
      get () {
        return this.getHeaders()
      }
    })
  }
}
