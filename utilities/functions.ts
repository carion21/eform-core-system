import * as randomstring from 'randomstring';
import * as moment from 'moment';
import { Consts } from './constants';
import {
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';
import * as slug from 'slug';
import { v4 as uuidv4 } from 'uuid';
import {
  isBoolean,
  isEmail,
  isInt,
  isNotEmpty,
  isNumber,
  isString,
  isUUID,
} from 'class-validator';
import { ConfigService } from '@nestjs/config';

const getSlug = (text: string) => {
  return slug(text, {
    lower: true,
    locale: 'fr',
  });
};

const generateUuid = () => {
  return uuidv4();
};

const translate = (text: string) => {
  return text;
};

const generateNumberCodeSpecial = () => {
  return randomstring.generate({
    length: 4,
    charset: '1234567890',
  });
};

const generatePassword = () => {
  return randomstring.generate({
    length: 8,
    // charset: 'alphanumeric',
    charset: 'alphanumeric',
  });
};

const generateOtpCode = () => {
  return randomstring.generate({
    length: 6,
    charset: '1234567890',
  });
};

const generateCode = (keyword: string) => {
  let now = moment();
  let suffix =
    now.format('YYMMDDHH_mmss').substring(2) +
    '_' +
    generateNumberCodeSpecial();
  return keyword + '' + suffix;
};

const genProfileCode = () => {
  return generateCode('PRF');
};

const genUserCode = () => {
  return generateCode('USR');
};

const genTeamCode = () => {
  return generateCode('TEM');
};

const genProjectCode = () => {
  return generateCode('PRO');
};

const genFormCode = () => {
  return generateCode('FRM');
};

const genFieldTypeCode = () => {
  return generateCode('FTY');
};

const genFieldCode = () => {
  return generateCode('FLD');
};

const getUiAvatar = (user: Object) => {
  const configService = new ConfigService();
  let uname = user['lastname'] + ' ' + user['firstname'];
  // get all words and concatenate with +
  uname = uname.replace(/\s/g, '+');
  return (
    configService.get('UI_AVATAR_URL') + uname + '&background=ff8000&color=fff'
  );
};

const applyRbac = (userAuthenticated: object, permission: string) => {
  if (
    Consts.ROLES[userAuthenticated['profile']['value']].indexOf(permission) ===
    -1
  ) {
    throw new UnauthorizedException(Consts.MSG_UNAUTHORIZED);
  }
};

const controlData = (inputs: object) => {
  const result = {
    success: true,
    message: 'Data is valid',
  };

  let error = '';

  try {
    const mapSelectValues = inputs['mapSelectValues'];
    const mapFieldTypes = inputs['mapFieldTypes'];
    const allFields = inputs['allFields'];
    const requiredFields = inputs['requiredFields'];
    const data = inputs['data'];
    const dataKeys = Object.keys(data);

    // check if all required fields are present
    const missingFields = requiredFields.filter(
      (field: string) => !dataKeys.includes(field),
    );
    if (missingFields.length > 0) {
      error = `Missing required fields: ${missingFields.join(', ')}`;
    }

    const presentFields = allFields.filter((field: string) =>
      dataKeys.includes(field),
    );

    // const unknownFields = dataKeys.filter((field: string) => !allFields.includes(field));

    // check if the field type is correct
    presentFields.forEach((field: string) => {
      const field_type = mapFieldTypes[field];
      const field_value = data[field];
      const control =
        field_type == 'select'
          ? controlFieldType(
              field,
              field_value,
              field_type,
              mapSelectValues[field],
            )
          : controlFieldType(field, field_value, field_type);

      // const control = field_type ==  controlFieldType(field, field_value, field_type);
      if (!control.success) {
        error = control.message;
      }
    });
  } catch (err) {
    error = err;
  }

  if (error) {
    result.success = false;
    result.message = error;
  }

  return result;
};

const controlFieldType = (
  field: string,
  value: any,
  field_type: string,
  select_values: string[] = [],
) => {
  let result = {
    success: false,
    message: 'The field is valid',
  };

  let error = '';

  switch (field_type) {
    case 'simple-text':
      if (isString(value) && isNotEmpty(value) && value.length <= 255) {
        result.success = true;
      } else {
        error = 'the field ' + field + ' must be a simple text and not empty';
      }
      break;
    case 'long-text':
      if (isString(value) && isNotEmpty(value)) {
        result.success = true;
      } else {
        error = 'the field ' + field + ' must be a long text and not empty';
      }
      break;
    case 'email':
      if (isEmail(value)) {
        result.success = true;
      } else {
        error = 'the field ' + field + ' must be an email';
      }
      break;
    case 'uuid':
      if (isUUID(value)) {
        result.success = true;
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a uuid';
      }
      break;
    case 'date':
      if (isString(value) && isNotEmpty(value)) {
        if (moment(value, 'YYYY-MM-DD').isValid()) {
          result.success = true;
        }
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a string date';
      }
      break;
    case 'time':
      if (isString(value) && isNotEmpty(value)) {
        if (moment(value, 'HH:mm:ss').isValid()) {
          result.success = true;
        }
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a string time';
      }
      break;
    case 'datetime':
      if (isString(value) && isNotEmpty(value)) {
        if (moment(value, 'YYYY-MM-DD HH:mm:ss').isValid()) {
          result.success = true;
        }
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a string datetime';
      }
      break;
    case 'boolean':
      if (isBoolean(value)) {
        result.success = true;
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a boolean';
      }
      break;
    case 'integer':
      if (isInt(value)) {
        result.success = true;
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a integer';
      }
      break;
    case 'number':
      if (isNumber(value)) {
        result.success = true;
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a number';
      }
      break;
    case 'float':
      if (isNumber(value)) {
        result.success = true;
      }
      if (!result.success) {
        error = 'the field ' + field + ' must be a float';
      }
      break;
    case 'select':
      if (
        isString(value) &&
        isNotEmpty(value) &&
        select_values.includes(value)
      ) {
        result.success = true;
      }
      if (!result.success) {
        error =
          'the field ' +
          field +
          ' must be a string between +=> ' +
          select_values.join(', ');
      }
      break;
    default:
      error = 'the field ' + field + ' has an unknown type';
      break;
  }

  if (error != '') {
    result.message = error;
  }

  return result;
};

function sumListKpiValues(listOfkpiValues: object[]): object {
  return listOfkpiValues.reduce((sum, kpiValues) => {
    for (const [cle, valeur] of Object.entries(kpiValues)) {
      sum[cle] = (sum[cle] || 0) + valeur;
    }
    return sum;
  }, {});
}

export {
  getSlug,
  generateUuid,
  translate,
  generateOtpCode,
  generatePassword,
  genProfileCode,
  genUserCode,
  genTeamCode,
  genProjectCode,
  genFormCode,
  genFieldTypeCode,
  genFieldCode,
  getUiAvatar,
  applyRbac,
  controlData,
  controlFieldType,
  sumListKpiValues
};
