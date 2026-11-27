// Cliente S3 mínimo (Signature v4, path-style) para la instancia Garage de devsChile.
// Sin SDK: firma con crypto y sube con node-fetch.
//
// Configuration:
//   CAJA_S3_ENDPOINT (default https://s3-static.devschile.cl)
//   CAJA_S3_BUCKET (default static)
//   CAJA_S3_REGION (default garage)
//   CAJA_S3_ACCESS_KEY_ID, CAJA_S3_SECRET_ACCESS_KEY

const crypto = require('crypto')
const fetch = require('node-fetch')

const encodeRfc3986 = value =>
  encodeURIComponent(value).replace(/[!'()*]/g, ch => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`)

const encodeKey = key => key.split('/').map(encodeRfc3986).join('/')

const sha256Hex = data => crypto.createHash('sha256').update(data).digest('hex')

const hmac = (key, data) => crypto.createHmac('sha256', key).update(data).digest()

const toAmzDate = date => date.toISOString().replace(/[:-]|\.\d{3}/g, '')

const config = () => ({
  endpoint: (process.env.CAJA_S3_ENDPOINT || 'https://s3-static.devschile.cl').replace(/\/+$/, ''),
  bucket: process.env.CAJA_S3_BUCKET || 'static',
  region: process.env.CAJA_S3_REGION || 'garage',
  accessKeyId: process.env.CAJA_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.CAJA_S3_SECRET_ACCESS_KEY
})

const isConfigured = cfg => Boolean(cfg.accessKeyId && cfg.secretAccessKey)

const publicUrl = key =>
  `${(process.env.CAJA_PUBLIC_URL || 'https://static.devschile.cl').replace(/\/+$/, '')}/${encodeKey(key)}`

const buildRequest = (method, key, body, contentType, date) => {
  const cfg = config()
  if (!isConfigured(cfg)) throw new Error('S3 no configurado')

  const endpoint = new URL(cfg.endpoint)
  const basePath = endpoint.pathname.replace(/\/+$/, '')
  const canonicalUri = `${basePath}/${encodeRfc3986(cfg.bucket)}/${encodeKey(key)}`
  const payloadHash = sha256Hex(body || '')

  const headers = {
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': toAmzDate(date || new Date())
  }
  if (contentType) headers['content-type'] = contentType

  const host = endpoint.host
  const signed = Object.assign({ host }, headers)
  const names = Object.keys(signed).sort()
  const canonicalHeaders = names.map(name => `${name}:${String(signed[name]).trim()}\n`).join('')
  const signedHeaders = names.join(';')
  const canonicalRequest = [method, canonicalUri, '', canonicalHeaders, signedHeaders, payloadHash].join('\n')

  const shortDate = headers['x-amz-date'].slice(0, 8)
  const scope = `${shortDate}/${cfg.region}/s3/aws4_request`
  const stringToSign = ['AWS4-HMAC-SHA256', headers['x-amz-date'], scope, sha256Hex(canonicalRequest)].join('\n')

  const signingKey = hmac(hmac(hmac(hmac(`AWS4${cfg.secretAccessKey}`, shortDate), cfg.region), 's3'), 'aws4_request')
  const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex')

  headers.authorization = `AWS4-HMAC-SHA256 Credential=${cfg.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`

  return { url: `${cfg.endpoint}${canonicalUri}`, headers }
}

const request = (method, key, body, contentType, timeout) => {
  const req = buildRequest(method, key, body, contentType)
  return fetch(req.url, {
    method,
    headers: req.headers,
    body: method === 'PUT' ? body : undefined,
    timeout: Number(timeout) || 15000
  })
}

const putObject = (key, body, contentType) => request('PUT', key, body, contentType)

const headObject = key => request('HEAD', key, '', null).then(res => res.status)

module.exports = { config, isConfigured, publicUrl, putObject, headObject }
