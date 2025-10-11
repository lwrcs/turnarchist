import { ResponsiveLine } from "@nivo/line";
import { Card } from "@/components/ui/card";

interface LineChartProps {
  data: Array<{
    id: string;
    data: Array<{
      x: string | number;
      y: number;
    }>;
  }>;
  title: string;
  height?: number;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

export const LineChart = ({
  data,
  title,
  height = 400,
  xAxisLabel = "Date",
  yAxisLabel = "Count",
}: LineChartProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
      <div style={{ height }}>
        <ResponsiveLine
          data={data}
          margin={{ top: 50, right: 110, bottom: 80, left: 60 }}
          xScale={{ type: "point" }}
          yScale={{
            type: "linear",
            min: "auto",
            max: "auto",
            stacked: false,
            reverse: false,
          }}
          yFormat=" >-.2f"
          curve="catmullRom"
          axisTop={null}
          axisRight={null}
          axisBottom={{
            tickSize: 5,
            tickPadding: 8,
            tickRotation: -45,
            legend: xAxisLabel,
            legendPosition: "middle",
            legendOffset: 60,
            format: (value) => {
              if (typeof value === "string" && value.length > 12) {
                return value.substring(0, 12) + "...";
              }
              return value;
            },
          }}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: yAxisLabel,
            legendPosition: "middle",
            legendOffset: -40,
          }}
          pointSize={8}
          pointColor={{ theme: "background" }}
          pointBorderWidth={2}
          pointBorderColor={{ from: "serieColor" }}
          pointLabelYOffset={-12}
          useMesh={true}
          colors={{ scheme: "dark2" }}
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
          legends={[
            {
              anchor: "bottom-right",
              direction: "column",
              justify: false,
              translateX: 100,
              translateY: 0,
              itemsSpacing: 0,
              itemDirection: "left-to-right",
              itemWidth: 80,
              itemHeight: 20,
              itemOpacity: 0.75,
              symbolSize: 12,
              symbolShape: "circle",
              symbolBorderColor: "rgba(0, 0, 0, .5)",
              effects: [
                {
                  on: "hover",
                  style: {
                    itemBackground: "rgba(0, 0, 0, .03)",
                    itemOpacity: 1,
                  },
                },
              ],
            },
          ]}
        />
      </div>
    </Card>
  );
};
