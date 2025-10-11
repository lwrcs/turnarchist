import { Card } from "@/components/ui/card";
import { FilterOptions, FilterOptionsData } from "@/types/api";

interface FiltersProps {
  filters: FilterOptions;
  onFilterChange: (key: keyof FilterOptions, value: string) => void;
  filterOptions: FilterOptionsData;
}

export const Filters = ({
  filters,
  onFilterChange,
  filterOptions,
}: FiltersProps) => {
  const filterSections = [
    {
      key: "gameDuration" as keyof FilterOptions,
      label: "Game Duration",
      options: filterOptions.gameDurations,
      value: filters.gameDuration,
    },
    {
      key: "coinsCount" as keyof FilterOptions,
      label: "Coins Count",
      options: filterOptions.coinsCounts,
      value: filters.coinsCount,
    },
    {
      key: "damageDealt" as keyof FilterOptions,
      label: "Damage Dealt",
      options: filterOptions.damageDealtRanges,
      value: filters.damageDealt,
    },
    {
      key: "playerDepth" as keyof FilterOptions,
      label: "Player Depth",
      options: filterOptions.playerDepths,
      value: filters.playerDepth,
    },
    {
      key: "weaponChoice" as keyof FilterOptions,
      label: "Weapon Choice",
      options: filterOptions.weapons,
      value: filters.weaponChoice,
    },
    {
      key: "killedBy" as keyof FilterOptions,
      label: "Killed By",
      options: filterOptions.deathCauses,
      value: filters.killedBy,
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4 text-white">Filters</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filterSections.map((section) => (
          <div key={section.key} className="space-y-2">
            <label className="block text-sm font-medium text-white">
              {section.label}
            </label>
            <select
              value={section.value}
              onChange={(e) => onFilterChange(section.key, e.target.value)}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent"
            >
              {section.options.map((option) => (
                <option key={option} value={option} className="bg-gray-800">
                  {option}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </Card>
  );
};
