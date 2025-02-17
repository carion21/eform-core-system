import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsObject, IsString } from "class-validator";

export class CreateProjectDto {

    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsString()
    readonly description: string;

    @IsNumber()
    @IsNotEmpty()
    readonly formId: number;

    @IsArray()
    @IsNotEmpty()
    @Type(() => Number)
    readonly teamids: number[];

    @IsObject()
    @IsNotEmpty()
    readonly kpiValues: object;
}
