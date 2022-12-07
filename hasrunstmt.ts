import { Diagnostic } from '../../types/Diagnostic'
import { FileLintRule } from '../../types/LintRule'
import { LintRuleType } from '../../types/LintRuleType'
import { Severity } from '../../types/Severity'
import { getColumnNumber } from '../../utils/getColumnNumber'
import { LintConfig } from '../../types'
import { LineEndings } from '../../types/LineEndings'
//import { parseMacros } from '../../utils/parseMacros'
import { parseproc } from '../../utils/proc'
//import { parsedata } from '../../utils/data steps

const name = 'hasrunstmt'
//const name = 'hasMacroNameInMend'
const description =
  'Enforces the presence of the Proc statment end with run  statement.'
const message = 'run statement has missing or incorrect in proc statment'
const test = (value: string, config?: LintConfig) => {
  const lineEnding = config?.lineEndings === LineEndings.CRLF ? '\r\n' : '\n'
  const lines: string[] = value ? value.split(lineEnding) : []
  const runs = parseproc(value, config)
  const diagnostics: Diagnostic[] = []
  runs.forEach((proc) => {
    if (proc.startLineNumbers.length === 0 && proc.endLineNumber !== null) {
      const endLine = lines[proc.endLineNumber - 1]
      diagnostics.push({
        message: `run statement is redundant`,
        lineNumber: proc.endLineNumber,
        startColumnNumber: getColumnNumber(endLine, 'run'),
        endColumnNumber:
          getColumnNumber(endLine, 'run') + proc.termination.length,
        severity: Severity.Warning
      })
    } else if (
      proc.endLineNumber === null &&
      proc.startLineNumbers.length !== 0
    ) {
      diagnostics.push({
        message: `Missing run  statement for proc statment - ${run}`,
        lineNumber: proc.startLineNumbers![0],
        startColumnNumber: 1,
        endColumnNumber: 1,
        severity: Severity.Warning
      })
    } else if (proc.mismatchedrunstmt) {
      const endLine = lines[(proc.endLineNumber as number) - 1]
      diagnostics.push({
        message: `run statement has mismatched in proc statement statment, it should be '${
          run!.name
        }'`,
        lineNumber: proc.endLineNumber as number,
        startColumnNumber: getColumnNumber(
          endLine,
          proc.mismatchedrunstmt
        ),
        endColumnNumber:
          getColumnNumber(endLine, proc.mismatchedrunstmt) +
          proc.mismatchedrunstmt.length -
          1,
        severity: Severity.Warning
      })
    } else if (!proc.hasrunstmt) {
      const endLine = lines[(proc.endLineNumber as number) - 1]
      diagnostics.push({
        message: `run  statement is missing in proc statement end - ${proc}`,
        lineNumber: proc.endLineNumber as number,
        startColumnNumber: getColumnNumber(endLine, 'run'),
        endColumnNumber: getColumnNumber(endLine, 'run') + 6,
        severity: Severity.Warning
      })
    }
  })

  return diagnostics
}

const fix = (value: string, config?: LintConfig): string => {
  const lineEnding = config?.lineEndings === LineEndings.CRLF ? '\r\n' : '\n'
  const lines: string[] = value ? value.split(lineEnding) : []
  const runs = parseproc(value, config)

  runs.forEach((proc) => {
    if (proc.startLineNumbers.length === 0 && proc.endLineNumber !== null) {
      // %mend statement is redundant
      const endLine = lines[proc.endLineNumber - 1]
      const startColumnNumber = getColumnNumber(endLine, 'run')
      const endColumnNumber =
        getColumnNumber(endLine, 'run') + proc.termination.length

      const beforeStatement = endLine.slice(0, startColumnNumber - 1)
      const afterStatement = endLine.slice(endColumnNumber)
      lines[proc.endLineNumber - 1] = beforeStatement + afterStatement
    } else if (
      proc.endLineNumber === null &&
      proc.startLineNumbers.length !== 0
    ) {
      // missing run statement
    } else if (run.mismatchedrunstmt) {
      // mismatched macro name
      const endLine = lines[(proc.endLineNumber as number) - 1]
      const startColumnNumber = getColumnNumber(
        endLine,
        proc.mismatchedrunstmt
      )
      const endColumnNumber =
        getColumnNumber(endLine, proc.mismatchedrunstmt) +
        proc.mismatchedrunstmt.length -
        1

      const beforerunName = endLine.slice(0, startColumnNumber - 1)
      const afterrunName = endLine.slice(endColumnNumber)

      lines[(proc.endLineNumber as number) - 1] =
        beforerunName + proc.name + afterrunName
    } else if (!run.hasrunstmt) {
      // run statement is missing macro name
      const endLine = lines[(run.endLineNumber as number) - 1]
      const startColumnNumber = getColumnNumber(endLine, 'run')
      const endColumnNumber = getColumnNumber(endLine, 'run') + 4

      const beforeStatement = endLine.slice(0, startColumnNumber - 1)
      const afterStatement = endLine.slice(endColumnNumber)
      lines[(run.endLineNumber as number) - 1] =
        beforeStatement + `run ${proc}` + afterStatement
    }
  })
  const formattedText = lines.join(lineEnding)

  return formattedText
}

/**
 * Lint rule that checks for the presence of PROC statement name in run statement.
 */
export const hasrunstmt: FileLintRule = {
  type: LintRuleType.File,
  name,
  description,
  message,
  test,
  fix
}
