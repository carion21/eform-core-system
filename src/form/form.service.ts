import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  generateUuid,
  genFieldCode,
  genFormCode,
  getSlug,
  translate,
} from 'utilities/functions';
import { AddFieldDto } from './dto/add-field.dto';
import { Consts } from 'utilities/constants';

@Injectable()
export class FormService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createFormDto: CreateFormDto, userAuthenticated: any) {
    const { name, description } = createFormDto;

    const form = await this.prismaService.form.create({
      data: {
        code: genFormCode(),
        uuid: generateUuid(),
        name,
        description,
      },
    });
    if (!form)
      throw new InternalServerErrorException(
        translate('Erreur lors de la création du formulaire'),
      );

    // Give the permission to supervisor and sampler to manage the form
    const profileValues = [Consts.SUPERVISOR_PROFILE, Consts.SAMPLER_PROFILE];
    const profiles = await this.prismaService.profile.findMany({
      where: {
        value: {
          in: profileValues,
        },
      },
    });
    await this.prismaService.formPermission.createMany({
      data: profiles.map((profile) => ({
        formId: form.id,
        profileId: profile.id,
      })),
    });

    // Return the response
    return {
      message: translate('Formulaire créé avec succès'),
      data: form,
    };
  }

  async findAll() {
    const forms = await this.prismaService.form.findMany({
      include: {
        Field: {
          select: {
            id: true,
            code: true,
            label: true,
            slug: true,
            description: true,
            optionnal: true,
            defaultValue: true,
            exampleValue: true,
            selectValues: true,
            fieldType: {
              select: {
                id: true,
                label: true,
                value: true,
              },
            },
          },
        },
      },
      where: {
        isDeleted: false,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Return the response
    return {
      message: translate('Liste des formulaires'),
      data: forms,
    };
  }

  async findOne(id: number) {
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    // Return the response
    return {
      message: translate('Détail du formulaire'),
      data: form,
    };
  }

  async duplicate(id: number, userAuthenticated: any) {
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    const formFields = await this.prismaService.field.findMany({
      where: {
        formId: id,
      },
    });

    const newForm = await this.prismaService.form.create({
      data: {
        code: genFormCode(),
        uuid: generateUuid(),
        name: `${form.name} - Copie`,
        description: form.description,
        Field: {
          createMany: {
            data: formFields.map((field) => ({
              code: genFieldCode(),
              fieldTypeId: field.fieldTypeId,
              label: field.label,
              slug: field.slug,
              description: field.description,
              optionnal: field.optionnal,
              defaultValue: field.defaultValue,
              exampleValue: field.exampleValue,
              selectValues: field.selectValues,
            })),
          },
        },
      },
    });
    if (!newForm)
      throw new InternalServerErrorException(
        translate('Erreur lors de la duplication du formulaire'),
      );

    // Return the response
    return {
      message: translate('Formulaire dupliqué avec succès'),
      data: newForm,
    };
  }

  async update(
    id: number,
    updateFormDto: UpdateFormDto,
    userAuthenticated: any,
  ) {
    const { name, description } = updateFormDto;

    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    const updatedForm = await this.prismaService.form.update({
      where: {
        id,
      },
      data: {
        name,
        description,
      },
    });
    if (!updatedForm)
      throw new InternalServerErrorException(
        translate('Erreur lors de la mise à jour du formulaire'),
      );

    // Return the response
    return {
      message: translate('Formulaire mis à jour avec succès'),
      data: updatedForm,
    };
  }

  async addField(id: number, addFieldDto: AddFieldDto, userAuthenticated: any) {
    const {
      fieldTypeId,
      label,
      description,
      optionnal,
      defaultValue,
      exampleValue,
      selectValues,
    } = addFieldDto;

    // Check if the form exists
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    // Check if the field type exists
    const fieldType = await this.prismaService.fieldType.findUnique({
      where: {
        id: fieldTypeId,
      },
    });
    if (!fieldType)
      throw new NotFoundException(translate('Type de champ non trouvé'));

    if (fieldType.value === 'select' && !selectValues)
      throw new ConflictException(
        translate(
          'Veuillez fournir les valeurs de sélection separées par des virgules',
        ),
      );

    const slug = getSlug(label);
    const slugExists = await this.prismaService.field.findFirst({
      where: {
        formId: id,
        slug,
      },
    });
    if (slugExists)
      throw new ConflictException(
        translate('Le champ existe déjà dans ce formulaire'),
      );

    // Create the field
    const field = await this.prismaService.field.create({
      data: {
        code: genFieldCode(),
        formId: id,
        fieldTypeId,
        label,
        slug: getSlug(label),
        description,
        optionnal,
        defaultValue,
        exampleValue,
        selectValues,
      },
    });
    if (!field)
      throw new InternalServerErrorException(
        translate('Erreur lors de la création du champ'),
      );

    // Return the response
    return {
      message: translate('Champ ajouté avec succès'),
      data: field,
    };
  }

  async changeStatus(id: number, userAuthenticated: any) {
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    const updatedForm = await this.prismaService.form.update({
      where: {
        id,
      },
      data: {
        isActive: !form.isActive,
      },
    });
    if (!updatedForm)
      throw new InternalServerErrorException(
        translate('Erreur lors du changement de statut du formulaire'),
      );

    // Return the response
    return {
      message: translate('Statut du formulaire modifié avec succès'),
      data: updatedForm,
    };
  }

  async remove(id: number, userAuthenticated: any) {
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    const updatedForm = await this.prismaService.form.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
      },
    });
    if (!updatedForm)
      throw new InternalServerErrorException(
        translate('Erreur lors de la suppression du formulaire'),
      );

    // Return the response
    return {
      message: translate('Formulaire supprimé avec succès'),
      data: updatedForm,
    };
  }
}
