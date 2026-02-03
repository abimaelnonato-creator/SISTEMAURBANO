import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator'

export class CreateSecretaryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  acronym!: string

  @IsString()
  @IsOptional()
  description?: string

  @IsString()
  @IsOptional()
  @MaxLength(7)
  color?: string

  @IsString()
  @IsOptional()
  icon?: string
}
