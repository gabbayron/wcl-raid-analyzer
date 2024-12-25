import { SlashCommandBuilder } from "discord.js";

export const RAID_COMMAND = {
  data: new SlashCommandBuilder()
    .setName("raid")
    .setDescription("Single raid summary")
    .addStringOption((option) => option.setName("log_id").setDescription("Log ID or URL").setRequired(true))
    .addStringOption((option) =>
      option
        .setName("expansion")
        .setDescription("Expansion")
        .setRequired(true)
        .setChoices([
          { name: "Cata", value: "cata" },
          { name: "Fresh", value: "fresh" },
        ]),
    )
    .addStringOption((option) =>
      option.setName("dmg_taken_filter").setDescription("Damage taken filter or default value.").setRequired(false),
    )
    .addStringOption((option) =>
      option.setName("dmg_done_filter").setDescription("Damage done filter or default value.").setRequired(false),
    ),
};

export const GEAR_CHECK = {
  data: new SlashCommandBuilder()
    .setName("gear_check")
    .setDescription("Raid gear check")
    .addStringOption((option) => option.setName("log_id").setDescription("Log ID or URL").setRequired(true))
    .addStringOption((option) =>
      option
        .setName("expansion")
        .setDescription("Expansion")
        .setRequired(true)
        .setChoices([
          { name: "Cata", value: "cata" },
          { name: "Fresh", value: "fresh" },
        ]),
    ),
};

export const DEBUFFS_COMMAND = {
  data: new SlashCommandBuilder()
    .setName("debuffs")
    .setDescription("Overall debuffs uptime")
    .addStringOption((option) => option.setName("log_id").setDescription("Log ID or URL").setRequired(true)),
};

export const RAID_SUMMARY_COMMAND = {
  data: new SlashCommandBuilder()
    .setName("weekly_raids_summary")
    .setDescription("Weekly raids summary")
    .addStringOption((option) =>
      option.setName("log_ids").setDescription("Provide the log URLs or log IDs separated by spaces").setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("expansion")
        .setDescription("Expansion")
        .setRequired(true)
        .setChoices([
          { name: "Cata", value: "cata" },
          { name: "Fresh", value: "fresh" },
        ]),
    ),
};

export const ADD_COMMAND = {
  data: new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add character description")
    .addStringOption((option) =>
      option.setName("char_name").setDescription("The absolute character name (!char name)").setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("spec").setDescription("Character specialization").setRequired(true).setAutocomplete(true),
    ),
};

export const RENAME_NAME_COMMAND = {
  data: new SlashCommandBuilder()
    .setName("rename_character")
    .setDescription("Rename existing character")
    .addStringOption((option) =>
      option
        .setName("existing_character_name")
        .setDescription("Existing character name")
        .setAutocomplete(true)
        .setRequired(true),
    )
    .addStringOption((option) =>
      option.setName("new_character_name").setDescription("New character name").setRequired(true),
    ),
};

export const RAID_OPTIONS = {
  data: new SlashCommandBuilder()
    .setName("absence")
    .setDescription("Handle raid options with multiple inputs and date selection.")
    .addStringOption((option) =>
      option
        .setName("absence_type")
        .setDescription("First option (string)")
        .setRequired(true)
        .setChoices([
          { name: "Late", value: "late" },
          { name: "Absent", value: "absent" },
        ]),
    )
    .addStringOption((option) => option.setName("note").setDescription("Custom not")),
};

export const RAID_PING_COMMAND = {
  data: new SlashCommandBuilder()
    .setName("ping-roster")
    .setDescription("Ping all members in a raid roster")
    .addStringOption((option) =>
      option.setName("split_name").setDescription("Select a raid").setRequired(true).setAutocomplete(true),
    )
    .addStringOption((option) => option.setName("raid_lead").setDescription("Who to whisper").setRequired(true))
    .addStringOption((option) =>
      option.setName("whisper_key_word").setDescription("Whisper key word").setRequired(true),
    ),
};
