import { Diagnostic } from '../../types/Diagnostic'
import { FileLintRule } from '../../types/LintRule'
import { LintRuleType } from '../../types/LintRuleType'
import { Severity } from '../../types/Severity'
import { getColumnNumber } from '../../utils/getColumnNumber'
import { LintConfig } from '../../types'
import { LineEndings } from '../../types/LineEndings'
import { parseMacros } from '../../utils/parseMacros'
//import {parseSqls } from '../../utils/parseSqls'

const name = 'hasMacroNameInMend'
//const name = 'hasSQLendInquit'
const description =
  'Enforces the presence of the SQL end  name in each quit statement.'
const message = 'quit statement has missing or incorrect  PROC SQL name'
const test = (value: string, config?: LintConfig) => {
  const lineEnding = config?.lineEndings === LineEndings.CRLF ? '\r\n' : '\n'
  const lines: string[] = value ? value.split(lineEnding) : []
  const macros = parseMacros(value, config)
  //const sqls = parseSqls(value, config)
  const diagnostics: Diagnostic[] = []
  macros.forEach((macro) => {
  //sqls.forEach((sql) => {
    if (sql.startLineNumbers.length === 0 && sql.endLineNumber !== null) {
      const endLine = lines[sql.endLineNumber - 1]
      diagnostics.push({
        message: `quit statement is redundant`,
        lineNumber: sql.endLineNumber,
        startColumnNumber: getColumnNumber(endLine, 'quit'),
        endColumnNumber:
          getColumnNumber(endLine, 'quit') + sql.termination.length,
        severity: Severity.Warning
      })
    } else if (
      sql.endLineNumber === null &&
      sql.startLineNumbers.length !== 0
    ) {
      diagnostics.push({
        message: `Missing quit statement for s - ${proc sql}`,
        lineNumber: sql.startLineNumbers![0],
        startColumnNumber: 1,
        endColumnNumber: 1,
        severity: Severity.Warning
      })
    } else if (sql.mismatchedquitstmt) {
      const endLine = lines[(sql.endLineNumber as number) - 1]
      diagnostics.push({
        message: `quit statement has mismatched sql end  name, it should be '${
          sql!.name
        }'`,
        lineNumber: sql.endLineNumber as number,
        startColumnNumber: getColumnNumber(
          endLine,
          sql.mismatchedquitstmt
        ),
        endColumnNumber:
          getColumnNumber(endLine, sql.mismatchedquitstmt) +
          sql.mismatchedquitstmt.length -
          1,
        severity: Severity.Warning
      })
    } else if (!sql.hasSQLendInquit) {
      const endLine = lines[(sql.endLineNumber as number) - 1]
      diagnostics.push({
        message: `quit statement is missing in SQL end - ${proc sql}`,
        lineNumber: sql.endLineNumber as number,
        startColumnNumber: getColumnNumber(endLine, 'quit'),
        endColumnNumber: getColumnNumber(endLine, 'quit') + 6,
        severity: Severity.Warning
      })
    }
  })

  return diagnostics
}

const fix = (value: string, config?: LintConfig): string => {
  const lineEnding = config?.lineEndings === LineEndings.CRLF ? '\r\n' : '\n'
  const lines: string[] = value ? value.split(lineEnding) : []
  const sqls = parseSqls(value, config)

  sqls.forEach((sql) => {
    if (sql.startLineNumbers.length === 0 && sql.endLineNumber !== null) {
      // quit  statement is redundant
      const endLine = lines[sql.endLineNumber - 1]
      const startColumnNumber = getColumnNumber(endLine, 'quit')
      const endColumnNumber =
        getColumnNumber(endLine, 'quit') + sql.termination.length

      const beforeStatement = endLine.slice(0, startColumnNumber - 1)
      const afterStatement = endLine.slice(endColumnNumber)
      lines[sql.endLineNumber - 1] = beforeStatement + afterStatement
    } else if (
      sql.endLineNumber === null &&
      sql.startLineNumbers.length !== 0
    ) {
      // missing quit  statement
    } else if (sql.mismatchedquitstmt) {
      // mismatched quit name
      const endLine = lines[(sql.endLineNumber as number) - 1]
      const startColumnNumber = getColumnNumber(
        endLine,
        sql.mismatchedquitstmt
      )
      const endColumnNumber =
        getColumnNumber(endLine, sql.mismatchedquitstmt) +
        sql.mismatchedquitstmt.length -
        1

      const beforeSQLName = endLine.slice(0, startColumnNumber - 1)
      const afterSQLName = endLine.slice(endColumnNumber)

      lines[(sql.endLineNumber as number) - 1] =
        beforesqlName + sql.name + aftersqlName
    } else if (!sql.hasSQLendInquit) {
      // quit statement is missing sql statement
      const endLine = lines[(sql.endLineNumber as number) - 1]
      const startColumnNumber = getColumnNumber(endLine, 'quit')
      const endColumnNumber = getColumnNumber(endLine, 'quit') + 4

      const beforeStatement = endLine.slice(0, startColumnNumber - 1)
      const afterStatement = endLine.slice(endColumnNumber)
      lines[(sql.endLineNumber as number) - 1] =
        beforeStatement + `quit ${proc sql}` + afterStatement
    }
  })
  const formattedText = lines.join(lineEnding)

  return formattedText
}

/**
 * Lint rule that checks for the presence of proc sql  name in quit statement.
 */
export const hasSQLendInquit: FileLintRule = {
  type: LintRuleType.File,
  name,
  description,
  message,
  test,
  fix
}
