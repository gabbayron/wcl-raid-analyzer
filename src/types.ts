export interface Zone {
  name: string;
}

export interface RaidData {
  code: string;
  title: string;
  startTime: number; // Unix timestamp in milliseconds
  endTime: number; // Unix timestamp in milliseconds
  zone: Zone;
}

interface Ability {
  name: string;
  total: number;
  type: number;
}

interface DamageAbility {
  // Extend this if you have specific properties for damageAbilities
}

interface Target {
  name: string;
  total: number;
  type: string;
}

interface Talent {
  name: string;
  guid: number;
  type: number;
  abilityIcon: string;
}

interface Gem {
  id: number;
  itemLevel: number;
  icon: string;
}

interface Gear {
  id: number;
  slot: number;
  quality: number;
  icon: string;
  name: string;
  itemLevel: number;
  permanentEnchant?: number;
  permanentEnchantName?: string;
  onUseEnchant?: number;
  onUseEnchantName?: string;
  gems?: Gem[];
  setID?: number;
}

export interface Character {
  name: string;
  id: number;
  guid: number;
  type: string;
  icon: string;
  itemLevel: number;
  total: number;
  activeTime: number;
  activeTimeReduced: number;
  abilities: Ability[];
  damageAbilities: DamageAbility[];
  targets: Target[];
  talents: Talent[];
  gear: Gear[];
}
