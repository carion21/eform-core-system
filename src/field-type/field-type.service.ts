import { Injectable } from '@nestjs/common';
import { CreateFieldTypeDto } from './dto/create-field-type.dto';
import { UpdateFieldTypeDto } from './dto/update-field-type.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { translate } from 'utilities/functions';

@Injectable()
export class FieldTypeService {
  constructor(private readonly prismaService: PrismaService) {}

  async findAll() {
    const fieldTypes = await this.prismaService.fieldType.findMany({
      where: { status: true },
    });

    // Return the response
    return {
      message: translate('Liste des types de champs'),
      data: fieldTypes,
    };
  }
}
