import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateProjectDto {

    @IsString()
    @IsNotEmpty()
    readonly name: string;

    @IsString()
    readonly description: string;

    @IsNumber()
    readonly salesPointToReach: number;

    @IsNumber()
    readonly peopleToReach: number;

    @IsNumber()
    readonly drinkRacks: number;

    @IsNumber()
    readonly bottlesDistributed: number;

    @IsNumber()
    @IsNotEmpty()
    readonly formId: number;

    @IsArray()
    @IsNotEmpty()
    @Type(() => Number)
    readonly teamids: number[];
}
