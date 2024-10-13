import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateKpiDto } from './dto/create-kpi.dto';
import { UpdateKpiDto } from './dto/update-kpi.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { getSlug, translate } from 'utilities/functions';

@Injectable()
export class KpiService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createKpiDto: CreateKpiDto) {
    const { name } = createKpiDto;

    const slug = getSlug(name);
    // check if kpi already exists
    const kpiExists = await this.prismaService.kpi.findFirst({
      where: {
        slug,
      },
    });
    if (kpiExists) throw new ConflictException(translate('Ce KPI existe déjà'));

    const kpi = await this.prismaService.kpi.create({
      data: {
        name,
        slug,
      },
    });
    if (!kpi)
      throw new InternalServerErrorException(
        translate('Une erreur est survenue lors de la création du KPI'),
      );

    // Return the response
    return {
      message: translate('KPI créé avec succès'),
      data: kpi,
    };
  }

  async findAll() {
    const kpis = await this.prismaService.kpi.findMany();

    // Return the response
    return {
      message: translate('Liste des KPIs'),
      data: kpis,
    };
  }

  async findOne(id: number) {
    const kpi = await this.prismaService.kpi.findUnique({
      where: {
        id,
      },
    });
    if (!kpi) throw new NotFoundException();
    translate("Ce KPI n'existe pas");

    // Return the response
    return {
      message: translate('KPI trouvé avec succès'),
      data: kpi,
    };
  }

  async update(id: number, updateKpiDto: UpdateKpiDto) {
    const { name } = updateKpiDto;

    const kpi = await this.prismaService.kpi.findUnique({
      where: {
        id,
      },
    });
    if (!kpi) throw new NotFoundException(translate("Ce KPI n'existe pas"));

    const slug = getSlug(name);
    // check if kpi already exists
    const kpiExists = await this.prismaService.kpi.findFirst({
      where: {
        slug,
        id: {
          not: id,
        },
      },
    });
    if (kpiExists) throw new ConflictException(translate('Ce KPI existe déjà'));

    const updatedKpi = await this.prismaService.kpi.update({
      where: {
        id,
      },
      data: {
        name,
        slug,
      },
    });
  }
}
