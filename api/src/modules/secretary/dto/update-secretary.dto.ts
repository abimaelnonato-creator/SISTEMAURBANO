import { PartialType } from '@nestjs/mapped-types'
import { CreateSecretaryDto } from './create-secretary.dto'
import { IsBoolean, IsOptional } from 'class-validator'

export class UpdateSecretaryDto extends PartialType(CreateSecretaryDto) {
  @IsBoolean()
  @IsOptional()
  isActive?: boolean
}
