import axios from "axios";
import { EmbedBuilder } from "discord.js";
import QuickChart from "quickchart-js";

export async function generateChart(
  data: { name: string; total: number; color: string }[],
  title: string,
  description: string,
): Promise<EmbedBuilder> {
  const chart = new QuickChart();
  chart.setBackgroundColor("black");
  const chartConfig = {
    type: "horizontalBar",
    data: {
      labels: data.map((player) => player.name),
      datasets: [
        {
          data: data.map((player) => player.total),
          backgroundColor: data.map((player, i) => player.color),
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      legend: { display: false },
      title: {
        display: true,
        text: title,
        fontColor: "white",
      },
      plugins: {
        title: { display: false },
        datalabels: {
          anchor: "end",
          align: "end",
          color: "white",
          formatter: (value: any) => {
            if (value >= 1_000_000) {
              return `${(value / 1_000_000).toFixed(2)}m`; // Convert to millions
            } else if (value >= 1_000) {
              return `${(value / 1_000).toFixed(2)}k`; // Convert to thousands
            }
            return value.toString();
          },
        },
      },
      scales: {
        xAxes: [
          {
            ticks: {
              callback: formatNumber,
              beginAtZero: true,
              fontColor: "white",
            },
            grid: { display: false },
          },
        ],
        yAxes: [
          {
            ticks: { fontColor: "white" },
            grid: { display: false },
          },
        ],
      },
    },
  };

  chart.setConfig(chartConfig);
  chart.setWidth(1400);
  chart.setHeight(700);

  const chartUrl = chart.getUrl();
  const { data: shortenedUrl } = await axios.get(
    `https://tinyurl.com/api-create.php?url=${encodeURIComponent(chartUrl)}`,
  );

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setImage(shortenedUrl!)
    .setColor(0x00aeff);
  return embed;
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(2)}m`; // Convert to millions
  } else if (value >= 1_000) {
    return `${(value / 1_000).toFixed(2)}k`; // Convert to thousands
  }
  return value.toString();
}
