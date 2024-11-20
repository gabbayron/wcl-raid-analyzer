import { SlashCommandBuilder } from "discord.js";

export const RAID_COMMAND = {
  data: new SlashCommandBuilder()
    .setName("raid")
    .setDescription("Single raid summary")
    .addStringOption((option) => option.setName("log_id").setDescription("Log ID or URL").setRequired(true))
    .addStringOption((option) =>
      option.setName("filter").setDescription("Damage taken filter or default value.").setRequired(false),
    ),
};

export const RAID_SUMMARY_COMMAND = {
  data: new SlashCommandBuilder()
    .setName("weekly_raids_summary")
    .setDescription("Weekly raids summary")
    .addStringOption((option) =>
      option.setName("log_ids").setDescription("Provide the log URLs or log IDs separated by spaces").setRequired(true),
    ),
};
