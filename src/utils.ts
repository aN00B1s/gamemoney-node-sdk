import { URL } from 'node:url'
import crypto from 'node:crypto'
import fs from 'node:fs'

const publicCert = fs
	.readFileSync(new URL('certs/gm.crt', import.meta.url))
	.toString()

export type RsaKey = Parameters<crypto.Sign['sign']>[0]
export type HmacKey = Parameters<typeof crypto.createHmac>[1]

type JsonPrimitive = number | number[] | string | string[] | undefined | null
export type Json = { [key: string]: Json | JsonPrimitive }

export type Body = {
	signature: string
} & Json

export function parametersToString(body: Json): string {
	let parametersString = ''
	const keys = Object.keys(body).sort()

	if (Array.isArray(body)) {
		keys.sort((a, b) => Number(a) - Number(b))
	}

	for (const key of keys) {
		let value = body[key]

		if (key === 'signature') {
			continue
		}

		value ??= ''

		if (typeof value === 'object' && value !== null) {
			value = parametersToString(value as Json)
		}

		parametersString += `${key}:${value};`
	}

	return parametersString
}

export function verifyRsaSignature(body: Body): boolean {
	return crypto
		.createVerify('RSA-SHA256')
		.update(parametersToString(body), 'utf8')
		.verify(publicCert, body.signature, 'base64')
}

export function generateRsaSignature(body: Json, key: RsaKey): string {
	return crypto
		.createSign('RSA-SHA256')
		.update(parametersToString(body), 'utf8')
		.sign(key, 'base64')
}

export function generateHmacSignature(body: Json, key: HmacKey): string {
	return crypto
		.createHmac('sha256', key)
		.update(parametersToString(body), 'utf8')
		.digest('hex')
}

export function getRandomString(length: number): string {
	return crypto
		.randomBytes(Math.ceil(length / 2))
		.toString('hex')
		.slice(0, length)
}
