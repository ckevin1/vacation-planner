import Fastify from "fastify";
import cors from "@fastify/cors";
import { randomUUID } from "node:crypto";
import { createDatabase, initializeDatabase } from "./db.js";
import {
  destinationInputSchema,
  itineraryItemInputSchema,
  loyaltyInputSchema,
  optionalActivityInputSchema,
  travelerInputSchema,
  tripInputSchema,
} from "@vacation-planner/shared";

const now = () => new Date().toISOString();
const parseBody = (
  schema: {
    safeParse: (input: unknown) => {
      success: boolean;
      data?: any;
      error?: { flatten: () => unknown };
    };
  },
  body: unknown,
) => {
  const result = schema.safeParse(body);
  if (!result.success)
    throw Object.assign(new Error("Validation failed"), {
      statusCode: 400,
      validation: result.error?.flatten(),
    });
  return result.data;
};

export function buildApp(database = createDatabase()) {
  initializeDatabase(database);
  const app = Fastify({ logger: false });
  app.register(cors, { origin: true });
  app.setErrorHandler((error, _request, reply) =>
    reply
      .code((error as any).statusCode ?? 500)
      .send({
        error: (error as Error).message,
        validation: (error as any).validation,
      }),
  );
  const trip = (id: string) =>
    database.prepare("SELECT * FROM trips WHERE id = ?").get(id) as any;
  const hydrate = (id: string) => {
    const value = trip(id);
    if (!value) return null;
    const destinations = database
      .prepare(
        "SELECT * FROM destinations WHERE trip_id = ? ORDER BY display_order, arrival_date",
      )
      .all(id);
    const days = database
      .prepare("SELECT * FROM itinerary_days WHERE trip_id = ? ORDER BY date")
      .all(id) as any[];
    const items = database
      .prepare(
        "SELECT * FROM itinerary_items WHERE trip_id = ? ORDER BY start_time, created_at",
      )
      .all(id) as any[];
    const optionalActivities = database
      .prepare(
        "SELECT id, trip_id, title, suggested_date, end_date, location, latitude, longitude, estimated_duration, tags_json, notes, created_at, updated_at FROM optional_activities WHERE trip_id = ? ORDER BY suggested_date, title",
      )
      .all(id) as any[];
    const loyalty = database
      .prepare(
        "SELECT * FROM loyalty_records WHERE trip_id = ? ORDER BY program_name",
      )
      .all(id);
    const travelers = database
      .prepare(
        "SELECT id, trip_id, first_name as firstName, last_name as lastName, preferred_name as preferredName, email, phone, notes, created_at as createdAt, updated_at as updatedAt FROM travelers WHERE trip_id = ? ORDER BY last_name, first_name",
      )
      .all(id);
    return {
      ...value,
      startDate: value.start_date,
      endDate: value.end_date,
      createdAt: value.created_at,
      updatedAt: value.updated_at,
      destinations,
      days: days.map((day) => ({
        ...day,
        items: items
          .filter((item) => item.day_id === day.id)
          .map((item) => ({ ...item, details: JSON.parse(item.details_json) })),
      })),
      optionalActivities: optionalActivities.map((item) => ({
        ...item,
        suggestedDate: item.suggested_date,
        endDate: item.end_date,
        estimatedDuration: item.estimated_duration,
        tags: JSON.parse(item.tags_json),
      })),
      loyalty,
      travelers,
    };
  };
  app.get("/health", async () => ({ ok: true }));
  app.get("/api/trips", async () =>
    database
      .prepare(
        "SELECT id, name, description, start_date as startDate, end_date as endDate, status, created_at as createdAt, updated_at as updatedAt FROM trips ORDER BY start_date DESC",
      )
      .all(),
  );
  app.post("/api/trips", async (request, reply) => {
    const data = parseBody(tripInputSchema, request.body);
    const id = randomUUID(),
      timestamp = now();
    database
      .prepare("INSERT INTO trips VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(
        id,
        "local-user",
        data.name,
        data.description,
        data.startDate,
        data.endDate,
        data.status,
        timestamp,
        timestamp,
      );
    return reply.code(201).send(hydrate(id));
  });
  app.get("/api/trips/:tripId", async (request, reply) => {
    const value = hydrate((request.params as any).tripId);
    return value ? value : reply.code(404).send({ error: "Trip not found" });
  });
  app.patch("/api/trips/:tripId", async (request, reply) => {
    const id = (request.params as any).tripId;
    if (!trip(id)) return reply.code(404).send({ error: "Trip not found" });
    const data = parseBody(tripInputSchema, request.body);
    database
      .prepare(
        "UPDATE trips SET name=?, description=?, start_date=?, end_date=?, status=?, updated_at=? WHERE id=?",
      )
      .run(
        data.name,
        data.description,
        data.startDate,
        data.endDate,
        data.status,
        now(),
        id,
      );
    return hydrate(id);
  });
  app.delete("/api/trips/:tripId", async (request, reply) => {
    database
      .prepare("DELETE FROM trips WHERE id=?")
      .run((request.params as any).tripId);
    return reply.code(204).send();
  });
  app.post("/api/trips/:tripId/destinations", async (request, reply) => {
    const tripId = (request.params as any).tripId;
    const data = parseBody(destinationInputSchema, request.body);
    const id = randomUUID(),
      timestamp = now();
    database
      .prepare(
        "INSERT INTO destinations VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        id,
        tripId,
        data.name,
        data.location,
        data.latitude,
        data.longitude,
        data.arrivalDate,
        data.departureDate,
        data.displayOrder,
        timestamp,
        timestamp,
      );
    return reply.code(201).send(hydrate(tripId));
  });
  app.patch("/api/destinations/:id", async (request, reply) => {
    const existing = database
      .prepare("SELECT * FROM destinations WHERE id=?")
      .get((request.params as any).id) as any;
    if (!existing)
      return reply.code(404).send({ error: "Destination not found" });
    const data = parseBody(destinationInputSchema, request.body);
    database
      .prepare(
        "UPDATE destinations SET name=?, location=?, latitude=?, longitude=?, arrival_date=?, departure_date=?, display_order=?, updated_at=? WHERE id=?",
      )
      .run(
        data.name,
        data.location,
        data.latitude,
        data.longitude,
        data.arrivalDate,
        data.departureDate,
        data.displayOrder,
        now(),
        existing.id,
      );
    return hydrate(existing.trip_id);
  });
  app.delete("/api/destinations/:id", async (request, reply) => {
    database
      .prepare("DELETE FROM destinations WHERE id=?")
      .run((request.params as any).id);
    return reply.code(204).send();
  });
  app.post("/api/trips/:tripId/items", async (request, reply) => {
    const tripId = (request.params as any).tripId;
    const data = parseBody(itineraryItemInputSchema, request.body);
    const dayId = randomUUID(),
      itemId = randomUUID(),
      timestamp = now();
    database
      .prepare(
        "INSERT OR IGNORE INTO itinerary_days (id, trip_id, date) VALUES (?, ?, ?)",
      )
      .run(dayId, tripId, data.dayDate);
    const day = database
      .prepare("SELECT id FROM itinerary_days WHERE trip_id=? AND date=?")
      .get(tripId, data.dayDate) as any;
    database
      .prepare(
        "INSERT INTO itinerary_items VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        itemId,
        tripId,
        day.id,
        data.title,
        data.category,
        data.startTime,
        data.endTime,
        data.location,
        data.notes,
        data.reference,
        data.status,
        data.cost,
        JSON.stringify(data.details),
        timestamp,
        timestamp,
      );
    return reply.code(201).send(hydrate(tripId));
  });
  app.patch("/api/items/:id", async (request, reply) => {
    const existing = database
      .prepare("SELECT * FROM itinerary_items WHERE id=?")
      .get((request.params as any).id) as any;
    if (!existing)
      return reply.code(404).send({ error: "Itinerary item not found" });
    const data = parseBody(itineraryItemInputSchema, request.body);
    database
      .prepare(
        "INSERT OR IGNORE INTO itinerary_days (id, trip_id, date) VALUES (?, ?, ?)",
      )
      .run(randomUUID(), existing.trip_id, data.dayDate);
    const day = database
      .prepare("SELECT id FROM itinerary_days WHERE trip_id=? AND date=?")
      .get(existing.trip_id, data.dayDate) as any;
    database
      .prepare(
        "UPDATE itinerary_items SET day_id=?, title=?, category=?, start_time=?, end_time=?, location=?, notes=?, reference=?, status=?, cost=?, details_json=?, updated_at=? WHERE id=?",
      )
      .run(
        day.id,
        data.title,
        data.category,
        data.startTime,
        data.endTime,
        data.location,
        data.notes,
        data.reference,
        data.status,
        data.cost,
        JSON.stringify(data.details),
        now(),
        existing.id,
      );
    return hydrate(existing.trip_id);
  });
  app.delete("/api/items/:id", async (request, reply) => {
    database
      .prepare("DELETE FROM itinerary_items WHERE id=?")
      .run((request.params as any).id);
    return reply.code(204).send();
  });
  app.post("/api/trips/:tripId/optional", async (request, reply) => {
    const tripId = (request.params as any).tripId;
    const data = parseBody(optionalActivityInputSchema, request.body);
    const timestamp = now();
    database
      .prepare(
        "INSERT INTO optional_activities (id, trip_id, title, suggested_date, end_date, location, latitude, longitude, estimated_duration, tags_json, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        randomUUID(),
        tripId,
        data.title,
        data.suggestedDate,
        data.endDate,
        data.location,
        data.latitude,
        data.longitude,
        data.estimatedDuration,
        JSON.stringify(data.tags),
        data.notes,
        timestamp,
        timestamp,
      );
    return reply.code(201).send(hydrate(tripId));
  });
  app.delete("/api/optional/:id", async (request, reply) => {
    database
      .prepare("DELETE FROM optional_activities WHERE id=?")
      .run((request.params as any).id);
    return reply.code(204).send();
  });
  app.post("/api/trips/:tripId/loyalty", async (request, reply) => {
    const tripId = (request.params as any).tripId;
    const data = parseBody(loyaltyInputSchema, request.body);
    const timestamp = now();
    database
      .prepare("INSERT INTO loyalty_records VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(
        randomUUID(),
        tripId,
        data.programName,
        data.membershipNumber,
        data.notes,
        timestamp,
        timestamp,
      );
    return reply.code(201).send(hydrate(tripId));
  });
  app.delete("/api/loyalty/:id", async (request, reply) => {
    database
      .prepare("DELETE FROM loyalty_records WHERE id=?")
      .run((request.params as any).id);
    return reply.code(204).send();
  });
  app.post("/api/trips/:tripId/travelers", async (request, reply) => {
    const tripId = (request.params as any).tripId;
    const data = parseBody(travelerInputSchema, request.body);
    const id = randomUUID(),
      timestamp = now();
    database
      .prepare(
        "INSERT INTO travelers (id, trip_id, first_name, last_name, preferred_name, email, phone, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .run(
        id,
        tripId,
        data.firstName,
        data.lastName,
        data.preferredName,
        data.email,
        data.phone,
        data.notes,
        timestamp,
        timestamp,
      );
    return reply.code(201).send(hydrate(tripId));
  });
  app.patch("/api/travelers/:id", async (request, reply) => {
    const id = (request.params as any).id;
    const existing = database
      .prepare("SELECT trip_id FROM travelers WHERE id=?")
      .get(id) as any;
    if (!existing) return reply.code(404).send({ error: "Traveler not found" });
    const data = parseBody(travelerInputSchema, request.body);
    database
      .prepare(
        "UPDATE travelers SET first_name=?, last_name=?, preferred_name=?, email=?, phone=?, notes=?, updated_at=? WHERE id=?",
      )
      .run(
        data.firstName,
        data.lastName,
        data.preferredName,
        data.email,
        data.phone,
        data.notes,
        now(),
        id,
      );
    return hydrate(existing.trip_id);
  });
  app.delete("/api/travelers/:id", async (request, reply) => {
    database
      .prepare("DELETE FROM travelers WHERE id=?")
      .run((request.params as any).id);
    return reply.code(204).send();
  });
  return app;
}

if (process.env.NODE_ENV !== "test")
  buildApp()
    .listen({ port: Number(process.env.PORT ?? 4000), host: "0.0.0.0" })
    .then(() =>
      console.log("Vacation Planner API running on http://localhost:4000"),
    );
