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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { applyRbac } from 'utilities/functions';

@ApiTags('Gestion des utilisateurs')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_create');

    return this.userService.create(createUserDto, userAuthenticated);
  }

  @Get()
  findAll(@Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_find_all');

    return this.userService.findAll(userAuthenticated);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_find_one');

    return this.userService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() request: Request,
  ) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_update');

    return this.userService.update(+id, updateUserDto, userAuthenticated);
  }

  @Patch('change-status/:id')
  changeStatus(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_change_status');

    return this.userService.changeStatus(+id, userAuthenticated);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'user_delete');

    return this.userService.remove(+id, userAuthenticated);
  }
}
