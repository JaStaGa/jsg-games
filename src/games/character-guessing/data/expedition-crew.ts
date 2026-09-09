import type { ThemeConfig } from "../types";

export interface CrewMember {
  readonly name: string;
  readonly role: string;
  readonly region: string;
  readonly skills: readonly string[];
}

export const crew: readonly CrewMember[] = [
  { name: "Aven Tallow", role: "Navigator", region: "Mistfen", skills: ["Mapping", "Sailing"] },
  { name: "Bela Wisp", role: "Navigator", region: "Sunhollow", skills: ["Mapping", "Climbing"] },
  { name: "Caro Brindle", role: "Medic", region: "Mistfen", skills: ["Herbalism", "Cooking"] },
  { name: "Davi Lilt", role: "Engineer", region: "Stonewash", skills: ["Repair", "Sailing"] },
  { name: "Enna Rill", role: "Scout", region: "Cloudmere", skills: ["Tracking", "Climbing"] },
  { name: "Fenn Oriel", role: "Botanist", region: "Sunhollow", skills: ["Herbalism", "Mapping"] },
  { name: "Gavi Thimble", role: "Cook", region: "Mistfen", skills: ["Cooking", "Repair"] },
  { name: "Hessa Valeen", role: "Medic", region: "Cloudmere", skills: ["Herbalism", "Climbing"] },
  { name: "Iven Loam", role: "Engineer", region: "Sunhollow", skills: ["Repair", "Tracking"] },
  { name: "Jora Bracken", role: "Scout", region: "Stonewash", skills: ["Tracking", "Sailing"] },
  { name: "Kavi Mallow", role: "Botanist", region: "Mistfen", skills: ["Herbalism", "Repair"] },
  { name: "Luma Tern", role: "Cook", region: "Cloudmere", skills: ["Cooking", "Mapping"] },
  { name: "Mavi Sedge", role: "Navigator", region: "Stonewash", skills: ["Mapping", "Tracking"] },
  { name: "Neri Pollen", role: "Medic", region: "Sunhollow", skills: ["Herbalism", "Sailing"] },
  { name: "Ossa Flintle", role: "Engineer", region: "Mistfen", skills: ["Repair", "Climbing"] },
  { name: "Pavi Dapple", role: "Scout", region: "Sunhollow", skills: ["Tracking", "Cooking"] },
  { name: "Quenna Mosslet", role: "Botanist", region: "Cloudmere", skills: ["Herbalism", "Tracking"] },
  { name: "Ravo Larkspur", role: "Cook", region: "Stonewash", skills: ["Cooking", "Sailing"] },
  { name: "Seli Drift", role: "Navigator", region: "Cloudmere", skills: ["Mapping", "Repair"] },
  { name: "Tavi Bellwort", role: "Medic", region: "Stonewash", skills: ["Herbalism", "Mapping"] },
  { name: "Ulla Spindle", role: "Engineer", region: "Cloudmere", skills: ["Repair", "Cooking"] },
  { name: "Vessa Reedle", role: "Scout", region: "Mistfen", skills: ["Tracking", "Mapping"] },
  { name: "Weri Pebble", role: "Botanist", region: "Stonewash", skills: ["Herbalism", "Climbing"] },
  { name: "Yavi Brume", role: "Cook", region: "Sunhollow", skills: ["Cooking", "Climbing"] },
];

export const expeditionCrew: ThemeConfig<CrewMember> = {
  id: "expedition-crew",
  characters: crew,
  name: (character) => character.name,
  traits: [
    { key: "role", label: "Role", match: "exact", value: (character) => character.role },
    { key: "region", label: "Region", match: "exact", value: (character) => character.region },
    { key: "skills", label: "Skills", match: "overlap", value: (character) => character.skills },
  ],
};
