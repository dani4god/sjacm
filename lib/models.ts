import mongoose, { Schema } from "mongoose";
const adminSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["superadmin"], default: "superadmin" },
    active: { type: Boolean, default: true },
    sessionVersion: { type: Number, default: 0 },
  },
  { timestamps: true },
);
const section = { _id: false };
const baptismSchema = new Schema(
  {
    date: String,
    dateOfBirth: String,
    registerNumber: String,
    registerPage: String,
    parentsOrFormerReligion: String,
    sponsors: [String],
    residence: String,
    priest: String,
  },
  section,
);
const confirmationSchema = new Schema(
  { date: String, place: String, priest: String },
  section,
);
const marriageSchema = new Schema(
  { spouse: String, date: String, priests: [String] },
  section,
);
const churchingSchema = new Schema({ date: String, priest: String }, section);
const profileSchema = new Schema(
  {
    surname: { type: String, required: true },
    firstName: { type: String, required: true },
    nameKey: { type: String, required: true, index: true },
    churchCode: { type: String, required: true, unique: true },
    baptized: Boolean,
    baptism: baptismSchema,
    confirmed: Boolean,
    confirmation: confirmationSchema,
    hasOrganizations: Boolean,
    organizations: [String],
    married: Boolean,
    marriage: marriageSchema,
    churched: Boolean,
    churching: churchingSchema,
    priestComment: String,
    commentPriest: String,
    createdBy: { type: Schema.Types.ObjectId, required: true },
    updatedBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);
const publicationSchema = new Schema(
  {
    kind: { type: String, enum: ["Announcement", "Activity"], required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    eventDate: String,
    location: String,
    published: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, required: true },
    updatedBy: { type: Schema.Types.ObjectId, required: true },
  },
  { timestamps: true },
);
publicationSchema.index({ published: 1, createdAt: -1 });
const limitSchema = new Schema({
  _id: String,
  count: Number,
  expiresAt: { type: Date, index: { expires: 0 } },
});
// Explicit collection names isolate this app even when sharing BSRverifier's database.
export const Admin =
  mongoose.models.SjacmAdmin ||
  mongoose.model("SjacmAdmin", adminSchema, "sjacm_admins");
export const Profile =
  mongoose.models.SjacmProfile ||
  mongoose.model("SjacmProfile", profileSchema, "sjacm_profiles");
export const PublicationModel =
  mongoose.models.SjacmPublication ||
  mongoose.model("SjacmPublication", publicationSchema, "sjacm_publications");
export const RateLimit =
  mongoose.models.SjacmRateLimit ||
  mongoose.model("SjacmRateLimit", limitSchema, "sjacm_rate_limits");
