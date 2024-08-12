import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { ProjectService } from './project.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { applyRbac } from 'utilities/functions';
import { AddTeamDto } from './dto/add-team.dto';
import { AddFormDto } from './dto/add-form.dto';

@ApiTags('Gestion des projets de collecte')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('project')
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Post()
  create(@Body() createProjectDto: CreateProjectDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'project_create');

    return this.projectService.create(createProjectDto, userAuthenticated);
  }

  @Get()
  findAll(@Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'project_find_all');

    return this.projectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'project_find_one');

    return this.projectService.findOne(+id);
  }

  @Get('duplicate/:id')
  duplicate(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'project_duplicate');

    return this.projectService.duplicate(+id, userAuthenticated);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'project_update');

    return this.projectService.update(+id, updateProjectDto);
  }

  @Patch('add-team/:id')
  addTeam(@Param('id') id: string, @Body() addTeamDto: AddTeamDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'project_add_team');

    return this.projectService.addTeam(+id, addTeamDto, userAuthenticated);
  }

  // @Patch('add-form/:id')
  // addForm(@Param('id') id: string, @Body() addFormDto: AddFormDto, @Req() request: Request) {
  //   let userAuthenticated = request['user'];
  //   applyRbac(userAuthenticated, 'project_add_form');

  //   return this.projectService.addForm(+id, addFormDto, userAuthenticated);
  // }

  @Patch('change-status/:id')
  changeStatus(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'project_change_status');

    return this.projectService.changeStatus(+id, userAuthenticated);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'project_delete');

    return this.projectService.remove(+id);
  }
}
