import { Type } from 'class-transformer';
import { IsNotEmpty, IsObject } from 'class-validator';

export class FillKpiDto {
    @IsObject()
    @IsNotEmpty()
    readonly kpiDatas: object;
}
