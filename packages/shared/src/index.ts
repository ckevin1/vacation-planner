import { z } from "zod";

export const travelCategories = [
  "lodging",
  "airfare",
  "ground transportation",
  "activity",
  "dining",
  "transfer",
] as const;
export const itemStatuses = ["planned", "booked", "complete"] as const;

export const tripInputSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().max(2000).default(""),
    startDate: z.string().date(),
    endDate: z.string().date(),
    status: z.enum(["planning", "booked", "complete"]).default("planning"),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

export const destinationInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  location: z.string().max(300).default(""),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
  arrivalDate: z.string().date().nullable().default(null),
  departureDate: z.string().date().nullable().default(null),
  displayOrder: z.number().int().nonnegative().default(0),
});

export const itineraryItemInputSchema = z
  .object({
    dayDate: z.string().date(),
    title: z.string().trim().min(1).max(160),
    category: z.enum(travelCategories),
    startTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable()
      .default(null),
    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
      .nullable()
      .default(null),
    location: z.string().max(300).default(""),
    notes: z.string().max(2000).default(""),
    reference: z.string().max(160).default(""),
    status: z.enum(itemStatuses).default("planned"),
    cost: z.number().min(0).nullable().default(null),
    details: z.record(z.unknown()).default({}),
  })
  .refine(
    (value) =>
      !value.startTime || !value.endTime || value.endTime >= value.startTime,
    { message: "End time must be after start time", path: ["endTime"] },
  );

export const optionalActivityInputSchema = z.object({
  title: z.string().trim().min(1).max(160),
  suggestedDate: z.string().date().nullable().default(null),
  endDate: z.string().date().nullable().default(null),
  location: z.string().max(300).default(""),
  latitude: z.number().min(-90).max(90).nullable().default(null),
  longitude: z.number().min(-180).max(180).nullable().default(null),
  estimatedDuration: z.number().int().min(0).default(60),
  tags: z.array(z.string().max(40)).default([]),
  notes: z.string().max(2000).default(""),
});

export const loyaltyInputSchema = z.object({
  programName: z.string().trim().min(1).max(120),
  membershipNumber: z.string().trim().min(1).max(120),
  notes: z.string().max(1000).default(""),
});
export const travelerInputSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  preferredName: z.string().trim().max(80).default(""),
  email: z.string().email().or(z.literal("")).default(""),
  phone: z.string().max(40).default(""),
  notes: z.string().max(2000).default(""),
});
export type TripInput = z.infer<typeof tripInputSchema>;
export type DestinationInput = z.infer<typeof destinationInputSchema>;
export type ItineraryItemInput = z.infer<typeof itineraryItemInputSchema>;
export type OptionalActivityInput = z.infer<typeof optionalActivityInputSchema>;
export type LoyaltyInput = z.infer<typeof loyaltyInputSchema>;
export type TravelerInput = z.infer<typeof travelerInputSchema>;
