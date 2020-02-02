const { entries, values, getPrototypeOf } = Object

function yank (object, ...args) {
  if (args.length === 0) return object

  const schemaList = args.flat()
  const yanked = {}

  if (!schemaList.every(arg => typeof arg === 'string')) throw 'All arguments must be strings'

  for (const schema of schemaList) {
    const parsedArgs = schema
      .replace(/\s+/g, '')
      .replace(/([\w->]+)/g, '"$1"')
      .replace(/((?<!}),|(?<=")\s?}|(?<!})$)/g, ':0$1')
    const parsedSchema = JSON.parse(`{${parsedArgs}}`)

    walk(object, yanked, parsedSchema)
  }

  if (this && this.nullify && isObject(yanked)) {
    const { length } = values(yanked)

    if (!length) return null
  }

  return yanked
}

function walk (object, yanked, schema) {
  for (const [key, value] of entries(schema)) {
    const [originalKey, renamedKey] = key.split('->')
    const newKey = renamedKey || originalKey

    if (!!object && object.hasOwnProperty(originalKey)) {
      const { length } = values(value || {})

      if (length) walk(object[originalKey], yanked[newKey] = {}, schema[key])
      else yanked[newKey] = object[originalKey]
    }

    prune(yanked)
  }
}

function prune (yanked) {
  for (const [key, value] of entries(yanked)) {
    const { length } = values(value)

    if (!length && isObject(value)) delete yanked[key]
  }
}

function isObject (object) {
  let proto = object

  while ((proto = getPrototypeOf(proto)) !== null)

  if (getPrototypeOf(object) === proto) return true
}

yank.nullify = (...args) => yank.call({ nullify: true }, ...args)

module.exports = yank
