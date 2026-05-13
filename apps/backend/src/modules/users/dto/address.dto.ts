import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

const baseAddress = {
  label: z.string().trim().min(1).max(40),
  city: z.string().trim().min(1).max(80),
  district: z.string().trim().min(1).max(80),
  street: z.string().trim().min(1).max(120),
  buildingNumber: z.string().trim().min(1).max(40),
  additionalNotes: z.string().trim().max(400).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  isDefault: z.boolean().optional(),
};

export const CreateAddressSchema = z.object(baseAddress).strict();
export class CreateAddressDto extends createZodDto(CreateAddressSchema) {}

export const UpdateAddressSchema = z.object(baseAddress).partial().strict();
export class UpdateAddressDto extends createZodDto(UpdateAddressSchema) {}
