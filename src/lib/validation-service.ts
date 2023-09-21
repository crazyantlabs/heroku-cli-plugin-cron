import validator from 'validator'
import {JobState, DynoSize, ScheduleType, TargetType} from './schema'

import * as cronParser from 'cron-parser'
import * as moment from 'moment-timezone'
import * as _ from 'lodash'

function validateCronExpression(expression: string, options = {}) {
  try {
    const parts = expression.split(' ')

    // Check if we have empty parts
    if (_.some(parts, _.isEmpty)) {
      return false
    }

    // Verify we have exactly 5 parts
    if (parts.length === 5) {
      cronParser.parseExpression(expression, options)
      return true
    }

    return false
  } catch {
    return false
  }
}

const rateExpressionPattern =
  /^(\d+)\s+(minute|minutes|hour|hours|day|days)$/
function validateRateExpression(expression: string) {
  // Check if the expression matches the pattern
  const match = expression.match(rateExpressionPattern)
  if (!match) {
    return false // Expression doesn't match the pattern
  }

  const value = Number(match[1]) // Extract the value from the match
  const unit = match[2] // Extract the unit from the match

  // Check if the value is a positive number
  if (Number.isNaN(value) || value <= 0) {
    return false
  }

  // Check if the unit is valid based on the value
  if (value === 1 && unit.endsWith('s')) {
    return false // Invalid unit for value of 1
  }

  if (value > 1 && !unit.endsWith('s')) {
    return false // Invalid unit for value greater than 1
  }

  return true
}

export function isRateExpression(expression: string): boolean {
  return rateExpressionPattern.test(expression)
}

function validateScheduleExpression(expression: string, options = {}) {
  return isRateExpression(expression) ? validateRateExpression(expression) : validateCronExpression(expression, options)
}

interface Validation {
  [key: string]: any,
}

interface IValidationRule {
  field: string,
  method: any,
  args?: Array<any>,
  validWhen: boolean,
  message: string,
}

// Inspired by https://medium.com/code-monkey/client-side-form-validation-in-react-40e367de47ba
class ValidationService {
  rules: Array<IValidationRule>

  constructor(rules: Array<IValidationRule>) {
    // Validations is an array of rules specific to a form
    this.rules = rules
  }

  validate(state: unknown): Validation {
    // start out assuming valid
    const validation:Validation = this.valid()

    // for each validation rule
    for (const rule of this.rules) {
      // if the field isn't already marked invalid by an earlier rule
      if (!validation[rule.field].isInvalid && // determine the field value, the method to invoke and
      // optional args from the rule definition
      // If state doesn't have the rule field, than we ignore validation
        _.has(state, rule.field)) {
        const fieldValue = _.toString(_.get(state, rule.field))
        const args = rule.args || []
        const validationMethod  = typeof rule.method === 'string' ?
          _.get(validator, rule.method) :
          rule.method
          // call the validationMethod with the current field value
          // as the first argument, any additional arguments, and the
          // whole state as a final argument.  If the result doesn't
          // match the rule.validWhen property, then modify the
          // validation object for the field and set the isValid
          // field to false
        if (validationMethod(fieldValue, ...args, state) !== rule.validWhen) {
          validation[rule.field] = {
            isInvalid: true,
            message: rule.message,
          }
          validation.isValid = false
        }
      }
    }
  }

  // create a validation object for a valid state
  valid(): Validation {
    const validation:Validation = {}

    for (const rule of this.rules) {
      validation[rule.field] = {isInvalid: false, message: ''}
    }

    return {isValid: true, ...validation}
  }

  static getJobValidationService(): ValidationService {
    return new ValidationService([
      {
        field: 'Alias',
        method: 'isLength',
        validWhen: true,
        args: [{
          min: 0, max: 200,
        }],
        message: "Unfortunately, nickname can't be longer than 200 characters.",
      }, {
        field: 'ScheduleExpression',
        method: 'isEmpty',
        validWhen: false,
        message: "Unfortunately, you can't leave schedule blank.",
      }, {
        field: 'ScheduleExpression',
        method: validateScheduleExpression,
        validWhen: true,
        message: "Unfortunately, schedule expression doesn't seem to be valid.",
      }, {
        field: 'ScheduleType',
        method: 'isEmpty',
        validWhen: false,
        message: 'Unfortunately, you have to choose a schedule type.',
      }, {
        field: 'ScheduleType',
        method: 'isIn',
        args: [Object.values(ScheduleType)],
        validWhen: true,
        message: `Unfortunately, schedule type can be one of: ${Object.values(ScheduleType).join(', ')} .`,
      }, {
        field: 'Timezone',
        method: 'isEmpty',
        validWhen: false,
        message: 'Unfortunately, you have to choose a time zone.',
      }, {
        field: 'Timezone',
        method: 'isIn',
        args: [moment.tz.names()],
        validWhen: true,
        message: 'Unfortunately, you have to choose a valid time zone.',
      }, {
        field: 'Target.Command',
        method: 'isEmpty',
        validWhen: false,
        message: "Unfortunately, you can't leave command blank.",
      }, {
        field: 'Target.Type',
        method: 'isEmpty',
        validWhen: false,
        message: 'Unfortunately, you have to choose a target type.',
      }, {
        field: 'Target.Type',
        method: 'isIn',
        args: [Object.values(TargetType)],
        validWhen: true,
        message: `Unfortunately, target type can be one of: ${Object.values(TargetType).join(', ')} .`,
      }, {
        field: 'Target.Size',
        method: 'isEmpty',
        validWhen: false,
        message: 'Unfortunately, you have to choose a Dyno size.',
      }, {
        field: 'Target.Size',
        method: 'isIn',
        args: [Object.values(DynoSize)],
        validWhen: true,
        message: `Unfortunately, dyno can be one of: ${Object.values(DynoSize).join(', ')} .`,
      }, {
        field: 'Target.TimeToLive',
        method: 'isEmpty',
        validWhen: false,
        message: "Unfortunately, you can't leave timeout blank.",
      }, {
        field: 'Target.TimeToLive',
        method: 'isInt',
        validWhen: true,
        args: [{
          max: 86_400, allow_leading_zeroes: false,
        }],
        message: "Unfortunately, timeout can't be greater than 86400 seconds.",
      }, {
        field: 'Target.TimeToLive',
        method: 'isInt',
        validWhen: true,
        args: [{
          min: 30, allow_leading_zeroes: false,
        }],
        message: "Unfortunately, timeout can't be lower than 30 seconds.",
      }, {
        field: 'State',
        method: 'isEmpty',
        validWhen: false,
        message: 'Unfortunately, you have to choose a state.',
      }, {
        field: 'State',
        method: 'isIn',
        args: [Object.values(JobState)],
        validWhen: true,
        message: `Unfortunately, state can be one of: ${Object.values(JobState).join(', ')} .`,
      }, {
        field: 'Retries',
        method: 'isInt',
        validWhen: true,
        args: [{
          max: 20, allow_leading_zeroes: false,
        }],
        message: "Unfortunately, retries can't be greater than 20.",
      }, {
        field: 'Retries',
        method: 'isInt',
        validWhen: true,
        args: [{
          min: 0, allow_leading_zeroes: false,
        }],
        message: "Unfortunately, retries can't be lower than 0.",
      },
    ])
  }
}

export default ValidationService
