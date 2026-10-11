import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  Compass,
  Edit3,
  Lightbulb,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { api } from "./api";
import { airportLabel, airports, findAirport } from "./travelData";

const categories = [
  "lodging",
  "airfare",
  "ground transportation",
  "activity",
  "dining",
  "transfer",
] as const;
const itemEmoji = (category: string) =>
  ({
    lodging: "🏨",
    airfare: "✈️",
    "ground transportation": "🚗",
    activity: "🎟️",
    dining: "🍽️",
    transfer: "🚐",
  })[category] || "📌";
const blankItem = (date: string) => ({
  dayDate: date,
  title: "",
  category: "activity",
  startTime: "09:00",
  endTime: "10:00",
  location: "",
  notes: "",
  reference: "",
  status: "planned",
  cost: "",
  details: {},
});
const prettyDate = (date: string) =>
  new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
const rangeDays = (start: string, end: string) => {
  const days: string[] = [];
  for (
    let cursor = new Date(`${start}T12:00:00`);
    cursor <= new Date(`${end}T12:00:00`);
    cursor.setDate(cursor.getDate() + 1)
  )
    days.push(cursor.toISOString().slice(0, 10));
  return days;
};
const defaultLeg = () => ({
  originCode: "",
  originCity: "",
  departureTime: "",
  departureZone: "America/New_York",
  destinationCode: "",
  destinationCity: "",
  arrivalTime: "",
  arrivalZone: "America/New_York",
  travelers: [],
  seats: {},
});
const flightSummary = (item: any) => {
  const legs = item.details?.legs || [];
  const first = legs[0];
  const last = legs[legs.length - 1];
  return {
    title: item.details?.flightNumber || item.title,
    startTime: first?.departureTime
      ? first.departureTime.slice(11, 16)
      : item.startTime,
    endTime: last?.arrivalTime ? last.arrivalTime.slice(11, 16) : item.endTime,
    location:
      first && last
        ? `${airportLabel(first.originCode, first.originCity)} to ${airportLabel(last.destinationCode, last.destinationCity)}`
        : item.location,
  };
};

