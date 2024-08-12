import { Type } from "class-transformer";
import { IsArray, IsNotEmpty } from "class-validator";


export class AddTeamDto {

    @IsArray()
    @IsNotEmpty()
    @Type(() => Number)
    readonly teamids: number[];
}
