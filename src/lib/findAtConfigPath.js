import fs from 'fs'
import path from 'path'

/**
 * Find the @config at-rule in the given CSS AST and return the relative path to the config file
 *
 * @param {import('postcss').Root} root
 * @param {import('postcss').Result} result
 */
export function findAtConfigPath(root, result) {
  let configPath = null
  let relativeTo = null

  root.walkAtRules('config', (rule) => {
    relativeTo = rule.source?.input.file ?? result.opts.from ?? null

    if (relativeTo === null) {
      throw rule.error(
        'The `@config` at-rule cannot be used without a `from` option being set on the PostCSS config.'
      )
    }

    if (configPath) {
      throw rule.error('Only `@config` at-rule is allowed per file.')
    }

    let matches = rule.params.match(/(['"])(.*?)\1/)
    if (!matches) {
      throw rule.error(
        'The `@config` at-rule must be followed by a string containing the path to the config file.'
      )
    }

    let inputPath = matches[2]
    if (path.isAbsolute(inputPath)) {
      throw rule.error('The `@config` at-rule cannot be used with an absolute path.')
    }

    configPath = path.resolve(path.dirname(relativeTo), inputPath)
    if (!fs.existsSync(configPath)) {
      throw rule.error(
        `The config file at "${inputPath}" does not exist. Make sure the path is correct and the file exists.`
      )
    }

    rule.remove()
  })

  return configPath ? configPath : null
}
