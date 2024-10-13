import {
  BadRequestException,
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
import { isUUID } from 'class-validator';
import { UpdateFieldsDto } from './dto/update-fields.dto';

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
        Project: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        Field: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            code: true,
            label: true,
            slug: true,
            uuid: true,
            description: true,
            optional: true,
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
            FieldRank: {
              select: {
                rank: true,
              },
              orderBy: {
                rank: 'asc',
              },
              take: 1,
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

    // order fields by rank
    forms.forEach((form) => {
      form.Field = form.Field.sort(
        (a, b) => a.FieldRank[0].rank - b.FieldRank[0].rank,
      );
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
      include: {
        Project: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        Field: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            code: true,
            label: true,
            slug: true,
            uuid: true,
            description: true,
            optional: true,
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
            FieldRank: {
              select: {
                rank: true,
              },
              orderBy: {
                rank: 'asc',
              },
              take: 1,
            },
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    // order fields by rank
    form.Field = form.Field.sort(
      (a, b) => a.FieldRank[0].rank - b.FieldRank[0].rank,
    );

    // Return the response
    return {
      message: translate('Détail du formulaire'),
      data: form,
    };
  }

  async findOneByUuid(uuid: string) {
    if (!isUUID(uuid))
      throw new BadRequestException(translate('UUID invalide'));

    const form = await this.prismaService.form.findFirst({
      where: {
        uuid,
        isDeleted: false,
      },
      include: {
        Project: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            isActive: true,
            isDeleted: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        Field: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            code: true,
            label: true,
            slug: true,
            uuid: true,
            description: true,
            optional: true,
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
            FieldRank: {
              select: {
                rank: true,
              },
              orderBy: {
                rank: 'asc',
              },
              take: 1,
            },
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    // order fields by rank
    form.Field = form.Field.sort(
      (a, b) => a.FieldRank[0].rank - b.FieldRank[0].rank,
    );

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
        isDeleted: false,
      },
      include: {
        FieldRank: {
          select: {
            rank: true,
          },
          orderBy: {
            rank: 'asc',
          },
          take: 1,
        },
      },
    });

    const newForm = await this.prismaService.form.create({
      data: {
        code: genFormCode(),
        uuid: generateUuid(),
        name: `${form.name} - Copie`,
        description: form.description,
        duplicatedFrom: form.id,
        Field: {
          createMany: {
            data: formFields.map((field) => ({
              code: genFieldCode(),
              fieldTypeId: field.fieldTypeId,
              label: field.label,
              slug: field.slug,
              uuid: field.uuid,
              description: field.description,
              optional: field.optional,
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
        formId: newForm.id,
        profileId: profile.id,
      })),
    });

    // create field ranks
    const fieldRanks = await Promise.all(
      formFields.map(async (field) => {
        const fieldRank = await this.prismaService.fieldRank.create({
          data: {
            fieldId: field.id,
            rank: field.FieldRank[0].rank,
          },
        });
        if (!fieldRank)
          throw new InternalServerErrorException(
            translate('Erreur lors de la création du rang du champ'),
          );
        return fieldRank;
      }),
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
      uuid,
      label,
      description,
      optional,
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
      include: {
        Field: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            slug: true,
          },
        },
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
        isDeleted: false,
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
        uuid,
        description,
        optional,
        defaultValue,
        exampleValue,
        selectValues,
      },
    });
    if (!field)
      throw new InternalServerErrorException(
        translate('Erreur lors de la création du champ'),
      );

    // create field rank
    const fieldRank = await this.prismaService.fieldRank.create({
      data: {
        fieldId: field.id,
        rank: form.Field.length + 1,
      },
    });
    if (!fieldRank)
      throw new InternalServerErrorException(
        translate('Erreur lors de la création du rang du champ'),
      );

    // Return the response
    return {
      message: translate('Champ ajouté avec succès'),
      data: field,
    };
  }

  async updateFields(
    id: number,
    updateFieldsDto: UpdateFieldsDto,
    userAuthenticated: any,
  ) {
    const { fields } = updateFieldsDto;

    // Check if the form exists
    const form = await this.prismaService.form.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        Field: {
          where: {
            isDeleted: false,
          },
          include: {
            fieldType: true,
          },
        },
      },
    });
    if (!form) throw new NotFoundException(translate('Formulaire non trouvé'));

    // remove all field ranks
    await this.prismaService.fieldRank.deleteMany({
      where: {
        fieldId: {
          in: form.Field.map((field) => field.id),
        },
      },
    });

    const mapRanks = fields.map((field, index) => ({
      [field.uuid]: index + 1,
    }));

    // get les fields a maintenir
    const fieldsToKeep = form.Field.filter((field) =>
      fields.map((field) => field.uuid).includes(field.uuid),
    );

    // get les fields a supprimer
    const fieldsToDelete = form.Field.filter(
      (field) => !fields.map((field) => field.uuid).includes(field.uuid),
    );

    // get les fields a ajouter
    const fieldsToAdd = fields.filter(
      (field) => !form.Field.map((field) => field.uuid).includes(field.uuid),
    );

    // update les fields a maintenir
    const updatedFields = await Promise.all(
      fieldsToKeep.map(async (field) => {
        const fieldToKeepData = fields.find((f) => f.uuid === field.uuid);
        const updatedField = await this.prismaService.field.update({
          where: {
            id: field.id,
          },
          data: {
            description: fieldToKeepData.description,
            label: fieldToKeepData.label,
            optional: fieldToKeepData.optional,
            defaultValue: fieldToKeepData.defaultValue,
            exampleValue: fieldToKeepData.exampleValue,
            selectValues: fieldToKeepData.selectValues,
            // fieldTypeId: fieldToKeepData.fieldTypeId,
          },
        });
        if (!updatedField)
          throw new InternalServerErrorException(
            translate('Erreur lors de la mise à jour du champ'),
          );
        return updatedField;
      }),
    );

    // delete les fields a supprimer
    await Promise.all(
      fieldsToDelete.map(async (field) => {
        await this.prismaService.field.update({
          where: {
            id: field.id,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      }),
    );

    // add les fields a ajouter
    const addedFields = await Promise.all(
      fieldsToAdd.map(async (field) => {
        const fieldType = await this.prismaService.fieldType.findUnique({
          where: {
            id: field.fieldTypeId,
          },
        });
        if (!fieldType)
          throw new NotFoundException(translate('Type de champ non trouvé'));

        if (fieldType.value === 'select' && !field.selectValues)
          throw new ConflictException(
            translate(
              'Veuillez fournir les valeurs de sélection separées par des virgules',
            ),
          );

        const slug = getSlug(field.label);
        const slugExists = await this.prismaService.field.findFirst({
          where: {
            formId: id,
            slug,
            isDeleted: false,
          },
        });
        if (slugExists)
          throw new ConflictException(
            translate('Le champ existe déjà dans ce formulaire'),
          );

        const newField = await this.prismaService.field.create({
          data: {
            code: genFieldCode(),
            formId: id,
            fieldTypeId: field.fieldTypeId,
            label: field.label,
            slug,
            uuid: field.uuid,
            description: field.description,
            optional: field.optional,
            defaultValue: field.defaultValue,
            exampleValue: field.exampleValue,
            selectValues: field.selectValues,
          },
        });
        if (!newField)
          throw new InternalServerErrorException(
            translate('Erreur lors de la création du champ'),
          );

        return newField;
      }),
    );

    const allFields = [...updatedFields, ...addedFields];

    // create field ranks
    const fieldRanks = await Promise.all(
      allFields.map(async (field) => {
        const rank = mapRanks.find((mapRank) => mapRank[field.uuid]);
        const fieldRank = await this.prismaService.fieldRank.create({
          data: {
            fieldId: field.id,
            rank: rank[field.uuid],
          },
        });
        if (!fieldRank)
          throw new InternalServerErrorException(
            translate('Erreur lors de la création du rang du champ'),
          );
        return fieldRank;
      }),
    );

    // Return the response
    return {
      message: translate('Champs mis à jour avec succès'),
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
