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
import { StoreService } from './store.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { UpdateStoreDto } from './dto/update-store.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { applyRbac } from 'utilities/functions';
import { SaveInStoreDto } from './dto/save-in-store.dto';

@ApiTags('Gestion du stockage des données')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('store')
export class StoreController {
  constructor(private readonly storeService: StoreService) {}

  @Post()
  save(@Body() saveInStoreDto: SaveInStoreDto, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'store_save');

    return this.storeService.save(saveInStoreDto, userAuthenticated);
  }

  @Get(':formUuid')
  show(@Param('formUuid') formUuid: string, @Req() request: Request) {
    let userAuthenticated = request['user'];
    applyRbac(userAuthenticated, 'store_show');

    return this.storeService.show(formUuid, userAuthenticated);
  }
}
