import { ResponsiveBar } from "@nivo/bar";
import { Card } from "@/components/ui/card";

interface BarChartProps {
  data: Array<{ [key: string]: string | number }>;
  keys: string[];
  indexBy: string;
  title: string;
  height?: number;
}

export const BarChart = ({
  data,
  keys,
  indexBy,
  title,
  height = 400,
}: BarChartProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
      <div style={{ height }}>
        <ResponsiveBar
          data={data}
          keys={keys}
          indexBy={indexBy}
          margin={{ top: 50, right: 130, bottom: 80, left: 60 }}
          padding={0.3}
          valueScale={{ type: "linear" }}
          indexScale={{ type: "band", round: true }}
          colors={{ scheme: "dark2" }}
          borderColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 8,
            tickRotation: -45,
            legend: indexBy,
            legendPosition: "middle",
            legendOffset: 60,
            format: (value) => {
              if (typeof value === "string") {
                // Handle long labels better
                if (value.length > 15) {
                  return value.substring(0, 15) + "...";
                }
                // Handle range labels (e.g., "1-10", "101-200")
                if (value.includes("-") && value.length > 10) {
                  return value.substring(0, 10) + "...";
                }
              }
              // For numeric values (like damage taken), show as-is
              return value;
            },
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: "Count",
            legendPosition: "middle",
            legendOffset: -40,
          }}
          labelSkipWidth={12}
          labelSkipHeight={12}
          labelTextColor={{ from: "color", modifiers: [["darker", 1.6]] }}
          legends={[
            {
              dataFrom: "keys",
              anchor: "bottom-right",
              direction: "column",
              justify: false,
              translateX: 120,
              translateY: 0,
              itemsSpacing: 2,
              itemWidth: 100,
              itemHeight: 20,
              itemDirection: "left-to-right",
              itemOpacity: 0.85,
              symbolSize: 20,
              effects: [
                {
                  on: "hover",
                  style: {
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
          animate={true}
          tooltip={({ id, value, indexValue, data }) => (
            <div
              style={{
                background: "#000000",
                color: "#ffffff",
                padding: "8px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                boxShadow: "0 3px 9px rgba(0, 0, 0, 0.5)",
                border: "1px solid #333",
              }}
            >
              <div>
                <strong>{indexValue}</strong>
              </div>
              <div>Count: {value}</div>
              {typeof indexValue === "string" && indexValue.includes("-") && (
                <div
                  style={{ fontSize: "10px", opacity: 0.8, marginTop: "2px" }}
                >
                  Range: {indexValue}
                </div>
              )}
            </div>
          )}
          theme={{
            background: "transparent",
            text: {
              fontSize: 12,
              fill: "#ffffff",
              outlineWidth: 0,
              outlineColor: "transparent",
            },
            axis: {
              domain: {
                line: {
                  stroke: "#ffffff",
                  strokeWidth: 1,
                },
              },
              legend: {
                text: {
                  fontSize: 12,
                  fill: "#ffffff",
                  outlineWidth: 0,
                  outlineColor: "transparent",
                },
              },
              ticks: {
                line: {
                  stroke: "#ffffff",
                  strokeWidth: 1,
                },
                text: {
                  fontSize: 11,
                  fill: "#ffffff",
                  outlineWidth: 0,
                  outlineColor: "transparent",
                },
              },
            },
            grid: {
              line: {
                stroke: "#ffffff",
                strokeWidth: 0.5,
                strokeOpacity: 0.3,
              },
            },
            tooltip: {
              container: {
                background: "#000000",
                color: "#ffffff",
                fontSize: 12,
                borderRadius: 4,
                boxShadow: "0 3px 9px rgba(0, 0, 0, 0.5)",
              },
            },
          }}
        />
      </div>
    </Card>
  );
};
