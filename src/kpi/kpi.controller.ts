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
import { KpiService } from './kpi.service';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { applyRbac } from 'utilities/functions';

@ApiTags('Gestion des KPIs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('kpi')
export class KpiController {
  constructor(private readonly kpiService: KpiService) {}

  @Post()
  create(@Body() createKpiDto: CreateKpiDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_create');

    return this.kpiService.create(createKpiDto);
  }

  @Get()
  findAll(@Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_find_all');

    return this.kpiService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_find_one');

    return this.kpiService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateKpiDto: UpdateKpiDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'kpi_update');

    return this.kpiService.update(+id, updateKpiDto);
  }
}
