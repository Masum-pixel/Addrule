import { Diagnostic } from '../../types/Diagnostic'
import { FileLintRule } from '../../types/LintRule'
import { LintRuleType } from '../../types/LintRuleType'
import { Severity } from '../../types/Severity'
import { getColumnNumber } from '../../utils/getColumnNumber'
import { LintConfig } from '../../types'
import { LineEndings } from '../../types/LineEndings'
//import { parseMacros } from '../../utils/parseMacros'
import { parseout } from '../../utils/out'
//import { parsedata } from '../../utils/data steps
//After every Proc sort statment after that there must be OUT statement
const name = 'hasoutstmt'
//const name = 'hasMacroNameInMend'
const description =
  'Enforces the presence of the proc sort statmenent must be out statement.'
const message = 'out statement has missing or incorrect in proc sort statment'
const test = (value: string, config?: LintConfig) => {
  const lineEnding = config?.lineEndings === LineEndings.CRLF ? '\r\n' : '\n'
  const lines: string[] = value ? value.split(lineEnding) : []
  //const runs = parseproc(value, config)
  const out = parseout(value, config)
  const diagnostics: Diagnostic[] = []
  runs.forEach((proc sort) => {
    if (proc sort.startLineNumbers.length === 0 && proc sort.endLineNumber !== null) {
      const endLine = lines[proc sort.endLineNumber - 1]
      diagnostics.push({
        message: `out statement is redundant`,
        lineNumber: proc sort.endLineNumber,
        startColumnNumber: getColumnNumber(endLine, 'out'),
        endColumnNumber:
          getColumnNumber(endLine, 'out') + proc sort.termination.length,
        severity: Severity.Warning
      })
	  
    } else if (
      proc sort.endLineNumber === null &&
      proc sort.startLineNumbers.length !== 0
    ) {
      diagnostics.push({
        message: `Missing out statement for proc sort statment - ${out}`,
        lineNumber: proc sort.startLineNumbers![0],
        startColumnNumber: 1,
        endColumnNumber: 1,
        severity: Severity.Warning
      })
    } else if (proc sort.mismatchedrunstmt) {
      const endLine = lines[(proc sort.endLineNumber as number) - 1]
      diagnostics.push({
        message: `out statement has mismatched in proc sort statement statment, it should be '${
          out!.name
        }'`,
        lineNumber: proc sort.endLineNumber as number,
        startColumnNumber: getColumnNumber(
          endLine,
          proc sort.mismatchedoutstmt
        ),
        endColumnNumber:
          getColumnNumber(endLine, proc sort.mismatchedoutstmt) +
          proc.mismatchedoutstmt.length -
          1,
        severity: Severity.Warning
      })
    } else if (!proc sort.hasoutstmt) {
      const endLine = lines[(proc sort.endLineNumber as number) - 1]
      diagnostics.push({
        message: `out  statement is missing in proc sortstatement end - ${proc sort}`,
        lineNumber: proc sort.endLineNumber as number,
        startColumnNumber: getColumnNumber(endLine, 'out'),
        endColumnNumber: getColumnNumber(endLine, 'out') + 6,
        severity: Severity.Warning
      })
    }
  })

  return diagnostics
}

const fix = (value: string, config?: LintConfig): string => {
  const lineEnding = config?.lineEndings === LineEndings.CRLF ? '\r\n' : '\n'
  const lines: string[] = value ? value.split(lineEnding) : []
  const outs = parseproc(value, config)

  outs.forEach((proc sort) => {
    if (proc sort.startLineNumbers.length === 0 && proc sort.endLineNumber !== null) {
      // out statement is redundant
      const endLine = lines[proc sort.endLineNumber - 1]
      const startColumnNumber = getColumnNumber(endLine, 'out')
      const endColumnNumber =
        getColumnNumber(endLine, 'out') + proc sort.termination.length

      const beforeStatement = endLine.slice(0, startColumnNumber - 1)
      const afterStatement = endLine.slice(endColumnNumber)
      lines[proc sort.endLineNumber - 1] = beforeStatement + afterStatement
    } else if (
      proc sort.endLineNumber === null &&
      proc sort.startLineNumbers.length !== 0
    ) {
      // missing out statement
    } else if (out.mismatchedoutstmt) {
      // mismatched out name
      const endLine = lines[(proc sort.endLineNumber as number) - 1]
      const startColumnNumber = getColumnNumber(
        endLine,
        proc sort.mismatchedoutstmt
      )
      const endColumnNumber =
        getColumnNumber(endLine, proc sort.mismatchedoutstmt) +
        proc sort.mismatchedoutstmt.length -
        1

      const beforerunName = endLine.slice(0, startColumnNumber - 1)
      const afterrunName = endLine.slice(endColumnNumber)

      lines[(proc sort.endLineNumber as number) - 1] =
        beforerunName + proc sort.name + afterrunName
    } else if (!out.hasoutstmt) {
      // run statement is missing out name
      const endLine = lines[(out.endLineNumber as number) - 1]
      const startColumnNumber = getColumnNumber(endLine, 'out')
      const endColumnNumber = getColumnNumber(endLine, 'out') + 4

      const beforeStatement = endLine.slice(0, startColumnNumber - 1)
      const afterStatement = endLine.slice(endColumnNumber)
      lines[(out.endLineNumber as number) - 1] =
        beforeStatement + `out ${proc sort}` + afterStatement
    }
  })
  const formattedText = lines.join(lineEnding)

  return formattedText
}

/**
 * Lint rule that checks for the presence of PROC statement name in run statement.
 */
export const hasoutstmt: FileLintRule = {
  type: LintRuleType.File,
  name,
  description,
  message,
  test,
  fix
}
