import { IsBoolean, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class AddFieldDto {

    @IsNumber()
    @IsNotEmpty()
    readonly fieldTypeId: number;

    @IsString()
    @IsNotEmpty()
    readonly label: string;

    @IsString()
    readonly description: string;

    @IsBoolean()
    // default value is false
    readonly optionnal: boolean = false;

    @IsString()
    readonly defaultValue: string;

    @IsString()
    readonly exampleValue: string;

    @IsString()
    readonly selectValues: string;
}