import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { TeamService } from './team.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { applyRbac } from 'utilities/functions';

@ApiTags('Gestion des équipes')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  create(@Body() createTeamDto: CreateTeamDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'team_create');

    return this.teamService.create(createTeamDto, userAuthenticated);
  }

  @Get()
  findAll(@Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'team_find_all');

    return this.teamService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'team_find_one');

    return this.teamService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeamDto: UpdateTeamDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'team_update');
    return this.teamService.update(+id, updateTeamDto, userAuthenticated);
  }

  @Patch('change-status/:id')
  changeStatus(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'team_change_status');

    return this.teamService.changeStatus(+id, userAuthenticated);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'team_delete');

    return this.teamService.remove(+id, userAuthenticated);
  }
}
