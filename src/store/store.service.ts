import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SaveInStoreDto } from './dto/save-in-store.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { controlData, generateUuid, translate } from 'utilities/functions';
import { Consts } from 'utilities/constants';

@Injectable()
export class StoreService {
  constructor(private readonly prismaService: PrismaService) {}

  async save(saveInStoreDto: SaveInStoreDto, userAuthenticated: any) {
    const { formUuid, data } = saveInStoreDto;

    // check if the form exists
    const form = await this.prismaService.form.findFirst({
      where: {
        uuid: formUuid,
      },
      include: {
        Field: {
          include: {
            fieldType: true,
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire introuvable'));

    // check if the user has the right to save data in the form
    const formPermission = await this.prismaService.formPermission.findFirst({
      where: {
        formId: form.id,
        profileId: userAuthenticated['profile']['id'],
      },
    });
    if (!formPermission || !formPermission.isActive)
      throw new ForbiddenException(
        translate(
          "Vous n'avez pas le droit de sauvegarder des données via ce formulaire",
        ),
      );

    const fields = form.Field;

    let mapFieldTypes = {};
    fields.forEach((field) => {
      let k = field.slug;
      let v = field.fieldType.value;
      mapFieldTypes[k] = v;
    });

    const allFields = fields.map((field) => field.slug);
    const requiredFields = fields
      .filter((field) => !field.optionnal)
      .map((field) => field.slug);

    const mapSelectValues = {};
    fields.forEach((field) => {
      if (field.fieldType.value === 'select') {
        // selectValues is string split by comma -> convert to array
        mapSelectValues[field.slug] = field.selectValues.split(',');
      }
    });

    let inputs = {
      data: data,
      mapFieldTypes: mapFieldTypes,
      allFields: allFields,
      requiredFields: requiredFields,
      mapSelectValues: mapSelectValues,
    };
    const bcontrol = controlData(inputs);
    if (!bcontrol.success)
      throw new BadRequestException(translate(bcontrol.message));

    // Save the data in the store
    const sessionUuid = generateUuid();
    const dataRows = await this.prismaService.dataRow.createMany({
      data: fields.map((field) => ({
        sessionUuid: sessionUuid,
        userId: userAuthenticated['id'],
        fieldId: field.id,
        value: data[field.slug],
      })),
    });

    // Return the response
    return {
      message: translate('Données sauvegardées avec succès'),
    };
  }

  async show(formUuid: string, userAuthenticated: any) {
    // check if the form exists
    const form = await this.prismaService.form.findFirst({
      where: {
        uuid: formUuid,
        isDeleted: false,
      },
      include: {
        Field: {
          include: {
            fieldType: true,
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire introuvable'));

    if (!form.isActive)
      throw new ForbiddenException(translate('Formulaire désactivé'));

    // check if the user has the right to show data in the form
    if (
      ![Consts.ADMIN_PROFILE, Consts.VIEWER_PROFILE].includes(
        userAuthenticated['profile']['value'],
      )
    ) {
      const formPermission = await this.prismaService.formPermission.findFirst({
        where: {
          formId: form.id,
          profileId: userAuthenticated['profile']['id'],
        },
      });
      if (!formPermission || !formPermission.isActive)
        throw new ForbiddenException(
          translate(
            "Vous n'avez pas le droit de consulter les données de ce formulaire",
          ),
        );
    }

    // Get the data from the store
    const fields = form.Field;
    const dataRows = await this.prismaService.dataRow.findMany({
      where: {
        fieldId: {
          in: fields.map((field) => field.id),
        },
      },
      select: {
        sessionUuid: true,
        fieldId: true,
        value: true,
      },
    });

    const sessionUuids = dataRows.map((dataRow) => dataRow.sessionUuid);
    let data = {};
    sessionUuids.forEach((sessionUuid) => {
      const rows = dataRows.filter(
        (dataRow) => dataRow.sessionUuid === sessionUuid,
      );
      data[sessionUuid] = {};
      rows.forEach((row) => {
        const field = fields.find((field) => field.id === row.fieldId);
        // with slug
        // data[sessionUuid][field.slug] = row.value;
        // with label
        data[sessionUuid][field.label] = row.value;
      });
    });
    const dataWithSessionUuid = data;
    const dataWithoutSessionUuid = Object.values(dataWithSessionUuid);

    // Return the response
    return {
      message: translate('Données récupérées avec succès'),
      data: dataWithoutSessionUuid,
    };
  }
}
