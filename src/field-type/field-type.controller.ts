import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { FieldTypeService } from './field-type.service';
import { CreateFieldTypeDto } from './dto/create-field-type.dto';
import { UpdateFieldTypeDto } from './dto/update-field-type.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { applyRbac } from 'utilities/functions';

@ApiTags('Gestion des types de champs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('field-type')
export class FieldTypeController {
  constructor(private readonly fieldTypeService: FieldTypeService) {}

  @Get()
  findAll(@Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'field_type_find_all');

    return this.fieldTypeService.findAll();
  }
}
