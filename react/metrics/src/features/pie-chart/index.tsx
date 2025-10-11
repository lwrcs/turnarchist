import { ResponsivePie } from "@nivo/pie";
import { Card } from "@/components/ui/card";

interface PieChartProps {
  data: Array<{
    id: string;
    label: string;
    value: number;
  }>;
  title: string;
  height?: number;
}

export const PieChart = ({ data, title, height = 400 }: PieChartProps) => {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
      <div style={{ height }}>
        <ResponsivePie
          data={data}
          margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
          innerRadius={0.5}
          padAngle={0.7}
          cornerRadius={3}
          activeOuterRadiusOffset={8}
          borderWidth={1}
          borderColor={{
            from: "color",
            modifiers: [["darker", 0.2]],
          }}
          arcLinkLabelsSkipAngle={10}
          arcLinkLabelsTextColor="#ffffff"
          arcLinkLabelsThickness={2}
          arcLinkLabelsColor={{ from: "color" }}
          arcLabelsSkipAngle={10}
          arcLabelsTextColor={{
            from: "color",
            modifiers: [["darker", 2]],
          }}
          colors={{ scheme: "dark2" }}
          theme={{
            background: "transparent",
            text: {
              fontSize: 12,
              fill: "#ffffff",
              outlineWidth: 0,
              outlineColor: "transparent",
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
              anchor: "bottom",
              direction: "row",
              justify: false,
              translateX: 0,
              translateY: 70,
              itemsSpacing: 8,
              itemWidth: 100,
              itemHeight: 18,
              itemTextColor: "#ffffff",
              itemDirection: "left-to-right",
              itemOpacity: 1,
              symbolSize: 18,
              symbolShape: "circle",
              effects: [
                {
                  on: "hover",
                  style: {
                    itemTextColor: "#ffffff",
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
