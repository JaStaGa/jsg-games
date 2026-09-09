import type { ThemeConfig } from "../types";

export interface CopperlightResident {
  readonly identity: { readonly displayName: string };
  readonly profession: string;
  readonly district: string;
  readonly specialties: readonly string[];
  readonly affiliations: readonly string[];
}

export const residents: readonly CopperlightResident[] = [
  { identity: { displayName: "Alda Copperskein" }, profession: "Clockmaker", district: "Lantern Quay", specialties: ["Gears", "Enameling"], affiliations: ["Dawn Guild", "Canal Circle"] },
  { identity: { displayName: "Brenna Wickfold" }, profession: "Clockmaker", district: "Glass Terrace", specialties: ["Gears", "Engraving"], affiliations: ["Evening Chorus", "Roof Gardeners"] },
  { identity: { displayName: "Cevin Mothwell" }, profession: "Baker", district: "Lantern Quay", specialties: ["Pastry", "Fermentation"], affiliations: ["Canal Circle", "Market Keepers"] },
  { identity: { displayName: "Delma Tinwhistle" }, profession: "Glassworker", district: "Bellward", specialties: ["Enameling", "Glassblowing"], affiliations: ["Dawn Guild", "Evening Chorus"] },
  { identity: { displayName: "Eriska Threadmere" }, profession: "Weaver", district: "Mosaic Steps", specialties: ["Dyeing", "Mending"], affiliations: ["Roof Gardeners", "Market Keepers"] },
  { identity: { displayName: "Fovan Emberstitch" }, profession: "Gardener", district: "Glass Terrace", specialties: ["Grafting", "Fermentation"], affiliations: ["Roof Gardeners", "Canal Circle"] },
  { identity: { displayName: "Gessa Chimewick" }, profession: "Printer", district: "Lantern Quay", specialties: ["Engraving", "Bookbinding"], affiliations: ["Dawn Guild", "Market Keepers"] },
  { identity: { displayName: "Haldo Bronzebloom" }, profession: "Clockmaker", district: "Bellward", specialties: ["Gears", "Mending"], affiliations: ["Canal Circle", "Evening Chorus"] },
  { identity: { displayName: "Iska Paperfen" }, profession: "Baker", district: "Glass Terrace", specialties: ["Pastry", "Dyeing"], affiliations: ["Market Keepers", "Evening Chorus"] },
  { identity: { displayName: "Jevra Kilnpetal" }, profession: "Glassworker", district: "Mosaic Steps", specialties: ["Glassblowing", "Engraving"], affiliations: ["Dawn Guild", "Roof Gardeners"] },
  { identity: { displayName: "Kelvo Spoolbrook" }, profession: "Weaver", district: "Lantern Quay", specialties: ["Dyeing", "Bookbinding"], affiliations: ["Canal Circle", "Roof Gardeners"] },
  { identity: { displayName: "Lessa Bramblecoil" }, profession: "Gardener", district: "Bellward", specialties: ["Grafting", "Mending"], affiliations: ["Roof Gardeners", "Evening Chorus"] },
  { identity: { displayName: "Mervo Inkthistle" }, profession: "Printer", district: "Glass Terrace", specialties: ["Bookbinding", "Enameling"], affiliations: ["Market Keepers", "Canal Circle"] },
  { identity: { displayName: "Nalda Gearlily" }, profession: "Clockmaker", district: "Mosaic Steps", specialties: ["Gears", "Bookbinding"], affiliations: ["Dawn Guild", "Market Keepers"] },
  { identity: { displayName: "Ovelo Crustbell" }, profession: "Baker", district: "Bellward", specialties: ["Pastry", "Grafting"], affiliations: ["Market Keepers", "Roof Gardeners"] },
  { identity: { displayName: "Pelna Glintbriar" }, profession: "Glassworker", district: "Lantern Quay", specialties: ["Glassblowing", "Mending"], affiliations: ["Dawn Guild", "Canal Circle"] },
  { identity: { displayName: "Quivo Loomcress" }, profession: "Weaver", district: "Glass Terrace", specialties: ["Dyeing", "Engraving"], affiliations: ["Evening Chorus", "Canal Circle"] },
  { identity: { displayName: "Relda Ferncog" }, profession: "Gardener", district: "Mosaic Steps", specialties: ["Grafting", "Dyeing"], affiliations: ["Roof Gardeners", "Dawn Guild"] },
  { identity: { displayName: "Sovra Pressmoss" }, profession: "Printer", district: "Bellward", specialties: ["Bookbinding", "Gears"], affiliations: ["Evening Chorus", "Market Keepers"] },
  { identity: { displayName: "Telvo Sugarhinge" }, profession: "Baker", district: "Mosaic Steps", specialties: ["Pastry", "Enameling"], affiliations: ["Canal Circle", "Dawn Guild"] },
  { identity: { displayName: "Uvena Prismreed" }, profession: "Glassworker", district: "Glass Terrace", specialties: ["Glassblowing", "Fermentation"], affiliations: ["Evening Chorus", "Roof Gardeners"] },
  { identity: { displayName: "Velko Shuttledew" }, profession: "Weaver", district: "Bellward", specialties: ["Mending", "Fermentation"], affiliations: ["Market Keepers", "Dawn Guild"] },
  { identity: { displayName: "Wenna Seedrivet" }, profession: "Gardener", district: "Lantern Quay", specialties: ["Grafting", "Enameling"], affiliations: ["Roof Gardeners", "Market Keepers"] },
  { identity: { displayName: "Yelvi Foliospark" }, profession: "Printer", district: "Mosaic Steps", specialties: ["Engraving", "Fermentation"], affiliations: ["Dawn Guild", "Evening Chorus"] },
];

export const copperlightCity: ThemeConfig<CopperlightResident> = {
  id: "copperlight-city",
  characters: residents,
  name: (character) => character.identity.displayName,
  traits: [
    { key: "profession", label: "Profession", match: "exact", value: (character) => character.profession },
    { key: "district", label: "District", match: "exact", value: (character) => character.district },
    { key: "specialties", label: "Specialties", match: "overlap", value: (character) => character.specialties },
    { key: "affiliations", label: "Affiliations", match: "overlap", value: (character) => character.affiliations },
  ],
};
