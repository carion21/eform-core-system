import { IsNotEmpty, IsString, IsIn } from "class-validator";
import { Consts } from "utilities/constants";

export class CreateKpiDto {

    @IsNotEmpty()
    @IsString()
    readonly name: string;

    @IsNotEmpty()
    @IsString()
    @IsIn(Consts.KPI_TYPES)
    readonly type: string;

}
