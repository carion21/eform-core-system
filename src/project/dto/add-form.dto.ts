import { Type } from "class-transformer";
import { IsArray, IsNotEmpty } from "class-validator";


export class AddFormDto {

    @IsArray()
    @IsNotEmpty()
    @Type(() => Number)
    readonly formids: number[];
}
