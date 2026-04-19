import { PartialType } from '@nestjs/swagger';
import { CreateTagDto } from './create-tags';

export class UpdateTagDto extends PartialType(CreateTagDto) {}
