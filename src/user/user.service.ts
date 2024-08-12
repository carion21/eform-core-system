import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { genUserCode, getUiAvatar, translate } from 'utilities/functions';

import * as bcrypt from 'bcrypt';
import * as moment from 'moment';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createUserDto: CreateUserDto, userAuthenticated: object) {
    const { role, lastname, firstname, email, phone, password } = createUserDto;

    const emailExists = await this.prismaService.user.findFirst({
      where: {
        email,
      },
    });
    if (emailExists)
      throw new ConflictException(translate('Email déjà utilisé'));

    const profile = await this.prismaService.profile.findFirst({
      where: {
        value: role,
      },
    });
    if (!profile) throw new NotFoundException(translate('Profil non trouvé'));

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.prismaService.user.create({
      data: {
        code: genUserCode(),
        profileId: profile.id,
        lastname,
        firstname,
        email,
        phone,
        password: hashedPassword,
      },
    });
    if (!user)
      throw new InternalServerErrorException(
        translate("Erreur lors de la création de l'utilisateur"),
      );

    Reflect.deleteProperty(user, 'password');
    // Return the response
    return {
      message: translate('Utilisateur créé avec succès'),
      data: user,
    };
  }

  async findAll(userAuthenticated: object) {
    const users = await this.prismaService.user.findMany({
      include: {
        profile: {
          select: {
            label: true,
            value: true,
          },
        },
      },
      where: {
        id: {
          not: userAuthenticated['id'],
        },
        isDeleted: false,
      },
    });

    // generate ui avatar if profile picture is not available
    users.forEach((user) => {
      if (!user.profilePicture) user.profilePicture = getUiAvatar(user);
      Reflect.deleteProperty(user, 'password');
    });

    // Return the response
    return {
      message: translate('Liste des utilisateurs'),
      data: users,
    };
  }

  async findOne(id: number) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        profile: {
          select: {
            label: true,
            value: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    // generate ui avatar if profile picture is not available
    if (!user.profilePicture) user.profilePicture = getUiAvatar(user);

    Reflect.deleteProperty(user, 'password');
    // Return the response
    return {
      message: translate('Utilisateur trouvé'),
      data: user,
    };
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
    userAuthenticated: object,
  ) {
    const { lastname, firstname, email, phone } = updateUserDto;

    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));
    if (user.email !== email) {
      const emailExists = await this.prismaService.user.findFirst({
        where: {
          email,
        },
      });
      if (emailExists)
        throw new ConflictException(translate('Email déjà utilisé'));
    }

    const updatedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        lastname,
        firstname,
        email,
        phone,
      },
    });
    if (!updatedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors de la mise à jour de l'utilisateur"),
      );

    Reflect.deleteProperty(updatedUser, 'password');
    // Return the response
    return {
      message: translate('Utilisateur mis à jour'),
      data: updatedUser,
    };
  }

  async changeStatus(id: number, userAuthenticated: object) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    const updatedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        isActive: !user.isActive,
      },
    });
    if (!updatedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors du changement de statut de l'utilisateur"),
      );

    // Return the response
    return {
      message: translate("Statut de l'utilisateur modifié"),
      data: updatedUser,
    };
  }

  async remove(id: number, userAuthenticated: object) {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        isDeleted: false,
      },
    });
    if (!user) throw new NotFoundException(translate('Utilisateur non trouvé'));

    const deletedUser = await this.prismaService.user.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: moment().format(),
      },
    });
    if (!deletedUser)
      throw new InternalServerErrorException(
        translate("Erreur lors de la suppression de l'utilisateur"),
      );

    // Return the response
    return {
      message: translate('Utilisateur supprimé'),
    };
  }
}