function Field({ label, as, children, ...props }: any) {
  const Control = as ?? "input";
  return (
    <label className="field">
      <span>{label}</span>
      <Control {...props}>{children}</Control>
    </label>
  );
}
function Button({ children, variant = "", ...props }: any) {
  return (
    <button className={`button ${variant}`} {...props}>
      {children}
    </button>
  );
}
function Modal({ title, children, close }: any) {
  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true">
        <div className="modal-heading">
          <h2>{title}</h2>
          <button className="icon-button" onClick={close} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
function AirportField({ label, code, city, onChange }: any) {
  const airport = findAirport(code);
  return (
    <div className="airport-field">
      <Field
        label={label}
        list="airport-options"
        maxLength={3}
        value={code}
        placeholder="e.g. LAS"
        onChange={(event: any) => {
          const value = event.target.value.toUpperCase();
          const match = findAirport(value);
          onChange(value, match?.city || city, match?.timeZone || "");
        }}
      />
      <datalist id="airport-options">
        {airports.map((entry) => (
          <option key={entry.code} value={entry.code}>
            {entry.city} - {entry.name}
          </option>
        ))}
      </datalist>
      <small>
        {airport
          ? `${airport.city} · ${airport.name} · ${airport.timeZone}`
          : city || "Type an airport code to see the city"}
      </small>
    </div>
  );
}

export default function Planner() {
  const [trips, setTrips] = useState<any[]>([]);
  const [trip, setTrip] = useState<any>(null);
  const [page, setPage] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tripModal, setTripModal] = useState(false);
  const loadTrips = async () => {
    setLoading(true);
    try {
      const records = await api.trips();
      setTrips(records);
      if (!trip && records[0]) setTrip(await api.trip(records[0].id));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadTrips();
  }, []);
  const openTrip = async (id: string) => {
    try {
      setTrip(await api.trip(id));
      setPage("overview");
    } catch (e: any) {
      setError(e.message);
    }
  };
  const refresh = async () => {
    if (trip) setTrip(await api.trip(trip.id));
    await loadTrips();
  };
  if (loading && !trip)
    return <div className="state">Loading your trips...</div>;
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <Compass size={20} />
          </span>
          <span>Wayfinder</span>
        </div>
        <div className="side-label">Your workspace</div>
        <button
          className={`nav-item ${!trip ? "active" : ""}`}
          onClick={() => setTrip(null)}
        >
          <CalendarDays size={17} /> Trips{" "}
          <span className="count">{trips.length}</span>
        </button>
        {trip && (
          <>
            <div className="side-label trip-nav-label">{trip.name}</div>
            <NavButton
              active={page === "overview"}
              onClick={() => setPage("overview")}
            >
              Overview
            </NavButton>
            <NavButton
              active={page === "destinations"}
              onClick={() => setPage("destinations")}
            >
              <MapPin size={16} /> Destinations
            </NavButton>
            <NavButton active={page === "days"} onClick={() => setPage("days")}>
              <CalendarDays size={16} /> Days In Motion
            </NavButton>
            <NavButton
              active={page === "optional"}
              onClick={() => setPage("optional")}
            >
              <Lightbulb size={16} /> Optional Activities
            </NavButton>
            <NavButton
              active={page === "travel"}
              onClick={() => setPage("travel")}
            >
              <Users size={16} /> Travel Details
            </NavButton>
            <NavButton
              active={page === "travelers"}
              onClick={() => setPage("travelers")}
            >
              <Users size={16} /> Travelers
            </NavButton>
          </>
        )}
        <div className="sidebar-footer">
          <span className="avatar">K</span>
          <span>
            <strong>Local planner</strong>
            <small>Personal workspace</small>
          </span>
        </div>
      </aside>
      <main className="main">
        {error && (
          <div className="alert">
            {error}
            <button onClick={() => setError("")} aria-label="Dismiss">
              ×
            </button>
          </div>
        )}
        {!trip ? (
          <Dashboard
            trips={trips}
            openTrip={openTrip}
            openNew={() => setTripModal(true)}
          />
        ) : (
          <TripWorkspace
            trip={trip}
            page={page}
            setPage={setPage}
            refresh={refresh}
            setTrip={setTrip}
          />
        )}
        {tripModal && (
          <TripForm
            save={async (data: any) => {
              const created = await api.createTrip(data);
              setTrip(created);
              setTrips(await api.trips());
              setTripModal(false);
            }}
            close={() => setTripModal(false)}
          />
        )}
      </main>
    </div>
  );
}
function NavButton({ active, children, onClick }: any) {
  return (
    <button
      className={`nav-item sub ${active ? "active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
function Dashboard({ trips, openTrip, openNew }: any) {
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">2026 planning season</p>
          <h1>Your trips</h1>
        </div>
        <Button onClick={openNew}>
          <Plus size={17} /> New trip
        </Button>
      </header>
      <section className="dashboard">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trip library</p>
            <h2>Make room for somewhere new.</h2>
          </div>
        </div>
        {trips.length === 0 ? (
          <div className="empty">
            <Compass size={27} />
            <h3>Your next chapter starts here.</h3>
            <p>
              Create a trip to start arranging destinations, reservations, and
              days.
            </p>
            <Button onClick={openNew}>
              <Plus size={17} /> Create your first trip
            </Button>
          </div>
        ) : (
          <div className="trip-grid">
            {trips.map((item: any) => (
              <button
                className="trip-card"
                key={item.id}
                onClick={() => openTrip(item.id)}
              >
                <span className="trip-status">{item.status}</span>
                <h3>{item.name}</h3>
                <p>
                  {prettyDate(item.startDate)} - {prettyDate(item.endDate)}
                </p>
                <span className="trip-description">
                  {item.description || "No description yet"}
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
function TripWorkspace({ trip, page, setPage, refresh, setTrip }: any) {
  return (
    <>
      <header className="topbar">
        <div>
          <p className="eyebrow">
            {trip.status} · {prettyDate(trip.startDate)} -{" "}
            {prettyDate(trip.endDate)}
          </p>
          <h1>{trip.name}</h1>
        </div>
        <Button variant="quiet" onClick={() => setTrip(null)}>
          All trips
        </Button>
      </header>
      {page === "overview" && <Overview trip={trip} setPage={setPage} />}
      {page === "destinations" && (
        <Destinations trip={trip} refresh={refresh} />
      )}
      {page === "days" && <DaysInMotion trip={trip} refresh={refresh} />}
      {page === "optional" && (
        <OptionalActivities trip={trip} refresh={refresh} />
      )}
      {page === "travel" && <TravelDetails trip={trip} refresh={refresh} />}
      {page === "travelers" && <TravelersPage trip={trip} refresh={refresh} />}
    </>
  );
}
function Overview({ trip, setPage }: any) {
  return (
    <section className="dashboard">
      <div className="trip-hero">
        <div>
          <span className="trip-status">{trip.status}</span>
          <p>{trip.description || "Your trip workspace is ready to shape."}</p>
        </div>
      </div>
      <div className="overview-grid">
        <button
          className="overview-card"
          onClick={() => setPage("destinations")}
        >
          <MapPin size={22} />
          <strong>{trip.destinations.length} destinations</strong>
          <span>Organize stops, locations, and date ranges.</span>
        </button>
        <button className="overview-card" onClick={() => setPage("days")}>
          <CalendarDays size={22} />
          <strong>
            {trip.days.reduce(
              (sum: number, day: any) => sum + day.items.length,
              0,
            )}{" "}
            planned items
          </strong>
          <span>Build the trip day by day in timeline or daily view.</span>
        </button>
        <button className="overview-card" onClick={() => setPage("optional")}>
          <Lightbulb size={22} />
          <strong>{trip.optionalActivities.length} optional ideas</strong>
          <span>Keep possibilities nearby without committing them.</span>
        </button>
      </div>
    </section>
  );
}
function Destinations({ trip, refresh }: any) {
  const [form, setForm] = useState<any>({
    name: "",
    location: "",
    arrivalDate: trip.startDate,
    departureDate: trip.endDate,
    displayOrder: trip.destinations.length,
    latitude: null,
    longitude: null,
  });
  const [editing, setEditing] = useState<any>(null);
  const save = async (event: any) => {
    event.preventDefault();
    if (editing) await api.updateDestination(editing.id, form);
    else await api.addDestination(trip.id, form);
    setEditing(null);
    setForm({
      name: "",
      location: "",
      arrivalDate: trip.startDate,
      departureDate: trip.endDate,
      displayOrder: trip.destinations.length,
      latitude: null,
      longitude: null,
    });
    await refresh();
  };
  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Place structure</p>
          <h2>Destinations</h2>
          <p className="page-intro">
            Destinations are the stops that give your trip shape. Add a city,
            neighborhood, hotel area, or venue cluster, then connect your plans
            to those dates in Days In Motion.
          </p>
        </div>
      </div>
      <div className="content-grid">
        <div className="panel">
          <h3>Your stops</h3>
          {trip.destinations.map((place: any) => (
            <div className="idea" key={place.id}>
              <div>
                <strong>{place.name}</strong>
                <span>
                  {place.location || "Location TBD"} ·{" "}
                  {place.arrival_date || "Date TBD"} to{" "}
                  {place.departure_date || "Date TBD"}
                </span>
              </div>
              <button
                className="text-button"
                onClick={() => {
                  setEditing(place);
                  setForm({
                    name: place.name,
                    location: place.location,
                    arrivalDate: place.arrival_date,
                    departureDate: place.departure_date,
                    displayOrder: place.display_order,
                    latitude: place.latitude,
                    longitude: place.longitude,
                  });
                }}
              >
                Edit
              </button>
              <button
                className="icon-button muted"
                onClick={async () => {
                  if (confirm(`Delete ${place.name}?`)) {
                    await api.deleteDestination(place.id);
                    await refresh();
                  }
                }}
                aria-label={`Delete ${place.name}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!trip.destinations.length && (
            <p className="day-empty">
              No destinations yet. Add the places you expect to visit.
            </p>
          )}
        </div>
        <form className="panel form-stack" onSubmit={save}>
          <h3>{editing ? "Edit destination" : "Add a destination"}</h3>
          <Field
            label="Name"
            required
            value={form.name}
            onChange={(e: any) => setForm({ ...form, name: e.target.value })}
            placeholder="Kyoto, Gion, or Lake Como"
          />
          <Field
            label="Location or address"
            value={form.location}
            onChange={(e: any) =>
              setForm({ ...form, location: e.target.value })
            }
            placeholder="Add a neighborhood, address, or venue"
          />
          <div className="form-row">
            <Field
              label="Arrival"
              type="date"
              value={form.arrivalDate || ""}
              onChange={(e: any) =>
                setForm({ ...form, arrivalDate: e.target.value || null })
              }
            />
            <Field
              label="Departure"
              type="date"
              value={form.departureDate || ""}
              onChange={(e: any) =>
                setForm({ ...form, departureDate: e.target.value || null })
              }
            />
          </div>
          <Button type="submit">
            <Plus size={16} />{" "}
            {editing ? "Save destination" : "Add destination"}
          </Button>
        </form>
      </div>
    </section>
  );
}
function DaysInMotion({ trip, refresh }: any) {
  const [view, setView] = useState<"timeline" | "daily">("timeline");
  const [item, setItem] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState(trip.startDate);
  const [expanded, setExpanded] = useState(false);
  const [ideas, setIdeas] = useState<any[]>([]);
  const days = rangeDays(trip.startDate, trip.endDate);
  const selectedDay = trip.days.find(
    (entry: any) => entry.date === selectedDate,
  );
  const selectedDestination = trip.destinations.find(
    (destination: any) =>
      selectedDate >= destination.arrival_date &&
      selectedDate <= destination.departure_date,
  );
  const findIdeas = (random: boolean) => {
    const matches = trip.optionalActivities.filter(
      (idea: any) =>
        (!idea.suggestedDate ||
          idea.suggestedDate === selectedDate ||
          (idea.endDate && selectedDate <= idea.endDate)) &&
        (!selectedDestination ||
          !idea.location ||
          `${idea.location}`
            .toLowerCase()
            .includes(
              `${selectedDestination.name} ${selectedDestination.location}`
                .toLowerCase()
                .split(" ")[0],
            )),
    );
    setIdeas(
      random && matches.length
        ? [matches[Math.floor(Math.random() * matches.length)]]
        : matches,
    );
  };
  const save = async (data: any) => {
    if (item?.id) await api.updateItem(item.id, data);
    else await api.addItem(trip.id, data);
    setItem(null);
    await refresh();
  };
  return (
    <section className="page-content">
      <div className="page-heading inline">
        <div>
          <p className="eyebrow">Trip rhythm</p>
          <h2>Days In Motion</h2>
          <p className="page-intro">
            Your confirmed plans, reservations, and travel records live here.
            Switch between a chronological timeline and a calendar-like daily
            view.
          </p>
        </div>
        <div className="segmented">
          <button
            className={view === "timeline" ? "selected" : ""}
            onClick={() => setView("timeline")}
          >
            Timeline
          </button>
          <button
            className={view === "daily" ? "selected" : ""}
            onClick={() => {
              setView("daily");
              setSelectedDate(selectedDate || days[0]);
            }}
          >
            Daily view
          </button>
        </div>
      </div>
      {view === "daily" && (
        <div className="daily-controls">
          <label className="field">
            <span>Day</span>
            <select
              value={selectedDate}
              onChange={(event) => {
                setSelectedDate(event.target.value);
                setExpanded(false);
                setIdeas([]);
              }}
            >
              {days.map((date) => (
                <option key={date} value={date}>
                  {prettyDate(date)}
                </option>
              ))}
            </select>
          </label>
          <Button variant="quiet" onClick={() => setExpanded(!expanded)}>
            {expanded ? "Collapse schedule" : "Expand schedule"}
          </Button>
          <Button variant="quiet" onClick={() => findIdeas(false)}>
            <Lightbulb size={16} /> Find things to do
          </Button>
          <Button variant="quiet" onClick={() => findIdeas(true)}>
            <Sparkles size={16} /> Random idea
          </Button>
        </div>
      )}
      {view === "daily" && ideas.length > 0 && (
        <div className="idea-strip">
          <strong>
            {selectedDestination
              ? `Ideas near ${selectedDestination.name}`
              : "Ideas for this day"}
          </strong>
          {ideas.map((idea: any) => (
            <span key={idea.id}>
              💡 {idea.title} · {idea.estimatedDuration} min
            </span>
          ))}
        </div>
      )}
      <div className={view === "timeline" ? "itinerary" : "calendar-view"}>
        {days
          .filter((date) => view === "timeline" || date === selectedDate)
          .map((date, index) => {
            const day = trip.days.find((entry: any) => entry.date === date);
            return (
              <div
                className={`${view === "timeline" ? "day" : "calendar-day"} ${view === "daily" && expanded ? "expanded" : ""}`}
                key={date}
              >
                <div className="day-marker">
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  <span>{prettyDate(date)}</span>
                </div>
                <div className="day-content">
                  {day?.items?.length ? (
                    day.items.map((entry: any) => (
                      <button
                        className="timeline-item"
                        key={entry.id}
                        onClick={() =>
                          setItem({
                            ...entry,
                            dayDate: date,
                            startTime: entry.start_time,
                            endTime: entry.end_time,
                            details: entry.details,
                          })
                        }
                      >
                        <span className="item-emoji" aria-hidden="true">
                          {itemEmoji(entry.category)}
                        </span>
                        <span>
                          <strong>{entry.title}</strong>
                          <small>
                            {[entry.start_time, entry.end_time]
                              .filter(Boolean)
                              .join(" - ")}{" "}
                            {entry.location && `· ${entry.location}`} ·{" "}
                            {durationLabel(entry.start_time, entry.end_time)}
                          </small>
                          {entry.reference && <em>Ref {entry.reference}</em>}
                        </span>
                      </button>
                    ))
                  ) : (
                    <p className="day-empty">No plans yet</p>
                  )}
                  <button
                    className="add-line"
                    onClick={() => setItem(blankItem(date))}
                  >
                    <Plus size={15} /> Add to this day
                  </button>
                </div>
              </div>
            );
          })}
      </div>
      {item && (
        <ItemModal
          initial={item}
          travelers={trip.travelers}
          save={save}
          close={() => setItem(null)}
        />
      )}
    </section>
  );
}
const durationLabel = (start?: string, end?: string) => {
  if (!start || !end) return "Duration TBD";
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);
  const minutes = endHour * 60 + endMinute - (startHour * 60 + startMinute);
  return minutes > 0
    ? `${Math.floor(minutes / 60)}h ${minutes % 60}m`
    : "Duration TBD";
};
function TravelerPicker({ travelers, leg, onChange }: any) {
  if (!travelers?.length)
    return (
      <p className="field-hint">
        Add travelers on the Travelers page to assign them to this flight leg.
      </p>
    );
  return (
    <div className="traveler-picker">
      <label className="field">
        <span>Travelers on this leg</span>
        <select
          value=""
          onChange={(event) => {
            const travelerId = event.target.value;
            if (travelerId && !(leg.travelerIds || []).includes(travelerId))
              onChange({
                travelerIds: [...(leg.travelerIds || []), travelerId],
              });
          }}
        >
          <option value="">Add a traveler...</option>
          {travelers
            .filter(
              (traveler: any) => !(leg.travelerIds || []).includes(traveler.id),
            )
            .map((traveler: any) => (
              <option key={traveler.id} value={traveler.id}>
                {traveler.preferredName ||
                  `${traveler.firstName} ${traveler.lastName}`}
              </option>
            ))}
        </select>
      </label>
      {(leg.travelerIds || []).map((travelerId: string) => {
        const traveler = travelers.find(
          (entry: any) => entry.id === travelerId,
        );
        const name = traveler
          ? traveler.preferredName ||
            `${traveler.firstName} ${traveler.lastName}`
          : travelerId;
        return (
          <div className="traveler-seat-row" key={travelerId}>
            <span>{name}</span>
            <Field
              label="Seat"
              aria-label={`Seat for ${name}`}
              value={leg.seats?.[travelerId] || ""}
              onChange={(event: any) =>
                onChange({
                  seats: {
                    ...(leg.seats || {}),
                    [travelerId]: event.target.value,
                  },
                })
              }
            />
            <button
              type="button"
              className="icon-button muted"
              aria-label={`Remove ${name}`}
              onClick={() =>
                onChange({
                  travelerIds: leg.travelerIds.filter(
                    (id: string) => id !== travelerId,
                  ),
                  seats: Object.fromEntries(
                    Object.entries(leg.seats || {}).filter(
                      ([id]) => id !== travelerId,
                    ),
                  ),
                })
              }
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
function ItemModal({ initial, travelers, save, close }: any) {
  const [item, setItem] = useState(initial);
  const [collapsedLegs, setCollapsedLegs] = useState<Record<number, boolean>>(
    {},
  );
  const update = (key: string, value: any) =>
    setItem({ ...item, [key]: value });
  const updateDetail = (key: string, value: any) =>
    setItem({ ...item, details: { ...item.details, [key]: value } });
  const legs = item.details?.legs || [
    {
      originCode: "",
      originCity: "",
      departureTime: "",
      departureZone: "America/New_York",
      destinationCode: "",
      destinationCity: "",
      arrivalTime: "",
      arrivalZone: "America/New_York",
    },
  ];
  const updateLeg = (index: number, key: string, value: string) =>
    updateDetail(
      "legs",
      legs.map((leg: any, legIndex: number) =>
        legIndex === index ? { ...leg, [key]: value } : leg,
      ),
    );
  const updateLegData = (index: number, data: any) => {
    const nextLegs = legs.map((leg: any, legIndex: number) =>
      legIndex === index ? { ...leg, ...data } : leg,
    );
    const first = nextLegs[0];
    const last = nextLegs[nextLegs.length - 1];
    setItem({
      ...item,
      details: { ...item.details, legs: nextLegs },
      title: item.details?.flightNumber || item.title,
      startTime: first?.departureTime?.slice(11, 16) || item.startTime,
      endTime: last?.arrivalTime?.slice(11, 16) || item.endTime,
      location:
        first && last
          ? `${airportLabel(first.originCode, first.originCity)} to ${airportLabel(last.destinationCode, last.destinationCity)}`
          : item.location,
    });
    if (data.arrivalTime) setCollapsedLegs({ ...collapsedLegs, [index]: true });
  };
  return (
    <Modal
      title={
        initial.id
          ? `${itemEmoji(initial.category)} Edit travel record`
          : `${itemEmoji(item.category)} Add travel record`
      }
      close={close}
    >
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          save({ ...item, cost: item.cost === "" ? null : Number(item.cost) });
        }}
      >
        <div className="form-row">
          <Field
            label="Date"
            type="date"
            required
            value={item.dayDate}
            onChange={(e: any) => update("dayDate", e.target.value)}
          />
          <Field
            label="Type"
            as="select"
            value={item.category}
            onChange={(e: any) => update("category", e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {itemEmoji(category)}{" "}
                {category[0].toUpperCase() + category.slice(1)}
              </option>
            ))}
          </Field>
        </div>
        {item.category !== "airfare" && (
          <Field
            label={
              item.category === "lodging"
                ? "Property name"
                : item.category === "airfare"
                  ? "Flight title"
                  : item.category === "activity"
                    ? "Activity or reservation"
                    : "Record title"
            }
            required
            value={item.title}
            onChange={(e: any) => update("title", e.target.value)}
          />
        )}
        {item.category === "airfare" && (
          <div className="derived-summary">
            <span>Flight summary</span>
            <strong>{item.title || "Add flight legs below"}</strong>
            <small>
              {item.location || "Airport route will appear here"} ·{" "}
              {[item.startTime, item.endTime].filter(Boolean).join(" - ")}
            </small>
          </div>
        )}
        {item.category !== "airfare" && (
          <div className="form-row">
            <Field
              label="Start"
              type="time"
              value={item.startTime || ""}
              onChange={(e: any) => update("startTime", e.target.value || null)}
            />
            <Field
              label="End"
              type="time"
              value={item.endTime || ""}
              onChange={(e: any) => update("endTime", e.target.value || null)}
            />
          </div>
        )}
        {item.category === "lodging" && (
          <>
            <div className="form-row">
              <Field
                label="Check-in time"
                type="time"
                value={item.details?.checkInTime || ""}
                onChange={(e: any) =>
                  updateDetail("checkInTime", e.target.value)
                }
              />
              <Field
                label="Check-out time"
                type="time"
                value={item.details?.checkOutTime || ""}
                onChange={(e: any) =>
                  updateDetail("checkOutTime", e.target.value)
                }
              />
            </div>
            <div className="form-row">
              <Field
                label="Street address"
                value={item.details?.street || ""}
                onChange={(e: any) => updateDetail("street", e.target.value)}
              />
              <Field
                label="City"
                value={item.details?.city || ""}
                onChange={(e: any) => updateDetail("city", e.target.value)}
              />
            </div>
            <div className="form-row">
              <Field
                label="State / region"
                value={item.details?.region || ""}
                onChange={(e: any) => updateDetail("region", e.target.value)}
              />
              <Field
                label="ZIP / postal code"
                value={item.details?.postalCode || ""}
                onChange={(e: any) =>
                  updateDetail("postalCode", e.target.value)
                }
              />
            </div>
            <div className="form-row">
              <Field
                label="Country"
                value={item.details?.country || "US"}
                onChange={(e: any) => updateDetail("country", e.target.value)}
              />
              <Field
                label="Phone number"
                type="tel"
                value={item.details?.phone || ""}
                onChange={(e: any) => updateDetail("phone", e.target.value)}
              />
            </div>
            <Field
              label="Contact email"
              type="email"
              value={item.details?.email || ""}
              onChange={(e: any) => updateDetail("email", e.target.value)}
            />
            <Field
              label="Confirmation number"
              value={item.reference}
              onChange={(e: any) => update("reference", e.target.value)}
            />
          </>
        )}
        {item.category === "airfare" && (
          <>
            <div className="derived-summary compact">
              <span>Flight rollup</span>
              <strong>
                {Array.from(
                  new Set(legs.map((leg: any) => leg.airline).filter(Boolean)),
                ).join(" / ") || "Add airline and flight number per leg"}
              </strong>
              <small>
                {legs
                  .map((leg: any) => leg.flightNumber)
                  .filter(Boolean)
                  .join(" / ") || "Each leg can have its own flight number"}
              </small>
            </div>
            <h3>Flight legs</h3>
            {legs.map((leg: any, index: number) => (
              <div className="leg-editor" key={index}>
                <button
                  type="button"
                  className="leg-heading"
                  onClick={() =>
                    setCollapsedLegs({
                      ...collapsedLegs,
                      [index]: !collapsedLegs[index],
                    })
                  }
                >
                  <strong>Leg {index + 1}</strong>
                  <span>
                    {airportLabel(leg.originCode, leg.originCity)} →{" "}
                    {airportLabel(leg.destinationCode, leg.destinationCity)}{" "}
                    {collapsedLegs[index] ? "＋" : "−"}
                  </span>
                </button>
                {!collapsedLegs[index] && (
                  <>
                    <Field
                      label="Confirmation number"
                      value={leg.confirmation || ""}
                      onChange={(e: any) =>
                        updateLegData(index, { confirmation: e.target.value })
                      }
                    />
                    <div className="form-row">
                      <Field
                        label="Airline for this leg"
                        value={leg.airline || ""}
                        onChange={(e: any) =>
                          updateLegData(index, { airline: e.target.value })
                        }
                      />
                      <Field
                        label="Flight number for this leg"
                        value={leg.flightNumber || ""}
                        onChange={(e: any) =>
                          updateLegData(index, { flightNumber: e.target.value })
                        }
                      />
                    </div>
                    <div className="form-row">
                      <AirportField
                        label="Origin airport"
                        code={leg.originCode}
                        city={leg.originCity}
                        onChange={(
                          code: string,
                          city: string,
                          timeZone: string,
                        ) =>
                          updateLegData(index, {
                            originCode: code,
                            originCity: city,
                            departureZone: timeZone,
                            arrivalZone: timeZone,
                          })
                        }
                      />
                      <AirportField
                        label="Destination airport"
                        code={leg.destinationCode}
                        city={leg.destinationCity}
                        onChange={(code: string, city: string) =>
                          updateLegData(index, {
                            destinationCode: code,
                            destinationCity: city,
                          })
                        }
                      />
                    </div>
                    <Field
                      label="Departure"
                      type="datetime-local"
                      value={leg.departureTime}
                      onChange={(e: any) =>
                        updateLegData(index, { departureTime: e.target.value })
                      }
                    />
                    <div className="form-row">
                      <Field
                        label="Arrival"
                        type="datetime-local"
                        value={leg.arrivalTime}
                        onChange={(e: any) =>
                          updateLegData(index, { arrivalTime: e.target.value })
                        }
                      />
                    </div>
                    <TravelerPicker
                      travelers={travelers}
                      leg={leg}
                      onChange={(data: any) => updateLegData(index, data)}
                    />
                  </>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="quiet"
              onClick={() =>
                updateDetail("legs", [...legs, { ...legs[legs.length - 1] }])
              }
            >
              <Plus size={16} /> Add another leg
            </Button>
          </>
        )}
        {item.category === "activity" && (
          <>
            <Field
              label="Venue or street address"
              value={item.location}
              onChange={(e: any) => update("location", e.target.value)}
            />
            <div className="form-row">
              <Field
                label="City"
                value={item.details?.city || ""}
                onChange={(e: any) => updateDetail("city", e.target.value)}
              />
              <Field
                label="Country"
                value={item.details?.country || "US"}
                onChange={(e: any) => updateDetail("country", e.target.value)}
              />
            </div>
            <div className="form-row">
              <Field
                label="Contact phone"
                type="tel"
                value={item.details?.phone || ""}
                onChange={(e: any) => updateDetail("phone", e.target.value)}
              />
              <Field
                label="Contact email"
                type="email"
                value={item.details?.email || ""}
                onChange={(e: any) => updateDetail("email", e.target.value)}
              />
            </div>
            <label className="check-field">
              <input
                type="checkbox"
                checked={Boolean(item.details?.reservationRequired)}
                onChange={(e) =>
                  updateDetail("reservationRequired", e.target.checked)
                }
              />{" "}
              Reservation required
            </label>
            <Field
              label="Ticket or reservation reference"
              value={item.reference}
              onChange={(e: any) => update("reference", e.target.value)}
            />
          </>
        )}
        {(item.category === "ground transportation" ||
          item.category === "transfer") && (
          <>
            <div className="form-row">
              <Field
                label="Provider"
                value={item.details?.provider || ""}
                onChange={(e: any) => updateDetail("provider", e.target.value)}
              />
              <Field
                label="Origin"
                value={item.details?.origin || ""}
                onChange={(e: any) => updateDetail("origin", e.target.value)}
              />
            </div>
            <Field
              label="Destination"
              value={item.details?.destination || ""}
              onChange={(e: any) => updateDetail("destination", e.target.value)}
            />
            <div className="form-row">
              <Field
                label="Contact phone"
                type="tel"
                value={item.details?.phone || ""}
                onChange={(e: any) => updateDetail("phone", e.target.value)}
              />
              <Field
                label="Reference"
                value={item.reference}
                onChange={(e: any) => update("reference", e.target.value)}
              />
            </div>
          </>
        )}
        {item.category !== "airfare" && (
          <TravelerPicker
            travelers={travelers}
            leg={item.details?.travelerSelection || {}}
            onChange={(data: any) => updateDetail("travelerSelection", data)}
          />
        )}
        <label className="field">
          <span>Notes</span>
          <textarea
            value={item.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </label>
        <Button type="submit">Save travel record</Button>
      </form>
    </Modal>
  );
}
function OptionalActivities({ trip, refresh }: any) {
  const [filter, setFilter] = useState("");
  const [form, setForm] = useState<any>({
    title: "",
    suggestedDate: trip.startDate,
    endDate: null,
    location: "",
    estimatedDuration: 60,
    tags: [],
    notes: "",
  });
  const visible = trip.optionalActivities.filter(
    (item: any) =>
      !filter ||
      `${item.title} ${item.location} ${item.tags.join(" ")}`
        .toLowerCase()
        .includes(filter.toLowerCase()),
  );
  const add = async (event: any) => {
    event.preventDefault();
    await api.addOptional(trip.id, form);
    setForm({ ...form, title: "", notes: "" });
    await refresh();
  };
  const random = () => {
    if (!visible.length) return;
    alert(`Try: ${visible[Math.floor(Math.random() * visible.length)].title}`);
  };
  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Maybe later</p>
          <h2>Optional Activities</h2>
          <p className="page-intro">
            Keep ideas separate from confirmed plans. Duration helps you judge
            fit; commute will be calculated later when location services are
            added.
          </p>
        </div>
      </div>
      <div className="content-grid">
        <div className="panel">
          <div className="filter-row">
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter by place or tag"
            />
            <Button onClick={random}>
              <Sparkles size={16} /> Surprise me
            </Button>
          </div>
          {visible.map((item: any) => (
            <div className="idea" key={item.id}>
              <div>
                <strong>{item.title}</strong>
                <span>
                  {item.location || "Location TBD"} · {item.estimatedDuration}{" "}
                  min
                </span>
                <small>{item.notes}</small>
              </div>
              <button
                className="icon-button muted"
                onClick={async () => {
                  if (confirm(`Delete ${item.title}?`)) {
                    await api.deleteOptional(item.id);
                    await refresh();
                  }
                }}
                aria-label={`Delete ${item.title}`}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!visible.length && (
            <p className="day-empty">
              No optional activities match this filter.
            </p>
          )}
        </div>
        <form className="panel form-stack" onSubmit={add}>
          <h3>Add an idea</h3>
          <Field
            label="Title"
            required
            value={form.title}
            onChange={(e: any) => setForm({ ...form, title: e.target.value })}
          />
          <Field
            label="Location"
            value={form.location}
            onChange={(e: any) =>
              setForm({ ...form, location: e.target.value })
            }
          />
          <Field
            label="Estimated duration (minutes)"
            type="number"
            min="0"
            value={form.estimatedDuration}
            onChange={(e: any) =>
              setForm({ ...form, estimatedDuration: Number(e.target.value) })
            }
          />
          <Field
            label="Notes"
            value={form.notes}
            onChange={(e: any) => setForm({ ...form, notes: e.target.value })}
          />
          <Button type="submit">
            <Plus size={16} /> Add idea
          </Button>
        </form>
      </div>
    </section>
  );
}
function TravelersPage({ trip, refresh }: any) {
  const blank = {
    firstName: "",
    lastName: "",
    preferredName: "",
    email: "",
    phone: "",
    notes: "",
  };
  const [form, setForm] = useState<any>(blank);
  const [editing, setEditing] = useState<any>(null);
  const save = async (event: any) => {
    event.preventDefault();
    if (editing) await api.updateTraveler(editing.id, form);
    else await api.addTraveler(trip.id, form);
    setForm(blank);
    setEditing(null);
    await refresh();
  };
  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Trip roster</p>
          <h2>Travelers</h2>
          <p className="page-intro">
            This is the source of truth for everyone on the trip. Add each
            traveler once, then pick them on flights and other records instead
            of retyping their information.
          </p>
        </div>
      </div>
      <div className="content-grid">
        <div className="panel">
          <h3>
            {trip.travelers.length} traveler
            {trip.travelers.length === 1 ? "" : "s"}
          </h3>
          {trip.travelers.map((traveler: any) => (
            <div className="traveler-card" key={traveler.id}>
              <div className="traveler-avatar">
                {(traveler.preferredName || traveler.firstName)
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
              <div className="traveler-info">
                <strong>
                  {traveler.preferredName ||
                    `${traveler.firstName} ${traveler.lastName}`}
                </strong>
                <span>
                  {traveler.preferredName
                    ? `${traveler.firstName} ${traveler.lastName}`
                    : ""}
                </span>
                {traveler.email && <small>{traveler.email}</small>}
                {traveler.phone && <small>{traveler.phone}</small>}
                {traveler.notes && <small>{traveler.notes}</small>}
              </div>
              <button
                className="text-button"
                onClick={() => {
                  setEditing(traveler);
                  setForm({
                    firstName: traveler.firstName,
                    lastName: traveler.lastName,
                    preferredName: traveler.preferredName || "",
                    email: traveler.email || "",
                    phone: traveler.phone || "",
                    notes: traveler.notes || "",
                  });
                }}
              >
                Edit
              </button>
              <button
                className="icon-button muted"
                aria-label={`Delete ${traveler.firstName} ${traveler.lastName}`}
                onClick={async () => {
                  if (
                    confirm(
                      `Remove ${traveler.firstName} ${traveler.lastName} from this trip?`,
                    )
                  ) {
                    await api.deleteTraveler(traveler.id);
                    await refresh();
                  }
                }}
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          {!trip.travelers.length && (
            <p className="day-empty">
              No travelers yet. Add everyone who may need to appear on
              reservations.
            </p>
          )}
        </div>
        <form className="panel form-stack" onSubmit={save}>
          <h3>{editing ? "Edit traveler" : "Add a traveler"}</h3>
          <div className="form-row">
            <Field
              label="First name"
              required
              value={form.firstName}
              onChange={(e: any) =>
                setForm({ ...form, firstName: e.target.value })
              }
            />
            <Field
              label="Last name"
              required
              value={form.lastName}
              onChange={(e: any) =>
                setForm({ ...form, lastName: e.target.value })
              }
            />
          </div>
          <Field
            label="Preferred name"
            value={form.preferredName}
            onChange={(e: any) =>
              setForm({ ...form, preferredName: e.target.value })
            }
          />
          <Field
            label="Email"
            type="email"
            value={form.email}
            onChange={(e: any) => setForm({ ...form, email: e.target.value })}
          />
          <Field
            label="Phone"
            type="tel"
            value={form.phone}
            onChange={(e: any) => setForm({ ...form, phone: e.target.value })}
          />
          <Field
            label="Notes"
            value={form.notes}
            onChange={(e: any) => setForm({ ...form, notes: e.target.value })}
          />
          <Button type="submit">
            <Plus size={16} /> {editing ? "Save traveler" : "Add traveler"}
          </Button>
        </form>
      </div>
    </section>
  );
}
function TravelDetails({ trip }: any) {
  return (
    <section className="page-content">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Reservations and people</p>
          <h2>Travel Details</h2>
          <p className="page-intro">
            Category-specific records are created from Days In Motion. Traveler
            profiles will connect reservations to individuals in the next domain
            milestone.
          </p>
        </div>
      </div>
      <div className="panel travel-summary">
        <Users size={22} />
        <h3>{trip.loyalty.length} loyalty records</h3>
        <p>
          Loyalty records remain available here while lodging, airfare,
          transportation, transfers, and activities are organized in the Days In
          Motion page.
        </p>
      </div>
    </section>
  );
}
function TripForm({ save, close }: any) {
  const [form, setForm] = useState<any>({
    name: "",
    description: "",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 6 * 86400000).toISOString().slice(0, 10),
    status: "planning",
  });
  return (
    <Modal title="New trip" close={close}>
      <form
        className="form-stack"
        onSubmit={(e) => {
          e.preventDefault();
          save(form);
        }}
      >
        <Field
          label="Trip name"
          required
          value={form.name}
          onChange={(e: any) => setForm({ ...form, name: e.target.value })}
        />
        <Field
          label="Description"
          value={form.description}
          onChange={(e: any) =>
            setForm({ ...form, description: e.target.value })
          }
        />
        <div className="form-row">
          <Field
            label="Start date"
            type="date"
            value={form.startDate}
            onChange={(e: any) =>
              setForm({ ...form, startDate: e.target.value })
            }
          />
          <Field
            label="End date"
            type="date"
            value={form.endDate}
            onChange={(e: any) => setForm({ ...form, endDate: e.target.value })}
          />
        </div>
        <Button type="submit">Create trip</Button>
      </form>
    </Modal>
  );
}
