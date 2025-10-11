import { useState } from "react";
import { useGameStats } from "@/hooks/useGameStats";
import { Filters } from "@/components/filters";
import { BarChart } from "@/features/bar-chart";
import { LineChart } from "@/features/line-chart";
import { PieChart } from "@/features/pie-chart";
import { FilterOptions } from "@/types/api";
import { Spinner } from "@/components/ui/spinner";

const defaultFilters: FilterOptions = {
  gameDuration: "All",
  coinsCount: "All",
  damageDealt: "All",
  playerDepth: "All",
  weaponChoice: "All",
  killedBy: "All",
};

export const MetricsPage = () => {
  const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
  const { data, error, isLoading } = useGameStats(filters);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-yellow-400">
            Game Metrics
          </h1>
          <div className="text-center py-12">
            <p className="text-red-400 text-lg">Error loading metrics data</p>
            <p className="text-gray-400 mt-2">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading && !data) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-yellow-400">
            Game Metrics
          </h1>
          <div className="flex justify-center items-center py-12">
            <Spinner />
            <span className="ml-4 text-lg">Loading metrics...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-yellow-400">
            Game Metrics
          </h1>
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-yellow-400">
          Game Metrics
        </h1>

        {/* Filters */}
        <div className="mb-8">
          <Filters
            filters={filters}
            onFilterChange={handleFilterChange}
            filterOptions={data.filters}
          />
        </div>

        {/* Charts Grid */}
        <div className="space-y-8">
          {/* Runs Played Per Day - Line Chart - Full Width */}
          <LineChart
            data={[
              {
                id: "runs",
                data: data.data.runsPlayedPerDay.map((item) => ({
                  x: item.date,
                  y: item.count,
                })),
              },
            ]}
            title="Runs Played Per Day"
            xAxisLabel="Date"
            yAxisLabel="Run Count"
          />

          {/* Player Deaths - Bar Chart - Full Width */}
          <BarChart
            data={data.data.playerDeaths.map((item) => ({
              cause: item.cause,
              count: item.count,
            }))}
            keys={["count"]}
            indexBy="cause"
            title="Player Deaths by Cause"
          />

          {/* Run Duration + Player Depth - Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BarChart
              data={data.data.runDuration.map((item) => ({
                duration: item.duration,
                count: item.count,
              }))}
              keys={["count"]}
              indexBy="duration"
              title="Run Duration Distribution"
            />
            <BarChart
              data={data.data.playerDepth.map((item) => ({
                depth: `Depth ${item.depth}`,
                count: item.count,
              }))}
              keys={["count"]}
              indexBy="depth"
              title="Player Depth Distribution"
            />
          </div>

          {/* Weapon Choice + Coins Collected - Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <PieChart
              data={data.data.weaponChoice.map((item) => ({
                id: item.weapon,
                label: item.weapon,
                value: item.count,
              }))}
              title="Weapon Choice Distribution"
            />
            <BarChart
              data={data.data.coinsCollected.map((item) => ({
                amount: item.amount,
                count: item.count,
              }))}
              keys={["count"]}
              indexBy="amount"
              title="Coins Collected Distribution"
            />
          </div>

          {/* Damage Dealt + Damage Taken - Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <BarChart
              data={data.data.damageDealt.map((item) => ({
                amount: item.amount,
                count: item.count,
              }))}
              keys={["count"]}
              indexBy="amount"
              title="Damage Dealt Distribution"
            />
            <BarChart
              data={data.data.damageTaken.map((item) => ({
                amount: item.amount,
                count: item.count,
              }))}
              keys={["count"]}
              indexBy="amount"
              title="Damage Taken Distribution"
            />
          </div>
        </div>

        {/* Pseudo-footer spacing */}
        <div className="h-16"></div>

        {/* Loading indicator for background updates */}
        {isLoading && data && (
          <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg">
            <div className="flex items-center">
              <Spinner size="sm" />
              <span className="ml-2 text-sm">Updating data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
