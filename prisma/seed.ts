import { PrismaClient } from '@prisma/client';
import { Consts } from '../utilities/constants';
import {
  genFieldTypeCode,
  genProfileCode,
  genUserCode,
  getSlug,
} from '../utilities/functions';

import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';

const prisma = new PrismaClient();
const configService = new ConfigService();

async function main() {
  const kpiDatas = Consts.DEFAULT_KPIS.map((kpi) => {
    return {
      name: kpi['name'],
      slug: getSlug(kpi['name']),
      type: kpi['type'],
    };
  });
  await prisma.kpi.createMany({
    data: kpiDatas,
  });
  console.log('KPIs created');

  const fieldTypeDatas = Consts.DEFAULT_FIELD_TYPES.map((ftype) => {
    return {
      code: genFieldTypeCode(),
      label: ftype['label'],
      value: ftype['value'],
      description: `Il s'agit du type de champ ${ftype['label']}`,
    };
  });
  await prisma.fieldType.createMany({
    data: fieldTypeDatas,
  });
  console.log('Field types created');

  // patienter 1 secondes
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const profileDatas = Consts.PROFILES.map((profile) => {
    return {
      code: genProfileCode(),
      label: profile['label'],
      value: profile['value'],
      description: profile['description'],
    };
  });
  await prisma.profile.createMany({
    data: profileDatas,
  });
  console.log('Profiles created');

  const admin_profile = await prisma.profile.findFirst({
    where: {
      value: Consts.ADMIN_PROFILE,
    },
  });
  let profileId = admin_profile['id'];
  console.log('Profile Admin found');

  Consts.DEFAULT_USERS.forEach(async (user) => {
    const password = configService.get<string>('DEFAULT_PASSWORD');
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        code: genUserCode(),
        lastname: user['lastname'],
        firstname: user['firstname'],
        email: user['email'],
        phone: user['phone'],
        profileId: profileId,
        password: hash,
      },
    });
  });
  console.log('Users created');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
