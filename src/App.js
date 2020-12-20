import React from "react";
import { useImmer } from "use-immer";
import styled from "styled-components";
import {
  AppBar,
  Button,
  Container,
  Toolbar,
  Typography,
} from "@material-ui/core";
import CSVReader from "react-csv-reader";
import { CanvasJS, CanvasJSChart } from "canvasjs-react-charts";

const MyBody = styled.div`
  background: linear-gradient(#c6d5e4, #69737b);
  overflow: auto;
`;

const MyToolbar = styled(Toolbar)`
  background: linear-gradient(#bbb, #888);
  box-shadow: 0px 2px 4px -1px rgba(0, 0, 0, 0.2),
    0px 4px 5px 0px rgba(0, 0, 0, 0.14), 0px 1px 10px 0px rgba(0, 0, 0, 0.12);
  min-height: 48px !important;
`;

const MyContainer = styled(Container).attrs({ maxWidth: "lg", fixed: true })`
  height: calc(100vh - 48px);
  margin-top: 48px;
  text-align: center;
`;

CanvasJS.addColorSet("materialColorSet", [
  "#ff1744",
  "#d500f9",
  "#3d5afe",
  "#00b0ff",
  "#1de9b6",
  "#33691e",
]);

function App() {
  const [file, setFile] = useImmer({
    data: [],
    info: null,
    axisX: null,
  });

  const handleSetFile = (data, info) => {
    setFile((f) => {
      f.info = info;

      f.data = Array.from(data[1].slice(1), (name, index) => ({
        dataPoints: [],
        index,
        name: name.trim(),
        showInLegend: true,
        type: "spline",
        visible: true,
      }));

      data.slice(2).forEach((d, index) => {
        if (d.length === 7) {
          d.slice(1).forEach((value, idx) => {
            f.data[idx].dataPoints.push({
              x: index + 1,
              y: parseFloat(value),
            });
          });
        }
      });

      f.axisX = {
        stripLines: Array.from({ length: 40 }, (_, i) => ({
          color: "#888",
          thickness: 1,
          value: parseInt(f.data[0].dataPoints.length / 40, 10) * i,
        })),
      };
    });
  };

  const options = {
    animationEnabled: true,
    axisY: {
      includeZero: false,
    },
    backgroundColor: "transparent",
    colorSet: "materialColorSet",
    exportEnabled: true,
    legend: {
      cursor: "pointer",
      itemclick: (event) => {
        const { index } = event.dataSeries;

        setFile((f) => {
          f.data[index].visible = !f.data[index].visible;
        });

        event.chart.render();
      },
      verticalAlign: "top",
    },
    title: {
      fontFamily: `"Montserrat", "Helvetica Neue", Arial, sans-serif`,
      fontSize: 24,
      margin: 20,
    },
    toolTip: {
      shared: true,
    },
    zoomEnabled: true,
  };

  return (
    <MyBody>
      <AppBar position="fixed">
        <MyToolbar>
          <Typography variant="subtitle1">波形分析小工具</Typography>
        </MyToolbar>
      </AppBar>
      <MyContainer>
        {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
        <label htmlFor="csv-reader-input">
          <CSVReader
            inputId="csv-reader-input"
            inputStyle={{ display: "none" }}
            onFileLoaded={handleSetFile}
          />
          <Button
            color="primary"
            component="span"
            style={{ margin: "20px" }}
            variant="contained"
          >
            上傳CSV檔
          </Button>
        </label>
        {Object.keys(file.data).length > 0 && (
          <CanvasJSChart
            options={{
              ...options,
              axisX: file.axisX,
              data: file.data,
              exportFileName: `${file.info.name.replace(
                /.csv/gi,
                ""
              )}-波形分析`,
              title: { ...options.title, text: `波形分析 - ${file.info.name}` },
            }}
          />
        )}
      </MyContainer>
    </MyBody>
  );
}

export default App;
