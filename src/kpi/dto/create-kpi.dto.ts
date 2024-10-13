import { IsNotEmpty, IsString } from "class-validator";

export class CreateKpiDto {

    @IsNotEmpty()
    @IsString()
    readonly name: string;

}
