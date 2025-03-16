import { pgTable, text, serial, integer, timestamp, numeric, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Advertising profiles table
export const advertisingProfiles = pgTable("advertising_profiles", {
  id: serial("id").primaryKey(),
  profileId: text("profile_id").notNull().unique(),
  countryCode: text("country_code").notNull(),
  marketplaceId: text("marketplace_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Campaigns table
export const campaigns = pgTable("campaigns", {
  id: serial("id").primaryKey(),
  profileId: text("profile_id").references(() => advertisingProfiles.profileId),
  campaignId: text("campaign_id").notNull().unique(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  budget: numeric("budget").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ad groups table
export const adGroups = pgTable("ad_groups", {
  id: serial("id").primaryKey(),
  campaignId: text("campaign_id").references(() => campaigns.campaignId),
  adGroupId: text("ad_group_id").notNull().unique(),
  name: text("name").notNull(),
  state: text("state").notNull(),
  defaultBid: numeric("default_bid"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Metrics table
export const metrics = pgTable("metrics", {
  id: serial("id").primaryKey(),
  profileId: text("profile_id").references(() => advertisingProfiles.profileId),
  campaignId: text("campaign_id").references(() => campaigns.campaignId),
  adGroupId: text("ad_group_id").references(() => adGroups.adGroupId),
  date: timestamp("date").notNull(),
  impressions: integer("impressions").notNull(),
  clicks: integer("clicks").notNull(),
  spend: numeric("spend").notNull(),
  sales: numeric("sales").notNull(),
  acos: numeric("acos"),
  roas: numeric("roas"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Create insert schemas
export const insertAdvertisingProfileSchema = createInsertSchema(advertisingProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertCampaignSchema = createInsertSchema(campaigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertAdGroupSchema = createInsertSchema(adGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});

export const insertMetricSchema = createInsertSchema(metrics).omit({
  id: true,
  createdAt: true
});

// Export types
export type InsertAdvertisingProfile = z.infer<typeof insertAdvertisingProfileSchema>;
export type InsertCampaign = z.infer<typeof insertCampaignSchema>;
export type InsertAdGroup = z.infer<typeof insertAdGroupSchema>;
export type InsertMetric = z.infer<typeof insertMetricSchema>;

export type AdvertisingProfile = typeof advertisingProfiles.$inferSelect;
export type Campaign = typeof campaigns.$inferSelect;
export type AdGroup = typeof adGroups.$inferSelect;
export type Metric = typeof metrics.$inferSelect;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;