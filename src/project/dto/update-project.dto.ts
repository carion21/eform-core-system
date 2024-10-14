import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsNumber, IsObject, IsString } from 'class-validator';

export class UpdateProjectDto {
    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsString()
    readonly description: string;

    @IsNumber()
    @IsNotEmpty()
    readonly formId: number;

    @IsArray()
    //   @IsNotEmpty()
    @Type(() => Number)
    readonly teamids: number[];

    @IsObject()
    readonly kpiValues: object;
}
