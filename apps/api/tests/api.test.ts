import { describe, expect, it, afterEach } from "vitest";
import { buildApp } from "../src/server.js";
import Database from "better-sqlite3";

const databases: Database.Database[] = [];
afterEach(() => databases.splice(0).forEach((db) => db.close()));
describe("trip API", () => {
  it("creates, reads, and validates a trip", async () => {
    const db = new Database(":memory:");
    databases.push(db);
    const app = buildApp(db);
    const created = await app.inject({
      method: "POST",
      url: "/api/trips",
      payload: {
        name: "Japan",
        description: "Spring trip",
        startDate: "2026-04-01",
        endDate: "2026-04-07",
        status: "planning",
      },
    });
    expect(created.statusCode).toBe(201);
    const trip = created.json();
    expect(trip.name).toBe("Japan");
    const bad = await app.inject({
      method: "POST",
      url: "/api/trips",
      payload: { name: "", startDate: "2026-04-07", endDate: "2026-04-01" },
    });
    expect(bad.statusCode).toBe(400);
    const read = await app.inject({
      method: "GET",
      url: `/api/trips/${trip.id}`,
    });
    expect(read.json().days).toEqual([]);
  });
  it("creates optional activities without commute input", async () => {
    const db = new Database(":memory:");
    databases.push(db);
    const app = buildApp(db);
    const trip = await app.inject({
      method: "POST",
      url: "/api/trips",
      payload: {
        name: "Portugal",
        startDate: "2026-05-01",
        endDate: "2026-05-03",
      },
    });
    const result = await app.inject({
      method: "POST",
      url: `/api/trips/${trip.json().id}/optional`,
      payload: {
        title: "Sintra gardens",
        location: "Sintra",
        estimatedDuration: 120,
      },
    });
    expect(result.statusCode).toBe(201);
    expect(result.json().optionalActivities[0].estimatedDuration).toBe(120);
  });
  it("creates and returns a trip traveler", async () => {
    const db = new Database(":memory:");
    databases.push(db);
    const app = buildApp(db);
    const trip = await app.inject({
      method: "POST",
      url: "/api/trips",
      payload: {
        name: "Family trip",
        startDate: "2026-06-01",
        endDate: "2026-06-03",
      },
    });
    const result = await app.inject({
      method: "POST",
      url: `/api/trips/${trip.json().id}/travelers`,
      payload: {
        firstName: "Avery",
        lastName: "Hughes",
        email: "avery@example.com",
      },
    });
    expect(result.statusCode).toBe(201);
    expect(result.json().travelers[0]).toMatchObject({
      firstName: "Avery",
      lastName: "Hughes",
    });
  });
});
